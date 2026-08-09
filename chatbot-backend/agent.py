"""Bounded function-calling agent for Paper Question Mode.

Task selection stays explicit at the UX layer (ADR-0010); this agent only
orchestrates tools *within* the Understand the Research task boundary
(ADR-0014). The loop is deliberately framework-free: system prompt + tools,
execute what the model calls, feed results back, stop at a hard iteration
bound with a guaranteed final text answer.
"""

import json

from agent_tools import TOOLS, execute_tool, openai_tool_specs, summarize_evidence
from telemetry import get_tracer

MAX_ITERATIONS = 6

AGENT_SYSTEM_PROMPT = (
    "You are the research assistant for the ALIGATEHR-Gen project, answering "
    "inside the Understand the Research task of the project website.\n\n"
    "Ground every factual claim in Study Evidence, fetched through the "
    "provided tools: the published ALIGATEHR-Gen paper, the versioned "
    "demonstration result release (whose mock/published status is explicit), "
    "and cohort-level fibrotic summaries. Never present mock result values as "
    "published experimental findings. Do not answer "
    "research questions from memory alone; call tools first.\n\n"
    "Scope contract:\n"
    "- Provide research explanation and cohort-level statistics only.\n"
    "- Never provide individual medical advice, personal risk assessment, or "
    "patient-specific predictions. If asked, refuse briefly and point the "
    "visitor to the Build a Demo Profile task in this assistant, which "
    "supports a research-only cohort comparison with a synthetic profile.\n"
    "- Questions outside Study Evidence — including the in-progress Bio-E2R "
    "manuscript, external literature, or general knowledge — receive an "
    "explicit scope limitation naming the published ALIGATEHR-Gen paper and "
    "its versioned study-evidence releases as the answering scope. Do not guess.\n"
    "- If a question is ambiguous, ask one clarifying question instead of "
    "guessing.\n\n"
    "Answer style: concise and scientifically precise. State when result "
    "values come from a mock demonstration release. When helpful, name the paper section a claim comes from "
    "(e.g. Methods); never invent numbered citations, page numbers, or "
    "external references.\n\n"
    "This is a research prototype for demonstration purposes only; nothing "
    "you say is medical advice."
)


def _assistant_turn(message):
    turn = {"role": "assistant", "content": message.content or ""}
    if message.tool_calls:
        turn["tool_calls"] = [
            {
                "id": call.id,
                "type": "function",
                "function": {
                    "name": call.function.name,
                    "arguments": call.function.arguments,
                },
            }
            for call in message.tool_calls
        ]
    return turn


def run_agent(
    client,
    message,
    history=None,
    model="deepseek-chat",
    max_iterations=MAX_ITERATIONS,
    max_tokens=1024,
):
    """Answer one Research Question; returns {"reply", "tool_trace"}.

    The last iteration always runs without tools so the model must produce
    a text answer — the loop cannot end on a tool call.
    """
    messages = [{"role": "system", "content": AGENT_SYSTEM_PROMPT}]
    for turn in history or []:
        messages.append({"role": turn["role"], "content": turn["content"]})
    messages.append({"role": "user", "content": message})

    specs = openai_tool_specs()
    tool_trace = []
    for iteration in range(max_iterations):
        final_turn = iteration == max_iterations - 1
        kwargs = {} if final_turn else {"tools": specs}
        with get_tracer().start_as_current_span("research_agent.model_turn") as span:
            span.set_attribute("agent.iteration", iteration)
            span.set_attribute("agent.final_turn", final_turn)
            span.set_attribute("gen_ai.request.model", model)
            response = client.chat.completions.create(
                model=model, max_tokens=max_tokens, messages=messages, **kwargs
            )
        reply = response.choices[0].message
        calls = reply.tool_calls or []
        if not calls:
            return {"reply": reply.content or "", "tool_trace": tool_trace}
        if final_turn:
            raise RuntimeError("Model produced tool calls on the tool-free final turn")

        messages.append(_assistant_turn(reply))
        for call in calls:
            with get_tracer().start_as_current_span("research_agent.tool") as span:
                span.set_attribute("agent.tool.name", call.function.name)
                result = execute_tool(call.function.name, call.function.arguments)
                span.set_attribute("agent.tool.ok", "error" not in result)
            tool_trace.append(
                {
                    "tool": call.function.name,
                    "arguments": call.function.arguments,
                    "ok": "error" not in result,
                    "evidence": summarize_evidence(call.function.name, result),
                }
            )
            messages.append(
                {
                    "role": "tool",
                    "tool_call_id": call.id,
                    "content": json.dumps(result),
                }
            )

    raise RuntimeError("Agent loop ended without a final text answer")


def _assembled_calls(deltas):
    ordered = [deltas[index] for index in sorted(deltas)]
    return [call for call in ordered if call["name"]]


def stream_agent(
    client,
    message,
    history=None,
    model="deepseek-chat",
    max_iterations=MAX_ITERATIONS,
    max_tokens=1024,
):
    """run_agent as an event generator for the SSE endpoint.

    Yields {"event", "data"} dicts: "token" (answer text as it streams),
    "tool_call" / "tool_result" (activity around each tool execution), and
    a final "done" carrying the full tool trace. Same loop contract as
    run_agent: hard iteration bound, tool-free final turn.
    """
    messages = [{"role": "system", "content": AGENT_SYSTEM_PROMPT}]
    for turn in history or []:
        messages.append({"role": turn["role"], "content": turn["content"]})
    messages.append({"role": "user", "content": message})

    specs = openai_tool_specs()
    tool_trace = []
    for iteration in range(max_iterations):
        final_turn = iteration == max_iterations - 1
        kwargs = {} if final_turn else {"tools": specs}
        with get_tracer().start_as_current_span("research_agent.model_turn") as span:
            span.set_attribute("agent.iteration", iteration)
            span.set_attribute("agent.final_turn", final_turn)
            span.set_attribute("gen_ai.request.model", model)
            stream = client.chat.completions.create(
                model=model,
                max_tokens=max_tokens,
                messages=messages,
                stream=True,
                **kwargs,
            )
        content_parts = []
        deltas = {}
        for chunk in stream:
            delta = chunk.choices[0].delta
            if delta.content:
                content_parts.append(delta.content)
                yield {"event": "token", "data": {"text": delta.content}}
            for fragment in delta.tool_calls or []:
                entry = deltas.setdefault(
                    fragment.index, {"id": "", "name": "", "arguments": ""}
                )
                if fragment.id:
                    entry["id"] = fragment.id
                if fragment.function and fragment.function.name:
                    entry["name"] = fragment.function.name
                if fragment.function and fragment.function.arguments:
                    entry["arguments"] += fragment.function.arguments

        calls = _assembled_calls(deltas)
        if not calls:
            yield {"event": "done", "data": {"tool_trace": tool_trace}}
            return
        if final_turn:
            raise RuntimeError("Model produced tool calls on the tool-free final turn")

        messages.append(
            {
                "role": "assistant",
                "content": "".join(content_parts),
                "tool_calls": [
                    {
                        "id": call["id"],
                        "type": "function",
                        "function": {
                            "name": call["name"],
                            "arguments": call["arguments"],
                        },
                    }
                    for call in calls
                ],
            }
        )
        for call in calls:
            label = TOOLS[call["name"]]["label"] if call["name"] in TOOLS else call["name"]
            yield {"event": "tool_call", "data": {"tool": call["name"], "label": label}}
            with get_tracer().start_as_current_span("research_agent.tool") as span:
                span.set_attribute("agent.tool.name", call["name"])
                result = execute_tool(call["name"], call["arguments"])
                span.set_attribute("agent.tool.ok", "error" not in result)
            ok = "error" not in result
            evidence = summarize_evidence(call["name"], result)
            tool_trace.append(
                {
                    "tool": call["name"],
                    "arguments": call["arguments"],
                    "ok": ok,
                    "evidence": evidence,
                }
            )
            yield {
                "event": "tool_result",
                "data": {"tool": call["name"], "ok": ok, "evidence": evidence},
            }
            messages.append(
                {
                    "role": "tool",
                    "tool_call_id": call["id"],
                    "content": json.dumps(result),
                }
            )

    raise RuntimeError("Agent loop ended without a final text answer")

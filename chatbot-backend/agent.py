"""Bounded function-calling agent for Paper Question Mode.

Task selection stays explicit at the UX layer (ADR-0010); this agent only
orchestrates tools *within* the Understand the Research task boundary
(ADR-0014). The loop is deliberately framework-free: system prompt + tools,
execute what the model calls, feed results back, stop at a hard iteration
bound with a guaranteed final text answer.
"""

import json

from agent_tools import execute_tool, openai_tool_specs

MAX_ITERATIONS = 6

AGENT_SYSTEM_PROMPT = (
    "You are the research assistant for the ALIGATEHR-Gen project, answering "
    "inside the Understand the Research task of the project website.\n\n"
    "Ground every factual claim in Study Evidence, fetched through the "
    "provided tools: the published ALIGATEHR-Gen paper and the published "
    "study result data (evaluation metrics, ablation results, pathway "
    "enrichment, and cohort-level fibrotic summaries). Do not answer "
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
    "its published study data as the answering scope. Do not guess.\n"
    "- If a question is ambiguous, ask one clarifying question instead of "
    "guessing.\n\n"
    "Answer style: concise, scientifically precise, numbers exactly as "
    "published. When helpful, name the paper section a claim comes from "
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
            result = execute_tool(call.function.name, call.function.arguments)
            tool_trace.append(
                {
                    "tool": call.function.name,
                    "arguments": call.function.arguments,
                    "ok": "error" not in result,
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

import json
from unittest.mock import MagicMock

import pytest

from agent import AGENT_SYSTEM_PROMPT, run_agent, stream_agent
from agent_tools import TOOLS


def _text_message(content):
    message = MagicMock()
    message.content = content
    message.tool_calls = None
    return message


def _tool_call(call_id, name, arguments):
    call = MagicMock()
    call.id = call_id
    call.function.name = name
    call.function.arguments = arguments
    return call


def _tool_message(*calls):
    message = MagicMock()
    message.content = ""
    message.tool_calls = list(calls)
    return message


def _response(message):
    response = MagicMock()
    response.choices = [MagicMock(message=message)]
    return response


def _scripted_client(*messages):
    client = MagicMock()
    client.chat.completions.create.side_effect = [_response(m) for m in messages]
    return client


def test_direct_text_answer_returns_without_tool_calls():
    client = _scripted_client(_text_message("The paper reports AUC 0.76."))
    result = run_agent(client, "What is the average AUC?")

    assert result == {"reply": "The paper reports AUC 0.76.", "tool_trace": []}
    call = client.chat.completions.create.call_args
    assert call.kwargs["messages"][0] == {
        "role": "system",
        "content": AGENT_SYSTEM_PROMPT,
    }
    assert {spec["function"]["name"] for spec in call.kwargs["tools"]} == set(TOOLS)


def test_tool_call_is_executed_and_result_fed_back():
    client = _scripted_client(
        _tool_message(_tool_call("c1", "query_metrics", '{"disease": "CKD"}')),
        _text_message("CKD AUROC is 0.79."),
    )
    result = run_agent(client, "What is the CKD AUROC?")

    assert result["reply"] == "CKD AUROC is 0.79."
    assert result["tool_trace"] == [
        {"tool": "query_metrics", "arguments": '{"disease": "CKD"}', "ok": True}
    ]
    second_call = client.chat.completions.create.call_args_list[1]
    messages = second_call.kwargs["messages"]
    assert messages[-2]["tool_calls"][0]["function"]["name"] == "query_metrics"
    tool_turn = messages[-1]
    assert tool_turn["role"] == "tool"
    assert tool_turn["tool_call_id"] == "c1"
    assert json.loads(tool_turn["content"])["filters"] == {"disease": "CKD"}


def test_invalid_arguments_surface_as_error_turn_not_crash():
    client = _scripted_client(
        _tool_message(_tool_call("c1", "query_enrichment", '{"top_n": 100}')),
        _text_message("Let me correct that."),
    )
    result = run_agent(client, "Top 100 pathways?")

    assert result["tool_trace"][0]["ok"] is False
    tool_turn = client.chat.completions.create.call_args_list[1].kwargs["messages"][-1]
    assert "Invalid tool arguments" in json.loads(tool_turn["content"])["error"]


def test_unknown_tool_surfaces_available_tools():
    client = _scripted_client(
        _tool_message(_tool_call("c1", "match_patient_profile", "{}")),
        _text_message("That capability is not available here."),
    )
    result = run_agent(client, "Match my profile")

    assert result["tool_trace"][0]["ok"] is False
    tool_turn = client.chat.completions.create.call_args_list[1].kwargs["messages"][-1]
    payload = json.loads(tool_turn["content"])
    assert "Unknown tool" in payload["error"]
    assert set(payload["available_tools"]) == set(TOOLS)


def test_final_iteration_runs_without_tools_and_must_answer():
    tool_turns = [
        _tool_message(_tool_call(f"c{i}", "get_paper_content", "{}"))
        for i in range(5)
    ]
    client = _scripted_client(*tool_turns, _text_message("Final grounded answer."))
    result = run_agent(client, "Explain everything.", max_iterations=6)

    assert result["reply"] == "Final grounded answer."
    assert len(result["tool_trace"]) == 5
    calls = client.chat.completions.create.call_args_list
    assert len(calls) == 6
    assert all("tools" in call.kwargs for call in calls[:-1])
    assert "tools" not in calls[-1].kwargs


def test_tool_calls_on_the_tool_free_final_turn_fail_loudly():
    client = _scripted_client(
        _tool_message(_tool_call("c1", "get_paper_content", "{}"))
    )
    with pytest.raises(RuntimeError, match="final turn"):
        run_agent(client, "Explain everything.", max_iterations=1)
    assert "tools" not in client.chat.completions.create.call_args.kwargs


def test_history_is_threaded_before_the_new_message():
    client = _scripted_client(_text_message("As discussed, 0.76."))
    history = [
        {"role": "user", "content": "What is the average AUC?"},
        {"role": "assistant", "content": "0.76."},
    ]
    run_agent(client, "Say it again?", history=history)

    messages = client.chat.completions.create.call_args.kwargs["messages"]
    assert messages[1] == history[0]
    assert messages[2] == history[1]
    assert messages[3] == {"role": "user", "content": "Say it again?"}


# --- stream_agent ---


def _chunk(content=None, tool_fragments=None):
    delta = MagicMock()
    delta.content = content
    delta.tool_calls = tool_fragments
    chunk = MagicMock()
    chunk.choices = [MagicMock(delta=delta)]
    return chunk


def _fragment(index, call_id=None, name=None, arguments=None):
    fragment = MagicMock()
    fragment.index = index
    fragment.id = call_id
    if name is None and arguments is None:
        fragment.function = None
    else:
        fragment.function = MagicMock()
        fragment.function.name = name
        fragment.function.arguments = arguments
    return fragment


def _streaming_client(*streams):
    client = MagicMock()
    client.chat.completions.create.side_effect = [iter(s) for s in streams]
    return client


def test_stream_agent_streams_tokens_and_finishes_with_done():
    client = _streaming_client([_chunk(content="The "), _chunk(content="answer.")])
    events = list(stream_agent(client, "What is the average AUC?"))

    assert events == [
        {"event": "token", "data": {"text": "The "}},
        {"event": "token", "data": {"text": "answer."}},
        {"event": "done", "data": {"tool_trace": []}},
    ]
    assert client.chat.completions.create.call_args.kwargs["stream"] is True


def test_stream_agent_emits_tool_activity_and_assembles_fragmented_arguments():
    tool_turn = [
        _chunk(tool_fragments=[_fragment(0, call_id="c1", name="query_metrics")]),
        _chunk(tool_fragments=[_fragment(0, arguments='{"disease":')]),
        _chunk(tool_fragments=[_fragment(0, arguments=' "CKD"}')]),
    ]
    answer_turn = [_chunk(content="CKD AUROC is 0.8755.")]
    client = _streaming_client(tool_turn, answer_turn)

    events = list(stream_agent(client, "What is the CKD AUROC?"))

    kinds = [e["event"] for e in events]
    assert kinds == ["tool_call", "tool_result", "token", "done"]
    assert events[0]["data"] == {
        "tool": "query_metrics",
        "label": "Querying evaluation metrics",
    }
    assert events[1]["data"] == {"tool": "query_metrics", "ok": True}
    assert events[3]["data"]["tool_trace"] == [
        {"tool": "query_metrics", "arguments": '{"disease": "CKD"}', "ok": True}
    ]
    tool_turn_messages = client.chat.completions.create.call_args.kwargs["messages"]
    assert tool_turn_messages[-1]["role"] == "tool"
    assert json.loads(tool_turn_messages[-1]["content"])["filters"] == {
        "disease": "CKD"
    }


def test_stream_agent_final_turn_violation_fails_loudly():
    client = _streaming_client(
        [_chunk(tool_fragments=[_fragment(0, call_id="c1", name="get_paper_content")])]
    )
    with pytest.raises(RuntimeError, match="final turn"):
        list(stream_agent(client, "Explain everything.", max_iterations=1))

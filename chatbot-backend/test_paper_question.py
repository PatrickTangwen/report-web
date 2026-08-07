import os
from unittest.mock import MagicMock, patch

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

os.environ["LLM_Key_Deepseek"] = "test-key"

from agent import AGENT_SYSTEM_PROMPT
from agent_tools import TOOLS
from app import app


def _mock_response(content, tool_calls=None):
    msg = MagicMock()
    msg.message.content = content
    msg.message.tool_calls = tool_calls
    resp = MagicMock()
    resp.choices = [msg]
    return resp


def _tool_call(call_id, name, arguments):
    call = MagicMock()
    call.id = call_id
    call.function.name = name
    call.function.arguments = arguments
    return call


@pytest.fixture
def mock_openai():
    with patch("app.client") as mock_client:
        mock_client.chat.completions.create.return_value = _mock_response(
            "The model achieves an average AUC of 0.76."
        )
        yield mock_client


@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


@pytest.mark.asyncio
async def test_paper_question_answers_via_the_agent_prompt(client, mock_openai):
    resp = await client.post(
        "/paper/question", json={"message": "What is the average AUC?"}
    )
    assert resp.status_code == 200
    assert resp.json() == {
        "reply": "The model achieves an average AUC of 0.76.",
        "tool_trace": [],
    }

    mock_openai.chat.completions.create.assert_called_once()
    call = mock_openai.chat.completions.create.call_args
    assert call.kwargs["messages"][0] == {
        "role": "system",
        "content": AGENT_SYSTEM_PROMPT,
    }
    assert call.kwargs["messages"][-1] == {
        "role": "user",
        "content": "What is the average AUC?",
    }
    assert {spec["function"]["name"] for spec in call.kwargs["tools"]} == set(TOOLS)


@pytest.mark.asyncio
async def test_paper_question_tool_calls_populate_the_trace(client, mock_openai):
    mock_openai.chat.completions.create.side_effect = [
        _mock_response(
            "", [_tool_call("c1", "query_metrics", '{"disease": "CKD"}')]
        ),
        _mock_response("CKD AUROC is 0.8755."),
    ]
    resp = await client.post(
        "/paper/question", json={"message": "What is the CKD AUROC?"}
    )
    assert resp.status_code == 200
    assert resp.json() == {
        "reply": "CKD AUROC is 0.8755.",
        "tool_trace": [
            {"tool": "query_metrics", "arguments": '{"disease": "CKD"}', "ok": True}
        ],
    }


@pytest.mark.asyncio
async def test_paper_question_carries_conversation_history(client, mock_openai):
    resp = await client.post(
        "/paper/question",
        json={
            "message": "And for the ablation study?",
            "history": [
                {"role": "user", "content": "What is the average AUC?"},
                {"role": "assistant", "content": "0.76."},
            ],
        },
    )
    assert resp.status_code == 200
    messages = mock_openai.chat.completions.create.call_args.kwargs["messages"]
    assert len(messages) == 4
    assert messages[1] == {"role": "user", "content": "What is the average AUC?"}
    assert messages[2] == {"role": "assistant", "content": "0.76."}
    assert messages[3]["content"] == "And for the ablation study?"


@pytest.mark.asyncio
async def test_paper_question_bypasses_intent_classification_and_icd_routing(
    client, mock_openai
):
    """A message that /chat would route to ICD keyword matching (no LLM call at
    all) must still reach the in-task agent exactly once here — the explicit
    bypass of generic intent classification that issue #38 required, preserved
    across the #48 agent cutover."""
    resp = await client.post(
        "/paper/question",
        json={"message": "Show me tuberculosis on the ICD graph"},
    )
    assert resp.status_code == 200
    mock_openai.chat.completions.create.assert_called_once()
    call = mock_openai.chat.completions.create.call_args
    assert call.kwargs["messages"][0]["content"] == AGENT_SYSTEM_PROMPT


@pytest.mark.asyncio
async def test_paper_question_requires_llm_configured(client):
    with patch("app.client", None):
        resp = await client.post("/paper/question", json={"message": "Hello"})
        assert resp.status_code == 503


@pytest.mark.asyncio
async def test_paper_question_rejects_empty_message(client):
    resp = await client.post("/paper/question", json={"message": ""})
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_paper_question_rejects_missing_message(client):
    resp = await client.post("/paper/question", json={})
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_paper_question_surfaces_llm_errors(client):
    from openai import APIError

    with patch("app.client") as mock_client:
        mock_client.chat.completions.create.side_effect = APIError(
            "boom", request=MagicMock(), body=None
        )
        resp = await client.post("/paper/question", json={"message": "Hello"})
        assert resp.status_code == 502


def _stream_chunk(content=None, tool_fragments=None):
    delta = MagicMock()
    delta.content = content
    delta.tool_calls = tool_fragments
    chunk = MagicMock()
    chunk.choices = [MagicMock(delta=delta)]
    return chunk


@pytest.mark.asyncio
async def test_paper_question_stream_emits_sse_events(client, mock_openai):
    mock_openai.chat.completions.create.side_effect = [
        iter([_stream_chunk(content="The answer."), _stream_chunk()])
    ]
    resp = await client.post(
        "/paper/question/stream", json={"message": "What is the average AUC?"}
    )
    assert resp.status_code == 200
    assert resp.headers["content-type"].startswith("text/event-stream")
    assert 'event: token\ndata: {"text": "The answer."}' in resp.text
    assert "event: done" in resp.text
    assert mock_openai.chat.completions.create.call_args.kwargs["stream"] is True


@pytest.mark.asyncio
async def test_paper_question_stream_requires_llm_configured(client):
    with patch("app.client", None):
        resp = await client.post(
            "/paper/question/stream", json={"message": "Hello"}
        )
        assert resp.status_code == 503


def test_agent_prompt_carries_the_scope_contract():
    assert "Study Evidence" in AGENT_SYSTEM_PROMPT
    assert "Build a Demo Profile" in AGENT_SYSTEM_PROMPT
    assert "Bio-E2R" in AGENT_SYSTEM_PROMPT
    assert "clarifying question" in AGENT_SYSTEM_PROMPT
    assert "never invent numbered citations" in AGENT_SYSTEM_PROMPT
import os
from unittest.mock import MagicMock, patch

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

os.environ["LLM_Key_Deepseek"] = "test-key"

from app import (
    app,
    PAPER_QA_SYSTEM_PROMPT,
    CLINICAL_NOT_READY,
    DATA_QUERY_NOT_READY,
    classify_intent,
)
from paper_context import PAPER_TEXT


def _mock_response(content):
    msg = MagicMock()
    msg.message.content = content
    resp = MagicMock()
    resp.choices = [msg]
    return resp


@pytest.fixture
def mock_openai():
    with patch("app.client") as mock_client:
        mock_client.chat.completions.create.return_value = _mock_response(
            "This is a test response."
        )
        yield mock_client


@pytest.fixture
def mock_openai_with_intent():
    """Mock that returns intent on first call and answer on second call."""
    with patch("app.client") as mock_client:
        mock_client.chat.completions.create.side_effect = [
            _mock_response("paper_qa"),
            _mock_response("The average AUC is 0.76."),
        ]
        yield mock_client


@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


# --- Health ---

@pytest.mark.asyncio
async def test_health(client):
    resp = await client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


# --- Paper Q&A ---

@pytest.mark.asyncio
async def test_chat_paper_qa(client, mock_openai_with_intent):
    resp = await client.post(
        "/chat", json={"message": "What is the average AUC?"}
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["intent"] == "paper_qa"
    assert "0.76" in body["reply"]

    qa_call = mock_openai_with_intent.chat.completions.create.call_args_list[1]
    messages = qa_call.kwargs["messages"]
    assert messages[0]["role"] == "system"
    assert "PAPER CONTENT" in messages[0]["content"]


@pytest.mark.asyncio
async def test_chat_with_history(client, mock_openai_with_intent):
    resp = await client.post(
        "/chat",
        json={
            "message": "Follow up question",
            "history": [
                {"role": "user", "content": "First message"},
                {"role": "assistant", "content": "First reply"},
            ],
        },
    )
    assert resp.status_code == 200
    qa_call = mock_openai_with_intent.chat.completions.create.call_args_list[1]
    messages = qa_call.kwargs["messages"]
    assert len(messages) == 4
    assert messages[0]["role"] == "system"
    assert messages[1]["role"] == "user"
    assert messages[2]["role"] == "assistant"
    assert messages[3]["content"] == "Follow up question"


# --- Intent classification ---

@pytest.mark.asyncio
async def test_intent_clinical(client):
    with patch("app.client") as mock_client:
        mock_client.chat.completions.create.return_value = _mock_response("clinical")
        resp = await client.post(
            "/chat", json={"message": "Assess my risk for heart disease"}
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["intent"] == "clinical"
        assert body["reply"] == CLINICAL_NOT_READY
        mock_client.chat.completions.create.assert_called_once()


@pytest.mark.asyncio
async def test_intent_data_query(client):
    with patch("app.client") as mock_client:
        mock_client.chat.completions.create.return_value = _mock_response("data_query")
        resp = await client.post(
            "/chat", json={"message": "Show me the ablation results CSV"}
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["intent"] == "data_query"
        assert body["reply"] == DATA_QUERY_NOT_READY
        mock_client.chat.completions.create.assert_called_once()


@pytest.mark.asyncio
async def test_intent_general_falls_through_to_paper_qa(client):
    with patch("app.client") as mock_client:
        mock_client.chat.completions.create.side_effect = [
            _mock_response("general"),
            _mock_response("Hello! I can help you with questions about the paper."),
        ]
        resp = await client.post("/chat", json={"message": "Hello"})
        assert resp.status_code == 200
        body = resp.json()
        assert body["intent"] == "general"


@pytest.mark.asyncio
async def test_intent_unknown_defaults_to_paper_qa(client):
    with patch("app.client") as mock_client:
        mock_client.chat.completions.create.side_effect = [
            _mock_response("something_weird!!!"),
            _mock_response("Answering from paper context."),
        ]
        resp = await client.post(
            "/chat", json={"message": "Tell me about the model"}
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["intent"] == "paper_qa"


def test_classify_intent_sanitizes_output():
    with patch("app.client") as mock_client:
        mock_client.chat.completions.create.return_value = _mock_response(
            "  Paper_QA  "
        )
        result = classify_intent("What is ALIGATEHR-Gen?")
        assert result == "paper_qa"


def test_classify_intent_garbage_defaults():
    with patch("app.client") as mock_client:
        mock_client.chat.completions.create.return_value = _mock_response(
            "I think this is about the paper"
        )
        result = classify_intent("What is the AUC?")
        assert result == "paper_qa"


# --- Error handling ---

@pytest.mark.asyncio
async def test_chat_no_api_key(client):
    with patch("app.client", None):
        resp = await client.post("/chat", json={"message": "Hello"})
        assert resp.status_code == 503


@pytest.mark.asyncio
async def test_chat_missing_message_field(client):
    resp = await client.post("/chat", json={})
    assert resp.status_code == 422


# --- Paper context ---

def test_paper_context_contains_key_facts():
    assert "ALIGATEHR-Gen" in PAPER_TEXT
    assert "118 diseases" in PAPER_TEXT
    assert "0.76" in PAPER_TEXT
    assert "UK Biobank" in PAPER_TEXT
    assert "first-degree relatives" in PAPER_TEXT


def test_system_prompt_includes_paper():
    assert "PAPER CONTENT" in PAPER_QA_SYSTEM_PROMPT
    assert "ALIGATEHR-Gen" in PAPER_QA_SYSTEM_PROMPT
    assert "do not guess or hallucinate" in PAPER_QA_SYSTEM_PROMPT


# --- Response model ---

@pytest.mark.asyncio
async def test_response_includes_intent_field(client, mock_openai_with_intent):
    resp = await client.post(
        "/chat", json={"message": "How does the attention mechanism work?"}
    )
    body = resp.json()
    assert "intent" in body
    assert "reply" in body

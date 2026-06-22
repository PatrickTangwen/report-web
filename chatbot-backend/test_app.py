import os
from unittest.mock import MagicMock, patch

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

os.environ["LLM_API_KEY"] = "test-key"

from app import app


@pytest.fixture
def mock_anthropic():
    mock_response = MagicMock()
    mock_response.content = [MagicMock(text="This is a test response.")]
    with patch("app.client") as mock_client:
        mock_client.messages.create.return_value = mock_response
        yield mock_client


@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


@pytest.mark.asyncio
async def test_health(client):
    resp = await client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_chat_returns_reply(client, mock_anthropic):
    resp = await client.post("/chat", json={"message": "Hello"})
    assert resp.status_code == 200
    body = resp.json()
    assert "reply" in body
    assert body["reply"] == "This is a test response."


@pytest.mark.asyncio
async def test_chat_with_history(client, mock_anthropic):
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
    call_args = mock_anthropic.messages.create.call_args
    messages = call_args.kwargs["messages"]
    assert len(messages) == 3
    assert messages[0]["role"] == "user"
    assert messages[1]["role"] == "assistant"
    assert messages[2]["content"] == "Follow up question"


@pytest.mark.asyncio
async def test_chat_empty_message(client, mock_anthropic):
    resp = await client.post("/chat", json={"message": ""})
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_chat_no_api_key(client):
    with patch("app.client", None):
        resp = await client.post("/chat", json={"message": "Hello"})
        assert resp.status_code == 503


@pytest.mark.asyncio
async def test_chat_missing_message_field(client):
    resp = await client.post("/chat", json={})
    assert resp.status_code == 422

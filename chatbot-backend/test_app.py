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
    DATA_QUERY_SYSTEM_PROMPT,
    classify_intent,
)
from paper_context import PAPER_TEXT
from data_query import match_disease, match_datasets, query_data, format_data_context


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
async def test_intent_data_query_routes_to_data(client):
    with patch("app.client") as mock_client:
        mock_client.chat.completions.create.side_effect = [
            _mock_response("data_query"),
            _mock_response("The AUROC for CKD is 0.82."),
        ]
        resp = await client.post(
            "/chat", json={"message": "What's the AUROC for CKD?"}
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["intent"] == "data_query"
        assert body["reply"] == "The AUROC for CKD is 0.82."

        qa_call = mock_client.chat.completions.create.call_args_list[1]
        system_content = qa_call.kwargs["messages"][0]["content"]
        assert "QUERY RESULTS" in system_content


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


# --- Data query module ---

def test_match_disease_exact():
    assert match_disease("What's the AUROC for CKD?") == "CKD"


def test_match_disease_full_name():
    assert match_disease("Tell me about Type 2 Diabetes") == "Type 2 Diabetes"


def test_match_disease_underscore():
    assert match_disease("pathways for Crohns Disease") == "Crohns_Disease"


def test_match_disease_alias_mash():
    assert match_disease("Top risk factors for MASH?") == "NASH"


def test_match_disease_alias_cad():
    assert match_disease("What about coronary artery disease?") == "Coronary Heart Disease"


def test_match_disease_alias_crohn():
    assert match_disease("pathways for Crohn's disease") == "Crohns_Disease"


def test_match_disease_none():
    assert match_disease("What's the best model?") is None


def test_match_disease_case_insensitive():
    result = match_disease("what about ckd?")
    assert result == "CKD"


def test_match_datasets_eval_keywords():
    result = match_datasets("What's the AUROC for CKD?")
    assert "evaluation_metrics" in result


def test_match_datasets_ablation_keywords():
    result = match_datasets("What happens without genetic data?")
    assert "ablation_results" in result


def test_match_datasets_feature_keywords():
    result = match_datasets("What are the top risk factors for MASH?")
    assert "feature_importance" in result


def test_match_datasets_pathway_keywords():
    result = match_datasets("What pathways are enriched in CKD?")
    assert "pathway_enrichment" in result


def test_match_datasets_defaults_to_eval():
    result = match_datasets("Tell me something about the data")
    assert result == ["evaluation_metrics"]


def test_query_data_filters_by_disease():
    results, disease, names = query_data("What's the AUROC for CKD?")
    assert disease == "CKD"
    assert "evaluation_metrics" in results
    assert "CKD" in results["evaluation_metrics"]
    assert "Type 2 Diabetes" not in results["evaluation_metrics"]


def test_query_data_ablation():
    results, disease, names = query_data("What happens without genetic data?")
    assert "ablation_results" in results
    assert "w/o Genetic Data" in results["ablation_results"]


def test_query_data_feature_importance():
    results, disease, names = query_data("Top risk factors for NASH?")
    assert "feature_importance" in results
    assert "NASH" in results["feature_importance"]


def test_query_data_pathway():
    results, disease, names = query_data("What pathways are enriched in CKD?")
    assert "pathway_enrichment" in results
    assert "CKD" in results["pathway_enrichment"]


def test_format_data_context_structure():
    results, disease, names = query_data("AUROC for CKD")
    ctx = format_data_context(results, disease, names)
    assert "Available datasets:" in ctx
    assert "Detected disease filter: CKD" in ctx
    assert "=== evaluation_metrics ===" in ctx
    assert "Available diseases per dataset" in ctx


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

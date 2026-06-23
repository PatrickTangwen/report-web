import os
from unittest.mock import MagicMock, patch

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

os.environ["LLM_Key_Deepseek"] = "test-key"

from app import (
    app,
    PAPER_QA_SYSTEM_PROMPT,
    CLINICAL_PROMPT,
    DATA_QUERY_SYSTEM_PROMPT,
    classify_intent,
)
from paper_context import PAPER_TEXT
from data_query import match_disease, match_datasets, query_data, format_data_context, is_pathway_query, is_embedding_query
from clinical_form import get_available_diseases, get_form_fields
from risk_assessment import query_patient_risk
from followup import get_pathway_enrichment, describe_embedding_context


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
async def test_intent_clinical_returns_disease_select(client):
    with patch("app.client") as mock_client:
        mock_client.chat.completions.create.return_value = _mock_response("clinical")
        resp = await client.post(
            "/chat", json={"message": "Assess my risk for heart disease"}
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["intent"] == "clinical"
        assert body["reply"] == CLINICAL_PROMPT
        assert body["ui"]["type"] == "disease_select"
        diseases = body["ui"]["diseases"]
        assert len(diseases) == 7
        ids = [d["id"] for d in diseases]
        assert "CKD" in ids
        assert "NASH" in ids
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


# --- Clinical form module ---

def test_get_available_diseases():
    diseases = get_available_diseases()
    assert len(diseases) == 7
    ids = [d["id"] for d in diseases]
    assert "CKD" in ids
    assert "NASH" in ids
    assert "IPF" in ids
    assert "Crohns_Disease" in ids
    for d in diseases:
        assert "id" in d
        assert "label" in d
        assert len(d["label"]) > 0


def test_get_form_fields_valid_disease():
    result = get_form_fields("CKD")
    assert result is not None
    assert result["disease"] == "CKD"
    assert "Chronic Kidney Disease" in result["disease_label"]
    assert len(result["fields"]) == 10
    first = result["fields"][0]
    assert first["rank"] == 1
    assert "key" in first
    assert "label" in first
    assert "type" in first


def test_get_form_fields_respects_top_n():
    result = get_form_fields("CKD", top_n=5)
    assert result is not None
    assert len(result["fields"]) == 5


def test_get_form_fields_alias():
    result = get_form_fields("mash")
    assert result is not None
    assert result["disease"] == "NASH"


def test_get_form_fields_unknown_disease():
    result = get_form_fields("nonexistent_disease_xyz")
    assert result is None


def test_get_form_fields_field_metadata():
    result = get_form_fields("CKD", top_n=50)
    for field in result["fields"]:
        assert "key" in field
        assert "label" in field
        assert "type" in field
        if field["type"] == "numeric":
            assert "min" in field
            assert "max" in field
            assert "step" in field
        elif field["type"] == "select":
            assert "options" in field


# --- Form-fields endpoint ---

@pytest.mark.asyncio
async def test_form_fields_endpoint(client):
    resp = await client.get("/form-fields", params={"disease": "CKD"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["disease"] == "CKD"
    assert len(body["fields"]) == 10


@pytest.mark.asyncio
async def test_form_fields_with_alias(client):
    resp = await client.get("/form-fields", params={"disease": "mash"})
    assert resp.status_code == 200
    assert resp.json()["disease"] == "NASH"


@pytest.mark.asyncio
async def test_form_fields_unknown_disease(client):
    resp = await client.get("/form-fields", params={"disease": "unknown_xyz"})
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_form_fields_empty_disease(client):
    resp = await client.get("/form-fields", params={"disease": ""})
    assert resp.status_code == 422


# --- Clinical submit endpoint ---

@pytest.mark.asyncio
async def test_clinical_submit(client):
    resp = await client.post(
        "/clinical/submit",
        json={"disease": "CKD", "values": {"BMI": 25.3, "Free T4": 15.2}},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "received"
    assert body["disease"] == "CKD"
    assert "Chronic Kidney Disease" in body["message"]


@pytest.mark.asyncio
async def test_clinical_submit_unknown_disease(client):
    resp = await client.post(
        "/clinical/submit",
        json={"disease": "unknown_xyz", "values": {"BMI": 25}},
    )
    assert resp.status_code == 404


# --- Risk assessment module ---

def test_query_patient_risk_valid():
    result = query_patient_risk({"BMI": 27.5, "Creatinine": 100}, "CKD")
    assert result is not None
    assert result["disease"] == "CKD"
    assert result["risk_level"] in ("high", "medium", "low")
    assert 0 <= result["risk_probability"] <= 1
    assert len(result["risk_factors"]) == 5
    assert result["similar_patients"]["count"] == 20
    assert "disclaimer" in result


def test_query_patient_risk_alias():
    result = query_patient_risk({"BMI": 30}, "mash")
    assert result is not None
    assert result["disease"] == "NASH"


def test_query_patient_risk_unknown_disease():
    result = query_patient_risk({"BMI": 25}, "nonexistent_xyz")
    assert result is None


def test_query_patient_risk_no_embedding_disease():
    result = query_patient_risk({"BMI": 25}, "IPF")
    assert result is None


def test_query_patient_risk_no_matching_features():
    result = query_patient_risk({"Free T4": 15.0}, "CKD")
    assert result is not None
    assert result["similar_patients"]["count"] == 20


def test_query_patient_risk_factors_have_cohort_data():
    result = query_patient_risk({"BMI": 27.5, "HbA1c": 38}, "CKD")
    bmi_factor = next((f for f in result["risk_factors"] if f["feature"] == "BMI"), None)
    assert bmi_factor is not None
    assert bmi_factor["user_value"] == 27.5
    assert "cohort_mean" in bmi_factor


def test_query_patient_risk_similar_patients_stats():
    result = query_patient_risk({"BMI": 27.5}, "CKD")
    sp = result["similar_patients"]
    assert 0 <= sp["high_risk_pct"] <= 100
    assert sp["mean_age"] is not None
    assert sp["male_pct"] is not None
    assert sp["family_history_pct"] is not None


# --- Assess endpoint ---

@pytest.mark.asyncio
async def test_assess_endpoint(client):
    resp = await client.post(
        "/assess",
        json={"disease": "CKD", "values": {"BMI": 27.5, "Creatinine": 100}},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["disease"] == "CKD"
    assert body["risk_level"] in ("high", "medium", "low")
    assert len(body["risk_factors"]) == 5
    assert body["similar_patients"]["count"] == 20
    assert "disclaimer" in body


@pytest.mark.asyncio
async def test_assess_unknown_disease(client):
    resp = await client.post(
        "/assess",
        json={"disease": "unknown_xyz", "values": {"BMI": 25}},
    )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_assess_no_embedding_disease(client):
    resp = await client.post(
        "/assess",
        json={"disease": "IPF", "values": {"BMI": 25}},
    )
    assert resp.status_code == 404


# --- Followup: pathway enrichment ---

def test_get_pathway_enrichment_valid():
    result = get_pathway_enrichment("CKD")
    assert result is not None
    assert result["disease"] == "CKD"
    assert "Chronic Kidney Disease" in result["disease_label"]
    assert len(result["pathways"]) == 10
    first = result["pathways"][0]
    assert "pathway" in first
    assert "source" in first
    assert "gene_count" in first
    assert "enrichment_ratio" in first
    assert "p_adjusted" in first


def test_get_pathway_enrichment_top_n():
    result = get_pathway_enrichment("CKD", top_n=5)
    assert result is not None
    assert len(result["pathways"]) == 5


def test_get_pathway_enrichment_alias():
    result = get_pathway_enrichment("mash")
    assert result is not None
    assert result["disease"] == "NASH"


def test_get_pathway_enrichment_unknown():
    result = get_pathway_enrichment("nonexistent_xyz")
    assert result is None


def test_get_pathway_enrichment_sources():
    result = get_pathway_enrichment("CKD", top_n=40)
    sources = {p["source"] for p in result["pathways"]}
    assert len(sources) >= 2


# --- Followup: embedding context ---

def test_describe_embedding_context_valid():
    result = describe_embedding_context("CKD")
    assert result is not None
    assert result["disease"] == "CKD"
    assert result["embed_disease"] == "CKD"
    assert result["total_patients"] > 0
    assert "x" in result["centroid"]
    assert "y" in result["centroid"]
    assert result["mean_purity_2d"] > 0
    groups = result["groups"]
    for g in ("pure", "intermediate", "overlap"):
        assert g in groups
        assert "count" in groups[g]
        assert "pct" in groups[g]
    assert len(result["nearest_clusters"]) == 3


def test_describe_embedding_context_alias():
    result = describe_embedding_context("mash")
    assert result is not None
    assert result["disease"] == "NASH"
    assert result["embed_disease"] == "MASH"


def test_describe_embedding_context_unknown():
    result = describe_embedding_context("nonexistent_xyz")
    assert result is None


def test_describe_embedding_context_no_embedding():
    result = describe_embedding_context("IPF")
    assert result is None


def test_describe_embedding_context_group_pcts_sum():
    result = describe_embedding_context("CKD")
    total_pct = sum(result["groups"][g]["pct"] for g in ("pure", "intermediate", "overlap"))
    assert 99.5 <= total_pct <= 100.5


# --- Keyword detection ---

def test_is_pathway_query():
    assert is_pathway_query("What pathways are involved?")
    assert is_pathway_query("Show me the enriched pathways")
    assert is_pathway_query("KEGG pathways for this disease")
    assert not is_pathway_query("What's the AUROC?")


def test_is_embedding_query():
    assert is_embedding_query("Where do similar patients cluster?")
    assert is_embedding_query("Show me the UMAP embedding")
    assert is_embedding_query("What about patient clustering?")
    assert not is_embedding_query("What's the AUROC?")


# --- Chat with assessed_disease ---

@pytest.mark.asyncio
async def test_chat_pathway_with_assessed_disease(client):
    with patch("app.client") as mock_client:
        mock_client.chat.completions.create.return_value = _mock_response("data_query")
        resp = await client.post(
            "/chat",
            json={
                "message": "What pathways are involved?",
                "assessed_disease": "CKD",
            },
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["ui"] is not None
        assert body["ui"]["type"] == "pathway_enrichment"
        assert body["ui"]["disease"] == "CKD"
        assert len(body["ui"]["pathways"]) == 10
        mock_client.chat.completions.create.assert_called_once()


@pytest.mark.asyncio
async def test_chat_pathway_disease_in_message(client):
    with patch("app.client") as mock_client:
        mock_client.chat.completions.create.return_value = _mock_response("data_query")
        resp = await client.post(
            "/chat",
            json={"message": "What pathways are enriched in CKD?"},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["ui"]["type"] == "pathway_enrichment"
        assert body["ui"]["disease"] == "CKD"


@pytest.mark.asyncio
async def test_chat_embedding_with_assessed_disease(client):
    with patch("app.client") as mock_client:
        mock_client.chat.completions.create.side_effect = [
            _mock_response("data_query"),
            _mock_response("The CKD patients form a distinct cluster in the UMAP space."),
        ]
        resp = await client.post(
            "/chat",
            json={
                "message": "Where do similar patients cluster?",
                "assessed_disease": "CKD",
            },
        )
        assert resp.status_code == 200
        body = resp.json()
        assert "cluster" in body["reply"].lower()
        calls = mock_client.chat.completions.create.call_args_list
        system_content = calls[1].kwargs["messages"][0]["content"]
        assert "EMBEDDING CONTEXT" in system_content
        assert "CKD" in system_content


@pytest.mark.asyncio
async def test_chat_data_query_fallback_assessed_disease(client):
    with patch("app.client") as mock_client:
        mock_client.chat.completions.create.side_effect = [
            _mock_response("data_query"),
            _mock_response("The top risk factors are BMI and creatinine."),
        ]
        resp = await client.post(
            "/chat",
            json={
                "message": "What are the top risk factors?",
                "assessed_disease": "CKD",
            },
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["intent"] == "data_query"

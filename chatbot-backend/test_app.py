import os
from unittest.mock import MagicMock, patch

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

os.environ["LLM_Key_Deepseek"] = "test-key"

from typing import get_args

from app import app, ComparisonTarget
from fibrotic_contract import TARGETS
from paper_context import PAPER_TEXT
from data_query import match_disease
from followup import get_pathway_enrichment


def _mock_response(content):
    msg = MagicMock()
    msg.message.content = content
    msg.message.tool_calls = None
    resp = MagicMock()
    resp.choices = [msg]
    return resp


@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


def test_comparison_target_literal_matches_the_approved_target_set():
    assert set(get_args(ComparisonTarget)) == TARGETS


# --- Health ---

@pytest.mark.asyncio
async def test_health(client):
    resp = await client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_superseded_risk_routes_are_not_public(client):
    assert (await client.get("/form-fields", params={"disease": "CKD"})).status_code == 404
    assert (
        await client.post(
            "/clinical/submit",
            json={"disease": "CKD", "values": {"BMI": 25}},
        )
    ).status_code == 404
    assert (
        await client.post(
            "/assess",
            json={"disease": "CKD", "values": {"BMI": 25}},
        )
    ).status_code == 404


@pytest.mark.asyncio
async def test_legacy_chat_router_is_deleted_not_disabled(client):
    """#53: the intent-router endpoint is gone from the app entirely."""
    resp = await client.post("/chat", json={"message": "What is the average AUC?"})
    assert resp.status_code == 404


# --- CORS ---

@pytest.mark.asyncio
async def test_public_pages_origin_is_allowed_by_cors(client):
    response = await client.options(
        "/paper/question",
        headers={
            "Origin": "https://patricktangwen.github.io",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "https://patricktangwen.github.io"


@pytest.mark.asyncio
async def test_local_preview_origins_are_allowed_by_cors(client):
    for origin in (
        "http://localhost:4200",
        "http://localhost:4210",
        "http://127.0.0.1:4999",
        "http://[::1]:4200",
    ):
        response = await client.options(
            "/paper/question",
            headers={
                "Origin": origin,
                "Access-Control-Request-Method": "POST",
            },
        )

        assert response.status_code == 200
        assert response.headers["access-control-allow-origin"] == origin


def test_superseded_mock_and_duplicate_patient_assets_are_absent():
    root = os.path.dirname(os.path.dirname(__file__))
    legacy_paths = [
        "chatbot-backend/data/feature_importance.csv",
        "chatbot-backend/data/fibrotic_patient_embeddings.csv",
        "viz/data/feature_importance.csv",
        "viz/data/fibrotic_patient_embeddings.csv",
    ]

    assert [path for path in legacy_paths if os.path.exists(os.path.join(root, path))] == []


# --- Disease matching (used by the agent's metrics/ablation tools) ---

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


# --- Paper context ---

def test_paper_context_contains_key_facts():
    assert "ALIGATEHR-Gen" in PAPER_TEXT
    assert "118 diseases" in PAPER_TEXT
    assert "0.76" in PAPER_TEXT
    assert "UK Biobank" in PAPER_TEXT
    assert "first-degree relatives" in PAPER_TEXT


# --- Followup: pathway enrichment (used by the agent's enrichment tool) ---

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

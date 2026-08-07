import json
import os

import pytest

os.environ.setdefault("LLM_Key_Deepseek", "test-key")

from agent_tools import TOOLS
from mcp_server import research_mcp

AGENT_TOOL_NAMES = set(TOOLS)
MCP_ONLY_TOOLS = {"search_icd_codes", "get_fibrotic_embedding"}


@pytest.mark.asyncio
async def test_mcp_roster_is_a_strict_superset_of_the_agent_roster():
    tools = await research_mcp.list_tools()
    names = {tool.name for tool in tools}
    assert names == AGENT_TOOL_NAMES | MCP_ONLY_TOOLS
    assert len(names) == 7


@pytest.mark.asyncio
async def test_mcp_exposes_no_profile_or_matching_surface():
    tools = await research_mcp.list_tools()
    for tool in tools:
        for banned in ("profile", "match_patient", "confirm", "coverage"):
            assert banned not in tool.name
    texts = " ".join(tool.description or "" for tool in tools)
    assert "no patient-level data" in (research_mcp.instructions or "")
    assert "never individual patient rows" in texts.lower() or "aggregates only" in texts.lower()


def _payload(result):
    if isinstance(result, tuple):
        result = result[0]
    return json.loads(result[0].text)


@pytest.mark.asyncio
async def test_mcp_call_reuses_the_agent_tool_validation_layer():
    result = await research_mcp.call_tool(
        "query_metrics", {"disease": "CKD", "model": "ALIGATEHR-Gen", "metric": "AUROC"}
    )
    payload = _payload(result)
    assert payload["rows"][0]["value"] == 0.8755

    result = await research_mcp.call_tool("query_enrichment", {"disease": "influenza"})
    assert _payload(result)["matched"] is False


@pytest.mark.asyncio
async def test_mcp_icd_lookup_returns_versioned_matches():
    result = await research_mcp.call_tool(
        "search_icd_codes", {"keyword": "chronic kidney disease"}
    )
    payload = _payload(result)
    assert payload["status"] in ("supported", "ambiguous", "unsupported")
    assert payload["vocabulary_version"]


@pytest.mark.asyncio
async def test_mcp_fibrotic_embedding_is_display_safe_only():
    result = await research_mcp.call_tool("get_fibrotic_embedding", {})
    payload = _payload(result)
    assert payload["point_count"] == len(payload["points"])
    point = payload["points"][0]
    assert set(point) == {"visual_reference_id", "disease", "group", "tsne_x", "tsne_y"}

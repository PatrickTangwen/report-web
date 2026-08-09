"""MCP research-data service (ADR-0015).

Exposes the read-only research tools over the Model Context Protocol so
any MCP client (Claude Desktop, Cursor, ...) can consume them. This is a
transport layer over the T1 tool registry: descriptions come from
agent_tools.TOOLS and every call is validated and executed by
execute_tool, so the agent and MCP surfaces cannot drift apart.

Governance boundary: the profile/matching flow and patient-level
matching data are never exposed. The MCP roster is a strict superset of
the agent roster: the five Study Evidence tools plus the ICD keyword
lookup (owned by visualization pages, hence not an agent tool) and raw
access to the display-safe fibrotic release.

Transports:
- Streamable HTTP, stateless, mounted at /mcp on the FastAPI app (see
  app.py) — one container, one port, works on Render.
- stdio for local development: `python mcp_server.py`.
"""

from mcp.server.fastmcp import FastMCP
from mcp.server.transport_security import TransportSecuritySettings

from agent_tools import TOOLS, execute_tool
from fibrotic_release import load_fibrotic_release
from icd_keyword import match_icd_keywords

# DNS-rebinding protection wants an explicit Host allowlist: the public
# Render deployment plus local development hosts (any port).
ALLOWED_MCP_HOSTS = [
    "aligatehr-gen-backend.onrender.com",
    "localhost",
    "localhost:*",
    "127.0.0.1",
    "127.0.0.1:*",
]

research_mcp = FastMCP(
    "aligatehr-research",
    instructions=(
        "Read-only research-data service for ALIGATEHR-Gen: published paper "
        "content, versioned demonstration metrics/ablation/pathway results "
        "whose mock or published status is explicit, cohort-level fibrotic aggregates, validated "
        "ICD keyword lookup, and the display-safe fibrotic embedding "
        "release. Research demonstration only — no patient-level data, no "
        "medical advice."
    ),
    streamable_http_path="/",
    stateless_http=True,
    json_response=True,
    transport_security=TransportSecuritySettings(allowed_hosts=ALLOWED_MCP_HOSTS),
)


@research_mcp.tool(description=TOOLS["get_paper_content"]["description"])
def get_paper_content(section: str | None = None):
    return execute_tool("get_paper_content", {"section": section})


@research_mcp.tool(description=TOOLS["query_metrics"]["description"])
def query_metrics(
    disease: str | None = None, model: str | None = None, metric: str | None = None
):
    return execute_tool(
        "query_metrics", {"disease": disease, "model": model, "metric": metric}
    )


@research_mcp.tool(description=TOOLS["query_ablation"]["description"])
def query_ablation(
    disease: str | None = None, variant: str | None = None, metric: str | None = None
):
    return execute_tool(
        "query_ablation", {"disease": disease, "variant": variant, "metric": metric}
    )


@research_mcp.tool(description=TOOLS["query_enrichment"]["description"])
def query_enrichment(disease: str, top_n: int = 10):
    return execute_tool("query_enrichment", {"disease": disease, "top_n": top_n})


@research_mcp.tool(description=TOOLS["summarize_fibrotic_cohort"]["description"])
def summarize_fibrotic_cohort(disease: str | None = None):
    return execute_tool("summarize_fibrotic_cohort", {"disease": disease})


@research_mcp.tool(
    description=(
        "Look up validated ICD diagnosis codes, code ranges, or categories "
        "for a disease keyword using the versioned, researcher-reviewed ICD "
        "Keyword Vocabulary. Returns supported matches, ambiguity options, "
        "or an unsupported status — never guessed codes."
    )
)
def search_icd_codes(keyword: str):
    return match_icd_keywords(keyword)


@research_mcp.tool(
    description=(
        "Fetch the raw display-safe fibrotic embedding release: dataset "
        "version, release date, per-disease counts, and the de-identified "
        "2D embedding points (visual reference id, disease, group, "
        "coordinates). Contains no clinical features and no patient "
        "identifiers."
    )
)
def get_fibrotic_embedding():
    embedding, _ = load_fibrotic_release()
    return embedding


if __name__ == "__main__":
    research_mcp.run()

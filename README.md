# ALIGATEHR-Gen Research Website

> **Current stack and data contract (2026-08-08):** frontend modules are built
> with pnpm + TypeScript + Vite, backend environments are locked with uv, and
> FastAPI OpenAPI generates the frontend API contract. Evaluation, ablation,
> and pathway values currently come from the explicitly labelled
> `research-results-mock-v1` release, not published experimental results. See
> `docs/technical-stack-modernization-2026-08-08.md`.

> **Current contract (2026-08-07):** the assistant is a task-routed Guided
> Research Assistant backed by a bounded function-calling agent; the legacy
> intent-router `/chat` path is deleted (#53). Governing docs:
> `docs/spec-agent-refactor-2026-08-07.md` (agent, eval, MCP, streaming) and
> `docs/complete-experience-shipped-contract-2026-07-13.md` (earlier shipped
> boundary).

A Quarto-based academic website for the ALIGATEHR-Gen project — a graph attention network integrating EHR, genetic data, and medical ontology for disease risk prediction in the UK Biobank. Features interactive data visualization dashboards and an AI-powered research chatbot.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Site framework | [Quarto](https://quarto.org) (website project type) |
| Visualization | [Observable JS (OJS)](https://observablehq.com/@observablehq/observable-javascript) cells in `.qmd` |
| Charts (SVG) | [Observable Plot](https://observablehq.com/plot/) |
| Charts (WebGL) | [regl-scatterplot](https://github.com/flekschas/regl-scatterplot) for large point clouds |
| Frontend build | pnpm + TypeScript + Vite; local UMD/ES bundles replace runtime CDN imports |
| Data transport | CSV for small tables; generated uncompressed Arrow IPC for the 114K-point patient embedding |
| Assistant backend | [FastAPI](https://fastapi.tiangolo.com/) + a bounded function-calling agent over [DeepSeek](https://platform.deepseek.com/)'s OpenAI-compatible API (framework-free loop, typed Pydantic tools) |
| Assistant frontend | Existing Vanilla JS widget backed by a typed Vite boundary and FastAPI-generated OpenAPI types |
| Tool service | [MCP](https://modelcontextprotocol.io/) Streamable HTTP mounted at `/mcp` on the same FastAPI app |
| Evaluation | Golden-set harness with LLM-as-judge + judge-free tool-trace metrics (`chatbot-backend/eval/`) |
| Testing | pytest, Node test runner, Vitest, Playwright, and axe-core across desktop/mobile Chromium |
| Observability | Privacy-safe OpenTelemetry OTLP spans plus structured request logs without bodies or query strings |
| Styling | SCSS (`styles/custom.scss`) + CSS (`styles/styles.css`) |
| Themes | Light (cosmo) / Dark (darkly) with custom extensions |
| Citations | BibTeX + Nature CSL |

## Project Structure

```
report-web/
├── _quarto.yml              # Site config: navbar, theme, format
├── index.qmd                # Homepage (hero section)
├── references.bib           # BibTeX bibliography
├── paper_v1.pdf             # Source PDF
├── report/
│   ├── index.qmd            # Report landing page
│   ├── paper1.qmd           # Full paper content
│   └── figures/             # Paper figures (PNG/JPEG)
├── viz/
│   ├── overall-performance.qmd  # Page 1: UMAP + Metrics
│   ├── ablation.qmd             # Page 2: Ablation delta chart
│   ├── use-case.qmd             # Page 3: Fibrotic disease analysis
│   └── data/                    # Published visualization assets (CSV + generated Arrow)
├── frontend/                # Typed source, generated OpenAPI client, Vite bundles
├── e2e/                     # Playwright + axe browser acceptance
├── chatbot/                 # Frontend chatbot widget
│   ├── chatbot-include.html     # HTML injected into every page
│   ├── chatbot.css              # Widget styles
│   └── chatbot.js               # Client-side logic
├── chatbot-backend/         # FastAPI assistant service
│   ├── app.py                   # API: paper questions (agent), SSE stream, profile wizard, /mcp mount
│   ├── agent.py                 # Bounded function-calling loop (run_agent / stream_agent)
│   ├── agent_tools.py           # Typed Study Evidence tools (Pydantic schemas)
│   ├── mcp_server.py            # MCP research-data service (Streamable HTTP + stdio)
│   ├── paper_context.py         # Published paper text (full-document context grounding)
│   ├── data_query.py            # Dataset loading and disease-name resolution
│   ├── profile_matching.py      # Demo Profile coverage + cohort matching
│   ├── followup.py              # Pathway enrichment lookups
│   ├── telemetry.py             # Privacy-safe tracing and request logs
│   ├── research_data_release.py # Versioned result-data authority
│   ├── eval/                    # Golden set, runner, committed results
│   ├── data/                    # Backend CSV data copies
│   ├── pyproject.toml / uv.lock # Locked Python project
│   ├── Dockerfile               # uv-based container image (Python 3.11)
│   └── requirements.txt         # uv-generated pip compatibility export
├── scripts/
│   ├── check_ojs_assets.py      # Deployment-time OJS asset validator
│   ├── sync_research_data.py    # Sync backend authority to published copies
│   ├── generate_paper_context.py# Check published-paper assistant context
│   └── build_embedding_assets.py# Reproducible CSV → Arrow build + benchmark
├── styles/
│   ├── custom.scss              # SCSS theme variables + components
│   ├── styles.css               # Layout, dark mode overrides
│   └── nature.csl               # Citation format
├── viz_planning/            # Design specs (reference only)
├── docs/                    # Agent and handoff documentation
└── _site/                   # Generated output (gitignored)
```

## Features

### Interactive Visualizations

- **Overall Performance** — Patient UMAP colored by sex/age (WebGL, 114K points), ICD code UMAP with search (12K codes), evaluation metrics dot plot
- **Ablation Study** — Delta bar chart with disease/metric dropdown selectors
- **Use Case** — Fibrotic patient UMAP (6K patients), risk factor bar chart, pathway enrichment dot plot
- Dark mode support for all OJS charts (SVG + WebGL)

### Guided Research Assistant

A floating assistant on every page with three explicit Research Tasks — no
hidden intent routing (ADR-0010):

- **Understand the Research** — free-form Research Questions answered by a
  bounded function-calling agent that orchestrates typed tools over Study
  Evidence: the published paper (full-document context, not retrieval) plus
  the versioned research-result release (currently mock and visibly labelled)
  plus cohort aggregates. Answers stream over SSE with visible tool-activity
  lines.
- **Explore Visualizations** — direct navigation to the Performance,
  Ablation, and Use Case pages.
- **Build a Demo Profile** — a staged wizard with target-first selection,
  coverage guidance, and explicit confirm-and-compare (ADR-0008).

The same tool set is a public **MCP research-data service** (`/mcp`,
Streamable HTTP) consumable from Claude Desktop and other MCP clients.
Answer quality is measured, not asserted: see the three-generation
comparison in `chatbot-backend/README.md` (agent: 94.4% overall, 100%
multi-tool vs 0% for the pre-agent baseline) and the site's
[Engineering page](https://patricktangwen.github.io/report-web/engineering.html).

The backend runs as a FastAPI service (Docker; deployed on Render).

## Local Development

### Prerequisites

- [Quarto](https://quarto.org/docs/get-started/) (v1.4+)
- Node.js 22+, [pnpm](https://pnpm.io/), and [uv](https://docs.astral.sh/uv/)
- Python 3.11 or 3.12 (managed through uv)

### Site Preview

```bash
pnpm install
pnpm run build:frontend
quarto preview              # Dev server at http://localhost:4200
pnpm test                   # frontend build + Node/Vitest/type checks
pnpm run test:e2e           # desktop/mobile Chromium + axe
```

### Chatbot Backend

```bash
cp chatbot-backend/.env.example chatbot-backend/.env  # Set LLM_Key_Deepseek
uv sync --project chatbot-backend --locked
uv run --project chatbot-backend uvicorn app:app --port 7860
uv run --project chatbot-backend pytest chatbot-backend -q
```

Or via Docker:

```bash
cd chatbot-backend
docker build -t aligatehr-chatbot .
docker run -p 7860:7860 --env-file .env aligatehr-chatbot
```

## Deployment

The site is deployed on GitHub Pages from `main` through `.github/workflows/deploy.yml`.

Published URL: [patricktangwen.github.io/report-web](https://patricktangwen.github.io/report-web/)

The chatbot backend is deployed separately on Render. The typed frontend API
boundary owns the local/remote backend URL selection.

### Deployment Contract

- GitHub Pages does not publish your local `_site/`. The workflow checks out the repository on GitHub Actions and runs `quarto render` there.
- Any file referenced by OJS `FileAttachment(...)` in `viz/*.qmd` must exist in the repository and be tracked by Git.
- Published visualization assets live in `viz/data/`. `viz/data/raw/` and `viz/data/processed/` remain non-published directories and stay ignored.
- **2026-07-13 exception for #24:** the display-safe fibrotic Dataset Release is patient-derived and is therefore owned and served by the chatbot backend, not copied into `viz/data/` or the GitHub Pages build. The backend release manifest and `/embedding/fibrotic*` endpoints are authoritative; the existing rule still applies to non-patient OJS assets.
- Before pushing deployment-related changes, run the validation commands below in an environment with Quarto and Python available.

### Deployment Validation

```bash
pnpm install --frozen-lockfile
pnpm run build:frontend
pnpm run check:data
pnpm run check:embeddings
pnpm run check:api
python scripts/check_ojs_assets.py
quarto render
pnpm run test:e2e
```

If `scripts/check_ojs_assets.py` fails, treat it as a deployment blocker. The most common cause is adding or renaming a `FileAttachment(...)` target without committing the corresponding file under `viz/data/`.

## TODO

**Data**
- [ ] Replace mock CSVs with real data for evaluation metrics, ablation results, feature importance, pathway enrichment

**Content**
- [ ] Add proper citation information (BibTeX entry for the paper)

**Feature Enhancements**
- [ ] Cross-chart brushing/linking between UMAP and metrics
- [ ] Mobile-responsive chart sizing
- [ ] Replace pre-computed case matching with live ALIGATEHR-Gen model inference in the assistant

## License

CC BY 4.0

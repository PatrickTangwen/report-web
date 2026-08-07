# ALIGATEHR-Gen Research Website

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
| Assistant backend | [FastAPI](https://fastapi.tiangolo.com/) + a bounded function-calling agent over [DeepSeek](https://platform.deepseek.com/)'s OpenAI-compatible API (framework-free loop, typed Pydantic tools) |
| Assistant frontend | Vanilla JS Guided Research Assistant widget (task-routed shell, SSE streaming) via Quarto `include-after-body` |
| Tool service | [MCP](https://modelcontextprotocol.io/) Streamable HTTP mounted at `/mcp` on the same FastAPI app |
| Evaluation | Golden-set harness with LLM-as-judge + judge-free tool-trace metrics (`chatbot-backend/eval/`) |
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
│   └── data/                    # CSV data files (3 real + 4 mock)
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
│   ├── eval/                    # Golden set, runner, committed results
│   ├── data/                    # Backend CSV data copies
│   ├── Dockerfile               # Container image (Python 3.11, port 7860)
│   └── requirements.txt         # Python dependencies
├── scripts/
│   └── check_ojs_assets.py      # Deployment-time OJS asset validator
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
  the published study data (metrics, ablation, enrichment, cohort
  aggregates). Answers stream over SSE with visible tool-activity lines.
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
- Python 3.11+ (for backend and validation scripts)

### Site Preview

```bash
quarto preview              # Dev server at http://localhost:4200
quarto render               # Full build to _site/
quarto render viz/ablation.qmd  # Single page render
```

### Chatbot Backend

```bash
cd chatbot-backend
cp .env.example .env        # Set LLM_API_KEY
pip install -r requirements.txt
uvicorn app:app --port 7860
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

The chatbot backend is deployed separately (e.g., HuggingFace Spaces). The frontend widget connects to the backend URL configured in `chatbot/chatbot.js`.

### Deployment Contract

- GitHub Pages does not publish your local `_site/`. The workflow checks out the repository on GitHub Actions and runs `quarto render` there.
- Any file referenced by OJS `FileAttachment(...)` in `viz/*.qmd` must exist in the repository and be tracked by Git.
- Published visualization assets live in `viz/data/`. `viz/data/raw/` and `viz/data/processed/` remain non-published directories and stay ignored.
- **2026-07-13 exception for #24:** the display-safe fibrotic Dataset Release is patient-derived and is therefore owned and served by the chatbot backend, not copied into `viz/data/` or the GitHub Pages build. The backend release manifest and `/embedding/fibrotic*` endpoints are authoritative; the existing rule still applies to non-patient OJS assets.
- Before pushing deployment-related changes, run the validation commands below in an environment with Quarto and Python available.

### Deployment Validation

```bash
python scripts/check_ojs_assets.py
quarto render
```

If `scripts/check_ojs_assets.py` fails, treat it as a deployment blocker. The most common cause is adding or renaming a `FileAttachment(...)` target without committing the corresponding file under `viz/data/`.

## TODO

**Data**
- [ ] Replace mock CSVs with real data for evaluation metrics, ablation results, feature importance, pathway enrichment

**Content**
- [ ] Update `site-url` and `repo-url` in `_quarto.yml` (currently placeholder `yourusername`)
- [ ] Add proper citation information (BibTeX entry for the paper)

**Feature Enhancements**
- [ ] Cross-chart brushing/linking between UMAP and metrics
- [ ] Mobile-responsive chart sizing
- [ ] Replace pre-computed case matching with live ALIGATEHR-Gen model inference in the assistant

## License

CC BY 4.0

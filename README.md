# ALIGATEHR-Gen Research Website

A Quarto-based academic website for the ALIGATEHR-Gen project — a graph attention network integrating EHR, genetic data, and medical ontology for disease risk prediction in the UK Biobank. Features interactive data visualization dashboards and an AI-powered research chatbot.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Site framework | [Quarto](https://quarto.org) (website project type) |
| Visualization | [Observable JS (OJS)](https://observablehq.com/@observablehq/observable-javascript) cells in `.qmd` |
| Charts (SVG) | [Observable Plot](https://observablehq.com/plot/) |
| Charts (WebGL) | [regl-scatterplot](https://github.com/flekschas/regl-scatterplot) for large point clouds |
| Chatbot backend | [FastAPI](https://fastapi.tiangolo.com/) + [DeepSeek API](https://platform.deepseek.com/) (OpenAI-compatible) |
| Chatbot frontend | Vanilla JS widget embedded via Quarto `include-after-body` |
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
├── chatbot-backend/         # FastAPI chatbot service
│   ├── app.py                   # Main API (intent classification, paper Q&A, data query, clinical)
│   ├── paper_context.py         # Paper text for RAG context
│   ├── data_query.py            # CSV data lookup handler
│   ├── clinical_form.py         # Disease selection and dynamic form fields
│   ├── risk_assessment.py       # Risk assessment with case-matching
│   ├── followup.py              # Follow-up enrichment queries
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

### AI Research Chatbot

A floating chatbot widget on every page, powered by an intent classifier that routes queries to specialized handlers:

- **Paper Q&A** — answers methodology/architecture questions using paper content as RAG context
- **Data Query** — looks up metrics, ablation results, feature importance, and pathway enrichment from CSV data
- **Clinical Risk Assessment** — guided flow: disease selection → dynamic clinical form → risk report with case-matching → follow-up enrichment queries
- **General** — greetings and off-topic handling

The backend runs as a FastAPI service (deployable via Docker or on HuggingFace Spaces).

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
- [ ] Replace pre-computed case matching with live ALIGATEHR-Gen model inference in chatbot

## License

CC BY 4.0

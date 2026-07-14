# Handoff: ALIGATEHR-Gen Chatbot — Issue #13

**Date:** 2026-06-22
**Project:** /Users/tangwenhua/Desktop/report-web
**Repo:** https://github.com/PatrickTangwen/report-web (private)

## What Was Completed (Issues #10–#12)

### Issue #10 — End-to-end scaffold (previous session)
- FastAPI backend on HuggingFace Spaces, vanilla JS floating chat widget
- See `docs/handoff-chatbot-2026-06-23.md` for full details

### Issue #11 — Paper & methodology Q&A (this session)
- Extracted full paper text into `chatbot-backend/paper_context.py`
- Enhanced system prompt with complete paper content + anti-hallucination instructions
- Added LLM-based intent classifier: `paper_qa`, `clinical`, `data_query`, `general`
- `clinical` returns "not yet available" placeholder (to be replaced by #13)
- Fixed frontend disclaimer from "Powered by Claude" to "Powered by DeepSeek"

### Issue #12 — Data query over CSV datasets (this session)
- Created `chatbot-backend/data_query.py` — pandas-backed query engine
- Loads 4 CSVs: evaluation_metrics, ablation_results, feature_importance, pathway_enrichment
- Keyword-based dataset routing + disease name matching with aliases (MASH→NASH, CAD→Coronary Heart Disease, etc.)
- Filters data with pandas, passes relevant subset to LLM for natural language answers
- Improved intent classifier prompt with examples to better distinguish `data_query` from `paper_qa`

### Commits (this session)
```
73c132a fix: improve intent classifier and add disease aliases (issue #12)
2254be8 feat: add CSV data query handler for chatbot (issue #12)
23ea1e3 feat: add paper Q&A with intent classification (issue #11)
```

All 3 commits are pushed to `origin/main`.

## Artifacts (do not duplicate — read these)

- **PRD:** [issue #9](https://github.com/PatrickTangwen/report-web/issues/9) — Full product requirements
- **Previous handoff:** `docs/handoff-chatbot-2026-06-23.md` — Issue #10 details
- **Issue #13:** [GitHub](https://github.com/PatrickTangwen/report-web/issues/13) — Disease selection + dynamic form
- **Remaining issues:**
  - [#14](https://github.com/PatrickTangwen/report-web/issues/14) — Risk assessment report (blocked by #13)
  - [#15](https://github.com/PatrickTangwen/report-web/issues/15) — Follow-up enrichment (blocked by #14)

## Current Architecture

```
Quarto static site (GitHub Pages)        HuggingFace Space
┌──────────────────────────────┐        ┌───────────────────────────────┐
│  chatbot/chatbot.js          │ fetch  │  chatbot-backend/app.py       │
│  (floating button,           │──────► │  FastAPI on port 7860         │
│   slide-in panel)            │◄────── │  - POST /chat                 │
│                              │  JSON  │  - GET /health                │
└──────────────────────────────┘        │  - Intent classifier          │
                                        │  - Paper Q&A (paper_context)  │
                                        │  - Data query (data_query)    │
                                        │  - Clinical: placeholder      │
                                        └───────────────────────────────┘
```

### Key files

```
chatbot-backend/
├── app.py              # FastAPI app — intent routing, 3 handlers
├── paper_context.py    # Full paper text as Python string
├── data_query.py       # CSV loading, disease matching, dataset routing
├── data/               # CSV copies for HF deployment
│   ├── evaluation_metrics.csv
│   ├── ablation_results.csv
│   ├── feature_importance.csv
│   └── pathway_enrichment.csv
├── Dockerfile          # HuggingFace Spaces Docker (port 7860)
├── requirements.txt    # fastapi, uvicorn, openai, pandas, pytest...
└── test_app.py         # 32 tests (all passing)

chatbot/
├── chatbot.js          # Frontend widget (IIFE, vanilla JS)
├── chatbot.css         # Styles + dark mode + mobile
└── chatbot-include.html
```

## What the Next Agent Should Do

Start with **issue #13** (Disease selection + dynamic form). This requires both backend and frontend work:

### 1. Backend: `GET /form-fields?disease={disease}` endpoint

Create a new endpoint that:
- Reads `feature_importance.csv` (already loaded in `data_query.py`) to get top-ranked features for the selected disease
- Maps feature names to human-readable field definitions with input types and reference ranges
- Returns a JSON form schema

The 7 available diseases in `feature_importance.csv` are:
`CKD, Crohns_Disease, Fibrosis_of_Skin, IPF, NASH, Pulmonary Fibrosis, SSc_Connective_Tissue`

The features per disease (from `feature_importance.csv`) are things like: Free T4, BMI, Haemoglobin, Sodium, Waist Circumference, Uric Acid, LDL Cholesterol, etc. Each needs a mapping to:
- `label`: human-readable name
- `type`: "numeric" or "categorical"
- `reference_range`: e.g. `{"min": 18.5, "max": 40}` for BMI

### 2. Backend: Replace `CLINICAL_NOT_READY` placeholder

The `clinical` intent currently returns a static placeholder string at `app.py:139-140`. Replace this with a disease selection flow:
- When clinical intent is detected, respond with the list of 7 available diseases and ask the user to pick one
- The frontend then needs to handle this structured response

### 3. Frontend: Render dynamic form in chat panel

The chat widget (`chatbot/chatbot.js`) currently only renders text messages. Extend it to:
- Render a disease selection UI (buttons or dropdown) when the backend returns a disease list
- After disease selection, call `GET /form-fields?disease={disease}`
- Render the form fields as HTML inputs within the chat panel
- Collect filled values and submit as structured JSON to a backend endpoint

### 4. Backend: Receive submitted form data

Add an endpoint (or extend `/chat`) to receive the submitted form values as structured JSON. This data will be used by issue #14 to generate a risk assessment report.

## Technical Notes

### Backend deployment workflow
```bash
hf upload patirckistc/report-web ./chatbot-backend/ . --repo-type space \
  --commit-message "your commit message" \
  --exclude "*.pyc" --exclude "__pycache__/*" --exclude ".pytest_cache/*"
hf spaces wait patirckistc/report-web
```

### LLM configuration

| Setting | Value |
|---------|-------|
| Provider | DeepSeek |
| SDK | `openai` (OpenAI-compatible) |
| Base URL | `https://api.deepseek.com` |
| Model | `deepseek-chat` |
| Env var | `LLM_Key_Deepseek` (HuggingFace Space secret) |

### Intent classifier

The classifier in `app.py:107-121` uses a separate LLM call with `temperature=0`. It returns one of: `paper_qa`, `clinical`, `data_query`, `general`. The `clinical` intent is the trigger for the #13 flow. Currently it returns a placeholder at line 140 — replace this.

### Data query module

`data_query.py` already loads `feature_importance.csv` via `get_datasets()["feature_importance"]`. The columns are: `disease, feature, importance_score, rank`. Reuse this for the form field endpoint.

### Disease aliases

`data_query.py` has a `_DISEASE_ALIASES` dict and `match_disease()` function. The form endpoint should accept both canonical names and common aliases.

### Frontend notes

- The widget is a self-contained IIFE in `chatbot/chatbot.js`
- API URL hardcoded on line 4: `https://patirckistc-report-web.hf.space`
- Minimal markdown rendering (bold, code, paragraphs) in `renderMarkdown()`
- Currently only handles text messages — form rendering will be new functionality
- Conversation history is in-memory only

### CORS origins

Currently allowed: `localhost:4200`, `patricktangwen.github.io`, `patirckistc-report-web.hf.space`

### Build & preview
```bash
quarto preview          # Dev server on port 4200
quarto render           # Full site build
```

## Suggested Skills

- `/implement` — for the main implementation work
- `/tdd` — the form-fields endpoint has clear input/output contracts ideal for test-first development
- `/verify` — to test the frontend form rendering in the browser after implementation

## Codebase Conventions

- Package manager: `pnpm` (not npm)
- Dark mode CSS: `.quarto-dark` selector
- Never auto-push code — always ask the user for permission
- `git push` is blocked by a hook — the user pushes manually
- Run `python -m pytest test_app.py -v` in `chatbot-backend/` to validate

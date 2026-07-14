# Handoff: Issue #15 — Follow-up enrichment (pathways + embeddings)

**Date**: 2026-06-22
**Branch**: `main` at `e7f09d3`
**Issue**: https://github.com/PatrickTangwen/report-web/issues/15

## What to build

After receiving a risk assessment report (issue #14, now complete), the user can ask natural follow-up questions. This issue adds two follow-up topics:

1. **Pathway enrichment** — "What pathways are involved?" → query `pathway_enrichment.csv` for the assessed disease, present top pathways with source (GO_BP/KEGG/Reactome), gene count, enrichment ratio, adjusted p-value.

2. **Embedding space context** — "Where do similar patients cluster?" → qualitative description of matched patients' UMAP clustering from `fibrotic_patient_embeddings.csv` (tsne_x/tsne_y, purity_2d, group columns).

The chatbot must infer the disease context from the prior assessment — no re-specification needed.

## Current architecture

### Backend (`chatbot-backend/`)

| File | Role |
|------|------|
| `app.py` | FastAPI app. Intent classifier via DeepSeek LLM. Endpoints: `/chat`, `/form-fields`, `/clinical/submit`, `/assess`, `/health` |
| `clinical_form.py` | Disease resolution (`_resolve_disease`), form schema (`get_form_fields`), `DISEASE_DISPLAY_NAMES` |
| `risk_assessment.py` | `query_patient_risk(features, disease)` — similarity matching against `fibrotic_patient_embeddings.csv`, returns structured report |
| `data_query.py` | CSV dataset queries. `match_disease()` (fuzzy NL), `_DISEASE_ALIASES`, `query_data()`, `format_data_context()` |
| `paper_context.py` | Static paper text for paper_qa intent |
| `test_app.py` | 54 tests, all passing |

### Intent classification flow

`/chat` → `classify_intent(message)` returns one of: `paper_qa`, `clinical`, `data_query`, `general`.

- `clinical` → returns disease selection UI (no LLM answer call)
- `data_query` → queries CSVs, builds context, sends to LLM
- `paper_qa` / `general` → sends paper text as context to LLM

**Key gap for issue #15**: There is currently NO intent for follow-up questions after assessment. The intent classifier doesn't know the user has just completed an assessment. Options:
- Add a new intent (e.g. `followup`) that the classifier can detect
- Use conversation history to detect post-assessment context on the backend
- Handle it client-side: detect the UI state and route differently

### Frontend (`chatbot/`)

| File | Role |
|------|------|
| `chatbot.js` | Vanilla JS IIFE. Chat logic, disease selection, clinical form, risk report rendering |
| `chatbot.css` | All chatbot styles including dark mode (`.quarto-dark`) |

**Key state**: `history` array tracks conversation. After risk report, `history` contains `{ role: "assistant", content: "Risk assessment for X: Y risk." }`. The frontend does NOT currently track which disease was assessed.

### Data files (`chatbot-backend/data/`)

| File | Shape | Key columns |
|------|-------|-------------|
| `pathway_enrichment.csv` | 280×8 | disease, pathway, source (GO_BP/KEGG/Reactome), gene_count, enrichment_ratio, p_adjusted, rank |
| `fibrotic_patient_embeddings.csv` | 6010×35 | disease, tsne_x, tsne_y, purity_2d, group (overlap/intermediate/pure), p_true, clinical features |
| `feature_importance.csv` | 350×4 | disease, feature, importance_score, rank |
| `evaluation_metrics.csv` | — | Model performance metrics |
| `ablation_results.csv` | — | Ablation study results |

### Disease name mapping caveat

Disease names differ across CSVs:
- `pathway_enrichment.csv`: `NASH`, `Pulmonary Fibrosis` (space)
- `fibrotic_patient_embeddings.csv`: `MASH`, `Pulmonary_fibrosis` (underscore)
- `feature_importance.csv`: `NASH`, `IPF`, `Pulmonary Fibrosis`

`risk_assessment.py` already has `_EMBED_DISEASE_MAP` for embeddings. `data_query.py` has `_DISEASE_ALIASES`. Pathway data uses the same disease names as `feature_importance.csv`, so `_resolve_disease()` from `clinical_form.py` works directly.

## Suggested implementation approach

### 1. Session-level disease context

The simplest approach: after `/assess` returns, the frontend stores the assessed disease in a variable (e.g. `lastAssessedDisease`). On subsequent chat messages, include it in the `/chat` request body: `{ message, history, assessed_disease }`.

Backend: `ChatRequest` gains an optional `assessed_disease` field. When present and intent is `data_query` or a new `followup` intent, use it to scope the query.

### 2. Pathway enrichment handler

Create `chatbot-backend/followup.py`:
- `get_pathway_enrichment(disease, top_n=10)` → reads `pathway_enrichment.csv`, filters by disease, returns top-N sorted by rank
- Return structure: `{ disease, disease_label, pathways: [{ pathway, source, gene_count, enrichment_ratio, p_adjusted }] }`

### 3. Embedding space description

Add to `followup.py` or `risk_assessment.py`:
- `describe_embedding_context(disease, matched_patient_ids=None)` → computes summary stats from `fibrotic_patient_embeddings.csv`:
  - Centroid position of matched patients in UMAP
  - Purity distribution (what fraction in pure/intermediate/overlap groups)
  - Nearest other disease clusters
  - Return as structured text or dict for LLM to narrate

### 4. Frontend rendering

- Pathway results → structured table/list in chat (similar to risk report card)
- Embedding description → plain text message (assistant bubble)
- Both should scroll into view and allow continued conversation

### 5. Intent routing

Option A (simpler): Don't add a new intent. Let `data_query` handle it — `match_datasets()` already detects "pathway" keywords → routes to `pathway_enrichment` dataset. Add embedding keywords similarly. The `assessed_disease` from context fills in the disease filter automatically.

Option B (cleaner): Add `followup` intent to the classifier. When detected + `assessed_disease` present, route to specialized handlers.

## Test guidance

```bash
cd chatbot-backend
python -m pytest test_app.py -v    # 54 tests, all passing
```

Existing test patterns to follow: see `test_query_patient_risk_*` and `test_assess_*` in `test_app.py`.

## Deployment

- GitHub Pages auto-deploys frontend via `.github/workflows/deploy.yml`
- HuggingFace Space (`patirckistc/report-web`) hosts the Docker backend
- After implementation, upload changed backend files via `huggingface_hub`:
  ```python
  from huggingface_hub import HfApi
  api = HfApi()
  api.upload_file(path_or_fileobj='chatbot-backend/<file>', path_in_repo='<file>',
                  repo_id='patirckistc/report-web', repo_type='space',
                  commit_message='update for issue #15')
  ```
- `requirements.txt` already has all needed deps (fastapi, pandas, numpy, openai)

## Constraints

- Never auto-push — ask user for permission
- Use `pnpm` not `npm`
- API_URL in `chatbot.js` must be `https://patirckistc-report-web.hf.space` (not localhost) at commit time
- Dark mode CSS uses `.quarto-dark` selector
- Run `python scripts/check_ojs_assets.py` if touching `viz/` files

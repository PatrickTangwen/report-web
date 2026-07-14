# Handoff: ALIGATEHR-Gen Chatbot — Issue #11 onwards

**Date:** 2026-06-23
**Project:** /Users/tangwenhua/Desktop/report-web
**Repo:** https://github.com/PatrickTangwen/report-web (private)

## What Was Completed (Issue #10)

The end-to-end chat scaffold is fully deployed and working:

- **Backend:** FastAPI app on HuggingFace Spaces (`patirckistc/report-web`), using DeepSeek API via OpenAI-compatible SDK. Single `POST /chat` endpoint + `GET /health`. 6 pytest tests passing.
- **Frontend:** Vanilla JS floating chat button (bottom-right) + slide-in panel, injected on every page via `_quarto.yml` `include-after-body`. Dark mode and mobile responsive.
- **Live URL:** `https://patirckistc-report-web.hf.space` — verified end-to-end with real DeepSeek responses.

### Key files created

```
chatbot-backend/
├── app.py              # FastAPI app — DeepSeek via OpenAI SDK
├── Dockerfile          # HuggingFace Spaces Docker (port 7860)
├── requirements.txt    # fastapi, uvicorn, httpx, openai, pytest
├── test_app.py         # 6 tests (httpx + mock)
└── .env.example        # Template for local dev

chatbot/
├── chatbot.js          # Frontend widget (IIFE, vanilla JS)
├── chatbot.css         # Styles + dark mode + mobile
└── chatbot-include.html  # HTML include loaded by Quarto
```

### Commits

```
1b6b0aa feat: switch backend from Anthropic to DeepSeek API
7be44a3 chore: set HuggingFace Space API URL and update CORS
5df8c34 feat: add end-to-end chatbot scaffold (issue #10)
```

## Artifacts (do not duplicate — read these)

- **PRD:** [issue #9](https://github.com/PatrickTangwen/report-web/issues/9) — Full product requirements, API contract, testing decisions
- **Remaining issues (vertical slices):**
  - [#11](https://github.com/PatrickTangwen/report-web/issues/11) — Paper & methodology Q&A (START HERE)
  - [#12](https://github.com/PatrickTangwen/report-web/issues/12) — Data query over CSV datasets (blocked by #10)
  - [#13](https://github.com/PatrickTangwen/report-web/issues/13) — Disease selection + dynamic form (blocked by #10)
  - [#14](https://github.com/PatrickTangwen/report-web/issues/14) — Risk assessment report (blocked by #13)
  - [#15](https://github.com/PatrickTangwen/report-web/issues/15) — Follow-up enrichment (blocked by #14)
- **Memory record:** `project_chatbot_realtime_inference.md` — Future upgrade plan

## Architecture

```
Quarto static site (GitHub Pages)       HuggingFace Space
┌────────────────────────────┐         ┌──────────────────────────┐
│  chatbot/chatbot.js        │  fetch  │  chatbot-backend/app.py  │
│  (floating button,         │ ──────► │  FastAPI on port 7860    │
│   slide-in panel)          │ ◄────── │  - POST /chat            │
│                            │  JSON   │  - DeepSeek API          │
└────────────────────────────┘         │  - LLM_Key_Deepseek env  │
                                       └──────────────────────────┘
```

## What the Next Agent Should Do

Start with **issue #11** (Paper & methodology Q&A). This requires:

### 1. Load paper content as LLM context

The paper is at `report/paper1.qmd` (full Quarto markdown). The agent should:
- Extract the paper text (abstract, methods, results, discussion) into a context string
- Either embed it in the system prompt or load it as a separate context file
- The system prompt in `chatbot-backend/app.py` already has a basic description — extend it with the actual paper content

### 2. Add intent classification

The `/chat` endpoint currently sends everything directly to the LLM. Issue #11 requires basic intent classification to distinguish:
- **Paper/methodology Q&A** (default fallback) — answered from paper context
- **Clinical support** — will trigger guided form flow (issue #13)
- **Data query** — will query CSV datasets (issue #12)

For #11, only paper Q&A needs to work. The other intents can return a "not yet supported" message or fall through to paper Q&A.

### 3. Test that answers are grounded in paper content

The acceptance criteria require that answers are accurate and not hallucinated. Tests should send known paper questions and verify the responses contain correct facts.

## Technical Notes

### Backend deployment workflow

The backend is deployed via `hf upload`, NOT via git push to a separate repo:
```bash
hf upload patirckistc/report-web ./chatbot-backend/ . --repo-type space \
  --commit-message "your commit message" \
  --exclude "*.pyc" --exclude "__pycache__/*" --exclude ".pytest_cache/*"
```
After uploading, wait for rebuild: `hf spaces wait patirckistc/report-web`

### LLM configuration

| Setting | Value |
|---------|-------|
| Provider | DeepSeek |
| SDK | `openai` (OpenAI-compatible) |
| Base URL | `https://api.deepseek.com` |
| Model | `deepseek-chat` |
| Env var | `LLM_Key_Deepseek` (HuggingFace Space secret) |

### Frontend notes

- The widget is a self-contained IIFE in `chatbot/chatbot.js`
- API URL is hardcoded on line 4: `https://patirckistc-report-web.hf.space`
- Minimal markdown rendering (bold, code, paragraphs) — future issues may need richer rendering (HTML blocks, tables)
- Conversation history is in-memory only (lost on page navigation)

### CORS origins

Currently allowed in `app.py`:
- `http://localhost:4200` (local dev)
- `https://patricktangwen.github.io` (GitHub Pages)
- `https://patirckistc-report-web.hf.space` (Space itself)

### Data files available

All in `viz/data/`:
- `fibrotic_patient_embeddings.csv` — 6K patients, 7 diseases (real UK Biobank data)
- `icd_code_embeddings.csv` — ICD code embeddings (real)
- `patient_embeddings.csv` — Patient embeddings (real)
- `evaluation_metrics.csv` — 118-disease metrics (mock)
- `ablation_results.csv` — Component ablation (mock)
- `feature_importance.csv` — Feature importance by disease (mock)
- `pathway_enrichment.csv` — GO/KEGG pathways (mock)

### Build & preview

```bash
quarto preview          # Dev server on port 4200
quarto render           # Full site build
```

### GitHub Pages status

Currently down — repo is private and free GitHub plan doesn't support Pages for private repos. Separate issue from chatbot work.

## Codebase Conventions

- Package manager: `pnpm` (not npm)
- Dark mode CSS: `.quarto-dark` selector (NOT `[data-bs-theme="dark"]`)
- Homepage uses `pagetitle` not `title` (hero section is the visual title)
- `FileAttachment(...)` in viz files must be git-tracked — run `python scripts/check_ojs_assets.py` before finishing viz changes
- Never auto-push code — always ask the user for permission

# Technical Stack Modernization — 2026-08-08

## Status

Implemented locally. No GitHub Pages or Render deployment was performed as
part of this change.

This note supersedes current-state claims about duplicated result tables,
runtime CDN imports, pip-only dependency installation, placeholder repository
URLs, and untyped frontend/backend API boundaries. Earlier design and release
documents remain historical records.

## Architecture now

| Boundary | Current contract |
|---|---|
| Research-result data | `chatbot-backend/data/research_results_manifest.json` is the authority. `scripts/sync_research_data.py` checks that the three `viz/data/` copies are byte-identical. The current release is explicitly `mock`. |
| Paper grounding | `report/old-report.qmd` is the published ALIGATEHR-Gen source for the assistant. `scripts/generate_paper_context.py --check` prevents drift without mixing in the in-progress Bio-ALIGATEHR manuscript. |
| JavaScript dependencies | pnpm lockfile plus Vite library builds. The assistant boundary is UMD for the existing widget; `regl-scatterplot` is a local ES bundle for OJS. |
| API contract | FastAPI emits `frontend/generated/openapi.json`; `@hey-api/openapi-ts` generates the checked TypeScript client and types. |
| Python dependencies | `chatbot-backend/pyproject.toml` and `uv.lock` are authoritative. Docker and Render install the locked environment with uv; `requirements.txt` is a generated compatibility export. |
| Browser acceptance | Playwright runs desktop and mobile Chromium. axe-core checks serious/critical WCAG A/AA findings on the assistant and visualization paths. Observable Plot's nested generated SVG groups and test-environment focus sentinels are narrowly excluded; project controls remain covered. |
| Observability | OTLP export activates only when `OTEL_EXPORTER_OTLP_ENDPOINT` is set. Request logs and spans include method, path, status, duration, request ID, model name, iteration, tool name, and success only—never question text, profile values, query strings, tool arguments, or model output. |
| Large embedding | `patient_embeddings.arrow` is generated deterministically from CSV and verified by manifest. On the local benchmark it is 6.4 MB versus 8.3 MB and Arrow parsing was about 9.8× faster (median of five); browser E2E verifies all 114,285 rows render. |

## Why DuckDB-Wasm and a Web Worker were not added

The current patient view loads one table and renders all rows; it does not run
joins, SQL aggregation, or multi-table cross-filtering. Arrow removes the
measured parsing bottleneck without shipping another query engine. A Web Worker
and DuckDB-Wasm remain conditional options if browser traces later show
main-thread blocking or product requirements add cross-table analytical
queries. This is a benchmark gate, not a fallback path.

## Commands

```bash
pnpm install --frozen-lockfile
pnpm run generate:api
pnpm run build:frontend
pnpm run check:data
pnpm run check:embeddings
pnpm test
uv run --project chatbot-backend pytest chatbot-backend -q
python scripts/check_ojs_assets.py
quarto render
pnpm run test:e2e
```

`scripts/check_ojs_assets.py` remains a deployment blocker. Every new
`FileAttachment(...)` target—including the Arrow file and local WebGL bundle—
must be included in the Git commit before Pages deployment.

## CI and deployment boundary

`.github/workflows/ci.yml` separates backend, site, and browser checks. The
Pages workflow installs the frozen pnpm environment and builds frontend bundles
before the OJS asset check and Quarto render. Render and the backend Dockerfile
use the uv lock. Enabling an OTLP collector or deploying these changes requires
separate operational authorization and environment configuration.

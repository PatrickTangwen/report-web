# Current Deployment Architecture — 2026-07-14

## Purpose and status

This document is the operational reference for the ALIGATEHR-Gen research
website architecture introduced while completing Issue #29. It describes the
current zero-cost deployment design, component responsibilities, data
boundaries, secrets, and verification steps.

Earlier Hugging Face Space handoffs and architecture decisions remain useful
historical records. Where they describe Hugging Face as the production compute
host, this document records the newer deployment arrangement.

## Architecture at a glance

```text
Browser
  |
  | HTTPS: website assets and JavaScript
  v
GitHub Pages
  https://patricktangwen.github.io/report-web/
  |
  | HTTPS: chatbot, profile, matching, and embedding API calls
  v
Render Free Web Service
  https://aligatehr-gen-backend.onrender.com
  |                              |
  | authenticated dataset read  | authenticated LLM request
  v                              v
Hugging Face private Dataset     DeepSeek API
patirckistc/report-web-private   chatbot language processing
revision: fibrotic-2026-07-13
```

The browser never receives the Hugging Face or DeepSeek credentials. It calls
only the public Render API.

## Component responsibilities

### GitHub Pages: public frontend

- Hosts the Quarto-generated research website.
- Serves the chatbot interface and visualization JavaScript.
- Calls `https://aligatehr-gen-backend.onrender.com` in production.
- Contains only files intended for public website delivery.
- Does not contain backend secrets or the private matching artifact.

The source repository is `PatrickTangwen/report-web`. GitHub Actions builds the
site with Quarto and deploys `_site/` through `.github/workflows/deploy.yml`.

### Render: production API compute

- Runs the FastAPI application from `chatbot-backend/`.
- Provides the health, chatbot, profile, matching, ICD, and embedding routes.
- Loads the private matching artifact from Hugging Face at runtime.
- Calls DeepSeek for language-model-backed chatbot operations.
- Exposes only approved response fields and display-safe visualization data.

Production API:

```text
https://aligatehr-gen-backend.onrender.com
```

The deployment source mirror is the public repository
`PatrickTangwen/report-web-backend`. It contains only the backend deployment
source and approved public release files. It must continue to exclude `.env`,
`data/private/`, caches, local credentials, and raw source data.

Render uses the provider-assigned `PORT`; the container must not assume that
port `7860` is available in production.

### Hugging Face: private artifact storage

Hugging Face no longer provides the production compute runtime. It remains the
versioned storage authority for the private matching artifact:

```text
Dataset:  patirckistc/report-web-private
Revision: fibrotic-2026-07-13
File:     fibrotic_match.csv
Access:   private
```

Render downloads this file through `huggingface_hub` using a fine-grained,
read-only token restricted to the private Dataset repository.

The earlier Docker Space is not part of the active request path. On
2026-07-14, its updated container could not be scheduled on free `cpu-basic`
without a PRO subscription, which prompted the move of compute to Render.

### DeepSeek: language-model service

- Processes chatbot and profile-extraction requests sent by the backend.
- Is called only by Render; the API key is never shipped to the browser.
- Must be treated as an external processor. The UI therefore permits only
  synthetic or sufficiently de-identified demo profiles and warns users not to
  submit names, exact birth dates, addresses, patient IDs, or real medical
  records.

## Runtime request flows

### Website and visualization

1. The visitor opens the GitHub Pages website.
2. GitHub Pages serves static HTML, CSS, JavaScript, and approved public CSVs.
3. Fibrotic visualization JavaScript requests the display release from Render.
4. Render returns display-safe fields only: `visual_reference_id`, `disease`,
   `group`, `tsne_x`, and `tsne_y`.

### Demo Profile matching

1. The visitor submits a synthetic or sufficiently de-identified profile.
2. The browser sends it to Render over HTTPS.
3. Render validates the profile and, when required, calls DeepSeek.
4. Render loads the version-pinned private matching CSV from Hugging Face.
5. Matching occurs only inside the backend.
6. The browser receives random Visual Reference IDs and an approved
   neighborhood summary, not the private feature rows.

### Release integrity

The public display artifact and private matching artifact are generated in one
release process. Both contain the same cryptographically random,
release-scoped Visual Reference IDs. The manifest records their schemas,
checksums, row counts, disease counts, and dataset version. Backend startup and
health checks verify the private artifact and its relationship to the public
release before reporting readiness.

## Data classification and privacy boundary

“De-identified” in this project must not be interpreted as “irreversibly
anonymous.” The current CSVs fall into different classes.

| Data | Location | Exposure | Privacy treatment |
|---|---|---|---|
| Fibrotic display release | Backend public release/API | Public | No UKB `eid`; random Visual Reference ID plus disease, display group, and t-SNE coordinates |
| Fibrotic matching release | Hugging Face private Dataset | Backend only | No UKB `eid`; random Visual Reference ID, but contains individual-level clinical and demographic quasi-identifiers |
| Patient embeddings | `viz/data/patient_embeddings.csv` | Public website asset | Documented as using de-identified UK Biobank IDs, but still contains individual-level ID, age, sex, and embedding coordinates |
| ICD embeddings | `viz/data/icd_code_embeddings.csv` | Public website asset | Code-level rather than patient-level data |
| Evaluation, ablation, and pathway files | `viz/data/` and backend data | Public | Mock or aggregate results under the current project inventory |

The private matching CSV must remain private even though direct identifiers are
absent. Combinations such as age, sex, measurements, biomarkers, and disease
can act as quasi-identifiers. The public `patient_embeddings.csv` is
pseudonymized/de-identified rather than demonstrably anonymous; its continued
public release requires the applicable UK Biobank and institutional data
governance authorization.

Never commit or publish:

- names, addresses, exact birth dates, or contact details;
- raw UKB identifiers or a mapping back to participant identity;
- `.env` files, provider tokens, or API keys;
- the private matching CSV;
- raw or processed source directories that were not explicitly approved for
  public release.

## Secrets and configuration

Render requires the following configuration:

| Key | Type | Purpose |
|---|---|---|
| `FIBROTIC_MATCH_DATASET_REPO` | Variable | Private Hugging Face Dataset repository |
| `FIBROTIC_MATCH_DATASET_REVISION` | Variable | Immutable release tag or revision |
| `HF_TOKEN` | Secret | Fine-grained read access to only the private Dataset |
| `LLM_Key_Deepseek` | Secret | DeepSeek API authentication |

Secret values belong in Render's secret store. Do not place them in GitHub,
the public backend mirror, frontend JavaScript, documentation, logs, screenshots,
or test fixtures.

When rotating a release, upload the new private artifact, create a new immutable
Dataset tag, update `FIBROTIC_MATCH_DATASET_REVISION`, deploy, and verify the
manifest version before retiring the previous revision.

## Availability and cost behavior

- GitHub Pages serves the static frontend.
- Render uses a Free Web Service and may sleep after inactivity.
- The first request after a Render sleep can take roughly a minute.
- The frontend should show a clear waking/retry state rather than silently
  falling back to stale or guessed data.
- Hugging Face stores the private artifact but is not on the public request
  path as an application host.
- This arrangement avoids requiring Hugging Face PRO for the backend runtime.

## Deployment and verification checklist

Before publishing frontend or data-contract changes:

```bash
python scripts/check_ojs_assets.py
quarto render
```

Before publishing backend changes:

```bash
cd chatbot-backend
pytest -q
```

Also run the JavaScript tests from the repository root:

```bash
node --test chatbot/*.test.cjs
```

After deployment, verify:

1. `GET https://aligatehr-gen-backend.onrender.com/health` returns HTTP 200.
2. The embedding and preset routes report the expected dataset version.
3. A synthetic Demo Profile can be extracted, reviewed, confirmed, and
   matched without exposing private feature rows.
4. Matching Visual Reference IDs exist in the displayed release.
5. The ICD handoff and Reset/Back interaction work on the public website.
6. Requests from the GitHub Pages origin pass CORS checks.
7. A cold-start visit shows an understandable wait/retry state.
8. No secret or private artifact appears in the rendered site, repository,
   browser source, or deployment logs.

## Change-control rules

- Treat the Hugging Face Dataset revision and release manifest as a versioned
  data contract; do not point production at an unreviewed moving file.
- Keep private matching fields backend-only.
- Generate public and private fibrotic artifacts together so their Visual
  Reference IDs cannot drift.
- Do not add a client-side fallback copy of the private matching data.
- Preserve older deployment and ADR documents as history. Record future host,
  data-contract, or privacy-boundary changes in a new dated note.
- Reassess the public status of participant-level CSVs whenever repository
  visibility, data fields, or institutional authorization changes.

## Related records

- `docs/deployment-change-render-2026-07-14.md`
- `docs/complete-experience-shipped-contract-2026-07-13.md`
- `docs/chatbot-embedding-visualization-design-2026-07-13.md`
- `docs/adr/0003-limit-profile-matching-to-demo-data.md`
- `docs/adr/0005-use-release-scoped-random-visual-ids.md`
- `docs/adr/0006-serve-fibrotic-data-from-one-backend-authority.md`

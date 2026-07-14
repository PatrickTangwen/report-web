# Complete Experience Shipped Contract — 2026-07-13

## Status

This record describes the release candidate prepared by issue #29. It is the
current operational contract for the website and chatbot; earlier README
inventories remain historical context.

The repository implementation is ready for local verification. The hosted
release is **not yet verified or promoted**. A read-only check on 2026-07-13
found the Hugging Face Space in `RUNTIME_ERROR` with the legacy backend tree,
and the GitHub Pages workflow in `disabled_manually` state, with its most recent
run from 2026-06-10. Updating either hosted system or re-enabling the workflow
requires separate authorization.

## Published boundaries

- When explicitly re-enabled, GitHub Pages publishes the Quarto site from
  `main` through `.github/workflows/deploy.yml`. Its repository trigger remains
  `push` to `main`, but its current hosted workflow state is `disabled_manually`.
- The browser resolves production API calls to
  `https://patirckistc-report-web.hf.space`; local previews resolve to
  `http://127.0.0.1:7860`.
- The backend is the sole authority for the display-safe fibrotic Dataset
  Release `fibrotic-2026-07-13-9d04ee36876b`, including its manifest, preset,
  opaque Visual Reference IDs, and matching contract.
- GitHub Pages still owns non-patient OJS assets in `viz/data/`. Every
  `FileAttachment(...)` target must be tracked and pass
  `python scripts/check_ojs_assets.py`.
- `viz/embedding-renderer.js` owns common WebGL coordinate normalization,
  responsive sizing, scatterplot construction, overview draw, highlighted draw,
  and zoom operations. Page-specific modules own their selection, presentation,
  and single-writer request sequencing; superseded results are invalidated
  without issuing concurrent renderer calls.

## Supported experience

The shipped frontend supports:

- paper, citation, and research-data chatbot questions;
- a preset fibrotic embedding walkthrough;
- reviewed synthetic/de-identified Profile Draft extraction, validation,
  confirmation, aggregate reference-neighborhood comparison, replay, and reset;
- explicit partial, out-of-range, conflicting, and no-match profile states;
- ICD keyword selection, visualization handoff, rapid replacement, replay, and
  reset;
- pathway enrichment cards.

The former clinical-risk form, risk score/report, case-matching assessment,
mock Top-10 feature ranking, and their public API routes are intentionally not
part of this contract. Feature-importance questions receive an explicit data
availability explanation rather than a fabricated ranking.

## Removed legacy paths

- API routes: `GET /form-fields`, `POST /clinical/submit`, `POST /assess`
- Backend modules: `clinical_form.py`, `risk_assessment.py`
- Mock ranking copies: `chatbot-backend/data/feature_importance.csv`,
  `viz/data/feature_importance.csv`
- Duplicate patient-level copies:
  `chatbot-backend/data/fibrotic_patient_embeddings.csv`,
  `viz/data/fibrotic_patient_embeddings.csv`
- The obsolete risk UI and duplicate Observable/WebGL renderer wrapper

Tests assert that the old routes return 404 and the superseded assets are
absent.

## Browser-to-backend contract

The backend CORS allow-list is explicit:

- `https://patricktangwen.github.io`
- `http://localhost:4200`
- `http://127.0.0.1:4200`
- `https://patirckistc-report-web.hf.space`

All chatbot API requests use the same bounded JSON request helper and time out
after 30 seconds. Preset, profile matching, and ordinary chat surface retryable
failure states. The fibrotic visualization shows a cold-start notice after four
seconds, times out safely, and retains a Retry control. No stale local data is
substituted when the backend is unavailable or the Dataset Release version does
not match.

## Required release verification

Run from the repository root:

```bash
node --test chatbot/*.test.cjs viz/*.test.mjs
python -m pytest chatbot-backend -q
python scripts/check_ojs_assets.py
quarto render
```

Then run the browser acceptance matrix against the actual public seam:

1. preset walkthrough, replay, reset;
2. confirmed profile comparison and matched visualization;
3. partial, out-of-range/conflicting, and no-match states;
4. ICD keyword handoff, rapid replacement, replay, reset;
5. reduced-motion behavior;
6. backend cold start, 30-second timeout, error copy, and Retry;
7. an unrelated paper/citation/data question.

Hosted acceptance is complete only when the Hugging Face Space serves the same
backend commit, the Pages workflow succeeds for the same repository release,
and this matrix passes at `https://patricktangwen.github.io/report-web/`.

## Local verification evidence

The 2026-07-13 release-candidate check passed:

- 44 Node tests, including the shared renderer, rapid ICD replacement/replay,
  reduced-motion final state, API timeout, and Retry contract;
- 104 backend tests, including CORS, removed-route 404s, absent legacy assets,
  Dataset Release integrity, profile edge states, and deterministic Top-10
  refusal before ICD routing;
- OJS published-asset validation;
- full Quarto render (with the pre-existing unresolved `viz/dashboard.qmd`
  warning only).

The local in-app browser check exercised preset play/replay/reset, a confirmed
synthetic profile and 20-reference CKD handoff, out-of-range correction with
confirmation disabled, CKD and Tuberculosis ICD handoffs, rapid ICD replay,
backend-unavailable Retry, and the explicit refusal to answer from the removed
Top-10 mock. A rapid replay initially exposed a `regl-scatterplot@1.9.1`
concurrency failure; the renderer queue now serializes all writes and invalidates
superseded results. The original browser reproduction and its regression test
both pass. Reduced-motion final-state behavior is covered by the deterministic
interaction test; hosted reduced-motion verification remains part of promotion
acceptance.

## Promotion and rollback

Promotion requires an authorized update of `patirckistc/report-web`, followed
by an authorized re-enable of the Pages workflow and merge to GitHub `main`.
Do not change Space secrets, variables, hardware, or other GitHub workflow
settings as part of a code promotion.

If hosted acceptance fails, keep the website and backend versions paired:
restore the previous Space commit and previous Pages-compatible repository
commit, then re-run the public health, CORS, Dataset Release version, and browser
checks. Never compensate for a version mismatch with guessed IDs, stale CSVs,
or a client-side fallback.

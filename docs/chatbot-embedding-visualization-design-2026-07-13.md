# Chatbot-Driven Embedding Visualization Design

**Status:** Accepted design; implementation pending

**Date:** 2026-07-13

**Scope:** Fibrotic patient profile comparison, ICD keyword highlighting, and chatbot-triggered embedding animation

## 1. Purpose

Add a chatbot-driven research demonstration in which a visitor describes a synthetic or de-identified patient profile, reviews the extracted values, compares the confirmed profile with an approved fibrotic reference cohort, and opens an annotated embedding visualization that highlights comparable reference patients.

The experience should resemble the supplied annotated scientific figure: it moves from an overview to one or more focused regions, dims unrelated points, emphasizes relevant points, and reveals explanatory callouts. The visualization must not imply that a new patient has been embedded by ALIGATEHR-Gen when no model-inference path exists.

Project vocabulary is defined in [`CONTEXT.md`](../CONTEXT.md). Decisions that carry architectural or privacy consequences are recorded in [`docs/adr/`](adr/).

## 2. Product Boundaries

### In scope

- Synthetic or sufficiently de-identified Demo Profiles only.
- Seven canonical Comparison Targets from the real fibrotic embedding cohort:
  - Chronic Kidney Disease
  - Cardiac Fibrosis
  - MASH
  - Pulmonary Fibrosis
  - Systemic Sclerosis / Connective Tissue
  - Crohn's Disease
  - Skin Fibrosis
- Multi-turn free-text extraction into a Profile Draft.
- Editable confirmation before comparison.
- Deterministic field validation, unit conversion, and derived features.
- Reference-cohort matching in clinical feature space.
- Threshold-qualified, adaptive Matched Reference Neighborhoods.
- Chatbot-triggered navigation to the full visualization page.
- Basic disease-keyword mapping to reviewed ICD codes, prefixes, or ranges.
- Annotated WebGL embedding transitions with accessible summaries.

### Explicitly out of scope

- Real patient records or identifying information.
- Personal disease-risk prediction, diagnosis, or treatment guidance.
- A new Query Patient embedding point.
- ICD history as an input to patient similarity.
- Cross-disease nearest-neighbor diagnosis.
- Complete ICD ontology coverage.
- Individual Reference Patient case callouts.
- Similarity percentages, prediction confidence, or health scores.
- Persistent patient accounts, server-side profiles, or longitudinal records.

## 3. Scientific Interpretation

The system compares a Confirmed Profile with Reference Patients. It does not run the ALIGATEHR-Gen encoder or prediction head for the Query Patient.

The Matched Reference Neighborhood is selected in approved clinical feature space. The two-dimensional t-SNE coordinates are used only to display the selected Reference Patients. A matched set may appear as one compact Display Region, several separated regions, or a broadly dispersed set. The interface must show the observed layout rather than forcing a single cluster narrative.

The current behavior of averaging matched patients' `p_true` values must not be presented as the Query Patient's risk. The replacement output is a Cohort Comparison Result containing Profile Coverage, neighborhood size, domain-level aggregate comparisons, limitations, and a Visualization Request.

## 4. User Journeys

### 4.1 Profile comparison

1. The visitor starts a demo-profile conversation or chooses a prefilled demo.
2. The chatbot displays the demo-only notice and warns against entering identifiers or real patient records.
3. The visitor supplies values in one or more messages.
4. The LLM returns Feature Candidates with raw value, raw unit, source text, and intended operation.
5. A deterministic validator maps candidates to the approved schema, converts units, detects conflicts, and calculates eligible Derived Match Features.
6. The chatbot presents an editable Profile Draft with valid, ambiguous, unsupported, conflicting, and outside-reference-support states.
7. The visitor explicitly confirms the Demo Profile and one Comparison Target.
8. The backend checks Profile Coverage eligibility and performs profile matching.
9. The result is either a Matched Reference Neighborhood or No Stable Neighborhood.
10. A successful result card offers `View matched reference patients`.
11. The visitor clicks the button; the site opens the full fibrotic embedding and plays the visualization transition once.

### 4.2 ICD keyword highlighting

1. The LLM extracts basic disease keywords from the visitor's message.
2. A deterministic, versioned ICD Keyword Vocabulary validates each keyword against reviewed exact-code, prefix, or inclusive-range selectors.
3. Each validated ICD Keyword Match appears as its own action, such as `View ICD: Tuberculosis (A15-A19)`.
4. The visitor opens one ICD target at a time.
5. The ICD embedding dims unrelated codes, highlights the selected nodes, fits the relevant view, and shows a non-clinical explanatory callout.

ICD keywords do not affect patient-profile matching. Multiple ICD matches remain separate; V1 has no combined `View all` animation.

### 4.3 No-result paths

- Insufficient Profile Coverage: request the most useful easy-to-obtain missing domain.
- Ambiguous or conflicting input: ask a focused clarification question.
- Outside Reference Support: preserve the confirmed value, explain the cohort limitation, and allow the matching policy to return No Stable Neighborhood.
- No Stable Neighborhood: explain that the approved cohort contains no sufficiently comparable records under the validated threshold; do not force nearest neighbors.
- Backend unavailable: show a retry state; do not use stale data or guessed mappings.

## 5. Profile Input Contract

### 5.1 Reported and derived fields

| Reported Feature | Normalized or Derived Match Feature | Domain | Requirement |
|---|---|---|---|
| Age | Years | Demographics | Core candidate |
| Sex | Cohort-compatible category when supplied | Demographics | Optional; never inferred |
| Height and weight | BMI | Body composition | Preferred input path |
| BMI | BMI | Body composition | Accepted if already known; cross-check when height and weight are also present |
| Waist and hip circumference | Waist-to-hip ratio | Body composition | Used only when both are valid |
| Blood pressure such as `135/85` | SBP and DBP | Blood pressure | Split and visibly confirmed |
| Smoking status | Standard smoking category | Lifestyle | Core candidate |
| Alcohol frequency | Standard frequency category | Lifestyle | Core candidate |
| Affected-relative yes/no | Family-history indicator | Family history | Core candidate |
| Creatinine | Standard unit | Optional laboratory | Optional |
| HbA1c | Standard unit | Optional laboratory | Optional |

Height, weight, BMI, waist, and hip must not be treated as independent full-weight domains. Similarly, SBP and DBP belong to one blood-pressure domain, and smoking fields belong to one lifestyle subdomain.

### 5.2 Extraction authority

The LLM proposes Feature Candidates only. It must not:

- decide that a candidate is valid;
- calculate BMI or other derived values;
- silently resolve conflicting values;
- invent units;
- fill missing values;
- emit a user-facing confidence score;
- generate unreviewed ICD codes.

The deterministic validator is authoritative. Candidate states are:

- `valid`
- `ambiguous`
- `out_of_range`
- `outside_reference_support`
- `unsupported`
- `conflicting`

Physiologically implausible or uninterpretable values are blocked pending clarification. Valid values outside cohort support are preserved and visibly flagged; they are not clamped to cohort minima or maxima.

### 5.3 Profile Session

- Profile Draft state lives in the current browser tab's `sessionStorage`.
- The draft may accumulate and be corrected across messages.
- Source text and original units remain visible during confirmation.
- Explicit corrections do not silently overwrite unresolved conflicts.
- `Start over` clears the profile state.
- Closing the tab clears the session.
- The backend remains stateless and does not create a saved patient record.
- Visualization Requests do not duplicate the full clinical profile.

## 6. Matching Design

### 6.1 Comparison scope

Matching occurs only inside the visitor-confirmed Comparison Target. The LLM may suggest a target, but the visitor must confirm it. `NASH` normalizes to `MASH`; `IPF` and `Idiopathic Pulmonary Fibrosis` normalize to the single `Pulmonary Fibrosis` target represented by the embedding cohort.

### 6.2 Distance

Use a domain-balanced Gower-style distance:

1. Calculate deterministic per-feature differences for fields that are valid for both the Confirmed Profile and a Reference Patient.
2. Use reviewed valid ranges for continuous values and exact category comparison for categorical values.
3. Average feature contributions within each domain.
4. Average across available domains so domains with more columns do not receive accidental extra weight.
5. Include optional laboratories only when both sides contain a compatible value.
6. Do not use mock feature-importance weights.
7. Do not use t-SNE coordinates, display regions, purity, `p_true`, or model correctness in the matching distance.

### 6.3 Coverage and threshold calibration

Partial profiles are allowed only after data-driven calibration:

- Run masking experiments on the reference cohort.
- Measure neighborhood stability as feature domains are removed.
- Establish the minimum eligible Profile Coverage by Comparison Target.
- Calibrate a distance threshold for each supported coverage pattern or an approved generalization of those patterns.
- Report coverage as available information, never as prediction confidence.

Thresholds, valid ranges, and minimum aggregate group sizes are implementation parameters requiring validation; this document does not invent them.

### 6.4 Adaptive neighborhood

- Include only Reference Patients that satisfy the validated distance threshold.
- Cap the displayed set at 20 for readability.
- Permit an empty result.
- Do not fill the set to 20 when candidates fail the threshold.
- Return Visual Reference IDs and aggregate statistics, not individual clinical records.

## 7. Data Architecture

### 7.1 Single data authority

Hugging Face is the runtime authority for the fibrotic Dataset Release. GitHub Pages deploys the interface and visualization code but does not publish a separate production copy of the fibrotic matching/display dataset.

```text
Git-ignored raw source
embedding_data/patient_feature_matrix.csv
                |
                v
validated preprocessing pipeline
          /                 \
         v                   v
private/noised match      display-safe embedding
artifact                  artifact
         \                   /
          Hugging Face backend
           |              |
           v              v
 POST profile match   GET fibrotic embedding
           \              /
             GitHub Pages UI
```

### 7.2 Generated artifacts

Both artifacts are generated in the same preprocessing run from the ignored raw source. They are not manually edited independently.

The display-safe fibrotic payload contains only fields required to draw and group points:

- `visual_reference_id`
- `disease`
- display-safe group/category
- `tsne_x`
- `tsne_y`

Matching features remain backend-only. Neither artifact contains UKB `eid`.

### 7.3 Visual identity and release version

- Each preprocessing run assigns cryptographically random Visual Reference IDs.
- The same ID is written to the two artifacts for the same Reference Patient.
- IDs are stable within one Dataset Release and may change on a new release.
- IDs are not sequential and are not hashes of `eid`.
- A Dataset Release version is exposed as response metadata and used for caching and diagnostics.
- The fibrotic embedding and profile match endpoint read the same backend release, eliminating cross-host data drift.

### 7.4 Proposed backend boundaries

The implementation may adjust endpoint names, but responsibilities remain separate:

- `GET /embedding/fibrotic`: display-safe points, dataset version, cache metadata.
- `POST /profile/extract`: stateless LLM candidate extraction from the latest message plus current draft context.
- `POST /profile/validate`: deterministic mapping, unit conversion, derived fields, conflicts, and coverage status.
- `POST /profile/match`: validated Confirmed Profile to threshold-qualified neighborhood result.
- Existing paper Q&A and general data-query behavior remain separate from profile matching.

The matching response contains only the data needed to render a Cohort Comparison Result and construct a Visualization Request: dataset version, target, coverage, matching domain summary, Visual Reference IDs, aggregate neighborhood statistics, warnings, and display-safe explanatory copy.

## 8. ICD Keyword Vocabulary

Use a small, reviewed, versioned table rather than open-ended LLM coding. Each entry records:

- canonical keyword;
- approved synonyms;
- display label;
- selector type (`exact`, `prefix`, or `range`);
- start/end code where applicable;
- source and ICD version.

Every selector must be validated against the tracked ICD embedding code set during build or test. Ambiguous matches require clarification. Unsupported keywords remain unsupported until a reviewed vocabulary entry is added.

The existing ICD embedding can remain a tracked GitHub Pages visualization asset because it contains codes rather than patient data. The patient-data single-authority rule applies to the fibrotic Dataset Release.

## 9. Visualization Design

### 9.1 Renderer

- Migrate the fibrotic t-SNE from Observable Plot to the shared `regl-scatterplot` path.
- Extract a reusable embedding-scatter component for patient, ICD, and fibrotic plots.
- Keep Observable Plot for metric, bar, and pathway charts.
- Use WebGL for points and an HTML/SVG overlay for outlines, leaders, labels, and callouts.
- Provide a DOM-based Neighborhood Summary outside the canvas for accessibility.

### 9.2 Visual encoding

- Background cohort: neutral gray or existing disease colors at reduced opacity.
- Matched points: emphasized blue treatment with sufficient contrast.
- Neighborhood Marker: red/orange summary marker, explicitly labeled as a matched-neighborhood summary rather than the Query Patient.
- Display Regions: translucent outlines and numbered callouts.
- Query Profile values: session-only content in the user's result context, not attached to a Reference Patient point.

### 9.3 Animation state machine

```text
idle
  -> overview
  -> dim background
  -> highlight matched points
  -> zoom to Display Region
  -> reveal outline and callout
  -> await visitor action
```

- The transition runs once after the visitor clicks a Visualization Request.
- A compact result uses one region.
- A multi-region result first shows numbered regions, then enters the first region.
- `Next` and `Back` control subsequent regions; there is no indefinite autoplay.
- Provide `Replay` and `Reset view`.
- New requests cancel and reset old animation state.
- User interaction, tab invisibility, or route changes pause/cancel active motion.
- `prefers-reduced-motion` skips camera animation and renders the final state directly.

### 9.4 Honest layout behavior

- Compact matched points may receive one outline and callout.
- Spatially separated points receive multiple Display Regions.
- Broadly dispersed points remain in an overview; do not draw one giant bounding box or misleading centroid.
- Display Regions organize annotations only. They are not clinical clusters or new patient subtypes.

### 9.5 Callout privacy

Reference callouts use privacy-reviewed aggregates only, such as count, ranges, medians, proportions, and domain-level comparisons. They do not display a Reference Patient ID or a complete individual clinical feature combination. Small groups suppress sensitive aggregates according to the threshold established during privacy review.

## 10. Chatbot and Navigation

- The chatbot remains site-wide.
- A result card contains explicit actions such as `View matched reference patients` or `View ICD: Tuberculosis (A15-A19)`.
- The chatbot never redirects without a visitor click.
- The clicked action writes a minimal Visualization Request into the browser session and navigates to the relevant full visualization page/anchor.
- The target page waits for data and renderer readiness, consumes the request, and plays the transition.
- The chatbot remains open and retains the current Profile Session when navigation stays in the same tab.
- Reloading a consumed request does not silently replay forever; the final state remains available with an explicit Replay control.

## 11. Privacy, Safety, and Failure Behavior

- Display a prominent research-demo disclaimer before profile collection.
- Reject or warn on identifying fields such as name, exact birth date, address, patient ID, or record number.
- Do not log profile request bodies or place them in URLs, analytics, or long-lived storage.
- Limit input length and rate-limit public LLM/profile endpoints.
- Keep matching features backend-only.
- Use aggregate result copy and suppress small-group clinical summaries.
- Treat backend unavailability as an explicit retry state.
- Never fall back to row numbers, nearest display coordinates, stale patient data, or guessed identifiers.
- Preserve the existing historical anonymization memo; the new ADRs describe the replacement runtime contract.

## 12. Delivery Plan

### Milestone 1: visible animation tracer bullet

Goal: validate the complete visible route quickly without representing unvalidated matching as live inference.

Backend:

- Generate the paired Dataset Release.
- Serve the display-safe fibrotic embedding.
- Serve one reviewed synthetic demo result containing Visual Reference IDs and a Neighborhood Summary.

Frontend:

- Fetch the fibrotic embedding from the backend authority.
- Migrate the t-SNE to the shared WebGL renderer.
- Add a `Try animated demo` chatbot action.
- Implement navigation, request consumption, highlighting, Display Regions, callouts, controls, reduced-motion behavior, and retry UI.

The result is explicitly labeled as a preset walkthrough, not real-time profile matching.

### Milestone 2: live demo-profile workflow

- Implement multi-turn LLM extraction.
- Implement deterministic validation and the confirmation card.
- Implement Profile Session state and corrections.
- Implement domain-balanced matching.
- Run coverage masking and distance-threshold calibration.
- Implement adaptive neighborhoods and No Stable Neighborhood.
- Add the reviewed ICD Keyword Vocabulary and independent ICD actions.
- Remove the invalid neighbor-averaged risk output from this flow.

## 13. Verification and Acceptance Criteria

### Data pipeline

- Raw `eid` never appears in generated artifacts or validation logs.
- Visual Reference IDs are unique within the Dataset Release.
- Private and display artifacts have a one-to-one Visual Reference ID mapping.
- Public display schema contains only approved fields.
- All seven canonical Comparison Targets have expected non-zero counts.
- Regeneration produces a coherent paired release and explicit dataset version.

### Backend

- Extraction cannot directly confirm or match a profile.
- Validator tests cover units, ambiguous values, corrections, conflicts, invalid values, and outside-reference-support values.
- Matching tests prove t-SNE coordinates and `p_true` are not inputs.
- Coverage-ineligible profiles cannot match.
- Threshold failure returns No Stable Neighborhood.
- Responses expose no individual clinical records.
- Public endpoints have bounded input and rate-limit behavior.

### Frontend

- A demo request highlights exactly the Visual Reference IDs returned by the backend.
- Compact, multi-region, dispersed, empty, and backend-error states are covered.
- Navigation never triggers without a click.
- Replay/reset and cancellation behave deterministically.
- Reduced-motion mode contains no camera transition.
- Keyboard and screen-reader users can access the Neighborhood Summary and region controls.
- No profile values appear in the URL or long-lived storage.

### Repository and deployment

- `python scripts/check_ojs_assets.py` passes for remaining tracked OJS assets.
- `quarto render` succeeds.
- Backend tests pass.
- Browser smoke tests cover the deployed GitHub Pages -> Hugging Face -> visualization route.
- The deployed page shows a clear loading/retry state during Hugging Face cold start or outage.

## 14. Decision Records

- [`ADR-0001`](adr/0001-share-opaque-visual-reference-ids.md): connect private matching and public visualization records with opaque visual identity; later extended to a single backend data authority.
- [`ADR-0002`](adr/0002-show-aggregate-neighborhood-callouts.md): show aggregate neighborhood callouts rather than individual cases.
- [`ADR-0003`](adr/0003-limit-profile-matching-to-demo-data.md): limit the workflow to synthetic or de-identified demo profiles.
- [`ADR-0004`](adr/0004-do-not-infer-risk-from-neighbor-outcomes.md): do not infer personal risk from neighbors' outcomes.
- [`ADR-0005`](adr/0005-use-release-scoped-random-visual-ids.md): historical random-ID decision, superseded by ADR-0006's single-authority release model while retaining release-scoped random IDs.
- [`ADR-0006`](adr/0006-serve-fibrotic-data-from-one-backend-authority.md): serve matching and display-safe fibrotic data from Hugging Face as one runtime authority.

## 15. Open Implementation Parameters

The product and architecture decisions are accepted. The following values remain intentionally unset until validation work produces evidence:

- physiological validity ranges and accepted unit conversions;
- per-target Profile Coverage eligibility threshold;
- masking-stability criterion;
- profile-distance threshold;
- minimum group size for aggregate callouts;
- geometry criteria for compact, multi-region, and dispersed display states;
- animation durations and easing values;
- endpoint rate limits and cache duration.

Changing the product boundaries in Sections 2-3 or contradicting an accepted ADR requires explicit design review. Tuning the evidence-driven implementation parameters does not require a new ADR unless it changes the meaning, privacy boundary, or scientific interpretation of the workflow.

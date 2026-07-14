# Demo Profile Edge-State Validation

**Date:** 2026-07-14

**Scope:** Issue #27 partial Profile Coverage, display layout, accessibility, and
backend failure behavior

This change note extends the accepted chatbot embedding design and the existing
matching-calibration evidence. It does not replace those historical documents.

## Partial Profile Coverage

The matching service continues to admit only exact target/domain patterns that
passed the tracked masking experiments. Missing domains are never imputed and
do not contribute to distance or aggregate callouts.

When a Confirmed Profile is not eligible, the service now returns the nearest
complete calibrated pattern rather than inventing a single preferred field. It
ranks calibrated supersets by:

1. fewest missing domains;
2. higher 10th-percentile top-five-neighbor overlap;
3. higher median top-five-neighbor overlap;
4. stable pattern name for deterministic ties.

The recommendation lists every domain still needed for that calibrated pattern
and maps each domain to supported, visitor-readable measurements. This avoids
claiming that one measurement is sufficient when the target's evidence requires
several domains.

Confirmed values outside the current reference support remain unchanged. The
response identifies their domains as an edge state; a No Stable Neighborhood
explains the cohort limitation without claiming that comparable people do not
exist elsewhere.

## Display Region Method

Display Regions organize the already-selected Visual Reference IDs only. They
do not participate in Profile Similarity.

For each selected point, the renderer calculates its distance to the fifth
nearest point in the same target cohort. Two selected points are connected only
when each falls within the other's local fifth-neighbor radius. Connected
components must also share a local center: their component center must fall
within every member's local radius. This rejects single-link chains that span
the embedding while remaining locally connected. Components are interpreted
as follows:

- one component containing the whole selection: `compact`;
- multiple components, each meeting the release suppression minimum:
  `multi_region`;
- any ungrouped or privacy-small component: dispersed `overview`.

The fifth-neighbor count is the release-controlled minimum display/aggregate
group size. The component-center check is scaled separately by every member's
release-derived local radius; it does not introduce a fixed global t-SNE
distance or mock clinical threshold. Multi-region navigation reveals only
display-safe counts and the existing whole-neighborhood aggregate; it does not
create clinical summaries for individual regions.

## Accessibility and Control

- The canvas is exposed as an image and points to a DOM Neighborhood Summary.
- Compact, multi-region, and dispersed layouts have distinct text outside the
  canvas.
- Multi-region results expose native Back and Next buttons with bounded states
  and a live region-position announcement. Before entering region 1, a
  display-only overlay shows every region outline and number from normalized
  coordinates; the overlay never feeds back into classification or matching.
- Replay and Reset remain available; a new request or Start Over cancels the
  previous backend request.
- Reduced motion skips camera transitions and renders the final highlighted
  state directly.
- Visitor interruption or tab hiding cancels motion and restores the neutral
  overview instead of leaving stale highlights. Renderer writes are serialized,
  so the neutral reset runs after any in-flight stale draw or camera operation.

## Backend Loading and Retry

Backend reads use an abortable 30-second operational request budget. After four
seconds the interface explains that the Hugging Face backend may be waking from
a cold start. Timeout or failure produces an explicit Retry path; a newer load
invalidates the older token, so a late response cannot replace the current
view. These timings are user-interface operational parameters, not scientific
or clinical thresholds.

No local patient-data fallback, row-number mapping, coordinate-nearest mapping,
or stale Dataset Release is used.

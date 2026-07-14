# Demo Profile Matching Calibration Evidence

**Date:** 2026-07-13

**Dataset Release:** `fibrotic-2026-07-13-9d04ee36876b`

**Private artifact SHA-256:** `518b472187ca66d62ae519ecbef796d7f172d3772211d7837de8ddb0b53874fc`

This note records the implementation parameters generated for issue #26. It
does not replace the accepted design or ADRs. The values below describe the
current research reference cohort; they are not clinical thresholds, healthy
ranges, or prediction-confidence cutoffs.

## Method

Matching uses a domain-balanced Gower-style distance. Feature differences are
averaged within each available domain, then domain contributions are averaged
so a domain with more columns does not receive extra weight. The approved
domains are demographics, body composition, blood pressure, lifestyle, family
history, and optional laboratory values.

For every Comparison Target and every available-domain pattern:

1. Treat each Reference Patient in turn as a masked query.
2. Find its five nearest same-target references using the masked pattern.
3. Compare those five references with the five selected using all six domains.
4. Retain a pattern only when median top-five overlap is at least `0.60` and
   the 10th-percentile overlap is at least `0.20`.
5. Set the distance threshold to the 95th percentile of the leave-one-out
   fifth-neighbor distance for that retained target/pattern.

At runtime only references at or below that threshold qualify. Results are
capped at 20. Fewer than five qualifying references produces `No Stable
Neighborhood`; the service does not fill the result with threshold-failing
nearest neighbors.

Aggregate callouts use a separately recorded release suppression minimum of
five. A categorical metric is withheld as a whole when any displayed category
or missing-value cell falls below that minimum, which prevents reconstruction
by subtraction. A continuous metric is withheld when fewer than five selected
references have a compatible value or when its missing-value cell is nonzero
but below five. Suppression is represented explicitly in both the chatbot card
and visualization summary; no sparse values or counts are sent in that metric.

## Coverage result

| Comparison Target | Reference rows | Eligible patterns | Minimum calibrated domains |
|---|---:|---:|---:|
| Chronic Kidney Disease | 1,500 | 9 | 4 |
| Cardiac Fibrosis | 379 | 17 | 3 |
| Crohn's Disease | 826 | 13 | 3 |
| Skin Fibrosis | 1,500 | 9 | 4 |
| MASH | 849 | 13 | 4 |
| Pulmonary Fibrosis | 869 | 10 | 4 |
| Systemic Sclerosis / Connective Tissue | 87 | 30 | 2 |

The complete per-target/per-pattern evidence and thresholds are tracked in
`chatbot-backend/data/fibrotic_matching_calibration.json`.

## Reproduction

The backend-only artifact must be generated in the same preprocessing run as
the public display artifact. It remains ignored by Git and must be provisioned
to the Hugging Face backend; matching returns an explicit unavailable response
when it is absent or fails integrity validation.

```bash
python chatbot-backend/calibrate_profile_matching.py \
  --private-artifact chatbot-backend/data/private/fibrotic_match.csv \
  --manifest chatbot-backend/data/fibrotic_release/fibrotic_manifest.json \
  --output chatbot-backend/data/fibrotic_matching_calibration.json
```

Runtime loading verifies the private schema, private SHA-256, calibration
Dataset Release version, unique Visual Reference IDs, and the one-to-one ID
mapping to the display-safe embedding. Matching never consumes t-SNE
coordinates, display groups, `p_true`, model correctness, or source participant
identifiers.

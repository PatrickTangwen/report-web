# Demo Profile input-bound validation — 2026-07-13

This note records the evidence for the operational validation bounds introduced
for issue [#25](https://github.com/PatrickTangwen/report-web/issues/25). It does
not replace the [accepted design](https://github.com/PatrickTangwen/report-web/blob/79b16b4ebf5add5dd8eeb81edab83cc30dcba136/docs/chatbot-embedding-visualization-design-2026-07-13.md)
or [ADR 0003](https://github.com/PatrickTangwen/report-web/blob/79b16b4ebf5add5dd8eeb81edab83cc30dcba136/docs/adr/0003-limit-profile-matching-to-demo-data.md).

## Evidence and interpretation

The current fibrotic demo source contains 6,010 reference rows. The validator's
`REFERENCE_SUPPORT` values are the observed minima and maxima of the ten
continuous fields in that committed source. A contract test reads the CSV and
proves that every recorded support interval matches those values exactly and is
contained by the corresponding operational input bound.

The wider `INPUT_BOUNDS` are conservative entry-error envelopes used only to
separate an uninterpretable value (`out_of_range`) from a valid value that the
current demo cohort does not represent (`outside_reference_support`). They are
not healthy ranges, diagnostic intervals, or matching thresholds. Values inside
the input envelope are never clamped; values beyond reference support remain
visible. Unit-conversion tests cover centimetres, metres, feet/inches, pounds,
kilograms, creatinine units, HbA1c units, and derived BMI.

This validation intentionally supports the current Dataset Release only. Before
a release changes these fields or their units, maintainers must rerun the CSV
extrema contract, review the operational envelopes, and update this dated note
instead of silently retaining stale limits. Scientific Profile Coverage and
matching-threshold calibration remain outside issue #25.

## Reproduction

```bash
cd chatbot-backend
python -m pytest -q test_demo_profile.py
```

---
status: accepted
---

# Ground Paper Question Mode in Study Evidence

Paper Question Mode answers are grounded in Study Evidence — the published ALIGATEHR-Gen paper plus the published study result data (evaluation metrics, ablation results, pathway enrichment, and cohort-level fibrotic summaries) — instead of the paper text alone. This partially supersedes ADR-0009: its restriction of free-text input to Paper Question Mode stands unchanged, but its paper-only answering clause is replaced, because the paper-only contract made compositional Research Questions that span the paper and the site's own published data structurally unanswerable (measured at 0% multi-tool correctness on the pre-cutover golden-set baseline). The boundary moves, but stays hard: unpublished manuscripts (Bio-E2R), external literature, general knowledge, and anything patient-level remain outside Study Evidence and receive an explicit scope limitation rather than an answer. `POST /paper/question` keeps its response contract (an additive, ignorable `tool_trace` field is the only change), and the pre-cutover single-call implementation is preserved under the `paper-question-single-call` git tag for the recorded baseline comparison.

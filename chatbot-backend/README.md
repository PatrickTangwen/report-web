---
title: ALIGATEHR-Gen Chatbot Backend
emoji: "🧬"
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
---

# ALIGATEHR-Gen Chatbot Backend

FastAPI backend for the ALIGATEHR-Gen research demonstration. This is a
research prototype and does not provide medical advice, diagnosis, or personal
outcome predictions.

The public deployment source contains only the de-identified visualization
release. The matching artifact is read at runtime from a private Hugging Face
Dataset. Deployment requires these environment settings:

- Variable `FIBROTIC_MATCH_DATASET_REPO`
- Variable `FIBROTIC_MATCH_DATASET_REVISION`
- Secret `HF_TOKEN`, scoped to read only that private Dataset
- Secret `LLM_Key_Deepseek`

## Answer quality: three architecture generations, one golden set

Paper Question Mode is served by a bounded function-calling agent
(`agent.py` + `agent_tools.py`, ADR-0013/0014): a framework-free tool-use
loop over typed Study Evidence tools (paper content, evaluation metrics,
ablation results, pathway enrichment, cohort-level fibrotic aggregates).
Task selection stays explicit UI routing (ADR-0010) — the model only
chooses tools *within* the selected task.

All three generations of the answering architecture were evaluated on the
same 36-item golden set (`eval/golden_set.jsonl`; runner in
`eval/run_eval.py`; raw + graded results committed under `eval/results/`):

| Path | Overall | Single-tool | Multi-tool | Adversarial refusal | Ambiguous clarification | Tool selection (exact) | Mean LLM calls | Mean latency |
|---|---|---|---|---|---|---|---|---|
| Legacy intent router (`/chat`) | 41.7% | 38.5% | 27.3% | 85.7% | 20.0% | — | 1.75 | 3.3s |
| Single-call full-paper (`/paper/question`, tag `paper-question-single-call`) | 27.8% | 30.8% | 0.0% | 71.4% | 0.0% | — | 1.0 | 2.3s |
| **In-task agent (current `/paper/question`)** | **94.4%** | **100%** | **100%** | **100%** | 40.0% | 91.7% (coverage 100%) | 2.22 | 6.4s |

Multi-tool compositional questions went from structurally unanswerable
(0% on the single-call baseline) to 100%; adversarial items (personal
medical advice, out-of-scope Bio-E2R questions, identifier requests)
refuse or scope-limit at 100%. The latency cost of tool orchestration
(2.3s → 6.4s mean) is accepted: correctness dominates in a research-QA
context, and the streaming endpoint surfaces progress while the agent
works.

Grading methodology and its limits: answer correctness is judged by
DeepSeek against a written rubric with per-item grading notes
(temperature 0), which means the judge shares a model family with the
system under test — a known bias risk. Mitigations: 22% of agent
verdicts (and 7 baseline verdicts) were manually re-checked with 0
disagreements, and tool-selection accuracy is judge-free (exact match on
recorded call traces). Baselines were captured *before* the agent
cutover, so the single-call column reflects the then-live production
handler.

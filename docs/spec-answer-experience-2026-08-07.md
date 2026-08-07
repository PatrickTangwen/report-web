# Answer Experience: Evidence, Presets, Inline Charts

Parent issue: #54. Tickets: T1 = #55, T2 = #56, T3 = #57, T4 = #58, T5 = #59. Follows the agent refactor (#45, `docs/spec-agent-refactor-2026-08-07.md`).
Governing decisions: ADR-0016 (created by T1). Domain vocabulary: `CONTEXT.md` (`Answer Evidence`, `Chart Preset`, and the amended `Visualization Request` are already committed).

## Problem Statement

The in-task agent (#45–#53) answers compositional Research Questions correctly, but the answer experience does not yet exploit the two assets a visitor cannot get by pasting the paper into a general chatbot: the site's structured study data and the surrounding interactive visualizations. Tool traces reach the frontend as names only (`{tool, arguments, ok}`), so the widget cannot show *what data* grounded an answer, cannot draw that data, and cannot link into the charts. Related-question suggestions come from a fixed example bank regardless of what was just asked. The MCP surface (#51) stays as shipped — an engineering artifact, not the product axis; this graph invests in the on-site experience instead.

## Solution

One substrate plus four consumers, all deterministic:

1. **Answer Evidence contract (substrate).** Every tool call's trace entry — in the non-streaming `tool_trace`, and in SSE `tool_result` events — carries a structured, size-capped evidence summary: resolved filters plus a bounded excerpt of the returned data. Tabular tools cap rows (≤ 20, with an explicit `total_rows` so truncation is visible); the paper tool contributes section names only, never text; the cohort tool contributes its aggregate dict as-is.
2. **Provenance UI.** The widget renders evidence chips under each answer ("ablation_results · CKD · AUROC"); clicking expands the actual rows consulted. Trust the visitor can inspect.
3. **Chart Presets + handoff chips.** Visualization pages read a URL hash fragment (e.g. `viz/ablation.html#disease=CKD&metric=AUROC`) to preset their own OJS controls — shareable deep links. The widget derives "open this in the chart" chips deterministically from evidence entries; the visitor clicks to follow (never auto-navigation).
4. **Inline evidence mini-charts.** Small hand-rolled SVG charts inside answer bubbles, rendered exclusively from evidence data (never parsed from answer prose): signed-delta bars for ablation, model-comparison bars for metrics. Theme-aware.
5. **Deterministic related questions.** Follow-up suggestions generated from (tool, resolved filters) templates — reviewed language, zero extra LLM calls — falling back to the example bank when no tools ran.

### Honesty and governance principles

- **No LLM-generated UI actions.** Chips, links, and charts derive from recorded tool results only (ADR-0016). An answer's prose can be wrong; its evidence cannot.
- **Caps are visible.** Truncated evidence always states the full count.
- **The Assistant never navigates on its own** from an answer; Chart Preset links are explicit visitor actions (amended Visualization Request).
- Agent behavior, system prompt, and eval golden set are untouched — this graph changes presentation, not answering.

## Ticket graph

Execution order: T1 → T2 → T3 → T4 → T5 (T2–T5 all depend on T1 only and are mutually independent).

| Ticket | Outcome | Blocked by |
|---|---|---|
| T1 Evidence contract | Per-tool evidence summarizers in `agent_tools.py`; trace entries and SSE `tool_result` events carry `evidence`; `ToolTraceEntry` gains the additive field; caps enforced and tested; ADR-0016. Mirror sync + manual Render deploy. | — |
| T2 Provenance UI | Evidence chips + expandable rows table under answers, streaming and non-streaming paths, light/dark. | T1 |
| T3 Chart Presets + handoff chips | Ablation and Performance pages read hash presets into their OJS selects (Use Case enrichment included if a selector exists); widget derives preset links from evidence; deployment-contract checks. | T1 |
| T4 Inline mini-charts | `chatbot/answer-charts.js` UMD module (+ `_quarto.yml` resources entry): signed-delta bars (ablation), comparison bars (metrics), rendered only from evidence; node tests. | T1 |
| T5 Related-question templates | Deterministic template bank keyed by (tool, filters); replaces the fixed bank when a trace exists, falls back otherwise. | T1 |

## Deployment notes

- T1 changes `chatbot-backend/` → checksum sync to `report-web-backend` + **manual Render deploy** (auto-deploy off).
- T2–T5 are frontend/site changes → GitHub Pages auto-deploys; any new `chatbot/*.js` file must be added to `_quarto.yml` `resources:`; site changes run `python scripts/check_ojs_assets.py` and `quarto render` before finishing.

## Definition of Done

1. Every answer on the published site shows inspectable Answer Evidence.
2. An ablation or metrics answer offers a working Chart Preset deep link that presets the target page's controls, and the preset URL is shareable on its own.
3. Ablation and metrics answers render mini-charts whose numbers come from evidence data.
4. Related-question chips reflect the just-asked topic when tools ran.
5. ADR-0016 committed; `CONTEXT.md` carries Answer Evidence and Chart Preset; existing behavior (answers, eval, wizard, MCP) unchanged.

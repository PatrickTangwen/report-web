const assert = require("node:assert/strict");
const test = require("node:test");

const charts = require("./answer-charts.js");


const CKD_AUROC_ABLATION = {
  filters: { disease: "CKD", metric: "AUROC" },
  total_rows: 5,
  rows: [
    { variant: "w/o Ontology Graph", disease: "CKD", metric: "AUROC", value: 0.8133, delta: -0.1052 },
    { variant: "w/o Attention Mechanism", disease: "CKD", metric: "AUROC", value: 0.8433, delta: -0.0616 },
    { variant: "w/o Genetic Data", disease: "CKD", metric: "AUROC", value: 0.8675, delta: -0.0432 },
    { variant: "w/o Pre-training", disease: "CKD", metric: "AUROC", value: 0.8472, delta: -0.0279 },
    { variant: "w/o EHR Sequences", disease: "CKD", metric: "AUROC", value: 0.8668, delta: -0.0265 },
  ],
};


test("ablation chart builds signed bars from a uniform slice", () => {
  const chart = charts.buildAblationChart(CKD_AUROC_ABLATION);
  assert.equal(chart.title, "Ablation deltas — CKD · AUROC");
  assert.equal(chart.bars.length, 5);
  assert.equal(chart.bars[0].label, "w/o Ontology Graph");
  assert.equal(chart.bars[0].value, -0.1052);
  assert.ok(chart.bars.every((bar) => bar.negative));
});


test("mixed slices never chart — the table already shows them", () => {
  const mixed = {
    rows: [
      { variant: "a", disease: "CKD", metric: "AUROC", delta: -0.1 },
      { variant: "a", disease: "CKD", metric: "F1", delta: -0.2 },
    ],
  };
  assert.equal(charts.buildAblationChart(mixed), null);
  assert.equal(charts.buildAblationChart({ rows: [] }), null);
  assert.equal(charts.buildAblationChart({ matched: false }), null);
  assert.equal(
    charts.buildAblationChart({ rows: [CKD_AUROC_ABLATION.rows[0]] }),
    null,
    "a single row is not a comparison"
  );
});


test("metrics chart sorts descending and highlights the proposed model", () => {
  const chart = charts.buildMetricsChart({
    rows: [
      { model: "XGBoost", disease: "T2D", metric: "AUPRC", value: 0.847, is_proposed: false },
      { model: "ALIGATEHR-Gen", disease: "T2D", metric: "AUPRC", value: 0.8284, is_proposed: true },
      { model: "Transformer", disease: "T2D", metric: "AUPRC", value: 0.7842, is_proposed: false },
    ],
  });
  assert.deepEqual(
    chart.bars.map((bar) => bar.label),
    ["XGBoost", "ALIGATEHR-Gen", "Transformer"]
  );
  assert.deepEqual(chart.bars.map((bar) => bar.highlight), [false, true, false]);
});


test("svg markup contains one labeled bar per row and escapes text", () => {
  const svg = charts.svgFor(charts.buildAblationChart(CKD_AUROC_ABLATION));
  assert.equal((svg.match(/<rect/g) || []).length, 5);
  assert.match(svg, /w\/o Ontology Graph/);
  assert.match(svg, /-0\.1052/);
  assert.match(svg, /chatbot-chart-bar-neg/);
  assert.match(svg, /chatbot-chart-axis/);

  const sneaky = charts.svgFor(
    charts.buildMetricsChart({
      rows: [
        { model: "<img>", disease: "d", metric: "m", value: 0.5, is_proposed: false },
        { model: "b&b", disease: "d", metric: "m", value: 0.4, is_proposed: false },
      ],
    })
  );
  assert.match(sneaky, /&lt;img&gt;/);
  assert.match(sneaky, /b&amp;b/);
});


test("chartFor gates on tool, ok, and chartability", () => {
  const entry = { tool: "query_ablation", ok: true, evidence: CKD_AUROC_ABLATION };
  const chart = charts.chartFor(entry);
  assert.match(chart.svg, /^<svg/);
  assert.equal(charts.chartFor({ tool: "query_enrichment", ok: true, evidence: {} }), null);
  assert.equal(charts.chartFor({ tool: "query_ablation", ok: false, evidence: {} }), null);
});

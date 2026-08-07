const assert = require("node:assert/strict");
const test = require("node:test");

const evidence = require("./answer-evidence.js");


test("ablation chip shows scope and visible truncation", () => {
  const chip = evidence.chipFor({
    tool: "query_ablation",
    ok: true,
    evidence: {
      filters: { disease: "CKD", metric: "AUROC" },
      total_rows: 175,
      rows: new Array(20).fill({}),
      truncated: true,
    },
  });
  assert.equal(chip.title, "Ablation results");
  assert.equal(chip.detail, "CKD · AUROC · first 20 of 175 rows");
  assert.equal(chip.error, false);
});


test("small tabular evidence renders exact row count without truncation note", () => {
  const entry = {
    tool: "query_metrics",
    ok: true,
    evidence: {
      filters: { disease: "CKD" },
      total_rows: 1,
      rows: [
        {
          model: "ALIGATEHR-Gen",
          disease: "CKD",
          metric: "AUROC",
          value: 0.8755,
          ci_lower: 0.8646,
          ci_upper: 0.8777,
        },
      ],
    },
  };
  assert.equal(evidence.chipFor(entry).detail, "CKD · 1 row");
  const table = evidence.tableFor(entry);
  assert.equal(table.kind, "table");
  assert.deepEqual(table.rows[0], [
    "ALIGATEHR-Gen",
    "CKD",
    "AUROC",
    "0.8755",
    "0.8646",
    "0.8777",
  ]);
  assert.equal(table.note, null);
});


test("paper evidence never renders content, only section names", () => {
  const full = {
    tool: "get_paper_content",
    ok: true,
    evidence: { available_sections: ["Methods", "Conclusions"] },
  };
  assert.equal(evidence.chipFor(full).detail, "full paper");
  assert.match(evidence.tableFor(full).text, /Methods, Conclusions/);

  const section = {
    tool: "get_paper_content",
    ok: true,
    evidence: { section: "Methods" },
  };
  assert.equal(evidence.chipFor(section).detail, "section: Methods");
});


test("cohort evidence respects suppression in the table", () => {
  const entry = {
    tool: "summarize_fibrotic_cohort",
    ok: true,
    evidence: {
      targets: [
        {
          label: "Systemic Sclerosis / Connective Tissue",
          reference_count: 87,
          age_at_recruitment: { suppressed: true },
          sex: { suppressed: true },
        },
      ],
    },
  };
  assert.equal(evidence.chipFor(entry).detail, "Systemic Sclerosis / Connective Tissue");
  const table = evidence.tableFor(entry);
  assert.deepEqual(table.rows[0], [
    "Systemic Sclerosis / Connective Tissue",
    "87",
    "suppressed",
    "suppressed",
    "suppressed",
  ]);
});


test("preset links derive only from successful evidence with resolved scope", () => {
  const ablation = evidence.presetLinkFor({
    tool: "query_ablation",
    ok: true,
    evidence: { filters: { disease: "CKD", metric: "AUROC" }, total_rows: 5, rows: [] },
  });
  assert.equal(ablation.path, "/viz/ablation.html");
  assert.equal(ablation.query, "disease=CKD&metric=AUROC");
  assert.equal(ablation.label, "Open in Ablation view (CKD · AUROC)");

  const metrics = evidence.presetLinkFor({
    tool: "query_metrics",
    ok: true,
    evidence: { filters: { metric: "AUPRC" }, total_rows: 70, rows: [] },
  });
  assert.equal(metrics.path, "/viz/overall-performance.html");
  assert.equal(metrics.query, "metric=AUPRC");
  assert.equal(metrics.anchor, "evaluation-metrics-comparison");

  const enrichment = evidence.presetLinkFor({
    tool: "query_enrichment",
    ok: true,
    evidence: { disease: "NASH", disease_label: "MASH", pathways: [] },
  });
  assert.equal(enrichment.query, "pathway_disease=NASH");
  assert.match(enrichment.label, /MASH/);

  assert.equal(
    evidence.presetLinkFor({ tool: "query_metrics", ok: true, evidence: { matched: false } }),
    null
  );
  assert.equal(
    evidence.presetLinkFor({ tool: "get_paper_content", ok: true, evidence: {} }),
    null
  );
});


test("related questions derive from evidence, dedupe, and cap at three", () => {
  const entries = [
    {
      tool: "query_ablation",
      ok: true,
      evidence: { filters: { disease: "CKD", metric: "AUROC" }, total_rows: 5, rows: [] },
    },
    {
      tool: "query_enrichment",
      ok: true,
      evidence: { disease: "NASH", pathways: [] },
    },
  ];
  const questions = evidence.relatedQuestionsFor(entries, "irrelevant");
  assert.equal(questions.length, 3);
  assert.match(questions[0], /Type 2 Diabetes most on AUROC/);
  assert.match(questions[1], /CKD most on AUPRC/);

  const askedAgain = evidence.relatedQuestionsFor(
    entries,
    "Which ablation variant hurts Type 2 Diabetes most on AUROC?"
  );
  assert.equal(askedAgain.length, 3);
  assert.doesNotMatch(askedAgain[0], /Type 2 Diabetes most on AUROC\?/);

  assert.deepEqual(evidence.relatedQuestionsFor([], "q"), []);
  assert.deepEqual(
    evidence.relatedQuestionsFor(
      [{ tool: "query_metrics", ok: true, evidence: { matched: false } }],
      "q"
    ),
    []
  );
});


test("enrichment follow-ups use the glossary display name for NASH", () => {
  const questions = evidence.relatedQuestionsFor(
    [{ tool: "query_enrichment", ok: true, evidence: { disease: "NASH", pathways: [] } }],
    "q"
  );
  assert.match(questions[0], /MASH and CKD share/);
});


test("errors and unmatched results render honestly", () => {
  const error = { tool: "query_enrichment", ok: false, evidence: { error: "Invalid tool arguments: ..." } };
  assert.equal(evidence.chipFor(error).error, true);
  assert.match(evidence.tableFor(error).text, /Invalid tool arguments/);

  const unmatched = {
    tool: "query_metrics",
    ok: true,
    evidence: { matched: false, available_diseases: ["CKD", "COPD"] },
  };
  assert.equal(evidence.chipFor(unmatched).detail, "no match");
  assert.match(evidence.tableFor(unmatched).text, /CKD, COPD/);
});

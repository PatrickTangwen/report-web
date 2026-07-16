import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const embeddingSource = fs.readFileSync(
  new URL("./embedding-scatter.js", import.meta.url),
  "utf8",
);
const useCaseSource = fs.readFileSync(
  new URL("./use-case.qmd", import.meta.url),
  "utf8",
);
const performanceSource = fs.readFileSync(
  new URL("./overall-performance.qmd", import.meta.url),
  "utf8",
);
const ablationSource = fs.readFileSync(
  new URL("./ablation.qmd", import.meta.url),
  "utf8",
);


test("fibrotic embedding keeps the framed UI without walkthrough controls", () => {
  assert.match(embeddingSource, /shell\.className = "embedding-walkthrough"/);
  assert.match(embeddingSource, /shell\.appendChild\(frame\)/);
  assert.match(embeddingSource, /shell\.appendChild\(legend\)/);
  assert.doesNotMatch(embeddingSource, /shell\.appendChild\(controls\)/);
  assert.doesNotMatch(embeddingSource, /shell\.appendChild\(summary\)/);
  assert.doesNotMatch(useCaseSource, /\/embedding\/fibrotic\/preset/);
  assert.doesNotMatch(useCaseSource, /connectRequestConsumer/);
});


test("fibrotic disease labels highlight groups at the normal point size", () => {
  assert.match(embeddingSource, /bindHighlightTarget\(button, disease, groupHighlight\)/);
  assert.match(embeddingSource, /pointSize: \[2\.5, 3\]/);
  assert.match(embeddingSource, /select: false/);
});


test("evaluation and ablation charts share hover and pinned selection highlighting", () => {
  assert.match(performanceSource, /createHighlightController\(models/);
  assert.match(performanceSource, /bindHighlightTarget\(legendButtons\.get\(model\)/);
  assert.match(ablationSource, /createHighlightController\(variants/);
  assert.match(ablationSource, /bindHighlightTarget\(node, variant, highlight\)/);
});

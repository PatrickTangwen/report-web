import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const pageSource = fs.readFileSync(
  new URL("./overall-performance.qmd", import.meta.url),
  "utf8",
);
const walkthroughSource = fs.readFileSync(
  new URL("./patient-embedding-walkthrough.js", import.meta.url),
  "utf8",
);

test("both patient embeddings use the shared walkthrough implementation", () => {
  assert.match(
    pageSource,
    /import \{ createPatientWalkthrough \} from "\.\/patient-embedding-walkthrough\.js"/,
  );
  assert.equal(
    pageSource.match(/return createPatientWalkthrough\(\{/g)?.length,
    2,
    "Sex and Age must both use the same walkthrough interaction contract",
  );
});

test("patient controls stay in the chart flow instead of following page scroll", () => {
  const framePosition = walkthroughSource.indexOf("shell.appendChild(frame)");
  const controlsPosition = walkthroughSource.indexOf("shell.appendChild(controls)");

  assert.notEqual(framePosition, -1);
  assert.notEqual(controlsPosition, -1);
  assert.ok(framePosition < controlsPosition);
  assert.match(walkthroughSource, /controls\.className = "embedding-controls"/);
  assert.doesNotMatch(walkthroughSource, /position:\s*(?:fixed|sticky)/);
  assert.doesNotMatch(walkthroughSource, /patient-embedding-explorer/);
});

test("Back and Reset view are enabled for direct group navigation", () => {
  assert.match(walkthroughSource, /const backButton = button\("Back"\)/);
  assert.match(walkthroughSource, /const resetButton = button\("Reset view"\)/);
  assert.match(
    walkthroughSource,
    /async function stepTo\(groupIndex\)[\s\S]*?resetButton\.disabled = false;[\s\S]*?await focusGroup/,
  );
  assert.match(
    walkthroughSource,
    /backButton\.addEventListener\("click", \(\) => stepTo\(currentGroup - 1\)\)/,
  );
  assert.match(
    walkthroughSource,
    /resetButton\.addEventListener\("click", \(\) => reset\(\)\)/,
  );
});

test("patient focus dims unrelated points before zooming exact group points", () => {
  const highlightPosition = walkthroughSource.indexOf(
    "await drawHighlighted(group.indices, group.color)",
  );
  const zoomPosition = walkthroughSource.indexOf("await zoomToPoints(group.indices");

  assert.notEqual(highlightPosition, -1);
  assert.notEqual(zoomPosition, -1);
  assert.ok(highlightPosition < zoomPosition);
  assert.doesNotMatch(walkthroughSource, /Math\.sqrt\(baseIndices\.length\)/);
  assert.doesNotMatch(walkthroughSource, /indices\.length > 100/);
});

test("new walkthrough actions cancel stale transitions before rendering", () => {
  assert.match(
    walkthroughSource,
    /async function stepTo\(groupIndex\)[\s\S]*?runController\.cancel\(\)/,
  );
  assert.match(
    walkthroughSource,
    /async function reset\(\)[\s\S]*?runController\.cancel\(\)/,
  );
  assert.match(walkthroughSource, /const rendererQueue = createRendererQueue\(\)/);
});

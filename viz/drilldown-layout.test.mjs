import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";


const source = fs.readFileSync(new URL("./overall-performance.qmd", import.meta.url), "utf8");
const styles = fs.readFileSync(new URL("../styles/styles.css", import.meta.url), "utf8");


test("patient embedding controls remain visible before the plot", () => {
  const controlsPosition = source.indexOf("container.appendChild(controls)");
  const plotPosition = source.indexOf("container.appendChild(plotFrame)");

  assert.notEqual(controlsPosition, -1);
  assert.notEqual(plotPosition, -1);
  assert.ok(
    controlsPosition < plotPosition,
    "Back, Replay, and Reset view must be rendered before the plot",
  );
  assert.match(
    styles,
    /\.patient-embedding-explorer \.embedding-controls\s*{[^}]*position:\s*sticky;[^}]*top:\s*4\.5rem;/s,
  );
  assert.match(styles, /\.cell-output:has\(\.patient-embedding-explorer\)\s*{[^}]*overflow:\s*visible;/s);
});


test("patient embeddings use the inline fibrotic walkthrough shell", () => {
  assert.match(source, /container\.className = "embedding-walkthrough patient-embedding-explorer"/);
  assert.match(source, /controls\.className = "embedding-controls"/);
  assert.match(source, /resetBtn\.textContent = "Reset view"/);
  assert.doesNotMatch(source, /classList\.toggle\("is-focused"/);
  assert.doesNotMatch(styles, /\.drilldown-shell\.is-focused/);
});


test("patient embedding focus dims unrelated points before inline zoom", () => {
  const highlightPosition = source.indexOf("await renderer.drawHighlighted(state.indices");
  const zoomPosition = source.indexOf("await scatterplot.zoomToPoints(focusIndices");

  assert.notEqual(highlightPosition, -1);
  assert.notEqual(zoomPosition, -1);
  assert.ok(highlightPosition < zoomPosition);
  assert.match(source, /replayBtn\.textContent = "Replay"/);
});


test("large patient cohorts use safe overview and bounded local neighborhoods", () => {
  assert.match(source, /Math\.round\(Math\.sqrt\(baseIndices\.length\)\)/);
  assert.match(source, /const focusIndices = state\.grouped \? allIndices : state\.indices/);
  assert.match(source, /state\.indices\.length > 100 \? 4 : 7/);
});

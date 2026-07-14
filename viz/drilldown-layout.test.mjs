import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";


const source = fs.readFileSync(new URL("./overall-performance.qmd", import.meta.url), "utf8");
const styles = fs.readFileSync(new URL("../styles/styles.css", import.meta.url), "utf8");


test("zoom exit controls precede the fixed-height plot", () => {
  const controlsPosition = source.indexOf("container.appendChild(controls)");
  const plotPosition = source.indexOf("container.appendChild(plotFrame)");

  assert.notEqual(controlsPosition, -1);
  assert.notEqual(plotPosition, -1);
  assert.ok(
    controlsPosition < plotPosition,
    "Back and Reset zoom must be rendered before the plot so they are initially visible",
  );
});


test("zoom exit controls remain pinned while the focused panel scrolls", () => {
  assert.match(
    styles,
    /\.drilldown-shell\.is-focused \.drilldown-controls\s*{[^}]*position:\s*sticky;[^}]*top:\s*0;/s,
  );
});

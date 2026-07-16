import assert from "node:assert/strict";
import test from "node:test";

import {
  createEmbeddingPointInteraction,
  groupAssignments,
} from "./grouped-embedding-explorer.js";


test("group assignments cover each embedding point exactly once", () => {
  assert.deepEqual(
    groupAssignments(5, [
      { indices: [0, 3] },
      { indices: [1, 2, 4] },
    ]),
    [0, 1, 1, 0, 1],
  );
});


test("group assignments reject overlap and missing points", () => {
  assert.throws(
    () => groupAssignments(2, [{ indices: [0] }, { indices: [0, 1] }]),
    /more than one group/,
  );
  assert.throws(
    () => groupAssignments(2, [{ indices: [0] }]),
    /Every embedding point/,
  );
});


test("point hover shows its tooltip without previewing or activating a group", () => {
  const calls = [];
  const tooltipClasses = new Set();
  const interaction = createEmbeddingPointInteraction({
    data: [{ disease: "CKD" }],
    assignments: [0],
    groups: [{ key: "CKD" }],
    groupHighlight: {
      hover: (group) => calls.push(["hover", group]),
      select: (group) => calls.push(["select", group]),
    },
    scatterplot: {
      deselect: (options) => calls.push(["deselect", options]),
    },
    tooltip: {
      classList: {
        add: (name) => tooltipClasses.add(name),
        remove: (name) => tooltipClasses.delete(name),
      },
    },
    renderTooltip: (_tooltip, point) => calls.push(["tooltip", point.disease]),
  });

  interaction.pointover(0);

  assert.deepEqual(calls, [["tooltip", "CKD"]]);
  assert.equal(tooltipClasses.has("is-visible"), true);
});


test("point click pins its group and clears renderer-native point selection", () => {
  const calls = [];
  const interaction = createEmbeddingPointInteraction({
    data: [{ disease: "CKD" }],
    assignments: [0],
    groups: [{ key: "CKD" }],
    groupHighlight: {
      select: (group) => calls.push(["select", group]),
    },
    scatterplot: {
      deselect: (options) => calls.push(["deselect", options]),
    },
    tooltip: { classList: { add() {}, remove() {} } },
    renderTooltip() {},
  });

  interaction.select({ points: [0] });

  assert.deepEqual(calls, [
    ["select", "CKD"],
    ["deselect", { preventEvent: true }],
  ]);
});

import assert from "node:assert/strict";
import test from "node:test";

import {
  groupAssignments,
  resetEmbeddingExplorer,
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


test("reset clears the pinned group before restoring the full embedding view", async () => {
  const calls = [];
  const controller = {
    clear() {
      calls.push("clear");
    },
  };
  const rendererQueue = {
    async run(operation) {
      calls.push("queue");
      await operation();
    },
  };
  const renderer = {
    async zoomToPoints(indices, options) {
      calls.push(["zoom", indices, options]);
    },
  };

  await resetEmbeddingExplorer(controller, rendererQueue, renderer, [0, 1]);

  assert.deepEqual(calls, [
    "clear",
    "queue",
    ["zoom", [0, 1], { padding: 0.08 }],
  ]);
});

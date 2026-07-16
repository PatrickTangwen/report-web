import assert from "node:assert/strict";
import test from "node:test";

import {
  createIcdInteraction,
  createIcdRequestQueue,
  resolveIcdIndices,
} from "./icd-keyword-scatter.js";


const data = [
  { code: "A14" },
  { code: "A15" },
  { code: "A150" },
  { code: "A19" },
  { code: "A191" },
  { code: "A20" },
  { code: "E11" },
  { code: "E110" },
  { code: "N18" },
  { code: "N180" },
];


test("exact, prefix, and inclusive range selectors resolve tracked graph points", () => {
  assert.deepEqual(resolveIcdIndices(data, { type: "exact", code: "E11" }), [6]);
  assert.deepEqual(resolveIcdIndices(data, { type: "prefix", prefix: "N18" }), [8, 9]);
  assert.deepEqual(
    resolveIcdIndices(data, { type: "range", start: "A15", end: "A19" }),
    [1, 2, 3, 4],
  );
  assert.throws(
    () => resolveIcdIndices(data, { type: "nearest", code: "E11" }),
    /unsupported ICD selector/,
  );
});


test("ICD interaction highlights, explains, and jumps without patient data", async () => {
  const calls = [];
  const renderer = {
    drawHighlighted: async (indices) => calls.push(["highlight", indices]),
    zoomToPoints: async (indices, options) => calls.push(["zoom", indices, options]),
  };
  const interaction = createIcdInteraction({ data, renderer, reducedMotion: false });
  const request = {
    type: "icd_keyword_match",
    display_label: "Tuberculosis",
    selector_label: "A15-A19",
    selector: { type: "range", start: "A15", end: "A19" },
  };

  const result = await interaction.focus(request);

  assert.deepEqual(result, {
    indices: [1, 2, 3, 4],
    explanation: "Tuberculosis · A15-A19 · 4 ICD graph points highlighted. Navigation context only; this does not represent patient history, diagnosis, or clinical similarity.",
  });
  assert.deepEqual(calls, [
    ["highlight", [1, 2, 3, 4]],
    ["zoom", [1, 2, 3, 4], { padding: 0.3, transition: true, transitionDuration: 520 }],
  ]);
});


test("reduced motion jumps directly to the final highlighted state", async () => {
  const calls = [];
  const interaction = createIcdInteraction({
    data,
    reducedMotion: true,
    renderer: {
      drawHighlighted: async () => calls.push("highlight"),
      zoomToPoints: async (_indices, options) => calls.push(options),
    },
  });

  await interaction.focus({
    display_label: "Chronic kidney disease",
    selector_label: "N18*",
    selector: { type: "prefix", prefix: "N18" },
  });

  assert.deepEqual(calls, [
    "highlight",
    { padding: 0.3, transition: false, transitionDuration: 0 },
  ]);
});


test("new ICD requests wait for active renderer work before replacement starts", async () => {
  const calls = [];
  let releaseFirst;
  const queue = createIcdRequestQueue();
  const first = queue.enqueue(async (isCurrent) => {
    calls.push("first-start");
    await new Promise((resolve) => { releaseFirst = resolve; });
    if (isCurrent()) calls.push("first-result");
  });
  await new Promise((resolve) => setTimeout(resolve, 0));
  const second = queue.enqueue(async (isCurrent) => {
    calls.push("second-start");
    if (isCurrent()) calls.push("second-result");
  });
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.deepEqual(calls, ["first-start"]);
  releaseFirst();

  await Promise.all([first, second]);

  assert.deepEqual(calls, [
    "first-start",
    "second-start",
    "second-result",
  ]);
});


test("explicit cancellation suppresses stale results", async () => {
  const calls = [];
  let release;
  const queue = createIcdRequestQueue();
  const active = queue.enqueue(async (isCurrent) => {
    await new Promise((resolve) => { release = resolve; });
    if (isCurrent()) calls.push("stale-result");
  });
  await new Promise((resolve) => setTimeout(resolve, 0));

  const cancelled = queue.cancel();
  release();
  await cancelled;
  await active;

  assert.deepEqual(calls, []);
});


test("a failed request cannot block the replacement request", async () => {
  const calls = [];
  const queue = createIcdRequestQueue();
  const first = queue.enqueue(async () => {
    calls.push("first-start");
    throw new Error("renderer failed");
  });

  const second = queue.enqueue(async (isCurrent) => {
    calls.push("second-start");
    if (isCurrent()) calls.push("second-result");
  });
  await assert.rejects(first, /renderer failed/);
  await second;

  assert.deepEqual(calls, [
    "first-start",
    "second-start",
    "second-result",
  ]);
});


test("rapid replay never calls the renderer concurrently with an active draw", async () => {
  let rendererBusy = false;
  let rendererCorrupted = false;
  let releaseFirst;
  const queue = createIcdRequestQueue();
  const first = queue.enqueue(async () => {
    rendererBusy = true;
    await new Promise((resolve) => { releaseFirst = resolve; });
    rendererBusy = false;
  });
  await new Promise((resolve) => setTimeout(resolve, 0));

  const replay = queue.enqueue(async () => {
    if (rendererBusy) rendererCorrupted = true;
    assert.equal(rendererCorrupted, false);
  });
  releaseFirst();

  await Promise.all([first, replay]);
});

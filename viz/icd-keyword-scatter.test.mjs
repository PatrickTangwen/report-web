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


test("ICD interaction highlights, explains, jumps, and resets without patient data", async () => {
  const calls = [];
  const renderer = {
    drawHighlighted: async (indices) => calls.push(["highlight", indices]),
    drawOverview: async () => calls.push(["overview"]),
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
  await interaction.reset();

  assert.deepEqual(result, {
    indices: [1, 2, 3, 4],
    explanation: "Tuberculosis · A15-A19 · 4 ICD graph points highlighted. Navigation context only; this does not represent patient history, diagnosis, or clinical similarity.",
  });
  assert.deepEqual(calls, [
    ["highlight", [1, 2, 3, 4]],
    ["zoom", [1, 2, 3, 4], { padding: 0.3, transition: true, transitionDuration: 520 }],
    ["overview"],
    ["zoom", [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], { padding: 0.08, transition: true, transitionDuration: 520 }],
  ]);
});


test("reduced motion jumps directly to the final highlighted state", async () => {
  const calls = [];
  const interaction = createIcdInteraction({
    data,
    reducedMotion: true,
    renderer: {
      drawHighlighted: async () => calls.push("highlight"),
      drawOverview: async () => calls.push("overview"),
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


test("new ICD requests interrupt stale motion before the next render starts", async () => {
  const calls = [];
  let releaseFirst;
  let releaseInterrupt;
  const queue = createIcdRequestQueue(() => {
    calls.push("cancel-motion");
    releaseFirst();
    return new Promise((resolve) => { releaseInterrupt = resolve; });
  });
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

  assert.deepEqual(calls, ["first-start", "cancel-motion"]);
  releaseInterrupt();

  await Promise.all([first, second]);

  assert.deepEqual(calls, [
    "first-start",
    "cancel-motion",
    "second-start",
    "second-result",
  ]);
});


test("explicit cancellation interrupts active motion and suppresses stale results", async () => {
  const calls = [];
  let release;
  const queue = createIcdRequestQueue(() => {
    calls.push("cancel-motion");
    release();
  });
  const active = queue.enqueue(async (isCurrent) => {
    await new Promise((resolve) => { release = resolve; });
    if (isCurrent()) calls.push("stale-result");
  });
  await new Promise((resolve) => setTimeout(resolve, 0));

  await queue.cancel();
  await active;

  assert.deepEqual(calls, ["cancel-motion"]);
});


test("a synchronous interruption error cannot block the replacement request", async () => {
  const calls = [];
  let releaseFirst;
  const queue = createIcdRequestQueue(() => {
    calls.push("cancel-error");
    throw new Error("renderer is already stopping");
  });
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

  assert.deepEqual(calls, ["first-start", "cancel-error"]);
  releaseFirst();
  await Promise.all([first, second]);

  assert.deepEqual(calls, [
    "first-start",
    "cancel-error",
    "second-start",
    "second-result",
  ]);
});

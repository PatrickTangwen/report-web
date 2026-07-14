import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

import {
  bindWalkthroughControls,
  classifyDisplayRegions,
  createRendererQueue,
  createRegionNavigator,
  createRunController,
  layoutForRequest,
  normalizePoints,
  regionOutlinePercentages,
  resolveReferenceIndices,
  walkthroughCopy,
  walkthroughFocusIndices,
  walkthroughPlan,
} from "./embedding-scatter.js";

const require = createRequire(import.meta.url);
const demo = require("../chatbot/embedding-demo.js");


test("normalization preserves aspect ratio inside WebGL coordinates", () => {
  const points = normalizePoints([
    { tsne_x: 0, tsne_y: 0 },
    { tsne_x: 10, tsne_y: 5 },
  ]);

  assert.deepEqual(points, [
    { x: -0.95, y: -0.475 },
    { x: 0.95, y: 0.475 },
  ]);
});


test("visual references resolve exactly and never fall back to row position", () => {
  const data = [
    { visual_reference_id: "vr_a" },
    { visual_reference_id: "vr_b" },
    { visual_reference_id: "vr_c" },
  ];

  assert.deepEqual(resolveReferenceIndices(data, ["vr_c", "vr_a"]), [2, 0]);
  assert.throws(
    () => resolveReferenceIndices(data, ["vr_missing"]),
    /outside the active dataset release/,
  );
});


test("reduced motion skips staged motion and renders the final state", () => {
  assert.deepEqual(walkthroughPlan(true), ["highlight", "zoom", "callout"]);
  assert.deepEqual(walkthroughPlan(false), [
    "overview",
    "dim",
    "highlight",
    "zoom",
    "callout",
  ]);
});


test("overview presets keep the full embedding while compact presets focus", () => {
  const all = [0, 1, 2, 3];
  const selected = [1, 3];
  assert.equal(walkthroughFocusIndices("overview", all, selected), all);
  assert.equal(walkthroughFocusIndices("compact", all, selected), selected);
});


function displayPoint(id, x, y, disease = "MASH") {
  return {
    visual_reference_id: id,
    disease,
    tsne_x: x,
    tsne_y: y,
  };
}


test("matched layout distinguishes compact, multi-region, and dispersed selections", () => {
  const compactCluster = Array.from({ length: 7 }, (_, index) =>
    displayPoint(`compact_${index}`, index * 0.01, 0),
  );
  const secondCluster = Array.from({ length: 7 }, (_, index) =>
    displayPoint(`second_${index}`, 10 + index * 0.01, 10),
  );
  const dispersedSupport = Array.from({ length: 5 }, (_, cluster) =>
    Array.from({ length: 6 }, (_, index) =>
      displayPoint(`support_${cluster}_${index}`, cluster * 20 + index * 0.01, 30),
    ),
  ).flat();
  const dispersedIds = dispersedSupport
    .filter((_, index) => index % 6 === 0)
    .map((point) => point.visual_reference_id);

  const compact = classifyDisplayRegions(
    [...compactCluster, ...secondCluster],
    compactCluster.slice(0, 5).map((point) => point.visual_reference_id),
    5,
  );
  const multi = classifyDisplayRegions(
    [...compactCluster, ...secondCluster],
    [
      ...compactCluster.slice(0, 5),
      ...secondCluster.slice(0, 5),
    ].map((point) => point.visual_reference_id),
    5,
  );
  const dispersed = classifyDisplayRegions(dispersedSupport, dispersedIds, 5);

  assert.equal(compact.mode, "compact");
  assert.deepEqual(compact.regions.map((region) => region.length), [5]);
  assert.equal(multi.mode, "multi_region");
  assert.deepEqual(multi.regions.map((region) => region.length), [5, 5]);
  assert.equal(dispersed.mode, "overview");
  assert.deepEqual(dispersed.regions, []);
});


test("a locally connected chain remains a dispersed overview", () => {
  const chain = [0, 1, 2, 3, 4].map((x) => displayPoint(`chain_${x}`, x, 0));
  const layout = classifyDisplayRegions(
    chain,
    chain.slice(0, 4).map((point) => point.visual_reference_id),
    2,
  );

  assert.equal(layout.mode, "overview");
  assert.deepEqual(layout.regions, []);
});


test("multi-region preset rejects missing or contradictory geometry", () => {
  const first = Array.from({ length: 7 }, (_, index) =>
    displayPoint(`first_${index}`, index * 0.01, 0),
  );
  const second = Array.from({ length: 7 }, (_, index) =>
    displayPoint(`second_${index}`, 10 + index * 0.01, 10),
  );
  const data = [...first, ...second];
  const visualReferenceIds = [
    ...first.slice(0, 5),
    ...second.slice(0, 5),
  ].map((point) => point.visual_reference_id);
  const indices = resolveReferenceIndices(data, visualReferenceIds);

  assert.throws(
    () => layoutForRequest(data, {
      type: "preset_selection",
      display_mode: "multi_region",
      visual_reference_ids: visualReferenceIds,
    }, indices),
    /missing its geometry contract/,
  );
  assert.equal(layoutForRequest(data, {
    type: "preset_selection",
    display_mode: "multi_region",
    minimum_region_size: 5,
    visual_reference_ids: visualReferenceIds,
  }, indices).mode, "multi_region");
});


test("region navigator exposes bounded Back and Next states", () => {
  const navigator = createRegionNavigator([[1, 2, 3, 4, 5], [8, 9, 10, 11, 12]]);

  assert.deepEqual(navigator.state(), {
    index: 0,
    count: 2,
    region: [1, 2, 3, 4, 5],
    canBack: false,
    canNext: true,
  });
  navigator.next();
  assert.equal(navigator.state().index, 1);
  assert.equal(navigator.state().canNext, false);
  navigator.next();
  assert.equal(navigator.state().index, 1);
  navigator.back();
  assert.equal(navigator.state().index, 0);
});


test("multi-region overview exposes one numbered outline per display region", () => {
  const outlines = regionOutlinePercentages(
    [
      { x: -0.8, y: 0.7 },
      { x: -0.7, y: 0.6 },
      { x: 0.6, y: -0.5 },
      { x: 0.8, y: -0.7 },
    ],
    [[0, 1], [2, 3]],
  );

  assert.deepEqual(outlines.map((outline) => outline.label), ["1", "2"]);
  assert.equal(outlines.every((outline) =>
    outline.left >= 0 && outline.top >= 0 &&
    outline.left + outline.width <= 100 &&
    outline.top + outline.height <= 100), true);
});


test("run controller deterministically cancels an active animation", () => {
  const controller = createRunController();
  const first = controller.start();
  assert.equal(controller.isCurrent(first), true);

  controller.cancel();

  assert.equal(controller.isCurrent(first), false);
  const second = controller.start();
  assert.equal(controller.isCurrent(second), true);
});


test("renderer queue applies the neutral reset after an in-flight stale write", async () => {
  const queue = createRendererQueue();
  const writes = [];
  let releaseStale;
  let markStarted;
  const started = new Promise((resolve) => {
    markStarted = resolve;
  });
  const stale = queue.run(() => new Promise((resolve) => {
    releaseStale = () => {
      writes.push("stale highlight");
      resolve();
    };
    markStarted();
  }));
  const neutral = queue.run(() => {
    writes.push("neutral overview");
  });

  await started;
  releaseStale();
  await Promise.all([stale, neutral]);
  assert.deepEqual(writes, ["stale highlight", "neutral overview"]);
});


test("production control binding routes play, replay, and reset", () => {
  const playButton = new EventTarget();
  const replayButton = new EventTarget();
  const resetButton = new EventTarget();
  const request = { preset_id: "display-preset" };
  const calls = [];
  const disconnect = bindWalkthroughControls({
    playButton,
    replayButton,
    resetButton,
    getRequest: () => request,
    play: (value) => calls.push(["play", value]),
    reset: () => calls.push(["reset"]),
  });

  playButton.dispatchEvent(new Event("click"));
  replayButton.dispatchEvent(new Event("click"));
  resetButton.dispatchEvent(new Event("click"));
  disconnect();
  replayButton.dispatchEvent(new Event("click"));

  assert.deepEqual(calls, [
    ["play", request],
    ["play", request],
    ["reset"],
  ]);
});


test("walkthrough copy distinguishes a live match from a fixed preset", () => {
  assert.deepEqual(
    walkthroughCopy({ type: "matched_reference_neighborhood" }),
    {
      kicker: "Matched reference neighborhood",
      pointNoun: "matched reference points",
      note: "Research cohort comparison only; no query patient is embedded and no diagnosis, prognosis, or personal outcome is inferred.",
    },
  );
  assert.equal(
    walkthroughCopy({ type: "preset_selection" }).kicker,
    "Preset reference selection",
  );
});


test("live match crosses session request boundary and focuses exact graph references", () => {
  const values = new Map();
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
  const result = {
    dataset_version: "fibrotic-test-release",
    cohort_comparison_result: {
      status: "matched_reference_neighborhood",
      target: "MASH",
      minimum_display_region_size: 5,
    },
    visual_reference_ids: ["vr_match_two", "vr_match_one"],
    aggregate_callout_data: {
      reference_count: 2,
      title: "Matched reference neighborhood",
      description: "Aggregate context.",
      domains: [],
    },
  };
  const data = [
    { visual_reference_id: "vr_other" },
    { visual_reference_id: "vr_match_one" },
    { visual_reference_id: "vr_match_two" },
  ];

  demo.saveRequest(
    storage,
    demo.createMatchedRequest(result, "2026-07-13T12:00:00Z"),
  );
  const consumed = demo.consumeRequest(storage, "fibrotic-test-release");
  const selected = resolveReferenceIndices(
    data,
    consumed.request.visual_reference_ids,
  );

  assert.equal(consumed.should_play, true);
  assert.equal(consumed.request.display_mode, "matched_selection");
  assert.deepEqual(selected, [2, 1]);
  assert.deepEqual(
    walkthroughFocusIndices("matched_selection", [0, 1, 2], selected),
    [2, 1],
  );
});

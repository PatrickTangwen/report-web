import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

import {
  bindWalkthroughControls,
  createRunController,
  normalizePoints,
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


test("run controller deterministically cancels an active animation", () => {
  const controller = createRunController();
  const first = controller.start();
  assert.equal(controller.isCurrent(first), true);

  controller.cancel();

  assert.equal(controller.isCurrent(first), false);
  const second = controller.start();
  assert.equal(controller.isCurrent(second), true);
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

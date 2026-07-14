import assert from "node:assert/strict";
import test from "node:test";

import {
  bindWalkthroughControls,
  createRunController,
  normalizePoints,
  resolveReferenceIndices,
  walkthroughFocusIndices,
  walkthroughPlan,
} from "./embedding-scatter.js";


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

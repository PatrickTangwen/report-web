import assert from "node:assert/strict";
import test from "node:test";

import {
  createHighlightController,
  highlightOpacity,
} from "./chart-highlighting.js";


test("hover previews a group and restores the pinned selection on leave", () => {
  const states = [];
  const controller = createHighlightController(
    ["model-a", "model-b"],
    (active) => states.push(active),
  );

  controller.toggle("model-a");
  controller.hover("model-b");
  controller.leave("model-b");

  assert.deepEqual(states, ["model-a", "model-b", "model-a"]);
  assert.equal(controller.active(), "model-a");
});


test("clicking the pinned group again clears the highlight", () => {
  const states = [];
  const controller = createHighlightController(
    ["one", "two"],
    (active) => states.push(active),
  );

  controller.toggle("one");
  controller.toggle("one");

  assert.deepEqual(states, ["one", null]);
  assert.equal(controller.active(), null);
});


test("unknown groups are rejected instead of silently highlighting the wrong data", () => {
  const controller = createHighlightController(["known"], () => {});

  assert.throws(() => controller.hover("missing"), /Unknown highlight group/);
  assert.throws(() => controller.toggle("missing"), /Unknown highlight group/);
});


test("opacity keeps the active group fully visible and dims only peers", () => {
  assert.equal(highlightOpacity("active", "active"), 1);
  assert.equal(highlightOpacity("other", "active"), 0.16);
  assert.equal(highlightOpacity("other", null), 1);
  assert.equal(highlightOpacity("other", "active", 0.25), 0.25);
});

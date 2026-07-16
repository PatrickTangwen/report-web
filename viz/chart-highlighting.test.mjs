import assert from "node:assert/strict";
import test from "node:test";

import {
  bindHighlightGroups,
  createHighlightController,
  highlightOpacity,
} from "./chart-highlighting.js";


class FakeElement extends EventTarget {
  constructor() {
    super();
    this.style = {};
    this.attributes = new Map();
    const classes = new Set();
    this.classList = {
      contains: (name) => classes.has(name),
      toggle: (name, enabled) => enabled ? classes.add(name) : classes.delete(name),
    };
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }
}


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


test("programmatic selection pins a group without walkthrough state", () => {
  const states = [];
  const controller = createHighlightController(
    ["CKD", "MASH"],
    (active) => states.push(active),
  );

  controller.select("MASH");

  assert.deepEqual(states, ["MASH"]);
  assert.equal(controller.pinned(), "MASH");
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


test("shared DOM binding previews, pins, and clears the same group", () => {
  const firstTarget = new FakeElement();
  const secondTarget = new FakeElement();
  const firstAction = new FakeElement();
  const secondAction = new FakeElement();
  const controller = bindHighlightGroups({
    groupKeys: ["first", "second"],
    targetsByGroup: new Map([
      ["first", [firstTarget]],
      ["second", [secondTarget]],
    ]),
    actionsByGroup: new Map([
      ["first", firstAction],
      ["second", secondAction],
    ]),
    labelForGroup: (group) => `Highlight ${group}`,
  });

  firstAction.dispatchEvent(new Event("pointerenter"));
  assert.equal(firstTarget.style.opacity, 1);
  assert.equal(secondTarget.style.opacity, 0.16);
  assert.equal(firstAction.classList.contains("is-active"), true);

  firstAction.dispatchEvent(new Event("click", { cancelable: true }));
  firstAction.dispatchEvent(new Event("pointerleave"));
  assert.equal(controller.pinned(), "first");
  assert.equal(firstAction.getAttribute("aria-pressed"), "true");

  const escape = new Event("keydown", { cancelable: true });
  Object.defineProperty(escape, "key", { value: "Escape" });
  firstTarget.dispatchEvent(escape);
  assert.equal(firstTarget.style.opacity, 1);
  assert.equal(secondTarget.style.opacity, 1);
  assert.equal(controller.pinned(), null);
});

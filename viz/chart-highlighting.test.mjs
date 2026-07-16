import assert from "node:assert/strict";
import test from "node:test";

import {
  bindHighlightTarget,
  bindHighlightGroups,
  bindSingleMarkTooltip,
  createHighlightController,
  highlightOpacity,
} from "./chart-highlighting.js";
import { FakeElement } from "./test-dom.mjs";


test("a pinned selection remains active while the pointer crosses other groups", () => {
  const states = [];
  const controller = createHighlightController(
    ["model-a", "model-b"],
    (active) => states.push(active),
  );

  controller.toggle("model-a");
  controller.hover("model-b");
  controller.leave("model-b");

  assert.deepEqual(states, ["model-a"]);
  assert.equal(controller.active(), "model-a");
});


test("persistent targets stay pinned until an explicit clear", () => {
  const states = [];
  const action = new FakeElement();
  const controller = createHighlightController(
    ["CKD"],
    (active) => states.push(active),
  );
  bindHighlightTarget(action, "CKD", controller, { persistent: true });

  action.dispatchEvent(new Event("click", { cancelable: true }));
  action.dispatchEvent(new Event("click", { cancelable: true }));

  assert.equal(controller.pinned(), "CKD");
  assert.deepEqual(states, ["CKD", "CKD"]);
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


test("clicking a hovered pinned target again clears both pinned and hover state", () => {
  const first = new FakeElement();
  const second = new FakeElement();
  const controller = bindHighlightGroups({
    groupKeys: ["first", "second"],
    targetsByGroup: new Map([
      ["first", [first]],
      ["second", [second]],
    ]),
  });

  first.dispatchEvent(new Event("pointerenter"));
  first.dispatchEvent(new Event("click", { cancelable: true }));
  first.dispatchEvent(new Event("pointerleave"));
  first.dispatchEvent(new Event("pointerenter"));
  first.dispatchEvent(new Event("click", { cancelable: true }));

  assert.equal(controller.pinned(), null);
  assert.equal(controller.active(), null);
  assert.equal(first.style.opacity, 1);
  assert.equal(second.style.opacity, 1);
});


test("single-mark tooltip replaces its content and hides when the active mark is left", () => {
  const originalWindow = globalThis.window;
  globalThis.window = { innerWidth: 800, innerHeight: 600 };
  const first = new FakeElement();
  const second = new FakeElement();
  const tooltip = new FakeElement();
  tooltip.offsetWidth = 160;
  tooltip.offsetHeight = 80;

  try {
    bindSingleMarkTooltip(
      [first, second],
      tooltip,
      (index) => index === 0 ? "First component" : "Second component",
    );

    const firstEnter = new Event("mouseenter");
    Object.defineProperties(firstEnter, {
      clientX: { value: 100 },
      clientY: { value: 120 },
    });
    first.dispatchEvent(firstEnter);
    assert.equal(tooltip.innerHTML, "First component");
    assert.equal(tooltip.style.display, "block");

    const secondEnter = new Event("mouseenter");
    Object.defineProperties(secondEnter, {
      clientX: { value: 300 },
      clientY: { value: 320 },
    });
    second.dispatchEvent(secondEnter);
    assert.equal(tooltip.innerHTML, "Second component");
    assert.equal(tooltip.style.display, "block");

    second.dispatchEvent(new Event("mouseleave"));
    assert.equal(tooltip.style.display, "none");
  } finally {
    globalThis.window = originalWindow;
  }
});

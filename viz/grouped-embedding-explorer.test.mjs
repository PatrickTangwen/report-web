import assert from "node:assert/strict";
import test from "node:test";

import {
  createGroupedEmbeddingExplorer,
  groupAssignments,
} from "./grouped-embedding-explorer.js";


class FakeElement extends EventTarget {
  constructor(tagName = "div") {
    super();
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.attributes = new Map();
    this.parentNode = null;
    this.style = {
      removeProperty: (property) => delete this.style[property],
    };
    const classes = new Set();
    this.classList = {
      add: (name) => classes.add(name),
      remove: (name) => classes.delete(name),
      contains: (name) => classes.has(name),
      toggle: (name, enabled) => enabled ? classes.add(name) : classes.delete(name),
    };
  }

  append(...children) {
    children.forEach((child) => this.appendChild(child));
  }

  appendChild(child) {
    this.children.push(child);
    if (child && typeof child === "object") child.parentNode = this;
    return child;
  }

  remove() {
    if (!this.parentNode) return;
    this.parentNode.children = this.parentNode.children.filter((child) => child !== this);
    this.parentNode = null;
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }

  removeAttribute(name) {
    this.attributes.delete(name);
  }

  getBoundingClientRect() {
    return { height: 0, left: 0, right: 1000, top: 0, bottom: 620 };
  }
}


function fakeDocument() {
  return {
    body: new FakeElement("body"),
    documentElement: { clientWidth: 1200, clientHeight: 900 },
    createElement: (tagName) => new FakeElement(tagName),
    createTextNode: (text) => ({ textContent: text }),
    querySelector: () => null,
  };
}


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


test("point hover shows a tooltip without activating its group label", async () => {
  const originalDocument = globalThis.document;
  const subscriptions = new Map();
  const tooltipPoints = [];
  globalThis.document = fakeDocument();

  try {
    const shell = await createGroupedEmbeddingExplorer({
      data: [{ x: 0, y: 0, disease: "CKD" }],
      groups: [{ key: "CKD", label: "Chronic Kidney Disease", color: "#4477aa", indices: [0] }],
      title: "Patient Embeddings",
      subtitle: "Reference cohort",
      width: 1000,
      xField: "x",
      yField: "y",
      pointSize: 3,
      opacity: 0.72,
      createScatterplot: () => ({
        subscribe: (eventName, handler) => subscriptions.set(eventName, handler),
        set() {},
        async draw() {},
        deselect() {},
        select() {},
        async zoomToPoints() {},
      }),
      canvasLabel: () => "One patient embedding point",
      highlightOptions: () => ({ pointSize: [3, 3] }),
      renderTooltip: (_tooltip, point) => tooltipPoints.push(point.disease),
    });

    subscriptions.get("pointover")(0);

    const frame = shell.children[1];
    const tooltip = frame.children[1];
    const legend = shell.children[2];
    const ckdLabel = legend.children[0];
    assert.deepEqual(tooltipPoints, ["CKD"]);
    assert.equal(tooltip.classList.contains("is-visible"), true);
    assert.equal(ckdLabel.classList.contains("is-active"), false);
    assert.equal(ckdLabel.getAttribute("aria-pressed"), "false");
  } finally {
    globalThis.document = originalDocument;
  }
});

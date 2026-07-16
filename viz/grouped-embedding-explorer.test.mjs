import assert from "node:assert/strict";
import test from "node:test";

import {
  createGroupedEmbeddingExplorer,
  groupAssignments,
} from "./grouped-embedding-explorer.js";
import { createEmbeddingScatter } from "./embedding-scatter.js";
import { createPatientEmbeddingExplorer } from "./patient-embedding-explorer.js";
import { createIcdKeywordScatter } from "./icd-keyword-scatter.js";


class FakeElement extends EventTarget {
  constructor(tagName = "div") {
    super();
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.attributes = new Map();
    this.parentNode = null;
    this.rectHeight = 0;
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
    return { height: this.rectHeight, left: 0, right: 1000, top: 0, bottom: 620 };
  }
}


function fakeDocument(options = {}) {
  return {
    body: new FakeElement("body"),
    documentElement: {
      clientWidth: options.clientWidth || 1200,
      clientHeight: options.clientHeight || 900,
    },
    createElement: (tagName) => {
      const element = new FakeElement(tagName);
      if (tagName === "section") element.rectHeight = options.shellHeight || 0;
      return element;
    },
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
      tooltipLabel: (point, group) => {
        tooltipPoints.push(point.disease);
        return group.label;
      },
    });

    subscriptions.get("pointover")(0);

    const frame = shell.children[1];
    const tooltip = frame.children[1];
    const legend = shell.children[2];
    const ckdLabel = legend.children[0];
    assert.deepEqual(tooltipPoints, ["CKD"]);
    assert.equal(tooltip.textContent, "Chronic Kidney Disease");
    assert.equal(tooltip.classList.contains("is-visible"), true);
    assert.equal(ckdLabel.classList.contains("is-active"), false);
    assert.equal(ckdLabel.getAttribute("aria-pressed"), "false");
  } finally {
    globalThis.document = originalDocument;
  }
});


test("fibrotic embedding does not register point-hover tooltips", async () => {
  const originalDocument = globalThis.document;
  const subscriptions = new Map();
  globalThis.document = fakeDocument();

  try {
    const shell = await createEmbeddingScatter({
      data: [{ tsne_x: 0, tsne_y: 0, disease: "CKD", group: "pure" }],
      colors: ["#4477aa"],
      displayName: (value) => value,
      datasetVersion: "test-release",
      createScatterplot: () => ({
        subscribe: (eventName, handler) => subscriptions.set(eventName, handler),
        set() {},
        async draw() {},
        deselect() {},
        select() {},
        async zoomToPoints() {},
      }),
    });

    const frame = shell.children[1];
    assert.equal(subscriptions.has("pointover"), false);
    assert.equal(subscriptions.has("pointout"), false);
    assert.equal(subscriptions.has("select"), true);
    assert.equal(frame.children.length, 1);
  } finally {
    globalThis.document = originalDocument;
  }
});


test("sex and age point hover shows only the group label without activating it", async () => {
  const originalDocument = globalThis.document;
  const subscriptions = new Map();
  globalThis.document = fakeDocument();

  try {
    const shell = await createPatientEmbeddingExplorer({
      data: [{ umap_1: 0, umap_2: 0, sex_male: 0 }],
      xField: "umap_1",
      yField: "umap_2",
      title: "Patient Embeddings — Coloured by Sex",
      subtitle: "UMAP view",
      groups: [{ label: "Female", color: "#e07b39", indices: [0] }],
      createScatterplot: () => ({
        subscribe: (eventName, handler) => subscriptions.set(eventName, handler),
        set() {},
        async draw() {},
        deselect() {},
        select() {},
        async zoomToPoints() {},
      }),
    });

    subscriptions.get("pointover")(0);

    const frame = shell.children[1];
    const tooltip = frame.children[1];
    const femaleLabel = shell.children[2].children[0];
    assert.equal(tooltip.textContent, "Female");
    assert.equal(tooltip.classList.contains("is-visible"), true);
    assert.equal(femaleLabel.classList.contains("is-active"), false);
    assert.equal(femaleLabel.getAttribute("aria-pressed"), "false");

    subscriptions.get("pointout")();
    assert.equal(tooltip.classList.contains("is-visible"), false);

    subscriptions.get("select")({ points: [0] });
    assert.equal(femaleLabel.classList.contains("is-active"), true);
    assert.equal(femaleLabel.getAttribute("aria-pressed"), "true");
  } finally {
    globalThis.document = originalDocument;
  }
});


test("ICD embedding shares the fibrotic viewport and interactions while preserving search", async () => {
  const originalDocument = globalThis.document;
  const originalWindow = globalThis.window;
  const documentLike = fakeDocument({ clientHeight: 720, shellHeight: 130 });
  const documentEvents = new EventTarget();
  documentLike.addEventListener = documentEvents.addEventListener.bind(documentEvents);
  documentLike.removeEventListener = documentEvents.removeEventListener.bind(documentEvents);
  documentLike.hidden = false;
  const windowEvents = new EventTarget();
  globalThis.document = documentLike;
  globalThis.window = {
    addEventListener: windowEvents.addEventListener.bind(windowEvents),
    removeEventListener: windowEvents.removeEventListener.bind(windowEvents),
    matchMedia: () => ({ matches: false }),
    setTimeout,
  };

  const fibroticSubscriptions = new Map();
  const icdSubscriptions = new Map();
  const fibroticRendererConfigs = [];
  const icdRendererConfigs = [];
  const icdDraws = [];
  const scatterplot = (subscriptions, configs, draws = []) => (config) => {
    configs.push(config);
    return {
      subscribe: (eventName, handler) => subscriptions.set(eventName, handler),
      set() {},
      draw: async (columns) => draws.push(columns),
      deselect() {},
      select() {},
      async zoomToPoints() {},
    };
  };

  try {
    const fibroticShell = await createEmbeddingScatter({
      data: [{ tsne_x: 0, tsne_y: 0, disease: "CKD" }],
      colors: ["#4477aa"],
      displayName: (value) => value,
      datasetVersion: "test-release",
      createScatterplot: scatterplot(fibroticSubscriptions, fibroticRendererConfigs),
    });
    const shell = await createIcdKeywordScatter({
      data: [
        { umap_1: 0, umap_2: 0, code: "N18", chapter: "Genitourinary" },
        { umap_1: 1, umap_2: 1, code: "E11", chapter: "Endocrine" },
      ],
      colors: ["#1f77b4", "#ff7f0e"],
      searchQuery: "N18",
      createScatterplot: scatterplot(icdSubscriptions, icdRendererConfigs, icdDraws),
    });

    assert.deepEqual(
      { width: icdRendererConfigs[0].width, height: icdRendererConfigs[0].height },
      { width: fibroticRendererConfigs[0].width, height: fibroticRendererConfigs[0].height },
    );
    assert.equal(icdSubscriptions.has("select"), true);
    assert.equal(icdSubscriptions.has("pointover"), true);
    assert.equal(shell.children.length, fibroticShell.children.length);
    assert.deepEqual(icdDraws.at(-1).z, [1, 0]);

    icdSubscriptions.get("pointover")(0);
    const icdTooltip = shell.children[1].children[1];
    const genitourinaryLabel = shell.children[2].children[0];
    assert.equal(shell.children[2].children.length, 2);
    assert.equal(genitourinaryLabel.children[1].textContent, "Genitourinary (1)");
    assert.equal(icdTooltip.textContent, "Genitourinary (1)");
    assert.equal(icdTooltip.classList.contains("is-visible"), true);
    assert.equal(genitourinaryLabel.classList.contains("is-active"), false);
    assert.equal(genitourinaryLabel.getAttribute("aria-pressed"), "false");

    icdSubscriptions.get("select")({ points: [0] });
    assert.equal(genitourinaryLabel.classList.contains("is-active"), true);
    assert.equal(genitourinaryLabel.getAttribute("aria-pressed"), "true");

    const resetButton = shell.children[0].children[1].children[1];
    resetButton.dispatchEvent(new Event("click"));
    assert.equal(genitourinaryLabel.classList.contains("is-active"), false);
    assert.equal(genitourinaryLabel.getAttribute("aria-pressed"), "false");
  } finally {
    globalThis.document = originalDocument;
    globalThis.window = originalWindow;
  }
});

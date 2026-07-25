import assert from "node:assert/strict";
import test from "node:test";

import {
  createGroupedEmbeddingExplorer,
  groupAssignments,
} from "./grouped-embedding-explorer.js";
import { createEmbeddingScatter } from "./embedding-scatter.js";
import { createPatientEmbeddingExplorer } from "./patient-embedding-explorer.js";
import { createIcdKeywordScatter } from "./icd-keyword-scatter.js";
import { FakeElement, FakeMutationObserver, fakeDocument } from "./test-dom.mjs";


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
        get: () => 1,
        async zoomToLocation() {},
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
        get: () => 1,
        async zoomToLocation() {},
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
        get: () => 1,
        async zoomToLocation() {},
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


test("choosing an ICD chapter frames it and a picked code keeps its own colour", async () => {
  const originalDocument = globalThis.document;
  const originalWindow = globalThis.window;
  const originalObserver = globalThis.MutationObserver;
  const documentLike = fakeDocument({ clientHeight: 720, shellHeight: 130 });
  const documentEvents = new EventTarget();
  documentLike.addEventListener = documentEvents.addEventListener.bind(documentEvents);
  documentLike.removeEventListener = documentEvents.removeEventListener.bind(documentEvents);
  documentLike.hidden = false;
  const windowEvents = new EventTarget();
  globalThis.document = documentLike;
  globalThis.MutationObserver = FakeMutationObserver;
  globalThis.window = {
    addEventListener: windowEvents.addEventListener.bind(windowEvents),
    removeEventListener: windowEvents.removeEventListener.bind(windowEvents),
    matchMedia: () => ({ matches: false }),
    setTimeout,
  };
  const flush = async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
    await new Promise((resolve) => setTimeout(resolve, 0));
  };

  const subscriptions = new Map();
  const sets = [];
  const draws = [];
  const zooms = [];
  let cameraDistance = 2;

  try {
    const shell = await createIcdKeywordScatter({
      data: [
        { umap_1: 0, umap_2: 0, code: "N18", chapter: "Genitourinary" },
        { umap_1: 1, umap_2: 1, code: "E11", chapter: "Endocrine" },
        { umap_1: 2, umap_2: 0, code: "E110", chapter: "Endocrine" },
      ],
      reference: [
        { code: "N18", label: "N18", description: "Chronic kidney disease", parent: "", kind: "category", in_plot: "1" },
        { code: "E11", label: "E11", description: "Type 2 diabetes mellitus", parent: "", kind: "category", in_plot: "1" },
        { code: "E110", label: "E11.0", description: "With coma", parent: "E11", kind: "subcategory", in_plot: "1" },
      ],
      colors: ["#1f77b4", "#ff7f0e"],
      createScatterplot: () => ({
        subscribe: (eventName, handler) => subscriptions.set(eventName, handler),
        set: (options) => sets.push(options),
        draw: async (columns) => draws.push(columns),
        deselect() {},
        select() {},
        get: (property) => (property === "cameraDistance" ? cameraDistance : undefined),
        zoomToLocation: async (target, distance, options) => {
          cameraDistance = distance;
          zooms.push({ target, distance, options });
        },
      }),
    });
    const themeObserver = FakeMutationObserver.instances.at(-1);

    const endocrineLabel = shell.children[2].children[1];
    endocrineLabel.dispatchEvent(new Event("click"));
    await flush();

    // Every other code stays drawn, faintly, so zooming out still places the
    // chapter inside the full map. The picked code carries the plain point size:
    // colour alone marks it.
    assert.deepEqual(draws.at(-1).z, [0, 1, 1]);
    assert.deepEqual(sets.at(-1).pointColor, ["#aeb7c2", "#ff7f0e", "#1b2430"]);
    assert.deepEqual(sets.at(-1).opacity, [0.1, 1, 1]);
    assert.deepEqual(sets.at(-1).pointSize, [2.5, 3, 3]);
    // The two Endocrine points span 0.95 in both directions, so the chapter is
    // framed at half that plus the 0.25 padding, centred between them.
    assert.deepEqual(zooms.at(-1).target, [0.475, 0]);
    assert.equal(Number(zooms.at(-1).distance.toFixed(6)), 0.59375);
    assert.deepEqual(zooms.at(-1).options.transitionDuration, 520);

    const chapterDistance = zooms.at(-1).distance;
    const zoomCount = zooms.length;
    subscriptions.get("select")({ points: [1] });
    await flush();

    // The picked point moves to its own colour class, and the camera stays
    // wherever the visitor left it.
    assert.deepEqual(draws.at(-1).z, [0, 2, 1]);
    assert.equal(zooms.length, zoomCount);

    // Picking a row in the pinned hierarchy panel marks that code the same way,
    // keeps the rest of the chapter coloured, and centres on the code without
    // changing the scale the visitor is reading.
    const panel = shell.children[1].children[2];
    const childRow = panel.children[1].children[1].children[0];
    assert.equal(childRow.children[0].textContent, "E11.0");
    childRow.dispatchEvent(new Event("click"));
    await flush();

    assert.deepEqual(draws.at(-1).z, [0, 1, 2]);
    assert.deepEqual(zooms.at(-1).target, [0.95, -0.475]);
    assert.equal(zooms.at(-1).distance, chapterDistance);
    assert.match(
      shell.children[0].children[1].children[2].textContent,
      /^E11\.0 With coma · 1 ICD graph point marked inside Endocrine \(2\)\./,
    );

    // The picked colour is the one colour that tracks the site theme.
    documentLike.body.classList.add("quarto-dark");
    themeObserver.trigger();
    await flush();
    assert.deepEqual(sets.at(-1).pointColor, ["#aeb7c2", "#ff7f0e", "#f1f5f9"]);
    assert.deepEqual(draws.at(-1).z, [0, 1, 2]);
    documentLike.body.classList.remove("quarto-dark");

    // Choosing another chapter from the legend closes the panel and drops the
    // pick, so the plot goes back to showing the chosen group.
    assert.equal(panel.classList.contains("is-visible"), true);
    const genitourinaryLabel = shell.children[2].children[0];
    genitourinaryLabel.dispatchEvent(new Event("click"));
    await flush();

    assert.equal(panel.classList.contains("is-visible"), false);
    assert.deepEqual(draws.at(-1).z, [1, 0, 0]);
    assert.deepEqual(sets.at(-1).pointColor, ["#aeb7c2", "#1f77b4", "#1b2430"]);
    assert.deepEqual(zooms.at(-1).target, [-0.95, -0.475]);
  } finally {
    globalThis.document = originalDocument;
    globalThis.window = originalWindow;
    globalThis.MutationObserver = originalObserver;
  }
});


test("ICD embedding shares the fibrotic viewport and interactions while preserving search", async () => {
  const originalDocument = globalThis.document;
  const originalWindow = globalThis.window;
  const originalObserver = globalThis.MutationObserver;
  const documentLike = fakeDocument({ clientHeight: 720, shellHeight: 130 });
  const documentEvents = new EventTarget();
  documentLike.addEventListener = documentEvents.addEventListener.bind(documentEvents);
  documentLike.removeEventListener = documentEvents.removeEventListener.bind(documentEvents);
  documentLike.hidden = false;
  const windowEvents = new EventTarget();
  globalThis.document = documentLike;
  globalThis.MutationObserver = FakeMutationObserver;
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
      get: () => 1,
      async zoomToLocation() {},
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
      reference: [
        { code: "N17-N19", label: "N17-N19", description: "Acute kidney failure and chronic kidney disease", parent: "", kind: "block", in_plot: "0" },
        { code: "N18", label: "N18", description: "Chronic kidney disease", parent: "N17-N19", kind: "category", in_plot: "1" },
        { code: "E11", label: "E11", description: "Type 2 diabetes mellitus", parent: "", kind: "category", in_plot: "1" },
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

    // Hovering a point is the tooltip's job alone: the panel stays shut.
    icdSubscriptions.get("pointover")(0);
    const icdTooltip = shell.children[1].children[1];
    const icdPanel = shell.children[1].children[2];
    const genitourinaryLabel = shell.children[2].children[0];
    assert.equal(shell.children[2].children.length, 2);
    assert.equal(genitourinaryLabel.children[1].textContent, "Genitourinary (1)");
    assert.equal(icdTooltip.textContent, "N18 · Chronic kidney disease\nGenitourinary (1)");
    assert.equal(icdTooltip.classList.contains("is-visible"), true);
    assert.equal(icdPanel.classList.contains("is-visible"), false);
    assert.equal(genitourinaryLabel.classList.contains("is-active"), false);
    assert.equal(genitourinaryLabel.getAttribute("aria-pressed"), "false");

    // Clicking one opens it.
    icdSubscriptions.get("select")({ points: [0] });
    assert.equal(genitourinaryLabel.classList.contains("is-active"), true);
    assert.equal(genitourinaryLabel.getAttribute("aria-pressed"), "true");
    assert.equal(icdPanel.classList.contains("is-visible"), true);
    assert.equal(icdPanel.children[0].children[1].textContent, "ICD-10 codes N18-*");

    // Hovering another point still refreshes the tooltip and leaves the open
    // panel's rows where the visitor is about to click them.
    icdSubscriptions.get("pointover")(1);
    assert.equal(icdTooltip.textContent, "E11 · Type 2 diabetes mellitus\nEndocrine (1)");
    assert.equal(icdPanel.children[0].children[1].textContent, "ICD-10 codes N18-*");

    const resetButton = shell.children[0].children[1].children[1];
    resetButton.dispatchEvent(new Event("click"));
    assert.equal(genitourinaryLabel.classList.contains("is-active"), false);
    assert.equal(genitourinaryLabel.getAttribute("aria-pressed"), "false");
    assert.equal(icdPanel.classList.contains("is-visible"), false);
  } finally {
    globalThis.document = originalDocument;
    globalThis.window = originalWindow;
    globalThis.MutationObserver = originalObserver;
  }
});

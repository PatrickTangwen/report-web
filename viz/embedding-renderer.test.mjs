import assert from "node:assert/strict";
import test from "node:test";

import {
  cameraDistanceFor,
  createEmbeddingRenderer,
  createRendererQueue,
  fitEmbeddingDimensions,
  fitEmbeddingWidth,
  normalizeCoordinates,
  pointBounds,
} from "./embedding-renderer.js";


test("renderer queue applies the latest state after in-flight work", async () => {
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
  const latest = queue.run(() => {
    writes.push("latest group");
  });

  await started;
  releaseStale();
  await Promise.all([stale, latest]);
  assert.deepEqual(writes, ["stale highlight", "latest group"]);
});


test("shared coordinate normalization preserves aspect ratio for every embedding", () => {
  assert.deepEqual(
    normalizeCoordinates(
      [
        { left: 10, top: 0 },
        { left: 30, top: 10 },
      ],
      "left",
      "top",
    ),
    [
      { x: -0.95, y: -0.475 },
      { x: 0.95, y: 0.475 },
    ],
  );
});


test("shared embedding width respects content, viewport, and minimum bounds", () => {
  function documentAt(mainWidth, viewportWidth) {
    return {
      documentElement: { clientWidth: viewportWidth },
      querySelector: (selector) => (
        selector === "main.content" ? { clientWidth: mainWidth } : null
      ),
    };
  }

  assert.equal(fitEmbeddingWidth(1000, documentAt(900, 1200)), 900);
  assert.equal(fitEmbeddingWidth(1000, documentAt(1200, 700)), 668);
  assert.equal(fitEmbeddingWidth(1000, documentAt(200, 300)), 320);
});


test("embedding dimensions use measured navigation and component chrome", () => {
  function documentAt(mainWidth, viewportWidth, viewportHeight, navigationHeight) {
    return {
      documentElement: {
        clientWidth: viewportWidth,
        clientHeight: viewportHeight,
      },
      querySelector: (selector) => {
        if (selector === "main.content") return { clientWidth: mainWidth };
        if (selector === "#quarto-header") {
          return { getBoundingClientRect: () => ({ height: navigationHeight }) };
        }
        return null;
      },
    };
  }

  assert.deepEqual(
    fitEmbeddingDimensions(1000, 130, documentAt(1100, 1280, 720, 58)),
    { width: 858, height: 532 },
  );
  assert.deepEqual(
    fitEmbeddingDimensions(1000, 130, documentAt(1100, 1680, 1200, 58)),
    { width: 1000, height: 620 },
  );
  assert.deepEqual(
    fitEmbeddingDimensions(1000, 130, documentAt(300, 360, 600, 58)),
    { width: 320, height: 198 },
  );
});


test("point bounds carry the centre and the extent of the chosen points", () => {
  const points = [
    { x: -1, y: 0.5 },
    { x: 0.2, y: -0.3 },
    { x: 0.6, y: 0.1 },
  ];

  assert.deepEqual(pointBounds(points, [1, 2]), {
    x: 0.4,
    y: -0.09999999999999999,
    width: 0.39999999999999997,
    height: 0.4,
  });
  assert.deepEqual(pointBounds(points, [2]), { x: 0.6, y: 0.1, width: 0, height: 0 });
  assert.throws(() => pointBounds(points, []), /empty set of embedding points/);
});


test("wide bounds are framed at the distance the view actually needs", () => {
  // The XXI Health Status chapter: wider than it is tall, which is the case
  // regl-scatterplot's own `zoomToPoints` frames about twice too close.
  const bounds = { x: 0, y: 0, width: 1.317, height: 0.532 };
  const aspectRatio = 907 / 562;
  const fieldOfView = 2 * Math.atan(1);
  const libraryDistance =
    bounds.width / 2 / Math.tan((fieldOfView * aspectRatio) / 2);
  const distance = cameraDistanceFor(bounds, aspectRatio);

  assert.ok(distance > libraryDistance * 1.9, "the library framed twice too close");
  // The view spans 2 * distance vertically and 2 * distance * aspect across, so
  // both edges of the bounds have to land inside it.
  assert.ok(2 * distance * aspectRatio >= bounds.width);
  assert.ok(2 * distance >= bounds.height);

  // Taller than wide: the vertical fit decides, and padding widens both.
  const tall = { x: 0, y: 0, width: 0.4, height: 1.2 };
  assert.equal(cameraDistanceFor(tall, aspectRatio), 0.6);
  assert.equal(cameraDistanceFor(tall, aspectRatio, 0.25), 0.75);
});


test("shared renderer owns overview, highlight, and zoom", async () => {
  const calls = [];
  const scatterplot = {
    set: (options) => calls.push(["set", options]),
    draw: async (columns, options) => calls.push(["draw", columns, options]),
    select: (indices, options) => calls.push(["select", indices, options]),
    deselect: (options) => calls.push(["deselect", options]),
    get: (property) => (property === "cameraDistance" ? 0.7 : undefined),
    zoomToLocation: async (target, distance, options) => (
      calls.push(["zoom", target, distance, options])
    ),
  };
  const data = [
    { x: 0, y: 0, group: 0 },
    { x: 2, y: 1, group: 1 },
  ];
  const renderer = createEmbeddingRenderer({
    data,
    xField: "x",
    yField: "y",
    zValues: data.map((point) => point.group),
    canvas: {},
    width: 600,
    height: 400,
    pointColor: ["#111", "#222"],
    createScatterplot: () => scatterplot,
  });

  await renderer.drawOverview();
  await renderer.drawHighlighted([1]);
  await renderer.zoomToPoints([1], { transition: true });

  assert.deepEqual(renderer.allIndices, [0, 1]);
  assert.deepEqual(calls, [
    ["set", {
      colorBy: "valueA",
      opacityBy: null,
      sizeBy: null,
      pointColor: ["#111", "#222"],
      opacity: 0.72,
      pointSize: 3,
    }],
    ["draw", { x: [-0.95, 0.95], y: [-0.475, 0.475], z: [0, 1] }, undefined],
    ["deselect", { preventEvent: true }],
    ["set", {
      colorBy: "valueA",
      opacityBy: "valueA",
      sizeBy: "valueA",
      pointColor: ["#aeb7c2", "#1565c0"],
      opacity: [0.14, 1],
      pointSize: [2.5, 8],
    }],
    ["draw", { x: [-0.95, 0.95], y: [-0.475, 0.475], z: [0, 1] }, { preventFilterReset: true }],
    ["select", [1], { preventEvent: true }],
    // One point has no extent, so it is centred at the current camera distance.
    ["zoom", [0.95, 0.475], 0.7, { transition: true }],
  ]);
});


test("class drawing carries more than two point states in one pass", async () => {
  const calls = [];
  const scatterplot = {
    set: (options) => calls.push(["set", options]),
    draw: async (columns, options) => calls.push(["draw", columns, options]),
    select: () => calls.push(["select"]),
  };
  const data = [
    { x: 0, y: 0 },
    { x: 1, y: 1 },
    { x: 2, y: 2 },
  ];
  const renderer = createEmbeddingRenderer({
    data,
    xField: "x",
    yField: "y",
    zValues: [0, 0, 0],
    canvas: {},
    width: 600,
    height: 400,
    pointColor: ["#111"],
    createScatterplot: () => scatterplot,
  });

  await renderer.drawClasses([0, 1, 2], {
    pointColor: ["#aeb7c2", "#ff7f0e", "#ff2d95"],
    opacity: [0.1, 1, 1],
    pointSize: [2.5, 3, 9],
  });

  assert.deepEqual(calls[0][1], {
    colorBy: "valueA",
    opacityBy: "valueA",
    sizeBy: "valueA",
    pointColor: ["#aeb7c2", "#ff7f0e", "#ff2d95"],
    opacity: [0.1, 1, 1],
    pointSize: [2.5, 3, 9],
  });
  assert.deepEqual(calls[1][1].z, [0, 1, 2]);
  assert.deepEqual(calls[1][2], { preventFilterReset: true });
  assert.equal(calls.some(([operation]) => operation === "select"), false);
});


test("group hover can highlight at the normal point size without selection inflation", async () => {
  const calls = [];
  const scatterplot = {
    set: (options) => calls.push(["set", options]),
    draw: async () => calls.push(["draw"]),
    select: () => calls.push(["select"]),
  };
  const data = [
    { x: 0, y: 0, group: 0 },
    { x: 1, y: 1, group: 1 },
  ];
  const renderer = createEmbeddingRenderer({
    data,
    xField: "x",
    yField: "y",
    zValues: [0, 1],
    canvas: {},
    width: 600,
    height: 400,
    pointColor: ["#111", "#222"],
    createScatterplot: () => scatterplot,
  });

  await renderer.drawHighlighted([1], {
    pointColor: ["#aeb7c2", "#222"],
    pointSize: [2.5, 3],
    select: false,
  });

  assert.deepEqual(calls[0][1].pointSize, [2.5, 3]);
  assert.equal(calls.some(([operation]) => operation === "select"), false);
});

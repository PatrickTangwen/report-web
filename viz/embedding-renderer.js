export function normalizeCoordinates(data, xField, yField) {
  const xs = data.map((point) => Number(point[xField]));
  const ys = data.map((point) => Number(point[yField]));
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);
  const xMid = (xMin + xMax) / 2;
  const yMid = (yMin + yMax) / 2;
  const span = Math.max(xMax - xMin, yMax - yMin) || 1;
  return data.map((point) => ({
    x: ((Number(point[xField]) - xMid) / span) * 1.9,
    y: ((Number(point[yField]) - yMid) / span) * 1.9,
  }));
}


export function fitEmbeddingWidth(maxWidth, documentLike = document) {
  const main =
    documentLike.querySelector("main.content") || documentLike.querySelector("main");
  const mainWidth = main?.clientWidth || maxWidth;
  const viewportWidth = documentLike.documentElement.clientWidth - 32;
  return Math.floor(
    Math.min(maxWidth, Math.max(320, Math.min(mainWidth, viewportWidth))),
  );
}


export function fitEmbeddingDimensions(maxWidth, componentChromeHeight, documentLike = document) {
  const aspectRatio = 0.62;
  const widthLimit = fitEmbeddingWidth(maxWidth, documentLike);
  const viewportHeight = Number(documentLike.documentElement.clientHeight) || Infinity;
  const navigation = documentLike.querySelector("#quarto-header");
  const navigationHeight = navigation?.getBoundingClientRect?.().height || 0;
  const heightLimit = viewportHeight - navigationHeight - componentChromeHeight;
  const width = Math.floor(Math.min(widthLimit, heightLimit / aspectRatio));
  const boundedWidth = Math.max(320, width);
  const height = Math.round(boundedWidth * aspectRatio);
  return { width: boundedWidth, height };
}


export function sizeEmbeddingCanvas(shell, canvas, maxWidth = 1000, documentLike = document) {
  const measurementWidth = fitEmbeddingWidth(maxWidth, documentLike);
  shell.style.position = "absolute";
  shell.style.left = "0";
  shell.style.top = "0";
  shell.style.visibility = "hidden";
  shell.style.pointerEvents = "none";
  shell.style.width = `${measurementWidth}px`;
  shell.setAttribute("aria-hidden", "true");
  canvas.hidden = true;
  documentLike.body.appendChild(shell);
  const componentChromeHeight = Math.ceil(shell.getBoundingClientRect().height);
  shell.remove();
  canvas.hidden = false;
  shell.removeAttribute("aria-hidden");
  ["position", "left", "top", "visibility", "pointer-events", "width"]
    .forEach((property) => shell.style.removeProperty(property));

  const dimensions = fitEmbeddingDimensions(
    maxWidth,
    componentChromeHeight,
    documentLike,
  );
  canvas.width = dimensions.width;
  canvas.height = dimensions.height;
  canvas.style.width = `${dimensions.width}px`;
  canvas.style.height = `${dimensions.height}px`;
  return dimensions;
}


export function pointBounds(points, indices) {
  if (!indices.length) {
    throw new Error("Cannot frame an empty set of embedding points");
  }
  let left = Infinity;
  let right = -Infinity;
  let top = Infinity;
  let bottom = -Infinity;
  indices.forEach((index) => {
    const point = points[index];
    left = Math.min(left, point.x);
    right = Math.max(right, point.x);
    top = Math.min(top, point.y);
    bottom = Math.max(bottom, point.y);
  });
  return {
    x: (left + right) / 2,
    y: (top + bottom) / 2,
    width: right - left,
    height: bottom - top,
  };
}


// The camera shows `2 * distance` vertically and `2 * distance * aspectRatio`
// horizontally, so this is the distance at which the bounds just fit.
//
// regl-scatterplot's own `zoomToPoints` derives the distance for wide bounds
// from `width / 2 / tan(fov * aspectRatio / 2)`, which at these canvas
// proportions lands about half the distance the view needs. Bounds wider than
// they are tall — an ICD chapter scattered across the map, for instance — are
// then framed twice too close, centred on the empty space between their own
// clusters. Computing the distance here is what keeps the framing honest.
export function cameraDistanceFor(bounds, aspectRatio, padding = 0) {
  const fit = Math.max(bounds.height / 2, bounds.width / (2 * aspectRatio));
  return fit * (1 + padding);
}


export function createRendererQueue() {
  let tail = Promise.resolve();
  return {
    run(operation) {
      tail = tail.catch(() => {}).then(operation);
      return tail;
    },
  };
}


export function createEmbeddingRenderer(config) {
  const points = normalizeCoordinates(config.data, config.xField, config.yField);
  const allIndices = config.data.map((_, index) => index);
  const columns = {
    x: points.map((point) => point.x),
    y: points.map((point) => point.y),
  };
  const scatterplot = config.createScatterplot({
    canvas: config.canvas,
    width: config.width,
    height: config.height,
    pointSize: config.pointSize || 3,
    opacity: config.opacity || 0.72,
    lassoOnLongPress: config.lassoOnLongPress === true,
  });
  const overview = {
    colorBy: "valueA",
    opacityBy: null,
    sizeBy: null,
    pointColor: config.pointColor,
    opacity: config.opacity || 0.72,
    pointSize: config.pointSize || 3,
  };

  async function drawOverview() {
    scatterplot.set(overview);
    await scatterplot.draw({ ...columns, z: config.zValues });
    scatterplot.deselect({ preventEvent: true });
  }

  // A point can be in more than the two states `drawHighlighted` covers: the ICD
  // scatter draws surrounding context, the active chapter, and the point the
  // visitor picked inside that chapter at the same time. `classes` holds one
  // class index per point, and the option arrays are read by that index.
  async function drawClasses(classes, options) {
    scatterplot.set({
      colorBy: "valueA",
      opacityBy: "valueA",
      sizeBy: "valueA",
      pointColor: options.pointColor,
      opacity: options.opacity,
      pointSize: options.pointSize,
    });
    await scatterplot.draw({ ...columns, z: classes }, { preventFilterReset: true });
  }

  async function drawHighlighted(indices, options = {}) {
    const selected = new Set(indices);
    await drawClasses(
      config.data.map((_, index) => (selected.has(index) ? 1 : 0)),
      {
        pointColor: options.pointColor || ["#aeb7c2", "#1565c0"],
        opacity: options.opacity || [0.14, 1],
        pointSize: options.pointSize || [2.5, 8],
      },
    );
    if (options.select !== false) {
      scatterplot.select(indices, { preventEvent: true });
    }
  }

  const aspectRatio = config.width / config.height;

  // `zoomOutOnly` keeps the scale the visitor is looking at unless the bounds
  // need more room, which is how a chosen point is centred without the view
  // jumping. A single point has no extent of its own, so the current scale is
  // kept for it either way.
  function zoomToPoints(indices, options = {}) {
    const bounds = pointBounds(points, indices);
    const currentDistance = scatterplot.get("cameraDistance");
    const required = cameraDistanceFor(bounds, aspectRatio, options.padding || 0);
    const distance = options.zoomOutOnly
      ? Math.max(required, currentDistance)
      : required || currentDistance;
    return scatterplot.zoomToLocation([bounds.x, bounds.y], distance, options);
  }

  return {
    allIndices,
    points,
    scatterplot,
    columns,
    drawOverview,
    drawClasses,
    drawHighlighted,
    zoomToPoints,
  };
}

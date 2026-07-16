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

  async function drawHighlighted(indices, options = {}) {
    const selected = new Set(indices);
    scatterplot.set({
      colorBy: "valueA",
      opacityBy: "valueA",
      sizeBy: "valueA",
      pointColor: options.pointColor || ["#aeb7c2", "#1565c0"],
      opacity: options.opacity || [0.14, 1],
      pointSize: options.pointSize || [2.5, 8],
    });
    await scatterplot.draw(
      {
        ...columns,
        z: config.data.map((_, index) => (selected.has(index) ? 1 : 0)),
      },
      { preventFilterReset: true },
    );
    if (options.select !== false) {
      scatterplot.select(indices, { preventEvent: true });
    }
  }

  return {
    allIndices,
    points,
    scatterplot,
    columns,
    drawOverview,
    drawHighlighted,
    zoomToPoints: (indices, options) => scatterplot.zoomToPoints(indices, options),
  };
}

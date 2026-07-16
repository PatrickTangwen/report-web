import {
  createEmbeddingRenderer,
  fitEmbeddingWidth,
} from "./embedding-renderer.js";
import {
  bindHighlightTarget,
  createHighlightController,
} from "./chart-highlighting.js";


export function createRunController() {
  let currentToken = 0;
  return {
    start() {
      currentToken += 1;
      return currentToken;
    },
    cancel() {
      currentToken += 1;
    },
    isCurrent(token) {
      return token === currentToken;
    },
  };
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


export async function createEmbeddingScatter(config) {
  const data = config.data;
  const allIndices = data.map((_, index) => index);
  const diseases = [...new Set(data.map((point) => point.disease))];
  const diseaseIndex = new Map(diseases.map((disease, index) => [disease, index]));
  const width = fitEmbeddingWidth(config.width || 1000);
  const height = Math.max(380, Math.round(width * 0.62));

  const shell = document.createElement("section");
  shell.className = "embedding-explorer";
  shell.setAttribute("aria-label", "Fibrotic disease embedding explorer");

  const heading = document.createElement("div");
  heading.className = "embedding-heading";
  heading.innerHTML =
    `<div><strong>Patient Embeddings — 7 Fibrotic Diseases</strong>` +
    `<span>Display-safe reference cohort · t-SNE view only</span></div>` +
    `<code>${config.datasetVersion}</code>`;
  shell.appendChild(heading);

  const frame = document.createElement("div");
  frame.className = "embedding-frame";
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", `${data.length.toLocaleString()} reference points`);
  canvas.tabIndex = 0;
  frame.appendChild(canvas);

  const tooltip = document.createElement("div");
  tooltip.className = "embedding-tooltip";
  frame.appendChild(tooltip);
  shell.appendChild(frame);

  const legend = document.createElement("div");
  legend.className = "embedding-legend";
  const legendButtons = new Map();
  diseases.forEach((disease, index) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "embedding-legend-action";
    item.setAttribute("aria-pressed", "false");
    const marker = document.createElement("i");
    marker.className = `embedding-legend-color-${index % 7}`;
    item.append(marker, document.createTextNode(config.displayName(disease)));
    legend.appendChild(item);
    legendButtons.set(disease, item);
  });
  shell.appendChild(legend);

  const renderer = createEmbeddingRenderer({
    data,
    xField: "tsne_x",
    yField: "tsne_y",
    zValues: data.map((point) => diseaseIndex.get(point.disease)),
    canvas,
    width,
    height,
    pointSize: 3,
    opacity: 0.72,
    pointColor: config.colors,
    createScatterplot: config.createScatterplot,
  });
  const scatterplot = renderer.scatterplot;
  const rendererQueue = createRendererQueue();

  const diseaseIndices = new Map(
    diseases.map((disease) => [
      disease,
      data
        .map((point, index) => point.disease === disease ? index : null)
        .filter((index) => index !== null),
    ]),
  );

  const groupHighlight = createHighlightController(diseases, (activeDisease) => {
    legendButtons.forEach((button, disease) => {
      const isActive = disease === activeDisease;
      button.classList.toggle("is-active", isActive);
      button.classList.toggle("is-muted", activeDisease !== null && !isActive);
      button.setAttribute("aria-pressed", String(groupHighlight.pinned() === disease));
    });
    if (activeDisease === null) {
      drawOverview();
      return;
    }
    const color = config.colors[diseaseIndex.get(activeDisease)];
    rendererQueue.run(() => renderer.drawHighlighted(
      diseaseIndices.get(activeDisease),
      {
        pointColor: ["#aeb7c2", color],
        opacity: [0.12, 0.9],
        pointSize: [2.5, 3],
        select: false,
      },
    ));
  });
  legendButtons.forEach((button, disease) => {
    bindHighlightTarget(button, disease, groupHighlight);
  });

  function drawOverview() {
    return rendererQueue.run(() => renderer.drawOverview());
  }

  function restoreOverview() {
    return rendererQueue.run(async () => {
      await renderer.drawOverview();
      await renderer.zoomToPoints(allIndices, { padding: 0.08 });
    });
  }

  let hoveredPointDisease = null;
  scatterplot.subscribe("pointover", (index) => {
    const point = data[index];
    if (!point) return;
    hoveredPointDisease = point.disease;
    groupHighlight.hover(point.disease);
    tooltip.textContent = `${config.displayName(point.disease)} · ${config.displayName(point.group)}`;
    tooltip.classList.add("is-visible");
  });
  scatterplot.subscribe("pointout", () => {
    if (hoveredPointDisease !== null) {
      groupHighlight.leave(hoveredPointDisease);
      hoveredPointDisease = null;
    }
    tooltip.classList.remove("is-visible");
  });
  scatterplot.subscribe("select", ({ points: selected }) => {
    const point = data[selected?.[0]];
    if (!point) return;
    groupHighlight.toggle(point.disease);
    scatterplot.deselect({ preventEvent: true });
  });
  canvas.addEventListener("mousemove", (event) => {
    const rect = canvas.getBoundingClientRect();
    tooltip.style.left = `${event.clientX - rect.left + 12}px`;
    tooltip.style.top = `${event.clientY - rect.top + 12}px`;
  });

  await restoreOverview();
  function selectDisease(disease) {
    if (!diseaseIndices.has(disease)) return false;
    groupHighlight.select(disease);
    return true;
  }
  shell.selectDisease = selectDisease;
  if (config.initialDisease) selectDisease(config.initialDisease);
  canvas.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    groupHighlight.clear();
  });
  return shell;
}

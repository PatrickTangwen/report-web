import {
  createEmbeddingRenderer,
  createRendererQueue,
  fitEmbeddingDimensions,
  fitEmbeddingWidth,
} from "./embedding-renderer.js";
import {
  bindHighlightTarget,
  createHighlightController,
} from "./chart-highlighting.js";


export function groupAssignments(pointCount, groups) {
  const assignments = new Array(pointCount).fill(-1);
  groups.forEach((group, groupIndex) => {
    group.indices.forEach((pointIndex) => {
      if (!Number.isInteger(pointIndex) || pointIndex < 0 || pointIndex >= pointCount) {
        throw new Error(`Group index is outside the embedding: ${pointIndex}`);
      }
      if (assignments[pointIndex] !== -1) {
        throw new Error(`Embedding point belongs to more than one group: ${pointIndex}`);
      }
      assignments[pointIndex] = groupIndex;
    });
  });
  if (assignments.some((groupIndex) => groupIndex === -1)) {
    throw new Error("Every embedding point must belong to one display group");
  }
  return assignments;
}


export function createEmbeddingPointInteraction(config) {
  return {
    pointover(index) {
      const point = config.data[index];
      if (!point) return;
      config.renderTooltip(config.tooltip, point);
      config.tooltip.classList.add("is-visible");
    },
    pointout() {
      config.tooltip.classList.remove("is-visible");
    },
    select({ points: selected }) {
      const pointIndex = selected?.[0];
      if (pointIndex === undefined || config.assignments[pointIndex] === undefined) return;
      const group = config.groups[config.assignments[pointIndex]];
      config.groupHighlight.select(group.key);
      config.scatterplot.deselect({ preventEvent: true });
    },
  };
}


export async function createGroupedEmbeddingExplorer(config) {
  const data = config.data;
  const groups = config.groups;
  const groupKeys = groups.map((group) => group.key);
  const groupByKey = new Map(groups.map((group) => [group.key, group]));
  if (groupByKey.size !== groups.length) {
    throw new Error("Embedding display group keys must be unique");
  }
  const assignments = groupAssignments(data.length, groups);
  const allIndices = data.map((_, index) => index);

  const shell = document.createElement("section");
  shell.className = ["embedding-explorer", config.className].filter(Boolean).join(" ");
  shell.setAttribute("aria-label", config.ariaLabel || `${config.title} explorer`);

  const heading = document.createElement("div");
  heading.className = "embedding-heading";
  const headingCopy = document.createElement("div");
  const title = document.createElement("strong");
  title.textContent = config.title;
  const subtitle = document.createElement("span");
  subtitle.textContent = config.subtitle;
  headingCopy.append(title, subtitle);
  const headingActions = document.createElement("div");
  headingActions.className = "embedding-heading-actions";
  if (config.datasetLabel) {
    const datasetLabel = document.createElement("code");
    datasetLabel.textContent = config.datasetLabel;
    headingActions.appendChild(datasetLabel);
  }
  const resetButton = document.createElement("button");
  resetButton.type = "button";
  resetButton.className = "embedding-button embedding-reset-button";
  resetButton.textContent = "Reset view";
  resetButton.setAttribute("aria-label", "Reset embedding selection and view");
  headingActions.appendChild(resetButton);
  heading.append(headingCopy, headingActions);
  shell.appendChild(heading);

  const frame = document.createElement("div");
  frame.className = "embedding-frame";
  const canvas = document.createElement("canvas");
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", config.canvasLabel(data.length));
  canvas.tabIndex = 0;
  frame.appendChild(canvas);

  const tooltip = document.createElement("div");
  tooltip.className = "embedding-tooltip";
  frame.appendChild(tooltip);
  shell.appendChild(frame);

  const legend = document.createElement("div");
  legend.className = ["embedding-legend", config.legendClassName]
    .filter(Boolean)
    .join(" ");
  const legendButtons = new Map();
  groups.forEach((group) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = ["embedding-legend-action", config.legendActionClassName]
      .filter(Boolean)
      .join(" ");
    item.setAttribute("aria-pressed", "false");
    const marker = document.createElement("i");
    marker.style.background = group.color;
    item.append(marker, document.createTextNode(group.label));
    legend.appendChild(item);
    legendButtons.set(group.key, item);
  });
  shell.appendChild(legend);

  const measurementWidth = fitEmbeddingWidth(config.width || 1000);
  shell.style.position = "absolute";
  shell.style.left = "0";
  shell.style.top = "0";
  shell.style.visibility = "hidden";
  shell.style.pointerEvents = "none";
  shell.style.width = `${measurementWidth}px`;
  shell.setAttribute("aria-hidden", "true");
  canvas.hidden = true;
  document.body.appendChild(shell);
  const componentChromeHeight = Math.ceil(shell.getBoundingClientRect().height);
  shell.remove();
  canvas.hidden = false;
  shell.removeAttribute("aria-hidden");
  ["position", "left", "top", "visibility", "pointer-events", "width"]
    .forEach((property) => shell.style.removeProperty(property));

  const { width, height } = fitEmbeddingDimensions(
    config.width || 1000,
    componentChromeHeight,
  );
  canvas.width = width;
  canvas.height = height;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const renderer = createEmbeddingRenderer({
    data,
    xField: config.xField,
    yField: config.yField,
    zValues: assignments,
    canvas,
    width,
    height,
    pointSize: config.pointSize,
    opacity: config.opacity,
    pointColor: groups.map((group) => group.color),
    createScatterplot: config.createScatterplot,
  });
  const scatterplot = renderer.scatterplot;
  const rendererQueue = createRendererQueue();

  function drawOverview() {
    return rendererQueue.run(() => renderer.drawOverview());
  }

  function resetEmbedding() {
    groupHighlight.clear();
    return rendererQueue.run(() => (
      renderer.zoomToPoints(allIndices, { padding: 0.08 })
    ));
  }

  const groupHighlight = createHighlightController(groupKeys, (activeGroup) => {
    legendButtons.forEach((button, groupKey) => {
      const isActive = groupKey === activeGroup;
      button.classList.toggle("is-active", isActive);
      button.classList.toggle("is-muted", activeGroup !== null && !isActive);
      button.setAttribute("aria-pressed", String(groupHighlight.pinned() === groupKey));
    });
    if (activeGroup === null) {
      drawOverview();
      return;
    }
    const group = groupByKey.get(activeGroup);
    rendererQueue.run(() => renderer.drawHighlighted(
      group.indices,
      config.highlightOptions(group),
    ));
  });
  legendButtons.forEach((button, groupKey) => {
    bindHighlightTarget(button, groupKey, groupHighlight, { persistent: true });
  });

  const pointInteraction = createEmbeddingPointInteraction({
    data,
    assignments,
    groups,
    groupHighlight,
    scatterplot,
    tooltip,
    renderTooltip: config.renderTooltip,
  });
  scatterplot.subscribe("pointover", pointInteraction.pointover);
  scatterplot.subscribe("pointout", pointInteraction.pointout);
  scatterplot.subscribe("select", pointInteraction.select);
  canvas.addEventListener("mousemove", (event) => {
    if (!tooltip.classList.contains("is-visible")) return;
    const canvasRect = canvas.getBoundingClientRect();
    const frameRect = frame.getBoundingClientRect();
    const cursorX = event.clientX - frameRect.left;
    const cursorY = event.clientY - frameRect.top;
    const tipW = tooltip.offsetWidth || 200;
    const tipH = tooltip.offsetHeight || 60;
    const rightEdge = canvasRect.right - frameRect.left;
    const bottomEdge = canvasRect.bottom - frameRect.top;
    let left = cursorX + 12;
    if (left + tipW > rightEdge) left = cursorX - tipW - 12;
    let top = cursorY + 12;
    if (top + tipH > bottomEdge) top = cursorY - tipH - 12;
    tooltip.style.left = `${Math.max(0, left)}px`;
    tooltip.style.top = `${Math.max(0, top)}px`;
  });
  canvas.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    resetEmbedding();
  });
  resetButton.addEventListener("click", () => {
    resetEmbedding();
  });

  await rendererQueue.run(async () => {
    await renderer.drawOverview();
    await renderer.zoomToPoints(allIndices, { padding: 0.08 });
  });

  shell.selectGroup = (groupKey) => {
    if (!groupByKey.has(groupKey)) return false;
    groupHighlight.select(groupKey);
    return true;
  };
  shell.resetEmbedding = resetEmbedding;
  if (config.initialGroup !== undefined && config.initialGroup !== null) {
    shell.selectGroup(config.initialGroup);
  }
  return shell;
}

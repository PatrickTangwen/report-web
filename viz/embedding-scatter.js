import {
  createEmbeddingRenderer,
  fitEmbeddingWidth,
  normalizeCoordinates,
} from "./embedding-renderer.js";
import {
  bindHighlightTarget,
  createHighlightController,
} from "./chart-highlighting.js";


export function normalizePoints(data) {
  return normalizeCoordinates(data, "tsne_x", "tsne_y");
}


export function resolveReferenceIndices(data, visualReferenceIds) {
  const indexById = new Map(
    data.map((point, index) => [point.visual_reference_id, index]),
  );
  const missing = visualReferenceIds.filter((id) => !indexById.has(id));
  if (missing.length) {
    throw new Error("Visualization request points are outside the active dataset release");
  }
  return visualReferenceIds.map((id) => indexById.get(id));
}


function squaredDistance(points, left, right) {
  const x = points[left].x - points[right].x;
  const y = points[left].y - points[right].y;
  return x * x + y * y;
}


export function classifyDisplayRegions(data, visualReferenceIds, minimumRegionSize) {
  const selectedIndices = resolveReferenceIndices(data, visualReferenceIds);
  if (!Number.isInteger(minimumRegionSize) || minimumRegionSize < 1) {
    throw new Error("Display-region classification requires a positive release minimum");
  }
  if (!selectedIndices.length) {
    return { mode: "overview", regions: [], selected_indices: selectedIndices };
  }
  const target = data[selectedIndices[0]].disease;
  if (selectedIndices.some((index) => data[index].disease !== target)) {
    throw new Error("A matched visualization request must stay inside one target cohort");
  }

  const normalized = normalizePoints(data);
  const targetIndices = data
    .map((point, index) => (point.disease === target ? index : null))
    .filter((index) => index !== null);
  if (targetIndices.length <= minimumRegionSize) {
    return { mode: "overview", regions: [], selected_indices: selectedIndices };
  }

  const localRadius = new Map();
  selectedIndices.forEach((selectedIndex) => {
    const distances = targetIndices
      .filter((index) => index !== selectedIndex)
      .map((index) => squaredDistance(normalized, selectedIndex, index))
      .sort((left, right) => left - right);
    localRadius.set(selectedIndex, distances[minimumRegionSize - 1]);
  });

  const neighbors = new Map(selectedIndices.map((index) => [index, []]));
  selectedIndices.forEach((left, leftPosition) => {
    selectedIndices.slice(leftPosition + 1).forEach((right) => {
      const threshold = Math.min(localRadius.get(left), localRadius.get(right));
      if (squaredDistance(normalized, left, right) <= threshold) {
        neighbors.get(left).push(right);
        neighbors.get(right).push(left);
      }
    });
  });

  const unseen = new Set(selectedIndices);
  const components = [];
  selectedIndices.forEach((start) => {
    if (!unseen.has(start)) return;
    const component = [];
    const queue = [start];
    unseen.delete(start);
    while (queue.length) {
      const current = queue.shift();
      component.push(current);
      neighbors.get(current).forEach((neighbor) => {
        if (!unseen.has(neighbor)) return;
        unseen.delete(neighbor);
        queue.push(neighbor);
      });
    }
    components.push(component);
  });

  const isLocallyCentered = (component) => {
    const center = component.reduce(
      (total, index) => ({
        x: total.x + normalized[index].x / component.length,
        y: total.y + normalized[index].y / component.length,
      }),
      { x: 0, y: 0 },
    );
    return component.every((index) => {
      const x = normalized[index].x - center.x;
      const y = normalized[index].y - center.y;
      return x * x + y * y <= localRadius.get(index);
    });
  };
  const safeComponents = components.every((component) =>
    component.length >= minimumRegionSize && isLocallyCentered(component),
  );

  if (components.length === 1 && safeComponents) {
    return { mode: "compact", regions: components, selected_indices: selectedIndices };
  }
  if (components.length > 1 && safeComponents) {
    return { mode: "multi_region", regions: components, selected_indices: selectedIndices };
  }
  return { mode: "overview", regions: [], selected_indices: selectedIndices };
}


export function createRegionNavigator(regions) {
  let index = 0;
  return {
    back() {
      index = Math.max(0, index - 1);
      return this.state();
    },
    next() {
      index = Math.min(regions.length - 1, index + 1);
      return this.state();
    },
    state() {
      return {
        index,
        count: regions.length,
        region: regions[index],
        canBack: index > 0,
        canNext: index < regions.length - 1,
      };
    },
  };
}


export function regionOutlinePercentages(points, regions) {
  return regions.map((region, index) => {
    const xs = region.map((pointIndex) => points[pointIndex].x);
    const ys = region.map((pointIndex) => points[pointIndex].y);
    const centerX = ((Math.min(...xs) + Math.max(...xs)) / 2 + 1) * 50;
    const centerY = (1 - (Math.min(...ys) + Math.max(...ys)) / 2) * 50;
    const width = Math.max(6, (Math.max(...xs) - Math.min(...xs)) * 50 + 4);
    const height = Math.max(8, (Math.max(...ys) - Math.min(...ys)) * 50 + 6);
    return {
      label: String(index + 1),
      left: Math.max(0, Math.min(100 - width, centerX - width / 2)),
      top: Math.max(0, Math.min(100 - height, centerY - height / 2)),
      width,
      height,
    };
  });
}


export function walkthroughPlan(reducedMotion) {
  return reducedMotion
    ? ["highlight", "zoom", "callout"]
    : ["overview", "dim", "highlight", "zoom", "callout"];
}


export function walkthroughFocusIndices(displayMode, allIndices, selectedIndices) {
  return displayMode === "overview" ? allIndices : selectedIndices;
}


export function walkthroughCopy(request) {
  if (request?.type === "matched_reference_neighborhood") {
    return {
      kicker: "Matched reference neighborhood",
      pointNoun: "matched reference points",
      note: "Research cohort comparison only; no query patient is embedded and no diagnosis, prognosis, or personal outcome is inferred.",
    };
  }
  return {
    kicker: "Preset reference selection",
    pointNoun: "preset reference points",
    note: "Display preset only; no query patient is embedded and no clinical comparison or personal outcome is inferred.",
  };
}


// Compact Matched Reference Summary text. A missing metric reads "Not
// available"; a privacy-suppressed cell is withheld rather than shown.
export function matchedAgeText(age) {
  if (!age) return "Not available";
  if (age.suppressed) return "Withheld to protect small cells";
  const unit = age.unit ? ` ${age.unit}` : "";
  return `Median ${age.median}${unit}`;
}

export function matchedSexText(sex) {
  if (!sex) return "Not available";
  if (sex.suppressed) return "Withheld to protect small cells";
  if (!Array.isArray(sex.distribution) || !sex.distribution.length) return "Not available";
  return sex.distribution
    .map((entry) => `${String(entry.category).replaceAll("_", " ")} (n=${entry.count})`)
    .join(", ");
}


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


export function layoutForRequest(data, request, indices) {
  if (request?.type === "matched_reference_neighborhood") {
    if (!Number.isInteger(request.minimum_region_size) || request.minimum_region_size < 1) {
      throw new Error("Matched visualization request is missing its geometry contract");
    }
    return classifyDisplayRegions(
      data,
      request.visual_reference_ids,
      request.minimum_region_size,
    );
  }
  if (request?.display_mode === "compact") {
    return { mode: "compact", regions: [indices], selected_indices: indices };
  }
  if (request?.display_mode === "overview") {
    return { mode: "overview", regions: [], selected_indices: indices };
  }
  if (request?.display_mode === "multi_region") {
    if (!Number.isInteger(request.minimum_region_size) || request.minimum_region_size < 1) {
      throw new Error("Multi-region preset is missing its geometry contract");
    }
    const layout = classifyDisplayRegions(
      data,
      request.visual_reference_ids,
      request.minimum_region_size,
    );
    if (layout.mode !== "multi_region") {
      throw new Error("Multi-region preset does not match its release geometry");
    }
    return layout;
  }
  throw new Error("Visualization request has an unsupported display mode");
}


export function bindWalkthroughControls(config) {
  const onPlay = () => config.play(config.getRequest());
  const onReset = () => config.reset();
  config.playButton.addEventListener("click", onPlay);
  config.replayButton.addEventListener("click", onPlay);
  config.resetButton.addEventListener("click", onReset);
  return () => {
    config.playButton.removeEventListener("click", onPlay);
    config.replayButton.removeEventListener("click", onPlay);
    config.resetButton.removeEventListener("click", onReset);
  };
}


function delay(milliseconds) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}


function button(label, className = "embedding-button") {
  const element = document.createElement("button");
  element.type = "button";
  element.className = className;
  element.textContent = label;
  return element;
}


export async function createEmbeddingScatter(config) {
  const data = config.data;
  const allIndices = data.map((_, index) => index);
  const diseases = [...new Set(data.map((point) => point.disease))];
  const diseaseIndex = new Map(diseases.map((disease, index) => [disease, index]));
  const width = fitEmbeddingWidth(config.width || 1000);
  const height = Math.max(380, Math.round(width * 0.62));

  const shell = document.createElement("section");
  shell.className = "embedding-walkthrough";
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
  canvas.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    groupHighlight.clear();
  });
  return shell;
}

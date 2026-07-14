let embeddingInstanceCounter = 0;


export function normalizePoints(data) {
  const xs = data.map((point) => Number(point.tsne_x));
  const ys = data.map((point) => Number(point.tsne_y));
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);
  const xMid = (xMin + xMax) / 2;
  const yMid = (yMin + yMax) / 2;
  const span = Math.max(xMax - xMin, yMax - yMin) || 1;
  return data.map((point) => ({
    x: ((Number(point.tsne_x) - xMid) / span) * 1.9,
    y: ((Number(point.tsne_y) - yMid) / span) * 1.9,
  }));
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


function fitWidth(maxWidth) {
  const main = document.querySelector("main.content") || document.querySelector("main");
  const mainWidth = main?.clientWidth || maxWidth;
  const viewportWidth = document.documentElement.clientWidth - 32;
  return Math.floor(
    Math.min(maxWidth, Math.max(320, Math.min(mainWidth, viewportWidth))),
  );
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
  const normalized = normalizePoints(data);
  const allIndices = data.map((_, index) => index);
  const diseases = [...new Set(data.map((point) => point.disease))];
  const diseaseIndex = new Map(diseases.map((disease, index) => [disease, index]));
  const width = fitWidth(config.width || 1000);
  const height = Math.max(380, Math.round(width * 0.62));
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  embeddingInstanceCounter += 1;
  const instanceId = `fibrotic-walkthrough-${embeddingInstanceCounter}`;

  const shell = document.createElement("section");
  shell.className = "embedding-walkthrough";
  shell.setAttribute("aria-label", "Fibrotic reference embedding walkthrough");

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
  canvas.setAttribute("aria-describedby", `${instanceId}-summary`);
  canvas.tabIndex = 0;
  frame.appendChild(canvas);

  const region = document.createElement("div");
  region.className = "embedding-region";
  region.setAttribute("aria-hidden", "true");
  region.innerHTML =
    '<svg viewBox="0 0 1000 620" preserveAspectRatio="none">' +
    '<ellipse cx="500" cy="330" rx="285" ry="205"></ellipse>' +
    '<line x1="705" y1="185" x2="815" y2="85"></line>' +
    '<circle cx="500" cy="330" r="8"></circle>' +
    "</svg>";
  frame.appendChild(region);

  const multiRegionOverview = document.createElement("div");
  multiRegionOverview.className = "embedding-multi-region-overview";
  multiRegionOverview.setAttribute("aria-hidden", "true");
  frame.appendChild(multiRegionOverview);

  const tooltip = document.createElement("div");
  tooltip.className = "embedding-tooltip";
  frame.appendChild(tooltip);
  shell.appendChild(frame);

  const controls = document.createElement("div");
  controls.className = "embedding-controls";
  const status = document.createElement("span");
  status.className = "embedding-status";
  status.setAttribute("aria-live", "polite");
  status.textContent = "Overview · waiting for a walkthrough request";
  const playButton = button("Play walkthrough", "embedding-button embedding-button-primary");
  const backButton = button("Back region");
  backButton.setAttribute("aria-label", "Show previous display region");
  const regionStatus = document.createElement("span");
  regionStatus.className = "embedding-region-status";
  regionStatus.setAttribute("aria-live", "polite");
  const nextButton = button("Next region");
  nextButton.setAttribute("aria-label", "Show next display region");
  const replayButton = button("Replay");
  const resetButton = button("Reset view");
  backButton.hidden = true;
  regionStatus.hidden = true;
  nextButton.hidden = true;
  replayButton.hidden = true;
  controls.append(
    status,
    playButton,
    backButton,
    regionStatus,
    nextButton,
    replayButton,
    resetButton,
  );
  shell.appendChild(controls);

  const summary = document.createElement("aside");
  summary.className = "embedding-summary";
  summary.id = `${instanceId}-summary`;
  summary.setAttribute("role", "region");
  summary.setAttribute("aria-label", "Matched reference neighborhood summary");
  summary.tabIndex = -1;
  summary.hidden = true;
  shell.appendChild(summary);

  const legend = document.createElement("div");
  legend.className = "embedding-legend";
  diseases.forEach((disease, index) => {
    const item = document.createElement("span");
    const marker = document.createElement("i");
    marker.className = `embedding-legend-color-${index % 7}`;
    item.append(marker, document.createTextNode(config.displayName(disease)));
    legend.appendChild(item);
  });
  shell.appendChild(legend);

  const scatterplot = config.createScatterplot({
    canvas,
    width,
    height,
    pointSize: 3,
    opacity: 0.72,
    lassoOnLongPress: false,
  });
  const columns = {
    x: normalized.map((point) => point.x),
    y: normalized.map((point) => point.y),
  };
  let activeRequest = config.request || config.preset;
  let activeLayout = null;
  let regionNavigator = null;
  let regionTransitionActive = false;
  const runController = createRunController();
  const regionController = createRunController();
  const rendererQueue = createRendererQueue();

  async function renderOverview() {
    scatterplot.set({
      colorBy: "valueA",
      opacityBy: null,
      sizeBy: null,
      pointColor: config.colors,
      opacity: 0.72,
      pointSize: 3,
    });
    await scatterplot.draw({
      ...columns,
      z: data.map((point) => diseaseIndex.get(point.disease)),
    });
    scatterplot.deselect({ preventEvent: true });
  }

  function drawOverview() {
    return rendererQueue.run(renderOverview);
  }

  function drawDimmed() {
    return rendererQueue.run(async () => {
      scatterplot.set({
        colorBy: "valueA",
        opacityBy: null,
        sizeBy: null,
        pointColor: ["#aeb7c2"],
        opacity: 0.2,
        pointSize: 2.5,
      });
      await scatterplot.draw({ ...columns, z: data.map(() => 0) });
    });
  }

  function drawHighlighted(indices) {
    return rendererQueue.run(async () => {
      const selected = new Set(indices);
      scatterplot.set({
        colorBy: "valueA",
        opacityBy: "valueA",
        sizeBy: "valueA",
        pointColor: ["#aeb7c2", "#1565c0"],
        opacity: [0.14, 1],
        pointSize: [2.5, 8],
      });
      await scatterplot.draw(
        { ...columns, z: data.map((_, index) => (selected.has(index) ? 1 : 0)) },
        { preventFilterReset: true },
      );
      scatterplot.select(indices, { preventEvent: true });
    });
  }

  function zoomToPoints(indices, options) {
    return rendererQueue.run(() => scatterplot.zoomToPoints(indices, options));
  }

  function restoreOverview() {
    return rendererQueue.run(async () => {
      await renderOverview();
      await scatterplot.zoomToPoints(allIndices, { padding: 0.08 });
    });
  }

  function hideRegionNavigation() {
    backButton.hidden = true;
    regionStatus.hidden = true;
    nextButton.hidden = true;
  }

  function hideMultiRegionOverview() {
    multiRegionOverview.classList.remove("is-visible");
    multiRegionOverview.replaceChildren();
  }

  function showMultiRegionOverview(layout) {
    multiRegionOverview.replaceChildren();
    regionOutlinePercentages(normalized, layout.regions).forEach((outline) => {
      const marker = document.createElement("div");
      marker.className = "embedding-region-outline";
      marker.style.left = `${outline.left}%`;
      marker.style.top = `${outline.top}%`;
      marker.style.width = `${outline.width}%`;
      marker.style.height = `${outline.height}%`;
      const label = document.createElement("span");
      label.textContent = outline.label;
      marker.appendChild(label);
      multiRegionOverview.appendChild(marker);
    });
    multiRegionOverview.classList.add("is-visible");
  }

  function updateRegionNavigation() {
    if (!regionNavigator || activeLayout?.mode !== "multi_region") {
      hideRegionNavigation();
      return;
    }
    const navigation = regionNavigator.state();
    backButton.hidden = false;
    regionStatus.hidden = false;
    nextButton.hidden = false;
    backButton.disabled = !navigation.canBack;
    nextButton.disabled = !navigation.canNext;
    regionStatus.textContent = `Display region ${navigation.index + 1} of ${navigation.count}`;
  }

  async function focusCurrentRegion(animate) {
    const token = regionController.start();
    regionTransitionActive = true;
    const navigation = regionNavigator.state();
    backButton.disabled = true;
    nextButton.disabled = true;
    status.textContent =
      `Display region ${navigation.index + 1} of ${navigation.count} · ` +
      `${navigation.region.length} highlighted reference points`;
    region.classList.add("is-visible");
    try {
      await zoomToPoints(navigation.region, {
        padding: 0.25,
        transition: animate,
        transitionDuration: animate ? 620 : 0,
      });
    } finally {
      if (regionController.isCurrent(token)) regionTransitionActive = false;
    }
    if (!regionController.isCurrent(token)) return;
    updateRegionNavigation();
  }

  function showCallout(request, layout) {
    const copy = walkthroughCopy(request);
    region.classList.toggle("is-visible", layout.mode !== "overview");
    summary.hidden = false;
    summary.replaceChildren();
    const kicker = document.createElement("div");
    kicker.className = "embedding-summary-kicker";
    kicker.textContent = copy.kicker;
    const title = document.createElement("h3");
    title.textContent = request.summary.title;
    const description = document.createElement("p");
    description.textContent = request.summary.description;
    const details = document.createElement("dl");
    [
      ["Reference points", request.summary.reference_count],
      ["Target", config.displayName(request.target)],
      [
        "Display layout",
        layout.mode === "compact"
          ? "One compact display region"
          : layout.mode === "multi_region"
            ? `${layout.regions.length} separated display regions`
            : "Dispersed overview",
      ],
    ].forEach(([term, value]) => {
      const pair = document.createElement("div");
      const key = document.createElement("dt");
      const content = document.createElement("dd");
      key.textContent = term;
      content.textContent = value;
      pair.append(key, content);
      details.appendChild(pair);
    });
    const note = document.createElement("p");
    note.className = "embedding-summary-note";
    note.textContent =
      "Display preset only; no query patient is embedded and no clinical similarity or personal outcome is inferred.";
    summary.append(kicker, title, description, details, note);
    const layoutNote = document.createElement("p");
    layoutNote.className = "embedding-layout-note";
    layoutNote.textContent =
      layout.mode === "compact"
        ? "The highlighted references occupy one local display region. This region is an annotation aid, not a clinical cluster."
        : layout.mode === "multi_region"
          ? "The highlighted references occupy separated display regions. Use Back and Next to inspect them; the regions are annotation aids, not clinical subtypes."
          : "The highlighted references are broadly dispersed, so the full embedding overview is preserved instead of drawing a misleading region.";
    summary.insertBefore(layoutNote, note);
    if (Array.isArray(request.summary.domains)) {
      request.summary.domains.forEach((domain) => {
        const domainSection = document.createElement("section");
        domainSection.className = "embedding-summary-domain";
        const domainTitle = document.createElement("h4");
        domainTitle.textContent = String(domain.domain).replaceAll("_", " ");
        const list = document.createElement("ul");
        domain.metrics.forEach((metric) => {
          const item = document.createElement("li");
          if (metric.suppressed) {
            item.textContent = `${metric.label}: suppressed because the aggregate cell is too small`;
          } else if (metric.distribution) {
            item.textContent = `${metric.label}: ${metric.distribution
              .map((entry) => `${String(entry.category).replaceAll("_", " ")} (n=${entry.count})`)
              .join(", ")}`;
          } else {
            const unit = metric.unit ? ` ${metric.unit}` : "";
            item.textContent = `${metric.label}: median ${metric.median}${unit}; range ${metric.range[0]}–${metric.range[1]}${unit}`;
          }
          list.appendChild(item);
        });
        domainSection.append(domainTitle, list);
        summary.insertBefore(domainSection, note);
      });
    }
    note.textContent = copy.note;
    status.textContent = `Walkthrough complete · ${request.summary.reference_count} reference points highlighted`;
    replayButton.hidden = false;
    playButton.hidden = true;
    updateRegionNavigation();
  }

  async function play(request, animate = !reducedMotion) {
    activeRequest = request;
    const token = runController.start();
    regionController.cancel();
    regionTransitionActive = false;
    let indices;
    let layout;
    try {
      indices = resolveReferenceIndices(data, request.visual_reference_ids);
      layout = layoutForRequest(data, request, indices);
    } catch (error) {
      cancelRun(
        "The visualization request does not match the active Dataset Release. Start the comparison again.",
      );
      return;
    }
    activeLayout = layout;
    regionNavigator = layout.regions.length
      ? createRegionNavigator(layout.regions)
      : null;
    region.classList.remove("is-visible");
    summary.hidden = true;
    hideRegionNavigation();
    hideMultiRegionOverview();
    playButton.disabled = true;
    replayButton.disabled = true;
    resetButton.disabled = true;

    for (const stage of walkthroughPlan(!animate)) {
      if (stage === "overview") {
        status.textContent = "Overview · preparing reference cohort";
        await drawOverview();
        await zoomToPoints(allIndices, { padding: 0.08 });
        await delay(380);
      } else if (stage === "dim") {
        status.textContent = "Dimming unrelated reference points";
        await drawDimmed();
        await delay(420);
      } else if (stage === "highlight") {
        status.textContent = `${animate ? "Highlighting" : "Showing"} ${indices.length} ${walkthroughCopy(request).pointNoun}`;
        await drawHighlighted(indices);
        if (animate) await delay(420);
      } else if (stage === "zoom") {
        if (layout.mode === "multi_region") {
          if (animate) {
            status.textContent = `Showing ${layout.regions.length} separated display regions`;
            showMultiRegionOverview(layout);
            await delay(900);
            if (!runController.isCurrent(token)) return;
            hideMultiRegionOverview();
          }
          await focusCurrentRegion(animate);
        } else {
          const focusIndices = layout.mode === "overview" ? allIndices : indices;
          status.textContent = layout.mode === "overview"
            ? "Keeping broadly dispersed matches in the full embedding overview"
            : "Zooming to the compact display region";
          await zoomToPoints(focusIndices, {
            padding: layout.mode === "overview" ? 0.08 : 0.25,
            transition: animate,
            transitionDuration: animate ? 760 : 0,
          });
        }
      } else if (stage === "callout") {
        showCallout(request, layout);
      }
      if (!runController.isCurrent(token)) return;
    }
    playButton.disabled = false;
    replayButton.disabled = false;
    resetButton.disabled = false;
    summary.focus({ preventScroll: true });
  }

  async function reset() {
    runController.cancel();
    regionController.cancel();
    region.classList.remove("is-visible");
    summary.hidden = true;
    activeLayout = null;
    regionNavigator = null;
    regionTransitionActive = false;
    hideRegionNavigation();
    hideMultiRegionOverview();
    replayButton.hidden = true;
    playButton.hidden = false;
    playButton.disabled = false;
    replayButton.disabled = false;
    resetButton.disabled = false;
    status.textContent = "Overview · walkthrough ready";
    await restoreOverview();
  }

  function cancelRun(message) {
    runController.cancel();
    regionController.cancel();
    regionTransitionActive = false;
    playButton.disabled = false;
    replayButton.disabled = false;
    resetButton.disabled = false;
    status.textContent = message;
    region.classList.remove("is-visible");
    summary.hidden = true;
    hideRegionNavigation();
    hideMultiRegionOverview();
    restoreOverview();
  }

  bindWalkthroughControls({
    playButton,
    replayButton,
    resetButton,
    getRequest: () => activeRequest,
    play,
    reset,
  });
  backButton.addEventListener("click", () => {
    regionNavigator.back();
    focusCurrentRegion(!reducedMotion);
  });
  nextButton.addEventListener("click", () => {
    regionNavigator.next();
    focusCurrentRegion(!reducedMotion);
  });
  canvas.addEventListener("pointerdown", () => {
    if (playButton.disabled || regionTransitionActive) {
      cancelRun("Walkthrough paused by visitor interaction");
    }
  });
  canvas.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      cancelRun("Walkthrough cancelled and reset to the overview");
    }
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && (playButton.disabled || regionTransitionActive)) {
      cancelRun("Walkthrough paused while this tab is hidden");
    }
  });
  window.addEventListener("pagehide", () => {
    runController.cancel();
    regionController.cancel();
    regionTransitionActive = false;
  });
  scatterplot.subscribe("pointover", (index) => {
    const point = data[index];
    if (!point) return;
    tooltip.textContent = `${config.displayName(point.disease)} · ${config.displayName(point.group)}`;
    tooltip.classList.add("is-visible");
  });
  scatterplot.subscribe("pointout", () => tooltip.classList.remove("is-visible"));
  canvas.addEventListener("mousemove", (event) => {
    const rect = canvas.getBoundingClientRect();
    tooltip.style.left = `${event.clientX - rect.left + 12}px`;
    tooltip.style.top = `${event.clientY - rect.top + 12}px`;
  });

  await restoreOverview();
  if (config.autoplay && config.request) {
    window.setTimeout(() => play(config.request), 80);
  } else if (config.request) {
    window.setTimeout(() => play(config.request, false), 80);
  }

  shell.embeddingWalkthrough = { play, reset };
  return shell;
}

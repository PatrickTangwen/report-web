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


export function walkthroughPlan(reducedMotion) {
  return reducedMotion
    ? ["highlight", "zoom", "callout"]
    : ["overview", "dim", "highlight", "zoom", "callout"];
}


export function walkthroughFocusIndices(displayMode, allIndices, selectedIndices) {
  return displayMode === "overview" ? allIndices : selectedIndices;
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
  canvas.setAttribute("aria-label", `${data.length.toLocaleString()} reference points`);
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
  const playButton = button("Play preset walkthrough", "embedding-button embedding-button-primary");
  const replayButton = button("Replay");
  const resetButton = button("Reset view");
  replayButton.hidden = true;
  controls.append(status, playButton, replayButton, resetButton);
  shell.appendChild(controls);

  const summary = document.createElement("aside");
  summary.className = "embedding-summary";
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
  const runController = createRunController();

  async function drawOverview() {
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

  async function drawDimmed() {
    scatterplot.set({
      colorBy: "valueA",
      opacityBy: null,
      sizeBy: null,
      pointColor: ["#aeb7c2"],
      opacity: 0.2,
      pointSize: 2.5,
    });
    await scatterplot.draw({ ...columns, z: data.map(() => 0) });
  }

  async function drawHighlighted(indices) {
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
  }

  function showCallout(request) {
    region.classList.toggle("is-visible", request.display_mode === "compact");
    summary.hidden = false;
    summary.replaceChildren();
    const kicker = document.createElement("div");
    kicker.className = "embedding-summary-kicker";
    kicker.textContent = "Preset reference selection";
    const title = document.createElement("h3");
    title.textContent = request.summary.title;
    const description = document.createElement("p");
    description.textContent = request.summary.description;
    const details = document.createElement("dl");
    [
      ["Reference points", request.summary.reference_count],
      ["Target", config.displayName(request.target)],
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
    status.textContent = `Walkthrough complete · ${request.summary.reference_count} reference points highlighted`;
    replayButton.hidden = false;
    playButton.hidden = true;
  }

  async function play(request, animate = !reducedMotion) {
    activeRequest = request;
    const token = runController.start();
    const indices = resolveReferenceIndices(data, request.visual_reference_ids);
    region.classList.remove("is-visible");
    summary.hidden = true;
    playButton.disabled = true;
    replayButton.disabled = true;
    resetButton.disabled = true;

    for (const stage of walkthroughPlan(!animate)) {
      if (stage === "overview") {
        status.textContent = "Overview · preparing reference cohort";
        await drawOverview();
        await scatterplot.zoomToPoints(allIndices, { padding: 0.08 });
        await delay(380);
      } else if (stage === "dim") {
        status.textContent = "Dimming unrelated reference points";
        await drawDimmed();
        await delay(420);
      } else if (stage === "highlight") {
        status.textContent = `${animate ? "Highlighting" : "Showing"} ${indices.length} preset reference points`;
        await drawHighlighted(indices);
        if (animate) await delay(420);
      } else if (stage === "zoom") {
        const focusIndices = walkthroughFocusIndices(
          request.display_mode,
          allIndices,
          indices,
        );
        status.textContent = request.display_mode === "overview"
          ? "Keeping the dispersed selection in the full embedding overview"
          : "Zooming to the display region";
        await scatterplot.zoomToPoints(focusIndices, {
          padding: request.display_mode === "overview" ? 0.08 : 0.25,
          transition: animate,
          transitionDuration: animate ? 760 : 0,
        });
      } else if (stage === "callout") {
        showCallout(request);
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
    region.classList.remove("is-visible");
    summary.hidden = true;
    replayButton.hidden = true;
    playButton.hidden = false;
    playButton.disabled = false;
    replayButton.disabled = false;
    resetButton.disabled = false;
    status.textContent = "Overview · preset walkthrough ready";
    await drawOverview();
    await scatterplot.zoomToPoints(allIndices, { padding: 0.08 });
  }

  function cancelRun(message) {
    runController.cancel();
    playButton.disabled = false;
    replayButton.disabled = false;
    resetButton.disabled = false;
    status.textContent = message;
  }

  bindWalkthroughControls({
    playButton,
    replayButton,
    resetButton,
    getRequest: () => activeRequest,
    play,
    reset,
  });
  canvas.addEventListener("pointerdown", () => {
    if (playButton.disabled) {
      cancelRun("Walkthrough paused by visitor interaction");
    }
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && playButton.disabled) {
      cancelRun("Walkthrough paused while this tab is hidden");
    }
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

  await drawOverview();
  await scatterplot.zoomToPoints(allIndices, { padding: 0.08 });
  if (config.autoplay && config.request) {
    window.setTimeout(() => play(config.request), 80);
  } else if (config.request) {
    window.setTimeout(() => play(config.request, false), 80);
  }

  shell.embeddingWalkthrough = { play, reset };
  return shell;
}

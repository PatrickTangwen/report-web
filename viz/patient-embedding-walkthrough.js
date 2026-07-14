import { createRunController, createRendererQueue } from "./embedding-scatter.js";

let patientInstanceCounter = 0;

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

function normalizePoints(data, xField, yField) {
  const xs = data.map((point) => Number(point[xField]));
  const ys = data.map((point) => Number(point[yField]));
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);
  const xMid = (xMin + xMax) / 2;
  const yMid = (yMin + yMax) / 2;
  const span = Math.max(xMax - xMin, yMax - yMin) || 1;
  return {
    x: data.map((point) => ((Number(point[xField]) - xMid) / span) * 1.9),
    y: data.map((point) => ((Number(point[yField]) - yMid) / span) * 1.9),
  };
}

// A guided walkthrough over categorical groups, matching the operation logic of
// the fibrotic embedding: overview -> dim others -> highlight one group -> zoom
// -> callout, with Play / Back / Next / Replay / Reset view controls. `groups`
// is an ordered list of { label, color, indices, stats } describing the tour.
export async function createPatientWalkthrough(config) {
  const data = config.data;
  const columns = normalizePoints(data, config.xField, config.yField);
  const allIndices = data.map((_, index) => index);
  const groups = config.groups;
  const groupColors = groups.map((group) => group.color);
  const groupOfPoint = new Array(data.length).fill(0);
  groups.forEach((group, groupIndex) => {
    group.indices.forEach((pointIndex) => {
      groupOfPoint[pointIndex] = groupIndex;
    });
  });

  const width = fitWidth(config.width || 1000);
  const height = Math.max(380, Math.round(width * 0.62));
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  patientInstanceCounter += 1;
  const instanceId = `patient-walkthrough-${patientInstanceCounter}`;

  const shell = document.createElement("section");
  shell.className = "embedding-walkthrough";
  shell.setAttribute("aria-label", `${config.title} walkthrough`);

  const heading = document.createElement("div");
  heading.className = "embedding-heading";
  heading.innerHTML =
    `<div><strong>${config.title}</strong>` +
    `<span>${config.subtitle}</span></div>` +
    (config.datasetLabel ? `<code>${config.datasetLabel}</code>` : "");
  shell.appendChild(heading);

  const frame = document.createElement("div");
  frame.className = "embedding-frame";
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", `${data.length.toLocaleString()} patient embeddings`);
  canvas.setAttribute("aria-describedby", `${instanceId}-summary`);
  canvas.tabIndex = 0;
  frame.appendChild(canvas);

  const tooltip = document.createElement("div");
  tooltip.className = "embedding-tooltip";
  frame.appendChild(tooltip);
  shell.appendChild(frame);

  const controls = document.createElement("div");
  controls.className = "embedding-controls";
  const status = document.createElement("span");
  status.className = "embedding-status";
  status.setAttribute("aria-live", "polite");
  status.textContent = "Overview · walkthrough ready";
  const playButton = button("Play walkthrough", "embedding-button embedding-button-primary");
  const backButton = button("Back");
  backButton.setAttribute("aria-label", "Show previous group");
  const regionStatus = document.createElement("span");
  regionStatus.className = "embedding-region-status";
  regionStatus.setAttribute("aria-live", "polite");
  const nextButton = button("Next");
  nextButton.setAttribute("aria-label", "Show next group");
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
  summary.setAttribute("aria-label", `${config.title} group summary`);
  summary.tabIndex = -1;
  summary.hidden = true;
  shell.appendChild(summary);

  const legend = document.createElement("div");
  legend.className = "embedding-legend";
  groups.forEach((group, groupIndex) => {
    const item = document.createElement("span");
    item.tabIndex = 0;
    item.setAttribute("role", "button");
    const marker = document.createElement("i");
    marker.style.background = group.color;
    item.append(marker, document.createTextNode(group.label));
    const jump = () => stepTo(groupIndex);
    item.addEventListener("click", jump);
    item.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        jump();
      }
    });
    legend.appendChild(item);
  });
  shell.appendChild(legend);

  const scatterplot = config.createScatterplot({
    canvas,
    width,
    height,
    pointSize: 2.5,
    opacity: 0.5,
    lassoOnLongPress: false,
  });
  const runController = createRunController();
  const rendererQueue = createRendererQueue();
  let currentGroup = 0;
  let inWalkthrough = false;

  async function renderOverview() {
    scatterplot.set({
      colorBy: "valueA",
      opacityBy: null,
      sizeBy: null,
      pointColor: groupColors,
      opacity: 0.5,
      pointSize: 2.5,
    });
    await scatterplot.draw({ ...columns, z: groupOfPoint });
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
        opacity: 0.16,
        pointSize: 2,
      });
      await scatterplot.draw({ ...columns, z: data.map(() => 0) });
    });
  }

  function drawHighlighted(indices, color) {
    return rendererQueue.run(async () => {
      const selected = new Set(indices);
      scatterplot.set({
        colorBy: "valueA",
        opacityBy: "valueA",
        sizeBy: "valueA",
        pointColor: ["#aeb7c2", color],
        opacity: [0.22, 0.95],
        pointSize: [2, 6],
      });
      await scatterplot.draw(
        { ...columns, z: data.map((_, index) => (selected.has(index) ? 1 : 0)) },
        { preventFilterReset: true },
      );
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

  function updateNavigation() {
    backButton.hidden = false;
    regionStatus.hidden = false;
    nextButton.hidden = false;
    backButton.disabled = currentGroup <= 0;
    nextButton.disabled = currentGroup >= groups.length - 1;
    regionStatus.textContent = `Group ${currentGroup + 1} of ${groups.length}`;
  }

  function showCallout(groupIndex) {
    const group = groups[groupIndex];
    summary.hidden = false;
    summary.replaceChildren();

    const kicker = document.createElement("div");
    kicker.className = "embedding-summary-kicker";
    kicker.textContent = config.kicker || "Group spotlight";

    const title = document.createElement("h3");
    title.textContent = group.label;

    const description = document.createElement("p");
    description.textContent =
      `${group.indices.length.toLocaleString()} of ${data.length.toLocaleString()} patients ` +
      `(${((group.indices.length / data.length) * 100).toFixed(1)}%) highlighted in this display group.`;

    const details = document.createElement("dl");
    (group.stats || []).forEach(([term, value]) => {
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
      config.note ||
      "Display grouping only; the highlight is an annotation aid over the shared embedding, not a clinical cluster.";

    summary.append(kicker, title, description, details, note);
  }

  async function focusGroup(groupIndex, animate) {
    currentGroup = groupIndex;
    const group = groups[groupIndex];
    status.textContent =
      `Highlighting ${group.label} · ${group.indices.length.toLocaleString()} patients`;
    playButton.hidden = true;
    replayButton.hidden = false;
    updateNavigation();
    await drawHighlighted(group.indices, group.color);
    await zoomToPoints(group.indices, {
      padding: 0.25,
      transition: animate,
      transitionDuration: animate ? 620 : 0,
    });
    showCallout(groupIndex);
  }

  async function play(animate = !reducedMotion) {
    const token = runController.start();
    inWalkthrough = true;
    playButton.disabled = true;
    replayButton.disabled = true;
    resetButton.disabled = true;
    summary.hidden = true;

    status.textContent = "Overview · preparing cohort";
    await drawOverview();
    await zoomToPoints(allIndices, { padding: 0.08 });
    if (animate) await delay(360);
    if (!runController.isCurrent(token)) return;

    status.textContent = "Dimming other patients";
    await drawDimmed();
    if (animate) await delay(360);
    if (!runController.isCurrent(token)) return;

    await focusGroup(0, animate);
    if (!runController.isCurrent(token)) return;

    playButton.disabled = false;
    replayButton.disabled = false;
    resetButton.disabled = false;
    summary.focus({ preventScroll: true });
  }

  // Jump straight to a group (legend click or Back/Next) without replaying the
  // full intro animation.
  async function stepTo(groupIndex) {
    if (groupIndex < 0 || groupIndex >= groups.length) return;
    runController.cancel();
    inWalkthrough = true;
    playButton.disabled = false;
    replayButton.disabled = false;
    resetButton.disabled = false;
    await focusGroup(groupIndex, !reducedMotion);
  }

  async function reset() {
    runController.cancel();
    inWalkthrough = false;
    summary.hidden = true;
    backButton.hidden = true;
    regionStatus.hidden = true;
    nextButton.hidden = true;
    replayButton.hidden = true;
    playButton.hidden = false;
    playButton.disabled = false;
    replayButton.disabled = false;
    resetButton.disabled = false;
    status.textContent = "Overview · walkthrough ready";
    await restoreOverview();
  }

  playButton.addEventListener("click", () => play());
  replayButton.addEventListener("click", () => play());
  resetButton.addEventListener("click", () => reset());
  backButton.addEventListener("click", () => stepTo(currentGroup - 1));
  nextButton.addEventListener("click", () => stepTo(currentGroup + 1));
  canvas.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      reset();
    }
  });

  scatterplot.subscribe("pointover", (index) => {
    const point = data[index];
    if (!point) return;
    tooltip.innerHTML = config.tooltip(point);
    tooltip.classList.add("is-visible");
  });
  scatterplot.subscribe("pointout", () => tooltip.classList.remove("is-visible"));
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

  await restoreOverview();

  shell.patientWalkthrough = { play, reset, stepTo };
  return shell;
}

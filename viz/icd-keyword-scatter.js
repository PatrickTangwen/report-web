import {
  createEmbeddingRenderer,
  fitEmbeddingWidth,
} from "./embedding-renderer.js";


function normalizeCode(value) {
  return String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}


function selectorPredicate(selector) {
  if (selector && selector.type === "exact" && selector.code) {
    const code = normalizeCode(selector.code);
    return (point) => normalizeCode(point.code) === code;
  }
  if (selector && selector.type === "prefix" && selector.prefix) {
    const prefix = normalizeCode(selector.prefix);
    return (point) => normalizeCode(point.code).startsWith(prefix);
  }
  if (selector && selector.type === "range" && selector.start && selector.end) {
    const start = normalizeCode(selector.start).slice(0, 3);
    const end = normalizeCode(selector.end).slice(0, 3);
    return (point) => {
      const category = normalizeCode(point.code).slice(0, 3);
      return category.length === 3 && start <= category && category <= end;
    };
  }
  throw new Error("The visualization request has an unsupported ICD selector");
}


export function resolveIcdIndices(data, selector) {
  const matches = selectorPredicate(selector);
  return data
    .map((point, index) => (matches(point) ? index : null))
    .filter((index) => index !== null);
}


function motionOptions(reducedMotion, padding) {
  return {
    padding,
    transition: !reducedMotion,
    transitionDuration: reducedMotion ? 0 : 520,
  };
}


export function createIcdInteraction(config) {
  const allIndices = config.data.map((_, index) => index);

  return {
    async focus(request, animate = !config.reducedMotion) {
      const indices = resolveIcdIndices(config.data, request.selector);
      if (!indices.length) {
        throw new Error("The reviewed ICD selector matches no graph points");
      }
      await config.renderer.drawHighlighted(indices);
      await config.renderer.zoomToPoints(
        indices,
        motionOptions(config.reducedMotion || !animate, 0.3),
      );
      const pointNoun = indices.length === 1 ? "point" : "points";
      return {
        indices,
        explanation:
          `${request.display_label} · ${request.selector_label} · ` +
          `${indices.length.toLocaleString()} ICD graph ${pointNoun} highlighted. ` +
          "Navigation context only; this does not represent patient history, " +
          "diagnosis, or clinical similarity.",
      };
    },

    async reset(animate = !config.reducedMotion) {
      await config.renderer.drawOverview();
      await config.renderer.zoomToPoints(
        allIndices,
        motionOptions(config.reducedMotion || !animate, 0.08),
      );
    },
  };
}


export function createIcdRequestQueue() {
  let generation = 0;
  let tail = Promise.resolve();

  return {
    enqueue(task) {
      generation += 1;
      const token = generation;
      const isCurrent = () => token === generation;
      const run = tail.catch(() => {}).then(() => task(isCurrent));
      tail = run.catch(() => {});
      return run;
    },
    cancel() {
      generation += 1;
      return tail.catch(() => {});
    },
  };
}


function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}


export async function createIcdKeywordScatter(config) {
  const data = config.data;
  const allIndices = data.map((_, index) => index);
  const chapters = [...new Set(data.map((point) => point.chapter))];
  const chapterIndex = new Map(chapters.map((chapter, index) => [chapter, index]));
  const colors = config.colors;
  const width = fitEmbeddingWidth(config.width || 1000);
  const height = Math.max(380, Math.round(width * 0.62));
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const shell = element("section", "embedding-walkthrough icd-keyword-walkthrough");
  shell.setAttribute("aria-label", "ICD Keyword Match walkthrough");

  const heading = element("div", "embedding-heading");
  const title = document.createElement("div");
  title.append(
    element("strong", "", "UMAP of ICD-10 Code Embeddings"),
    element("span", "", `${data.length.toLocaleString()} tracked codes · navigation context only`),
  );
  const vocabularyBadge = element("code", "", "Reviewed ICD vocabulary");
  heading.append(title, vocabularyBadge);
  shell.appendChild(heading);

  const frame = element("div", "embedding-frame");
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", `${data.length.toLocaleString()} ICD code embedding points`);
  canvas.tabIndex = 0;
  frame.appendChild(canvas);
  const tooltip = element("div", "embedding-tooltip");
  frame.appendChild(tooltip);
  shell.appendChild(frame);

  const controls = element("div", "embedding-controls");
  const status = element("span", "embedding-status", "Overview · waiting for an ICD Keyword Match action");
  status.setAttribute("aria-live", "polite");
  const replayButton = element("button", "embedding-button", "Replay highlight");
  replayButton.type = "button";
  replayButton.hidden = true;
  const resetButton = element("button", "embedding-button", "Reset view");
  resetButton.type = "button";
  controls.append(status, replayButton, resetButton);
  shell.appendChild(controls);

  const summary = element("aside", "embedding-summary icd-keyword-summary");
  summary.setAttribute("role", "region");
  summary.setAttribute("aria-label", "ICD Keyword Match explanation");
  summary.setAttribute("aria-live", "polite");
  summary.tabIndex = -1;
  summary.hidden = true;
  shell.appendChild(summary);

  const legend = element("div", "embedding-legend");
  chapters.forEach((chapter, index) => {
    const item = document.createElement("span");
    const marker = document.createElement("i");
    marker.style.background = colors[index % colors.length];
    item.append(marker, document.createTextNode(chapter));
    legend.appendChild(item);
  });
  shell.appendChild(legend);

  const renderer = createEmbeddingRenderer({
    data,
    xField: "umap_1",
    yField: "umap_2",
    zValues: data.map((point) => chapterIndex.get(point.chapter)),
    canvas,
    width,
    height,
    pointSize: 3,
    opacity: 0.78,
    pointColor: colors,
    createScatterplot: config.createScatterplot,
  });
  const scatterplot = renderer.scatterplot;

  async function drawOverview() {
    await renderer.drawOverview();
  }

  async function drawHighlighted(indices) {
    await renderer.drawHighlighted(indices, {
      pointColor: ["#aeb7c2", "#2c5aa0"],
      opacity: [0.1, 1],
      pointSize: [2.3, 8],
    });
  }

  const interaction = createIcdInteraction({
    data,
    reducedMotion,
    renderer: {
      drawOverview,
      drawHighlighted,
      zoomToPoints: renderer.zoomToPoints,
    },
  });
  const requestQueue = createIcdRequestQueue();
  let activeRequest = config.request || null;
  let motionActive = false;

  function showExplanation(request, result) {
    summary.replaceChildren();
    summary.setAttribute("role", "region");
    const kicker = element("div", "embedding-summary-kicker", "ICD Keyword Match");
    const title = element("h3", "", `${request.display_label} (${request.selector_label})`);
    const copy = element("p", "", result.explanation);
    const note = element(
      "p",
      "embedding-summary-note",
      "The selected points are code-embedding nodes. They are not a patient profile, diagnosis, or similarity result.",
    );
    summary.append(kicker, title, copy, note);
    summary.hidden = false;
    replayButton.hidden = false;
    vocabularyBadge.textContent = request.vocabulary_version;
    const pointNoun = result.indices.length === 1 ? "point" : "points";
    status.textContent = `${result.indices.length.toLocaleString()} ICD graph ${pointNoun} highlighted`;
    summary.focus({ preventScroll: true });
  }

  function setControlsBusy(busy) {
    resetButton.disabled = busy;
    replayButton.disabled = busy;
  }

  function focus(request, animate = !reducedMotion) {
    activeRequest = request;
    status.textContent = `Highlighting ${request.display_label} (${request.selector_label})`;
    setControlsBusy(true);
    motionActive = true;
    return requestQueue.enqueue(async (isCurrent) => {
      try {
        await interaction.reset(false);
        if (!isCurrent()) return;
        const result = await interaction.focus(request, animate);
        if (!isCurrent()) return;
        showExplanation(request, result);
      } catch (error) {
        if (!isCurrent()) return;
        summary.hidden = false;
        summary.textContent = error.message;
        summary.setAttribute("role", "alert");
        status.textContent = "The ICD request could not be shown";
      } finally {
        if (isCurrent()) {
          motionActive = false;
          setControlsBusy(false);
        }
      }
    });
  }

  function reset(message = "Overview · ICD Keyword Match reset", animate = !reducedMotion) {
    setControlsBusy(true);
    motionActive = true;
    return requestQueue.enqueue(async (isCurrent) => {
      try {
        await interaction.reset(animate);
        if (!isCurrent()) return;
        summary.hidden = true;
        summary.setAttribute("role", "region");
        replayButton.hidden = activeRequest === null;
        status.textContent = message;
      } finally {
        if (isCurrent()) {
          motionActive = false;
          setControlsBusy(false);
        }
      }
    });
  }

  replayButton.addEventListener("click", () => {
    if (activeRequest) focus(activeRequest);
  });
  resetButton.addEventListener("click", () => reset());
  scatterplot.subscribe("pointover", (index) => {
    const point = data[index];
    if (!point) return;
    tooltip.textContent = `${point.code} · ${point.chapter}`;
    tooltip.classList.add("is-visible");
  });
  scatterplot.subscribe("pointout", () => tooltip.classList.remove("is-visible"));
  canvas.addEventListener("mousemove", (event) => {
    const rect = canvas.getBoundingClientRect();
    tooltip.style.left = `${event.clientX - rect.left + 12}px`;
    tooltip.style.top = `${event.clientY - rect.top + 12}px`;
  });

  function cancelForInteraction() {
    if (motionActive) reset("Walkthrough paused by visitor interaction", false);
  }

  function cancelForVisibility() {
    if (document.hidden && motionActive) {
      reset("Walkthrough paused while this tab is hidden", false);
    }
  }

  function cancelForRouteChange() {
    requestQueue.cancel();
    motionActive = false;
  }

  canvas.addEventListener("pointerdown", cancelForInteraction);
  document.addEventListener("visibilitychange", cancelForVisibility);
  window.addEventListener("pagehide", cancelForRouteChange);

  await drawOverview();
  await scatterplot.zoomToPoints(allIndices, { padding: 0.08 });

  if (!activeRequest && config.searchQuery) {
    const query = config.searchQuery.toLowerCase();
    const searchIndices = data
      .map((point, index) => (
        point.code.toLowerCase().includes(query) || point.chapter.toLowerCase().includes(query)
          ? index
          : null
      ))
      .filter((index) => index !== null);
    if (searchIndices.length) {
      await drawHighlighted(searchIndices);
      status.textContent = `Manual search · ${searchIndices.length.toLocaleString()} matching code nodes`;
    } else {
      status.textContent = "Manual search · no matching code nodes";
    }
  }

  if (activeRequest) {
    window.setTimeout(() => focus(activeRequest, config.autoplay !== false), 80);
  }

  function destroy() {
    requestQueue.cancel();
    motionActive = false;
    document.removeEventListener("visibilitychange", cancelForVisibility);
    window.removeEventListener("pagehide", cancelForRouteChange);
  }

  shell.icdKeywordWalkthrough = { focus, reset, destroy };
  return shell;
}

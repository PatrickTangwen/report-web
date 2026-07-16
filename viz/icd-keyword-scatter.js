import {
  createEmbeddingRenderer,
  sizeEmbeddingCanvas,
} from "./embedding-renderer.js";
import {
  bindHighlightTarget,
  createHighlightController,
} from "./chart-highlighting.js";
import { bindEmbeddingTooltip } from "./grouped-embedding-explorer.js";


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
  const chapterCounts = new Map(chapters.map((chapter) => [chapter, 0]));
  data.forEach((point) => {
    chapterCounts.set(point.chapter, chapterCounts.get(point.chapter) + 1);
  });
  const chapterLabels = new Map(chapters.map((chapter) => [
    chapter,
    `${chapter} (${chapterCounts.get(chapter).toLocaleString()})`,
  ]));
  const colors = config.colors;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const shell = element("section", "embedding-explorer icd-keyword-explorer");
  shell.setAttribute("aria-label", "ICD-10 code embedding explorer");

  const heading = element("div", "embedding-heading");
  const title = document.createElement("div");
  title.append(
    element("strong", "", "UMAP of ICD-10 Code Embeddings"),
    element("span", "", `${data.length.toLocaleString()} tracked codes · navigation context only`),
  );
  const headingActions = element("div", "embedding-heading-actions");
  const vocabularyBadge = element("code", "", "Reviewed ICD vocabulary");
  const resetButton = element("button", "embedding-button embedding-reset-button", "Reset view");
  resetButton.type = "button";
  resetButton.setAttribute("aria-label", "Reset embedding selection and view");
  const status = element(
    "span",
    "embedding-status visually-hidden",
    "Overview · waiting for an ICD Keyword Match action",
  );
  status.setAttribute("aria-live", "polite");
  headingActions.append(vocabularyBadge, resetButton, status);
  heading.append(title, headingActions);
  shell.appendChild(heading);

  const frame = element("div", "embedding-frame");
  const canvas = document.createElement("canvas");
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", `${data.length.toLocaleString()} ICD code embedding points`);
  canvas.tabIndex = 0;
  frame.appendChild(canvas);
  shell.appendChild(frame);

  const legend = element("div", "embedding-legend icd-embedding-legend");
  const legendButtons = new Map();
  chapters.forEach((chapter, index) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "embedding-legend-action";
    item.setAttribute("aria-pressed", "false");
    const marker = document.createElement("i");
    marker.style.background = colors[index % colors.length];
    item.append(marker, document.createTextNode(chapterLabels.get(chapter)));
    legend.appendChild(item);
    legendButtons.set(chapter, item);
  });

  const { width, height } = sizeEmbeddingCanvas(
    shell,
    canvas,
    config.width || 1000,
  );
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

  async function drawHighlighted(indices, color = "#2c5aa0") {
    await renderer.drawHighlighted(indices, {
      pointColor: ["#aeb7c2", color],
      opacity: [0.1, 1],
      pointSize: [2.5, 3],
      select: false,
    });
  }

  const interaction = createIcdInteraction({
    data,
    reducedMotion,
    renderer: {
      drawHighlighted,
      zoomToPoints: renderer.zoomToPoints,
    },
  });
  const requestQueue = createIcdRequestQueue();
  const chapterIndices = new Map(chapters.map((chapter) => [
    chapter,
    data
      .map((point, index) => point.chapter === chapter ? index : null)
      .filter((index) => index !== null),
  ]));
  const initialRequest = config.request || null;
  let motionActive = false;
  let groupHighlight;

  groupHighlight = createHighlightController(chapters, (activeChapter) => {
    legendButtons.forEach((button, chapter) => {
      const isActive = chapter === activeChapter;
      button.classList.toggle("is-active", isActive);
      button.classList.toggle("is-muted", activeChapter !== null && !isActive);
      button.setAttribute("aria-pressed", String(groupHighlight.pinned() === chapter));
    });
    requestQueue.enqueue(async () => {
      if (activeChapter === null) {
        await drawOverview();
        return;
      }
      await drawHighlighted(
        chapterIndices.get(activeChapter),
        colors[chapterIndex.get(activeChapter) % colors.length],
      );
    });
  });
  legendButtons.forEach((button, chapter) => {
    bindHighlightTarget(button, chapter, groupHighlight, { persistent: true });
  });
  bindEmbeddingTooltip(
    frame,
    canvas,
    scatterplot,
    (index) => chapterLabels.get(data[index]?.chapter),
  );

  function showExplanation(request, result) {
    vocabularyBadge.textContent = request.vocabulary_version;
    status.textContent = result.explanation;
  }

  function setControlsBusy(busy) {
    resetButton.disabled = busy;
  }

  function focus(request, animate = !reducedMotion) {
    groupHighlight.clear();
    status.textContent = `Highlighting ${request.display_label} (${request.selector_label})`;
    setControlsBusy(true);
    motionActive = true;
    return requestQueue.enqueue(async (isCurrent) => {
      try {
        const result = await interaction.focus(request, animate);
        if (!isCurrent()) return;
        showExplanation(request, result);
      } catch (error) {
        if (!isCurrent()) return;
        status.textContent = `The ICD request could not be shown: ${error.message}`;
      } finally {
        if (isCurrent()) {
          motionActive = false;
          setControlsBusy(false);
        }
      }
    });
  }

  function reset(message = "Overview · ICD Keyword Match reset", animate = !reducedMotion) {
    groupHighlight.clear();
    setControlsBusy(true);
    motionActive = true;
    return requestQueue.enqueue(async (isCurrent) => {
      try {
        await renderer.zoomToPoints(
          allIndices,
          motionOptions(reducedMotion || !animate, 0.08),
        );
        if (!isCurrent()) return;
        status.textContent = message;
      } finally {
        if (isCurrent()) {
          motionActive = false;
          setControlsBusy(false);
        }
      }
    });
  }

  resetButton.addEventListener("click", () => reset());
  scatterplot.subscribe("select", ({ points: selected }) => {
    const pointIndex = selected?.[0];
    const chapter = data[pointIndex]?.chapter;
    if (!chapterIndex.has(chapter)) return;
    groupHighlight.select(chapter);
    scatterplot.deselect({ preventEvent: true });
  });
  canvas.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    reset();
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

  if (!initialRequest && config.searchQuery) {
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

  if (initialRequest) {
    window.setTimeout(() => focus(initialRequest, config.autoplay !== false), 80);
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

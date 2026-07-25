import {
  createEmbeddingRenderer,
  sizeEmbeddingCanvas,
} from "./embedding-renderer.js";
import {
  bindHighlightTarget,
  createHighlightController,
} from "./chart-highlighting.js";
import { bindEmbeddingTooltip } from "./grouped-embedding-explorer.js";
import {
  buildIcdIndex,
  createIcdHierarchyPanel,
} from "./icd-hierarchy-panel.js";


const CONTEXT_POINT_COLOR = "#aeb7c2";
// The picked code is drawn in ink rather than in another hue. The chapter
// palette already spans the hue circle, so only the extremes of lightness stay
// legible against whichever chapter sits underneath — which makes this the one
// chart colour that has to follow the site theme.
const PICKED_POINT_COLOR = { light: "#1b2430", dark: "#f1f5f9" };
// Same size as every other code in the chapter — colour alone marks the pick.
const PICKED_POINT_SIZE = 3;
const CHAPTER_ZOOM_PADDING = 0.25;


export function pickedPointColor(documentLike = document) {
  return documentLike.body.classList.contains("quarto-dark")
    ? PICKED_POINT_COLOR.dark
    : PICKED_POINT_COLOR.light;
}


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
  // There are more chapters than palette entries, so the palette wraps. The
  // legend swatches and the canvas have to wrap the same way: handing the
  // renderer the bare palette left the chapters past its end with no colour of
  // their own, and they came out black while their swatches said otherwise.
  const chapterColor = (chapter) => colors[chapterIndex.get(chapter) % colors.length];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const referenceIndex = buildIcdIndex(config.reference);

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
  chapters.forEach((chapter) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "embedding-legend-action";
    item.setAttribute("aria-pressed", "false");
    const marker = document.createElement("i");
    marker.style.background = chapterColor(chapter);
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
    pointColor: chapters.map(chapterColor),
    createScatterplot: config.createScatterplot,
  });
  const scatterplot = renderer.scatterplot;

  async function drawOverview() {
    await renderer.drawOverview();
  }

  async function drawHighlighted(indices, color = "#2c5aa0") {
    await renderer.drawHighlighted(indices, {
      pointColor: [CONTEXT_POINT_COLOR, color],
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
  // What the visitor picked inside the chapter being drawn — a point on the
  // canvas or a row in the hierarchy panel. It is drawn on its own colour class
  // while the rest of the chapter keeps its own colour, so the pick stays
  // findable without losing where it sits inside the chapter.
  //
  // Whoever picks stages it right before asking for the chapter, and the render
  // consumes it. Every other route to a chapter — a legend choice, a hover
  // preview, a reset — stages nothing and therefore clears the pick.
  let picked = null;
  let stagedPick = null;

  async function drawChapter(chapter) {
    const members = new Set(chapterIndices.get(chapter));
    await renderer.drawClasses(
      data.map((_, index) => {
        if (picked?.indices.has(index)) return 2;
        return members.has(index) ? 1 : 0;
      }),
      {
        pointColor: [
          CONTEXT_POINT_COLOR,
          chapterColor(chapter),
          pickedPointColor(),
        ],
        opacity: [0.1, 1, 1],
        pointSize: [2.5, 3, PICKED_POINT_SIZE],
      },
    );
  }

  // Framing the chapter leaves every other code drawn, faintly, rather than
  // filtered out: zooming back out still shows where the chapter sits in the
  // full map.
  function frameIndices(indices, options, message) {
    return requestQueue.enqueue(async (isCurrent) => {
      await renderer.zoomToPoints(indices, {
        ...motionOptions(reducedMotion, CHAPTER_ZOOM_PADDING),
        ...options,
      });
      if (!isCurrent()) return;
      status.textContent = message;
    });
  }

  function zoomToChapter(chapter, message) {
    return frameIndices(chapterIndices.get(chapter), {}, message);
  }

  groupHighlight = createHighlightController(chapters, (activeChapter) => {
    legendButtons.forEach((button, chapter) => {
      const isActive = chapter === activeChapter;
      button.classList.toggle("is-active", isActive);
      button.classList.toggle("is-muted", activeChapter !== null && !isActive);
      button.setAttribute("aria-pressed", String(groupHighlight.pinned() === chapter));
    });
    picked = stagedPick;
    stagedPick = null;
    requestQueue.enqueue(async () => {
      if (activeChapter === null) {
        await drawOverview();
        return;
      }
      await drawChapter(activeChapter);
    });
  });
  legendButtons.forEach((button, chapter) => {
    bindHighlightTarget(button, chapter, groupHighlight, { persistent: true });
    // Choosing a chapter from the legend is a group-level move, so the panel of
    // whatever code was open closes with it. Keyboard activation of a button
    // also raises `click`, so this covers both.
    button.addEventListener("click", () => {
      hierarchyPanel.hide();
      zoomToChapter(
        chapter,
        `${chapterLabels.get(chapter)} · view focused on this chapter. ` +
        "Zoom out to see where it sits in the full map.",
      );
    });
  });

  // A hierarchy row can name a structural ancestor rather than a plotted code,
  // so it hands over the selector and this resolves the points behind it. The
  // chapter those points belong to stays coloured underneath the pick, and the
  // view centres on the pick at the scale the visitor is already reading, only
  // widening when the pick does not fit: they asked to see this code, not to be
  // taken somewhere else in the chapter.
  function selectFromPanel(selection) {
    const indices = resolveIcdIndices(data, selection.selector);
    if (!indices.length) {
      status.textContent = `${selection.label} matches no ICD graph points`;
      return;
    }
    const chapter = data[indices[0]].chapter;
    hierarchyPanel.showFor(selection.code, chapter);
    stagedPick = { chapter, indices: new Set(indices) };
    groupHighlight.select(chapter);
    const pointNoun = indices.length === 1 ? "point" : "points";
    frameIndices(
      indices,
      { zoomOutOnly: true },
      `${selection.label} ${selection.description} · ` +
      `${indices.length.toLocaleString()} ICD graph ${pointNoun} marked inside ` +
      `${chapterLabels.get(chapter)}. Navigation context only; this does not ` +
      "represent patient history, diagnosis, or clinical similarity.",
    );
  }

  const hierarchyPanel = createIcdHierarchyPanel({
    index: referenceIndex,
    onSelect: selectFromPanel,
  });

  let pointerOnRightHalf = false;
  canvas.addEventListener("mousemove", (event) => {
    const rect = canvas.getBoundingClientRect();
    pointerOnRightHalf = event.clientX - rect.left > rect.width / 2;
  });

  // Hovering a point is served by the tooltip alone. The panel is a workspace a
  // click opens, not something that follows the pointer around.
  const tooltip = bindEmbeddingTooltip(
    frame,
    canvas,
    scatterplot,
    (index) => {
      const point = data[index];
      if (!point) return null;
      const reference = referenceIndex.get(point.code);
      const heading = reference ? `${reference.label} · ${reference.description}` : point.code;
      return `${heading}\n${chapterLabels.get(point.chapter)}`;
    },
  );
  tooltip.classList.add("icd-embedding-tooltip");
  frame.appendChild(hierarchyPanel.node);

  function showExplanation(request, result) {
    if (request.vocabulary_version) vocabularyBadge.textContent = request.vocabulary_version;
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

  // Resetting drops the selection, so the panel of whatever code was open goes
  // with it — the same move the legend and Escape make.
  resetButton.addEventListener("click", () => {
    hierarchyPanel.hide();
    reset();
  });
  scatterplot.subscribe("select", ({ points: selected }) => {
    const pointIndex = selected?.[0];
    const point = data[pointIndex];
    if (!chapterIndex.has(point?.chapter)) return;
    // Open the panel on the side away from the point, so it does not cover what
    // the visitor just clicked.
    hierarchyPanel.node.classList.toggle("is-left", pointerOnRightHalf);
    hierarchyPanel.showFor(point.code, point.chapter);
    // The camera stays where it is: the visitor picked this point at the zoom
    // level they chose, and reframing the whole chapter would lose it.
    stagedPick = { chapter: point.chapter, indices: new Set([pointIndex]) };
    groupHighlight.select(point.chapter);
    scatterplot.deselect({ preventEvent: true });
  });
  canvas.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    hierarchyPanel.hide();
    reset();
  });

  // The picked colour is the only chart colour that depends on the site theme,
  // so flipping the theme has to repaint whatever is on screen. Quarto carries
  // the theme as a class on the body and exposes no event for the switch.
  const themeObserver = new MutationObserver(() => {
    const chapter = groupHighlight.active();
    if (chapter === null) return;
    requestQueue.enqueue(() => drawChapter(chapter));
  });
  themeObserver.observe(document.body, { attributes: true, attributeFilter: ["class"] });

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
  await renderer.zoomToPoints(allIndices, { padding: 0.08 });

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
    hierarchyPanel.hide();
    themeObserver.disconnect();
    motionActive = false;
    document.removeEventListener("visibilitychange", cancelForVisibility);
    window.removeEventListener("pagehide", cancelForRouteChange);
  }

  shell.icdKeywordWalkthrough = { focus, reset, destroy };
  return shell;
}

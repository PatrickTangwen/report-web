// Hierarchy panel for the ICD-10 code embedding scatter plot.
//
// Clicking a point opens a panel listing the whole ICD category the point
// belongs to (A69 -> A69.1, A69.2, ...), the way a tabular ICD reference does.
// Every row is a navigation target: selecting one moves the plot to that code.
//
// The panel is only ever a workspace, never a hover preview. Hovering points is
// served by the tooltip alone: the pointer's route from a point to the panel
// crosses other points, and letting those rewrite the panel mid-journey would
// pull the row out from under the cursor.


const CATEGORY_LENGTH = 3;
const HINT = "Select a code to move the plot to it";


export function buildIcdIndex(rows) {
  const index = new Map();
  rows.forEach((row) => {
    const code = String(row.code || "").trim();
    if (!code) return;
    index.set(code, {
      code,
      label: String(row.label || code),
      description: String(row.description || ""),
      parent: String(row.parent || ""),
      kind: String(row.kind || ""),
      inPlot: String(row.in_plot) === "1",
      children: [],
    });
  });

  index.forEach((node) => {
    const parent = index.get(node.parent);
    if (parent) parent.children.push(node);
  });
  index.forEach((node) => {
    node.children.sort((left, right) => left.code.localeCompare(right.code));
  });
  return index;
}


export function categoryCodeFor(code) {
  return String(code || "").trim().slice(0, CATEGORY_LENGTH);
}


export function hierarchyRows(index, rootCode) {
  const root = index.get(rootCode);
  if (!root) return [];

  const rows = [];
  const walk = (node, depth) => {
    rows.push({ ...node, depth, hasChildren: node.children.length > 0 });
    node.children.forEach((child) => walk(child, depth + 1));
  };
  walk(root, 0);
  return rows;
}


export function selectorForNode(node) {
  return node.inPlot
    ? { type: "exact", code: node.code }
    : { type: "prefix", prefix: node.code };
}


function element(documentLike, tag, className, text) {
  const node = documentLike.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}


export function createIcdHierarchyPanel(config) {
  const documentLike = config.document || document;
  const index = config.index;

  const panel = element(documentLike, "aside", "icd-hierarchy-panel");
  panel.setAttribute("aria-label", "ICD-10 code hierarchy");
  panel.setAttribute("aria-hidden", "true");

  const head = element(documentLike, "div", "icd-hierarchy-head");
  const breadcrumb = element(documentLike, "div", "icd-hierarchy-breadcrumb");
  const title = element(documentLike, "strong", "icd-hierarchy-title", "");
  const closeButton = element(documentLike, "button", "icd-hierarchy-close", "×");
  closeButton.type = "button";
  closeButton.setAttribute("aria-label", "Close the ICD hierarchy panel");
  head.append(breadcrumb, title, closeButton);

  const tree = element(documentLike, "ul", "icd-hierarchy-tree");
  const hint = element(documentLike, "p", "icd-hierarchy-hint", HINT);
  panel.append(head, tree, hint);

  let currentCode = null;

  function hide() {
    currentCode = null;
    panel.classList.remove("is-visible");
    panel.setAttribute("aria-hidden", "true");
    // The close button lives in here, so whoever owns the control that reopens
    // the panel has to hear about it.
    config.onHide?.();
  }

  function renderBreadcrumb(node, chapter) {
    const parts = [];
    if (chapter) parts.push(element(documentLike, "span", "", chapter));

    const block = index.get(node.parent);
    if (block && block.kind === "block") {
      const blockButton = element(
        documentLike,
        "button",
        "icd-hierarchy-block",
        `${block.label} ${block.description}`,
      );
      blockButton.type = "button";
      blockButton.addEventListener("click", () => {
        config.onSelect({
          code: block.code,
          label: block.label,
          description: block.description,
          selector: {
            type: "range",
            start: block.code.slice(0, CATEGORY_LENGTH),
            end: block.code.slice(-CATEGORY_LENGTH),
          },
        });
      });
      parts.push(blockButton);
    }

    const separated = [];
    parts.forEach((part, position) => {
      if (position > 0) separated.push(element(documentLike, "span", "icd-hierarchy-sep", "›"));
      separated.push(part);
    });
    breadcrumb.replaceChildren(...separated);
  }

  function renderRow(row, activeCode) {
    const item = element(documentLike, "li", "icd-hierarchy-item");
    const button = element(documentLike, "button", "icd-hierarchy-row");
    button.type = "button";
    button.style.paddingLeft = `${0.5 + row.depth * 0.85}rem`;
    button.classList.toggle("is-current", row.code === activeCode);
    // Structural ancestors have no point of their own; selecting one highlights
    // every plotted code underneath it instead.
    button.classList.toggle("is-group", !row.inPlot);
    button.append(
      element(documentLike, "code", "icd-hierarchy-code", row.label),
      element(documentLike, "span", "icd-hierarchy-description", row.description),
    );
    button.setAttribute(
      "aria-label",
      row.inPlot
        ? `${row.label} ${row.description}`
        : `${row.label} ${row.description}, highlight all codes below it`,
    );
    button.addEventListener("click", () => {
      config.onSelect({
        code: row.code,
        label: row.label,
        description: row.description,
        selector: selectorForNode(row),
      });
    });
    item.appendChild(button);
    return item;
  }

  function showFor(code, chapter) {
    const node = index.get(code);
    const rootCode = categoryCodeFor(code);
    const root = index.get(rootCode);
    if (!root) return false;

    currentCode = code;
    title.textContent = `ICD-10 codes ${rootCode}-*`;
    renderBreadcrumb(root, chapter);
    tree.replaceChildren(
      ...hierarchyRows(index, rootCode).map((row) => renderRow(row, node ? code : rootCode)),
    );
    panel.classList.add("is-visible");
    panel.setAttribute("aria-hidden", "false");
    return true;
  }

  closeButton.addEventListener("click", hide);

  return {
    node: panel,
    showFor,
    hide,
    currentCode: () => currentCode,
  };
}

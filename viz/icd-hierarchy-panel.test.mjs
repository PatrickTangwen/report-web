import assert from "node:assert/strict";
import test from "node:test";

import {
  buildIcdIndex,
  categoryCodeFor,
  createIcdHierarchyPanel,
  hierarchyRows,
  selectorForNode,
} from "./icd-hierarchy-panel.js";
import { fakeDocument } from "./test-dom.mjs";


const reference = [
  { code: "A65-A69", label: "A65-A69", description: "Other spirochaetal diseases", parent: "", kind: "block", in_plot: "0" },
  { code: "A69", label: "A69", description: "Other spirochaetal infections", parent: "A65-A69", kind: "category", in_plot: "0" },
  { code: "A692", label: "A69.2", description: "Lyme disease", parent: "A69", kind: "subcategory", in_plot: "1" },
  { code: "A6920", label: "A69.20", description: "Lyme disease, unspecified", parent: "A692", kind: "extension", in_plot: "1" },
  { code: "A691", label: "A69.1", description: "Other Vincent's infections", parent: "A69", kind: "subcategory", in_plot: "1" },
  { code: "E11", label: "E11", description: "Type 2 diabetes mellitus", parent: "", kind: "category", in_plot: "1" },
];


function selectionRecorder() {
  const selections = [];
  return { selections, onSelect: (selection) => selections.push(selection) };
}


test("the index links every code to its parent in code order", () => {
  const index = buildIcdIndex(reference);
  assert.deepEqual(
    index.get("A69").children.map((child) => child.code),
    ["A691", "A692"],
  );
  assert.deepEqual(index.get("A692").children.map((child) => child.code), ["A6920"]);
  assert.equal(index.get("A692").inPlot, true);
  assert.equal(index.get("A69").inPlot, false);
});


test("a code resolves to the three-character category that roots its panel", () => {
  assert.equal(categoryCodeFor("A6920"), "A69");
  assert.equal(categoryCodeFor("A69"), "A69");
});


test("hierarchy rows walk the category depth-first with indentation depth", () => {
  const index = buildIcdIndex(reference);
  assert.deepEqual(
    hierarchyRows(index, "A69").map((row) => [row.code, row.depth]),
    [["A69", 0], ["A691", 1], ["A692", 1], ["A6920", 2]],
  );
  assert.deepEqual(hierarchyRows(index, "ZZZ"), []);
});


test("plotted codes select exactly, structural ancestors select by prefix", () => {
  const index = buildIcdIndex(reference);
  assert.deepEqual(selectorForNode(index.get("A692")), { type: "exact", code: "A692" });
  assert.deepEqual(selectorForNode(index.get("A69")), { type: "prefix", prefix: "A69" });
});


test("showing a code renders its whole category and marks the hovered row", () => {
  const documentLike = fakeDocument();
  const panel = createIcdHierarchyPanel({
    document: documentLike,
    index: buildIcdIndex(reference),
    ...selectionRecorder(),
  });

  assert.equal(panel.showFor("A6920", "I  Infectious"), true);
  assert.equal(panel.node.classList.contains("is-visible"), true);
  assert.equal(panel.node.getAttribute("aria-hidden"), "false");

  const [head, tree] = panel.node.children;
  assert.equal(head.children[1].textContent, "ICD-10 codes A69-*");
  assert.deepEqual(
    tree.children.map((item) => item.children[0].children[0].textContent),
    ["A69", "A69.1", "A69.2", "A69.20"],
  );

  const current = tree.children.filter((item) =>
    item.children[0].classList.contains("is-current"),
  );
  assert.equal(current.length, 1);
  assert.equal(current[0].children[0].children[0].textContent, "A69.20");
});


test("a code outside the reference table does not open the panel", () => {
  const documentLike = fakeDocument();
  const panel = createIcdHierarchyPanel({
    document: documentLike,
    index: buildIcdIndex(reference),
    ...selectionRecorder(),
  });

  assert.equal(panel.showFor("ZZ9", "Unknown"), false);
  assert.equal(panel.node.classList.contains("is-visible"), false);
});


test("selecting a row reports the code and its selector", () => {
  const documentLike = fakeDocument();
  const recorder = selectionRecorder();
  const panel = createIcdHierarchyPanel({
    document: documentLike,
    index: buildIcdIndex(reference),
    onSelect: recorder.onSelect,
  });
  panel.showFor("A692", "I  Infectious");

  const tree = panel.node.children[1];
  tree.children[0].children[0].dispatchEvent(new Event("click"));
  tree.children[2].children[0].dispatchEvent(new Event("click"));

  assert.deepEqual(recorder.selections, [
    {
      code: "A69",
      label: "A69",
      description: "Other spirochaetal infections",
      selector: { type: "prefix", prefix: "A69" },
    },
    {
      code: "A692",
      label: "A69.2",
      description: "Lyme disease",
      selector: { type: "exact", code: "A692" },
    },
  ]);
});


test("the breadcrumb offers the containing block as a range selection", () => {
  const documentLike = fakeDocument();
  const recorder = selectionRecorder();
  const panel = createIcdHierarchyPanel({
    document: documentLike,
    index: buildIcdIndex(reference),
    onSelect: recorder.onSelect,
  });
  panel.showFor("A692", "I  Infectious");

  const breadcrumb = panel.node.children[0].children[0];
  assert.deepEqual(
    breadcrumb.children.map((part) => part.textContent),
    ["I  Infectious", "›", "A65-A69 Other spirochaetal diseases"],
  );

  breadcrumb.children[2].dispatchEvent(new Event("click"));
  assert.deepEqual(recorder.selections, [
    {
      code: "A65-A69",
      label: "A65-A69",
      description: "Other spirochaetal diseases",
      selector: { type: "range", start: "A65", end: "A69" },
    },
  ]);
});


test("a category without a block shows only the chapter breadcrumb", () => {
  const documentLike = fakeDocument();
  const panel = createIcdHierarchyPanel({
    document: documentLike,
    index: buildIcdIndex(reference),
    ...selectionRecorder(),
  });
  panel.showFor("E11", "IV Endocrine/Metabolic");

  const breadcrumb = panel.node.children[0].children[0];
  assert.deepEqual(
    breadcrumb.children.map((part) => part.textContent),
    ["IV Endocrine/Metabolic"],
  );
});


test("the panel stays open until it is closed", () => {
  const documentLike = fakeDocument();
  const panel = createIcdHierarchyPanel({
    document: documentLike,
    index: buildIcdIndex(reference),
    ...selectionRecorder(),
  });

  panel.showFor("A692", "I  Infectious");
  assert.equal(panel.node.classList.contains("is-visible"), true);
  assert.equal(panel.node.getAttribute("aria-hidden"), "false");
  assert.equal(panel.currentCode(), "A692");
  assert.equal(panel.node.children[2].textContent, "Select a code to move the plot to it");

  // Showing another code replaces the rows without closing the panel.
  panel.showFor("E11", "IV Endocrine/Metabolic");
  assert.equal(panel.currentCode(), "E11");
  assert.equal(panel.node.classList.contains("is-visible"), true);

  // The close button is the visitor's way out; the plot calls `hide` for Escape
  // and for a chapter chosen from the legend.
  panel.node.children[0].children[2].dispatchEvent(new Event("click"));
  assert.equal(panel.currentCode(), null);
  assert.equal(panel.node.classList.contains("is-visible"), false);
  assert.equal(panel.node.getAttribute("aria-hidden"), "true");
});

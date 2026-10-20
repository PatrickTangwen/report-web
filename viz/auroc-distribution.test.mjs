import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  ICD_CHAPTERS,
  boxStats,
  chapterByKey,
  gaussianKde,
  icdChapterFor,
  kdeAt,
  quantileSorted,
  silvermanBandwidth,
  summariseCells,
  toLongAuroc,
} from "./auroc-distribution.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const readCsv = (file) => {
  const lines = fs.readFileSync(path.join(here, "data", file), "utf8").trim().split("\n");
  const header = lines[0].split(",");
  return lines.slice(1).map((line) => {
    const cells = line.split(",");
    return Object.fromEntries(header.map((column, i) => [column, cells[i]]));
  });
};


test("chapters are resolved from the three-character category, not the letter", () => {
  assert.equal(icdChapterFor("A045").numeral, "I");
  assert.equal(icdChapterFor("B349").numeral, "I");
  assert.equal(icdChapterFor("D48").numeral, "II");
  assert.equal(icdChapterFor("D50").numeral, "III");
  assert.equal(icdChapterFor("H59").numeral, "VII");
  assert.equal(icdChapterFor("H60").numeral, "VIII");
  assert.equal(icdChapterFor("S00").numeral, "XIX");
  assert.equal(icdChapterFor("T98").numeral, "XIX");
  assert.equal(icdChapterFor("V01").numeral, "XX");
  assert.equal(icdChapterFor("Y98").numeral, "XX");
  assert.equal(icdChapterFor("U071").numeral, "XXII");
  assert.throws(() => icdChapterFor("E95"), /outside every chapter/);
  assert.throws(() => icdChapterFor("12A"), /Not an ICD-10 code/);
  assert.equal(chapterByKey("IX").short, "Circulatory");
  assert.throws(() => chapterByKey("XXX"), /Unknown ICD-10 chapter/);
  assert.equal(ICD_CHAPTERS.length, 22);
});


test("the chapter mapping agrees with the published embedding chapters for every AUROC code", () => {
  const published = new Map(readCsv("icd_code_embeddings.csv").map((row) => [row.code, row.chapter]));
  const codes = readCsv("auroc_by_icd_baseline.csv").map((row) => row.icd);
  assert.equal(codes.length, 1632);
  codes.forEach((code) => {
    const expected = published.get(code);
    assert.ok(expected, `${code} is missing from the embedding table`);
    assert.equal(icdChapterFor(code).numeral, expected.split(" ")[0], code);
  });
});


test("the two AUROC tables cover the same codes and the long reshape keeps every cell", () => {
  const baseline = readCsv("auroc_by_icd_baseline.csv");
  const plusEnv = readCsv("auroc_by_icd_plus_env.csv");
  assert.deepEqual(baseline.map((r) => r.icd), plusEnv.map((r) => r.icd));
  const models = Object.keys(baseline[0]).filter((column) => column !== "icd");
  const typed = baseline.slice(0, 3).map((row) =>
    Object.fromEntries(Object.entries(row).map(([k, v]) => [k, k === "icd" ? v : Number(v)])),
  );
  const long = toLongAuroc(typed, models, "baseline");
  assert.equal(long.length, 3 * 17);
  assert.deepEqual(long[0], { dataset: "baseline", code: "A045", chapter: "I", model: "bilstm", auroc: 0.7219 });
  assert.throws(() => toLongAuroc([{ icd: "A045", bilstm: Number.NaN }], ["bilstm"], "x"), /Missing AUROC/);
});


test("quantiles interpolate the way R type 7 does", () => {
  assert.equal(quantileSorted([1, 2, 3, 4], 0.5), 2.5);
  assert.equal(quantileSorted([1, 2, 3, 4, 5], 0.25), 2);
  assert.equal(quantileSorted([7], 0.9), 7);
  assert.throws(() => quantileSorted([], 0.5));
});


test("box statistics follow the Tukey convention", () => {
  const stats = boxStats([0.1, 0.5, 0.52, 0.55, 0.6, 0.62, 0.65, 0.7, 0.99]);
  assert.equal(stats.n, 9);
  assert.equal(stats.median, 0.6);
  assert.equal(stats.q1, 0.52);
  assert.equal(stats.q3, 0.65);
  assert.equal(stats.whiskerLow, 0.5);
  assert.equal(stats.whiskerHigh, 0.7);
  assert.deepEqual(stats.outliers, [0.1, 0.99]);
  assert.equal(stats.min, 0.1);
  assert.equal(stats.max, 0.99);
});


test("the kernel density estimate integrates to one and peaks at the data", () => {
  const values = Array.from({ length: 400 }, (_, i) => 0.5 + 0.1 * Math.sin(i) + 0.05 * Math.cos(3 * i));
  const bandwidth = silvermanBandwidth(values);
  assert.ok(bandwidth > 0 && bandwidth < 0.1);
  const { points } = gaussianKde(values, { steps: 400, support: [-0.5, 1.5] });
  const step = points[1].x - points[0].x;
  const area = points.reduce((sum, p) => sum + p.density * step, 0);
  assert.ok(Math.abs(area - 1) < 0.01, `area ${area}`);
  const peak = points.reduce((best, p) => (p.density > best.density ? p : best));
  assert.ok(Math.abs(peak.x - 0.5) < 0.15);
  assert.ok(Math.abs(kdeAt(values, bandwidth, peak.x) - peak.density) < 1e-12);
  assert.throws(() => silvermanBandwidth([0.5]), /at least two/);
  assert.throws(() => silvermanBandwidth([0.5, 0.5, 0.5]), /spread/);
});


test("cell summaries group by chapter and model and keep outlier rows", () => {
  const rows = [
    ...[0.5, 0.52, 0.55, 0.6, 0.62, 0.65, 0.1].map((auroc, i) => ({ dataset: "b", code: `A0${i}`, chapter: "I", model: "gtn", auroc })),
    { dataset: "b", code: "C01", chapter: "II", model: "gtn", auroc: 0.8 },
    { dataset: "b", code: "A00", chapter: "I", model: "rnn", auroc: 0.4 },
  ];
  const cells = summariseCells(rows);
  assert.equal(cells.length, 3);
  const gtnI = cells.find((cell) => cell.chapter === "I" && cell.model === "gtn");
  assert.equal(gtnI.n, 7);
  assert.deepEqual(gtnI.outlierRows.map((row) => row.code), ["A06"]);
  assert.equal(cells.find((cell) => cell.chapter === "II").median, 0.8);
});

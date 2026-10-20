// Pure data helpers behind the per-ICD AUROC charts: the ICD-10 chapter
// mapping, the wide-to-long reshape, Gaussian kernel density estimates, and
// box-plot summaries. No DOM here so every function is unit-testable.

// WHO ICD-10 chapters by code range. Chapter I spans two letters (A and B),
// chapters II and III share the letter D, and VII and VIII share H, so the
// chapter is resolved from the full three-character category rather than
// from the leading letter alone.
export const ICD_CHAPTERS = [
  { numeral: "I", start: "A00", end: "B99", title: "Certain infectious and parasitic diseases", short: "Infectious" },
  { numeral: "II", start: "C00", end: "D48", title: "Neoplasms", short: "Neoplasms" },
  { numeral: "III", start: "D50", end: "D89", title: "Diseases of the blood and blood-forming organs and certain disorders involving the immune mechanism", short: "Blood / immune" },
  { numeral: "IV", start: "E00", end: "E90", title: "Endocrine, nutritional and metabolic diseases", short: "Endocrine / metabolic" },
  { numeral: "V", start: "F00", end: "F99", title: "Mental and behavioural disorders", short: "Mental / behavioural" },
  { numeral: "VI", start: "G00", end: "G99", title: "Diseases of the nervous system", short: "Nervous" },
  { numeral: "VII", start: "H00", end: "H59", title: "Diseases of the eye and adnexa", short: "Eye" },
  { numeral: "VIII", start: "H60", end: "H95", title: "Diseases of the ear and mastoid process", short: "Ear" },
  { numeral: "IX", start: "I00", end: "I99", title: "Diseases of the circulatory system", short: "Circulatory" },
  { numeral: "X", start: "J00", end: "J99", title: "Diseases of the respiratory system", short: "Respiratory" },
  { numeral: "XI", start: "K00", end: "K93", title: "Diseases of the digestive system", short: "Digestive" },
  { numeral: "XII", start: "L00", end: "L99", title: "Diseases of the skin and subcutaneous tissue", short: "Skin" },
  { numeral: "XIII", start: "M00", end: "M99", title: "Diseases of the musculoskeletal system and connective tissue", short: "Musculoskeletal" },
  { numeral: "XIV", start: "N00", end: "N99", title: "Diseases of the genitourinary system", short: "Genitourinary" },
  { numeral: "XV", start: "O00", end: "O99", title: "Pregnancy, childbirth and the puerperium", short: "Pregnancy" },
  { numeral: "XVI", start: "P00", end: "P96", title: "Certain conditions originating in the perinatal period", short: "Perinatal" },
  { numeral: "XVII", start: "Q00", end: "Q99", title: "Congenital malformations, deformations and chromosomal abnormalities", short: "Congenital" },
  { numeral: "XVIII", start: "R00", end: "R99", title: "Symptoms, signs and abnormal clinical and laboratory findings, not elsewhere classified", short: "Symptoms / signs" },
  { numeral: "XIX", start: "S00", end: "T98", title: "Injury, poisoning and certain other consequences of external causes", short: "Injury / poisoning" },
  { numeral: "XX", start: "V01", end: "Y98", title: "External causes of morbidity and mortality", short: "External causes" },
  { numeral: "XXI", start: "Z00", end: "Z99", title: "Factors influencing health status and contact with health services", short: "Health status (Z)" },
  { numeral: "XXII", start: "U00", end: "U99", title: "Codes for special purposes", short: "Special purposes (U)" },
].map((chapter) => ({
  ...chapter,
  key: chapter.numeral,
  range: `${chapter.start}–${chapter.end}`,
  label: `${chapter.numeral}. ${chapter.short}`,
}));

const CHAPTER_BY_KEY = new Map(ICD_CHAPTERS.map((chapter) => [chapter.key, chapter]));


export function icdChapterFor(code) {
  const category = String(code).trim().toUpperCase().slice(0, 3);
  if (!/^[A-Z][0-9]{2}$/.test(category)) {
    throw new Error(`Not an ICD-10 code: ${code}`);
  }
  // Three-character categories compare lexicographically within the ranges
  // above because every range starts and ends on the same letter width.
  const chapter = ICD_CHAPTERS.find((c) => category >= c.start && category <= c.end);
  if (!chapter) throw new Error(`ICD-10 code outside every chapter: ${code}`);
  return chapter;
}


export function chapterByKey(key) {
  const chapter = CHAPTER_BY_KEY.get(key);
  if (!chapter) throw new Error(`Unknown ICD-10 chapter: ${key}`);
  return chapter;
}


// Reshapes a wide table (one row per ICD code, one AUROC column per model)
// into one record per ICD code × model. `models` is the list of model
// columns to keep, in the order the caller wants them.
export function toLongAuroc(wideRows, models, dataset) {
  const rows = [];
  wideRows.forEach((row) => {
    const code = String(row.icd);
    const chapter = icdChapterFor(code);
    models.forEach((model) => {
      const auroc = row[model];
      if (typeof auroc !== "number" || Number.isNaN(auroc)) {
        throw new Error(`Missing AUROC for ${code} / ${model}`);
      }
      rows.push({ dataset, code, chapter: chapter.key, model, auroc });
    });
  });
  return rows;
}


// Type-7 quantile (linear interpolation between order statistics), the
// default in R and in d3.quantile.
export function quantileSorted(sorted, p) {
  const n = sorted.length;
  if (n === 0) throw new Error("Cannot take a quantile of no values");
  if (n === 1) return sorted[0];
  const h = (n - 1) * p;
  const lo = Math.floor(h);
  const hi = Math.ceil(h);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (h - lo);
}


function mean(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}


function standardDeviation(values) {
  if (values.length < 2) return 0;
  const m = mean(values);
  const ss = values.reduce((sum, value) => sum + (value - m) ** 2, 0);
  return Math.sqrt(ss / (values.length - 1));
}


// Tukey box-plot summary: quartiles, whiskers at the most extreme values
// within 1.5 × IQR of the box, everything beyond as outliers.
export function boxStats(values) {
  const sorted = [...values].sort((a, b) => a - b);
  if (sorted.length === 0) throw new Error("Cannot summarise no values");
  const q1 = quantileSorted(sorted, 0.25);
  const median = quantileSorted(sorted, 0.5);
  const q3 = quantileSorted(sorted, 0.75);
  const iqr = q3 - q1;
  const lowFence = q1 - 1.5 * iqr;
  const highFence = q3 + 1.5 * iqr;
  const inside = sorted.filter((value) => value >= lowFence && value <= highFence);
  return {
    n: sorted.length,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    mean: mean(sorted),
    q1,
    median,
    q3,
    iqr,
    whiskerLow: inside[0],
    whiskerHigh: inside[inside.length - 1],
    outliers: sorted.filter((value) => value < lowFence || value > highFence),
  };
}


// Silverman's rule of thumb. The IQR term guards against heavy tails and
// bimodality; when it collapses to zero the standard deviation stands alone.
export function silvermanBandwidth(values) {
  const n = values.length;
  if (n < 2) throw new Error("A kernel density estimate needs at least two values");
  const sorted = [...values].sort((a, b) => a - b);
  const sd = standardDeviation(sorted);
  const iqr = quantileSorted(sorted, 0.75) - quantileSorted(sorted, 0.25);
  const spread = iqr > 0 ? Math.min(sd, iqr / 1.34) : sd;
  if (spread <= 0) throw new Error("A kernel density estimate needs spread in the values");
  return 0.9 * spread * n ** (-1 / 5);
}


// Gaussian kernel density estimate evaluated on an evenly spaced grid.
// `support` bounds the grid; AUROC lives in [0, 1] so the caller passes that.
export function gaussianKde(values, options = {}) {
  const bandwidth = options.bandwidth ?? silvermanBandwidth(values);
  const steps = options.steps ?? 200;
  const [lo, hi] = options.support ?? [Math.min(...values), Math.max(...values)];
  const norm = 1 / (values.length * bandwidth * Math.sqrt(2 * Math.PI));
  const points = [];
  for (let i = 0; i <= steps; i += 1) {
    const x = lo + ((hi - lo) * i) / steps;
    let sum = 0;
    for (const value of values) {
      const z = (x - value) / bandwidth;
      sum += Math.exp(-0.5 * z * z);
    }
    points.push({ x, density: sum * norm });
  }
  return { bandwidth, points };
}


// Density value at an arbitrary x, used to place a selected ICD code's marker
// on its model's curve.
export function kdeAt(values, bandwidth, x) {
  const norm = 1 / (values.length * bandwidth * Math.sqrt(2 * Math.PI));
  let sum = 0;
  for (const value of values) {
    const z = (x - value) / bandwidth;
    sum += Math.exp(-0.5 * z * z);
  }
  return sum * norm;
}


// Groups long rows into one summary per (chapter, model) cell.
export function summariseCells(rows) {
  const groups = new Map();
  rows.forEach((row) => {
    const key = `${row.chapter}\u0000${row.model}`;
    if (!groups.has(key)) groups.set(key, { chapter: row.chapter, model: row.model, rows: [] });
    groups.get(key).rows.push(row);
  });
  return [...groups.values()].map((group) => {
    const stats = boxStats(group.rows.map((row) => row.auroc));
    const outlierSet = new Set(stats.outliers);
    return {
      chapter: group.chapter,
      model: group.model,
      ...stats,
      outlierRows: group.rows.filter((row) => outlierSet.has(row.auroc)),
    };
  });
}

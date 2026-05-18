# Interactive Visualization Planning Document

This document defines the architecture, design, data schemas, and implementation details for all interactive visualization pages on the ALIGATEHR-Gen research website. It is intended as a specification for LLM-assisted implementation.

---

## 1. Global Architecture

### 1.1 Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Site framework | Quarto (website project) | Page generation, navbar, theming |
| Interactive runtime | OJS (Observable JS) cells in `.qmd` files | Reactive inputs, data loading, chart rendering |
| WebGL scatter plots | regl-scatterplot | Patient UMAP (114k points), ICD Code UMAP (1,785 points) |
| Standard charts | Observable Plot / D3.js | Dot plots, bar charts, dot plots for enrichment |
| Data format | CSV | All data files served as CSV |
| Data hosting | GitHub Release assets | Large CSV files (patient embeddings, etc.) fetched at runtime |
| Styling | SCSS/CSS per STYLE_SPEC.md | Site-wide design consistency |

### 1.2 Navbar Structure

Remove the existing "Viz" tab. Add three new top-level tabs. The navbar `left` section in `_quarto.yml` becomes:

```yaml
left:
  - text: "Home"
    href: index.qmd
  - text: "Report"
    href: report/paper1.qmd
  - text: "Performance"
    href: viz/overall-performance.qmd
  - text: "Ablation"
    href: viz/ablation.qmd
  - text: "Use Case"
    href: viz/use-case.qmd
```

### 1.3 File Structure

```
viz/
├── overall-performance.qmd    # Page 1: Overall Model Performance
├── ablation.qmd               # Page 2: Ablation Study
├── use-case.qmd               # Page 3: Use Case Study
├── _ojs/                      # Shared OJS modules (optional, for reuse)
│   ├── umap-scatter.js        # Reusable regl-scatterplot wrapper
│   └── tooltip.js             # Shared tooltip component
├── data/
│   └── README.md              # Documents GitHub Release URLs and schema
├── dashboard.qmd              # (to be removed or redirected)
├── dashboard.ipynb            # (to be removed)
├── dashboard_shiny.qmd        # (already excluded from render)
└── dashboard_shiny.ipynb      # (to be removed)
```

### 1.4 Page Layout Convention

All three viz pages use a wider layout than the standard 900px body width. Each `.qmd` file should include:

```yaml
---
title: "Full Page Title"
subtitle: "One-line description"
date: last-modified
format:
  html:
    toc: true
    toc-depth: 2
    page-layout: custom
    grid:
      body-width: 1100px
      sidebar-width: 0px
      margin-width: 200px
---
```

This gives ~1100px for visualization content while keeping a right margin for TOC navigation.

### 1.5 Data Loading Pattern

All large data files are hosted as GitHub Release assets. The standard OJS loading pattern is:

```js
data = {
  const url = "https://github.com/<owner>/<repo>/releases/download/<tag>/<filename>.csv";
  const response = await fetch(url);
  const text = await response.text();
  return d3.csvParse(text, d3.autoType);
}
```

Small data files (evaluation metrics, ablation results) can live directly in `viz/data/` if under ~500KB. Large files (patient embeddings) must be hosted externally.

### 1.6 Common Interaction Patterns

These conventions apply across all pages:

| Interaction | Behavior |
|------------|----------|
| Hover tooltip | Appears on mouse-over with relevant fields; disappears on mouse-out. Light background (`#f8f9fa`), 1px border (`#dee2e6`), Source Sans Pro font, max-width 280px. |
| Zoom / Pan | Supported on all UMAP scatter plots via regl-scatterplot built-in controls. |
| Dropdown filters | Styled as standard HTML `<select>` elements. Placed above the chart they control. Label in `#2c3e50`, font-weight 500. |
| Reset view | A small "Reset" button below each zoomable chart to restore default viewport. |
| Color legend | Positioned to the right of or below the chart. Uses categorical palette for discrete variables, sequential palette for continuous variables. |

### 1.7 Color Palettes for Data Visualization

These palettes are separate from the site UI palette defined in STYLE_SPEC.md. They are specifically for encoding data variables in charts.

| Use case | Palette | Notes |
|----------|---------|-------|
| Categorical (≤10 groups) | Tableau 10 | ICD chapters (20+ groups) may need extended palette |
| Categorical (ICD chapters, ~20 groups) | d3.schemeCategory10 + d3.schemeSet3 combined | Ensure sufficient contrast between adjacent chapters |
| Sequential (age) | Viridis | Perceptually uniform, colorblind-safe |
| Diverging (delta from baseline) | RdBu | Red = performance drop, Blue = improvement |
| Binary (sex) | `["#e07b39", "#4a90d9"]` | Consistent with示意图 (orange/blue) |

---

## 2. Page 1: Overall Model Performance

### 2.1 Page Purpose

Demonstrate that the ALIGATEHR-Gen model learns clinically meaningful patient representations and outperforms baselines across diseases and metrics. The reader should come away understanding: (1) the embedding space has interpretable structure, and (2) the model achieves strong quantitative performance.

### 2.2 Page URL and Metadata

- File: `viz/overall-performance.qmd`
- Navbar label: "Performance"
- Page title: "Overall Model Performance"
- Subtitle: "Patient and Code Embeddings, Evaluation Metrics"

### 2.3 Module Layout (top to bottom)

1. Brief intro text (2-3 sentences explaining what this page shows)
2. **Patient Embedding UMAP — Coloured by Sex**
3. **Patient Embedding UMAP — Coloured by Age**
4. **ICD-10 Code Embedding UMAP**
5. **Evaluation Metrics Comparison**

Each module is separated by a Quarto section heading (`##`).

---

### 2.4 Module: Patient Embedding UMAP (×2)

Two independent UMAP scatter plots of the same 114,705 patients, stacked vertically.

#### Chart 1: Coloured by Sex

| Property | Value |
|----------|-------|
| Title | `Patient Embeddings — Coloured by Sex` |
| Subtitle | `Pre-trained EHR Encoder (UKB 114,705 patients)` |
| Renderer | regl-scatterplot (WebGL) |
| X axis | UMAP dimension 1 |
| Y axis | UMAP dimension 2 |
| Point size | 2-3px (adjustable) |
| Opacity | 0.6 |
| Color encoding | Binary: Female → `#e07b39`, Male → `#4a90d9` |
| Legend | Right side or below, showing sex labels + counts |
| Interactions | Hover tooltip, zoom, pan, reset button |

#### Chart 2: Coloured by Age

| Property | Value |
|----------|-------|
| Title | `Patient Embeddings — Coloured by Age` |
| Subtitle | `Pre-trained EHR Encoder (UKB 114,705 patients)` |
| Renderer | regl-scatterplot (WebGL) |
| X axis | UMAP dimension 1 |
| Y axis | UMAP dimension 2 |
| Point size | 2-3px |
| Opacity | 0.6 |
| Color encoding | Continuous: Viridis scale mapped to age range |
| Legend | Color bar with min/max age labels |
| Interactions | Hover tooltip, zoom, pan, reset button |

#### Tooltip (both charts)

On hover, display a small card with:

| Field | Example |
|-------|---------|
| Patient ID | `UKB-003821` |
| Age | `62` |
| Sex | `Female` |
| Primary Diagnosis | `I25 — Chronic ischaemic heart disease` |
| Disease Count | `7 diagnoses` |

#### Data File: `patient_embeddings.csv`

Hosted on GitHub Release. ~114,705 rows.

| Column | Type | Description |
|--------|------|-------------|
| `patient_id` | string | Anonymised patient identifier |
| `umap_x` | float | UMAP dimension 1 coordinate |
| `umap_y` | float | UMAP dimension 2 coordinate |
| `age` | integer | Age at baseline |
| `sex` | string | `"Male"` or `"Female"` |
| `primary_diagnosis` | string | Primary ICD-10 code (e.g., `"I25"`) |
| `primary_diagnosis_desc` | string | Description of primary ICD-10 code |
| `disease_count` | integer | Total number of distinct diagnoses |

Estimated file size: ~15-20MB raw CSV, ~3-5MB gzip transfer.

#### Implementation Notes

- Both charts share the same CSV; load it once, render twice with different color mappings.
- regl-scatterplot handles 100k+ points natively. Set `pointSize` and `opacity` to avoid visual clutter.
- Tooltip implementation: listen to regl-scatterplot's `pointover` / `pointout` events, render a positioned HTML `<div>` overlay.

---

### 2.5 Module: ICD-10 Code Embedding UMAP

#### Chart Properties

| Property | Value |
|----------|-------|
| Title | `UMAP of ICD-10 Code Embeddings` |
| Subtitle | `1,785 codes, coloured by ICD-10 chapter` |
| Renderer | regl-scatterplot (WebGL) |
| X axis | UMAP dimension 1 |
| Y axis | UMAP dimension 2 |
| Point size | 5-6px (larger than patient UMAP since fewer points) |
| Opacity | 0.8 |
| Color encoding | Categorical by ICD-10 chapter (A–Z, ~20 categories) |
| Legend | Below chart, multi-column layout showing chapter letter + name + count |
| Interactions | Hover tooltip, zoom, pan, reset button, **search box** |

#### Search Box

- Placed above the chart.
- Text input with placeholder: `Search ICD code or description...`
- On input, filter matching codes and highlight them on the chart (full opacity + increased size), while dimming non-matching points (opacity → 0.1).
- Matching logic: case-insensitive substring match on `icd_code` OR `description`.
- Clear button (×) to reset highlighting.

#### Tooltip

| Field | Example |
|-------|---------|
| ICD Code | `E11` |
| Description | `Type 2 diabetes mellitus` |
| ICD Chapter | `E: Endocrine, nutritional and metabolic diseases` |
| Frequency | `12,453 patients` |

#### Data File: `icd_code_embeddings.csv`

Can live in `viz/data/` (small file, ~1,785 rows, <200KB).

| Column | Type | Description |
|--------|------|-------------|
| `icd_code` | string | ICD-10 code (e.g., `"E11"`) |
| `description` | string | Full text description |
| `icd_chapter` | string | Chapter letter (e.g., `"E"`) |
| `icd_chapter_name` | string | Chapter full name (e.g., `"Endocrine, nutritional and metabolic diseases"`) |
| `frequency` | integer | Number of patients with this code in the cohort |
| `umap_x` | float | UMAP dimension 1 coordinate |
| `umap_y` | float | UMAP dimension 2 coordinate |

#### Implementation Notes

- Search filtering: use regl-scatterplot's `filter` or re-render with updated opacity/size arrays based on search input.
- Legend for ~20 ICD chapters will be tall; use a multi-column layout (3-4 columns) below the chart.
- Point labels: optionally show text labels for notable codes when zoomed in (TBD — depends on regl-scatterplot text annotation support; may require a D3 SVG overlay).

---

### 2.6 Module: Evaluation Metrics Comparison

#### Chart Properties

| Property | Value |
|----------|-------|
| Title | `Model Performance Comparison` |
| Chart type | Dot plot with optional error bars |
| Renderer | Observable Plot (or D3.js) |
| X axis | Metric value (e.g., 0.5–1.0 for AUROC) |
| Y axis | Disease name (categorical, 7 diseases) |
| Point encoding | Each model is a distinct color/shape |
| Error bars | Horizontal lines from `ci_lower` to `ci_upper` (if available) |
| Legend | Below chart, showing model name + color/shape |

#### Controls

- **Metric dropdown**: Switch between AUROC, AUPRC, F1, Precision, Recall, etc.
- Default view: AUROC

#### Visual Design

- The proposed model (ALIGATEHR-Gen) should be visually distinguished: use `#2c5aa0` (primary color) + filled circle, while baselines use gray-scale or muted colors + open shapes.
- Y axis diseases sorted by proposed model's performance (descending) for each metric.
- Grid lines: light horizontal lines at each disease row for readability.
- If CI data is available, error bars render; if not, only dots are shown. No visual glitch either way.

#### Tooltip

| Field | Example |
|-------|---------|
| Model | `ALIGATEHR-Gen` |
| Disease | `Type 2 Diabetes` |
| Metric | `AUROC` |
| Value | `0.847` |
| CI | `[0.831, 0.863]` (if available) |

#### Data File: `evaluation_metrics.csv`

Can live in `viz/data/` (small file, ~10 models × 7 diseases × ~5 metrics = ~350 rows).

| Column | Type | Description |
|--------|------|-------------|
| `model` | string | Model name (e.g., `"ALIGATEHR-Gen"`, `"XGBoost"`) |
| `disease` | string | Disease name (e.g., `"Type 2 Diabetes"`) |
| `metric` | string | Metric name (e.g., `"AUROC"`) |
| `value` | float | Metric value |
| `ci_lower` | float (nullable) | Lower bound of confidence interval |
| `ci_upper` | float (nullable) | Upper bound of confidence interval |
| `is_proposed` | boolean | `true` for ALIGATEHR-Gen, `false` for baselines |

#### Implementation Notes

- Observable Plot's `dot` mark + `ruleX` mark (for error bars) handles this cleanly.
- Use `Plot.plot({ facet: ... })` if small-multiples layout is preferred later.
- The dropdown triggers OJS reactivity: `viewof selectedMetric = Inputs.select(...)`, then the chart re-renders with filtered data.

---

## 3. Page 2: Ablation Study

### 3.1 Page Purpose

Show how each architectural component of ALIGATEHR-Gen contributes to overall performance. The reader should understand which modules are most critical (largest performance drop when removed) and why the full model design is justified.

### 3.2 Page URL and Metadata

- File: `viz/ablation.qmd`
- Navbar label: "Ablation"
- Page title: "Ablation Study"
- Subtitle: "Component Contribution Analysis"

### 3.3 Module Layout

1. Brief intro text explaining the ablation setup
2. **Ablation Delta Chart**

---

### 3.4 Module: Ablation Delta Chart

#### Chart Properties

| Property | Value |
|----------|-------|
| Title | `Performance Impact of Removing Model Components` |
| Chart type | Grouped horizontal bar chart showing delta from full model |
| Renderer | Observable Plot (or D3.js) |
| X axis | Delta metric value (e.g., -0.05 to +0.01) |
| Y axis | Ablation variant name (categorical, 5-6 variants) |
| Color encoding | Diverging RdBu — red for negative delta (performance drop), blue for improvement |
| Reference line | Vertical line at x=0 (full model baseline) |

#### Controls

- **Disease dropdown**: Switch between 7 diseases. Default: first disease alphabetically, or a representative disease.
- **Metric dropdown**: Switch between AUROC, AUPRC, F1, etc. Default: AUROC.

#### Visual Design

- Bars extend left from x=0 for negative deltas (most bars should go left, indicating performance drops).
- Sort variants by delta magnitude (largest drop at top) for the currently selected disease + metric.
- Each bar is labeled with the exact delta value at its end (e.g., `-0.032`).
- A light annotation area below the chart can optionally display a one-sentence interpretation of the main ablation finding for the selected disease (TBD — can be a static text block per disease, or omitted).

#### Tooltip

| Field | Example |
|-------|---------|
| Variant | `w/o Genetic Data` |
| Disease | `Type 2 Diabetes` |
| Metric | `AUROC` |
| Full Model Value | `0.847` |
| Variant Value | `0.815` |
| Delta | `-0.032` |

#### Data File: `ablation_results.csv`

Can live in `viz/data/` (small file, ~5-6 variants × 7 diseases × ~5 metrics = ~210 rows).

| Column | Type | Description |
|--------|------|-------------|
| `variant` | string | Ablation variant name (e.g., `"w/o Genetic Data"`, `"w/o Ontology"`, `"w/o Attention"`) |
| `disease` | string | Disease name |
| `metric` | string | Metric name |
| `value` | float | Metric value for this variant |
| `full_model_value` | float | Metric value for the full model (same disease + metric) |
| `delta` | float | `value - full_model_value` (negative means performance drop) |

#### Implementation Notes

- Observable Plot's `barX` mark with `fill` mapped to sign of delta works well here.
- Delta can be computed client-side from `value` and `full_model_value`, but pre-computing in the CSV makes the OJS code simpler.
- Sorting by delta magnitude: use `Plot.sort` or pre-sort in OJS with `d3.sort`.

---

## 4. Page 3: Use Case Study

### 4.1 Page Purpose

Demonstrate the clinical utility and interpretability of ALIGATEHR-Gen through a focused case study on 7 fibrotic diseases. The reader should see that the model can (1) separate fibrotic disease subtypes in embedding space, (2) identify disease-specific risk factors, and (3) reveal enriched biological pathways.

### 4.2 Page URL and Metadata

- File: `viz/use-case.qmd`
- Navbar label: "Use Case"
- Page title: "Use Case Study"
- Subtitle: "Fibrotic Disease Analysis"

### 4.3 Module Layout

1. Brief intro text explaining the 7 fibrotic diseases case study
2. **Fibrotic Disease Patient Embedding UMAP**
3. **Risk Factor Ranking**
4. **Pathway Enrichment Analysis**

---

### 4.4 Module: Fibrotic Disease Patient Embedding UMAP

#### Chart Properties

| Property | Value |
|----------|-------|
| Title | `Patient Embeddings — 7 Fibrotic Diseases` |
| Subtitle | `Coloured by true first-onset fibrotic disease` |
| Renderer | regl-scatterplot (WebGL) |
| X axis | UMAP (or t-SNE) dimension 1 |
| Y axis | UMAP (or t-SNE) dimension 2 |
| Point size | 3-4px |
| Opacity | 0.7 |
| Color encoding | 7-class categorical palette (one color per fibrotic disease) |
| Legend | Right side or below, showing disease name + count |
| Interactions | Hover tooltip, zoom, pan, reset button |

#### 7 Fibrotic Diseases

Based on示意图:

1. CKD (Chronic Kidney Disease)
2. IPF (Idiopathic Pulmonary Fibrosis)
3. NASH (Non-alcoholic Steatohepatitis)
4. Pulmonary Fibrosis (non-IPF)
5. SSc / Connective Tissue
6. Crohn's Disease
7. Fibrosis of Skin

Use a 7-color categorical palette with high inter-color contrast. Suggested: a subset of Tableau 10 or a manually curated palette ensuring colorblind safety.

#### Tooltip

| Field | Example |
|-------|---------|
| Patient ID | `UKB-018472` |
| Age | `55` |
| Sex | `Male` |
| Fibrotic Disease | `NASH` |
| Primary Diagnosis | `K75 — Other inflammatory liver diseases` |
| Disease Count | `4 diagnoses` |

#### Data File: `fibrotic_patient_embeddings.csv`

Hosted on GitHub Release (subset of patients, but could still be thousands of rows).

| Column | Type | Description |
|--------|------|-------------|
| `patient_id` | string | Anonymised patient identifier |
| `umap_x` | float | Dimension 1 coordinate |
| `umap_y` | float | Dimension 2 coordinate |
| `age` | integer | Age at baseline |
| `sex` | string | `"Male"` or `"Female"` |
| `fibrotic_disease` | string | One of the 7 fibrotic disease labels |
| `primary_diagnosis` | string | Primary ICD-10 code |
| `primary_diagnosis_desc` | string | Description of primary ICD-10 code |
| `disease_count` | integer | Total number of distinct diagnoses |

#### Implementation Notes

- This chart reuses the same regl-scatterplot wrapper as Page 1's Patient UMAP.
- The data file is a separate CSV (not a subset of the 114k file) because it may use different dimensionality reduction coordinates (t-SNE vs UMAP) and contains the `fibrotic_disease` column.
- If the subset is small enough (< 10k rows, < 1MB), it can live in `viz/data/` instead of GitHub Release.

---

### 4.5 Module: Risk Factor Ranking

#### Chart Properties

| Property | Value |
|----------|-------|
| Title | `Top Risk Factors by Disease` |
| Chart type | Horizontal bar chart (lollipop variant) |
| Renderer | Observable Plot (or D3.js) |
| X axis | Importance score |
| Y axis | Feature name (categorical, top N features) |
| Color encoding | Single color `#2c5aa0` for all bars |
| Display | Top 15 features by default |

#### Controls

- **Disease dropdown**: Switch between 7 fibrotic diseases. Default: CKD (most prevalent).

#### Visual Design

- Bars sorted by importance score (highest at top).
- Feature names on the Y axis should be human-readable (e.g., "Systolic Blood Pressure" not "sbp_mean").
- A subtle grid on the X axis for readability.
- No patient-level or local explanation — global importance only.

#### Tooltip

| Field | Example |
|-------|---------|
| Feature | `Systolic Blood Pressure` |
| Importance Score | `0.142` |
| Rank | `#1` |
| Disease | `CKD` |

#### Data File: `feature_importance.csv`

Can live in `viz/data/` (small file, ~7 diseases × ~50 features = ~350 rows).

| Column | Type | Description |
|--------|------|-------------|
| `disease` | string | Fibrotic disease name |
| `feature` | string | Human-readable feature name |
| `importance_score` | float | Global feature importance score |
| `rank` | integer | Rank within this disease (1 = most important) |

#### Implementation Notes

- Observable Plot's `barX` mark handles this directly.
- Filter to top 15 per disease in OJS: `data.filter(d => d.disease === selected && d.rank <= 15)`.
- Consider adding a slider to adjust the top-N cutoff (e.g., 10–30), but this is a nice-to-have.

---

### 4.6 Module: Pathway Enrichment Analysis

#### Chart Properties

| Property | Value |
|----------|-------|
| Title | `Pathway Enrichment Analysis` |
| Chart type | Enrichment dot plot |
| Renderer | Observable Plot (or D3.js) |
| X axis | Enrichment ratio (or gene ratio) |
| Y axis | Pathway name (categorical, top N pathways) |
| Point size | Mapped to `gene_count` (larger = more genes) |
| Point color | Mapped to `-log10(p_adjusted)` — sequential palette (e.g., Viridis or YlOrRd) |

#### Controls

- **Disease dropdown**: Switch between 7 fibrotic diseases. Default: CKD.

#### Visual Design

- Show top 15 pathways by significance (lowest adjusted p-value) for the selected disease.
- Y axis pathway names can be long; allow sufficient width or truncate with full name in tooltip.
- Size legend (gene count) and color legend (-log10 adjusted p-value) positioned below the chart.
- Classic enrichment dot plot style as seen in clusterProfiler / enrichplot R packages.

#### Tooltip

| Field | Example |
|-------|---------|
| Pathway | `PI3K-Akt signaling pathway` |
| Source | `KEGG` |
| Gene Count | `24` |
| Enrichment Ratio | `2.31` |
| P-value | `1.2e-05` |
| Adjusted P-value | `3.4e-04` |
| Disease | `CKD` |

#### Data File: `pathway_enrichment.csv`

Can live in `viz/data/` (small file, ~7 diseases × ~50 pathways = ~350 rows).

| Column | Type | Description |
|--------|------|-------------|
| `disease` | string | Fibrotic disease name |
| `pathway` | string | Pathway name |
| `source` | string | Database source (e.g., `"KEGG"`, `"Reactome"`, `"GO_BP"`) |
| `gene_count` | integer | Number of genes in overlap |
| `enrichment_ratio` | float | Observed/expected gene ratio |
| `p_value` | float | Raw p-value |
| `p_adjusted` | float | Multiple-testing-adjusted p-value (BH or similar) |
| `rank` | integer | Rank by `p_adjusted` within this disease |

#### Implementation Notes

- Observable Plot's `dot` mark with `r` (radius) mapped to gene_count and `fill` mapped to -log10(p_adjusted) creates the classic enrichment dot plot.
- Y axis labels: use `Plot.text` or CSS to handle long pathway names (consider max 60 characters with ellipsis).
- Gene count size scale: map to a reasonable range (e.g., 4px–16px radius) to avoid oversized dots.

---

## 5. Data Files Summary

| File | Location | Rows (est.) | Size (est.) | Used by |
|------|----------|-------------|-------------|---------|
| `patient_embeddings.csv` | GitHub Release | ~114,705 | ~15-20MB | Page 1: Patient UMAP ×2 |
| `icd_code_embeddings.csv` | `viz/data/` | ~1,785 | ~150KB | Page 1: ICD Code UMAP |
| `evaluation_metrics.csv` | `viz/data/` | ~350 | ~20KB | Page 1: Evaluation Metrics |
| `ablation_results.csv` | `viz/data/` | ~210 | ~15KB | Page 2: Ablation Delta Chart |
| `fibrotic_patient_embeddings.csv` | GitHub Release or `viz/data/` | TBD | TBD | Page 3: Fibrotic UMAP |
| `feature_importance.csv` | `viz/data/` | ~350 | ~25KB | Page 3: Risk Factor Ranking |
| `pathway_enrichment.csv` | `viz/data/` | ~350 | ~30KB | Page 3: Pathway Enrichment |

---

## 6. Implementation Milestones

### Phase 1: Scaffolding

- Create the three `.qmd` files with correct YAML frontmatter.
- Update `_quarto.yml` navbar: remove "Viz" tab, add "Performance", "Ablation", "Use Case".
- Add placeholder content (section headings, intro text, empty OJS cells).
- Verify site builds and navbar works.

**Deliverable**: Three new pages accessible from navbar, no interactive content yet.

### Phase 2: Data Preparation

- Define and export all CSV files per the schemas above.
- Upload `patient_embeddings.csv` (and `fibrotic_patient_embeddings.csv` if large) to a GitHub Release.
- Place small CSV files in `viz/data/`.
- Verify all files load correctly via `fetch()` in a test OJS cell.

**Deliverable**: All data files available and loadable.

### Phase 3: Page 1 — Overall Model Performance

- Implement Patient UMAP ×2 with regl-scatterplot (color by sex, color by age).
- Implement ICD Code UMAP with regl-scatterplot + search box.
- Implement Evaluation Metrics dot plot with Observable Plot + metric dropdown.
- Add tooltips to all charts.
- Test zoom/pan, tooltip positioning, search functionality.

**Deliverable**: Page 1 fully interactive.

### Phase 4: Page 2 — Ablation Study

- Implement Ablation Delta Chart with Observable Plot.
- Add disease + metric dropdowns.
- Style bars with diverging color scale.
- Add delta value labels.

**Deliverable**: Page 2 fully interactive.

### Phase 5: Page 3 — Use Case Study

- Implement Fibrotic Disease UMAP (reuse regl-scatterplot wrapper from Page 1).
- Implement Risk Factor Ranking horizontal bar chart.
- Implement Pathway Enrichment dot plot.
- Add disease dropdowns to all three modules.

**Deliverable**: Page 3 fully interactive.

### Phase 6: Polish and Performance

- Test all pages with real data at full scale (114k points).
- Optimize tooltip responsiveness on large scatter plots.
- Verify dark mode compatibility for all charts.
- Test responsive behavior on smaller screens.
- Review color contrast and colorblind accessibility.
- Clean up removed files (`dashboard.qmd`, `dashboard.ipynb`, etc.).

**Deliverable**: Production-ready interactive visualization pages.

---

## 7. Technical Risks and Mitigations

| Risk | Mitigation |
|------|-----------|
| regl-scatterplot not compatible with OJS cell lifecycle | Test early in Phase 3 with a minimal example. Fallback: use deck.gl ScatterplotLayer or Plotly scattergl. |
| 114k points tooltip hover performance (finding nearest point) | regl-scatterplot has built-in spatial indexing. If too slow, implement kd-tree lookup. |
| GitHub Release asset CORS issues | GitHub Release download URLs should work with `fetch()`. If CORS blocks, use a raw.githubusercontent.com proxy or download-redirect URL. |
| Dark mode breaks chart colors | Use CSS custom properties for tooltip styling. Chart colors (data encoding) are set in JS and should not change with dark mode — only background/text colors need adapting. Set regl-scatterplot `backgroundColor` reactively based on theme. |
| Long pathway names overflow Y axis | Truncate to 60 characters with `…` in the chart, show full name in tooltip. |

---

## 8. Privacy Considerations

- All patient IDs must be anonymised (e.g., `UKB-XXXXXX` format, not real NHS/UKB identifiers).
- Tooltips show only aggregate or de-identified information.
- No combination of displayed fields should allow re-identification.
- Feature importance results should not be presented as causal claims — add a brief note on each relevant page.
- Clinical interpretations must align with findings reported in the paper.

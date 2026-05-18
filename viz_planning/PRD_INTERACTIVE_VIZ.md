# PRD: Interactive Visualization Pages for ALIGATEHR-Gen Website

## Problem Statement

The ALIGATEHR-Gen research website currently has only a placeholder visualization page (`viz/dashboard.qmd`) with no interactive content. Readers of the paper have no way to explore the model's patient embeddings, ICD code embeddings, performance comparisons, ablation results, or clinical use case findings interactively. The static figures in the paper cannot convey the richness of the learned representations or allow readers to drill into specific diseases, patients, or model components.

## Solution

Build three interactive visualization pages — **Overall Model Performance**, **Ablation Study**, and **Use Case Study** — using OJS (Observable JS) cells embedded in Quarto `.qmd` files. Each page is a top-level navbar tab. Large-scale scatter plots (up to 114k patients) use WebGL via regl-scatterplot; standard charts (dot plots, bar charts, enrichment plots) use Observable Plot. Data is served as CSV files, with large files hosted on GitHub Release assets and small files in `viz/data/`.

## User Stories

1. As a researcher, I want to see a UMAP of 114k patient embeddings coloured by sex, so that I can verify the model captures biological sex structure in the representation space.
2. As a researcher, I want to see a UMAP of 114k patient embeddings coloured by age (continuous scale), so that I can assess whether the embedding encodes aging-related clinical patterns.
3. As a researcher, I want to hover over any patient point on the UMAP and see their anonymised ID, age, sex, primary diagnosis, and disease count, so that I can inspect individual-level information without leaving the chart.
4. As a researcher, I want to zoom into and pan across the patient UMAP, so that I can examine dense clusters at higher resolution.
5. As a researcher, I want to reset the UMAP viewport to default, so that I can return to the overview after zooming in.
6. As a researcher, I want to see a UMAP of 1,785 ICD-10 code embeddings coloured by ICD chapter, so that I can assess whether the model captures medical ontology structure.
7. As a researcher, I want to search for a specific ICD code or keyword in the ICD UMAP, so that I can locate codes of interest without manually scanning 1,785 points.
8. As a researcher, I want matching codes highlighted and non-matching codes dimmed when I search, so that I can visually identify where relevant codes sit in the embedding space.
9. As a researcher, I want to hover over any ICD code point and see the code, description, chapter, and patient frequency, so that I can understand what each point represents.
10. As a researcher, I want to compare model performance across ~10 models and 7 diseases via a dot plot with error bars, so that I can assess the proposed model's advantage over baselines.
11. As a researcher, I want to switch between different evaluation metrics (AUROC, AUPRC, F1, etc.) via a dropdown, so that I can examine performance across multiple criteria.
12. As a researcher, I want the proposed model visually distinguished from baselines in the dot plot, so that I can immediately identify it.
13. As a researcher, I want to see confidence intervals on the dot plot when available, so that I can judge the statistical significance of performance differences.
14. As a researcher, I want to see a delta bar chart showing how removing each model component affects performance, so that I can understand which architectural choices matter most.
15. As a researcher, I want to switch between diseases and metrics on the ablation chart, so that I can check whether component importance varies across conditions.
16. As a researcher, I want bars sorted by delta magnitude, so that the most impactful components are immediately visible at the top.
17. As a researcher, I want to see exact delta values labelled on each bar, so that I can quantify the performance impact without relying on visual estimation.
18. As a researcher, I want to see a UMAP of fibrotic disease patients coloured by their 7 disease subtypes, so that I can assess whether the model separates distinct fibrotic conditions.
19. As a researcher, I want to hover over fibrotic disease patients and see their disease subtype alongside standard patient info, so that I can inspect individual cases.
20. As a researcher, I want to see a ranked bar chart of top risk factors per fibrotic disease, so that I can identify which features the model considers most predictive.
21. As a researcher, I want to switch between 7 fibrotic diseases in the risk factor chart, so that I can compare disease-specific risk profiles.
22. As a researcher, I want to see a pathway enrichment dot plot showing enriched biological pathways per disease, so that I can connect model predictions to known biology.
23. As a researcher, I want pathway dots sized by gene count and coloured by significance, so that I can quickly identify the most meaningful enrichments.
24. As a researcher, I want to switch between diseases on the enrichment plot, so that I can compare pathway-level findings across fibrotic conditions.
25. As a researcher, I want all visualizations to work in both light and dark mode, so that the experience is consistent regardless of my theme preference.
26. As a researcher, I want the viz pages to have a wider layout than the 900px body text, so that scatter plots and charts have sufficient space.

## Implementation Decisions

### Site structure

- Remove the existing "Viz" navbar tab. Add three new top-level tabs: "Performance", "Ablation", "Use Case".
- Create three new files: `viz/overall-performance.qmd`, `viz/ablation.qmd`, `viz/use-case.qmd`.
- Remove or archive the existing placeholder files: `viz/dashboard.qmd`, `viz/dashboard.ipynb`.
- Viz pages use `page-layout: custom` with ~1100px body width and reduced/no sidebar, breaking from the standard 900px layout used on content pages.

### Technology stack

- All interactivity is implemented via OJS (Observable JS) code cells in `.qmd` files. No Shiny server required — the site remains fully static.
- WebGL scatter plots (patient UMAPs, ICD UMAP) use **regl-scatterplot**.
- Standard charts (evaluation dot plot, ablation bar chart, risk factor bars, enrichment dot plot) use **Observable Plot**.
- Data is parsed with **d3-dsv** (`d3.csvParse` with `d3.autoType`).

### Reusable modules

- **regl-scatterplot OJS wrapper**: encapsulates initialization, point color/size/opacity configuration, tooltip event binding (`pointover` / `pointout`), zoom/pan, and reset. Used by Page 1 (Patient UMAP ×2, ICD UMAP) and Page 3 (Fibrotic UMAP).
- **ICD search module**: text input that filters ICD code points by substring match on code or description, adjusting opacity/size arrays to highlight matches and dim non-matches.
- **Tooltip component**: a shared HTML `<div>` overlay positioned near the cursor. Styled per STYLE_SPEC: `#f8f9fa` background, `1px solid #dee2e6` border, Source Sans Pro font, max-width 280px.
- **Data loading module**: a standard OJS pattern for fetching CSV from GitHub Release URLs or local `viz/data/` paths.

### Data hosting

- Large files (patient embeddings ~15-20MB) are hosted as **GitHub Release assets** and fetched at runtime via `fetch()`.
- Small files (<500KB: evaluation metrics, ablation results, ICD embeddings, feature importance, pathway enrichment) live in `viz/data/`.
- All data files are CSV format.

### Data schemas

Seven CSV files, each with defined column names and types:

- `patient_embeddings.csv` (~114k rows): `patient_id`, `umap_x`, `umap_y`, `age`, `sex`, `primary_diagnosis`, `primary_diagnosis_desc`, `disease_count`
- `icd_code_embeddings.csv` (~1,785 rows): `icd_code`, `description`, `icd_chapter`, `icd_chapter_name`, `frequency`, `umap_x`, `umap_y`
- `evaluation_metrics.csv` (~350 rows): `model`, `disease`, `metric`, `value`, `ci_lower` (nullable), `ci_upper` (nullable), `is_proposed`
- `ablation_results.csv` (~210 rows): `variant`, `disease`, `metric`, `value`, `full_model_value`, `delta`
- `fibrotic_patient_embeddings.csv` (TBD rows): `patient_id`, `umap_x`, `umap_y`, `age`, `sex`, `fibrotic_disease`, `primary_diagnosis`, `primary_diagnosis_desc`, `disease_count`
- `feature_importance.csv` (~350 rows): `disease`, `feature`, `importance_score`, `rank`
- `pathway_enrichment.csv` (~350 rows): `disease`, `pathway`, `source`, `gene_count`, `enrichment_ratio`, `p_value`, `p_adjusted`, `rank`

### Chart-specific decisions

- **Patient UMAP**: two independent charts stacked vertically (not side-by-side). Chart 1 coloured by sex (binary: orange/blue). Chart 2 coloured by age (Viridis continuous scale). No cross-chart linking.
- **ICD UMAP**: coloured by ~20 ICD chapters. Search box above chart with case-insensitive substring matching. Matched points go full opacity + enlarged; unmatched dim to 0.1 opacity.
- **Evaluation Metrics**: dot plot + optional error bars. Proposed model rendered in `#2c5aa0` filled circle; baselines in muted colors + open shapes. Dropdown to switch metric. CI fields are optional — chart renders cleanly with or without them.
- **Ablation Delta Chart**: horizontal grouped bar chart. X axis is delta from full model (negative = performance drop). Bars coloured with RdBu diverging scale. Sorted by delta magnitude. Exact delta values labelled on bars. Two dropdowns: disease + metric.
- **Fibrotic UMAP**: reuses the same regl-scatterplot wrapper. 7-color categorical palette. Tooltip adds `fibrotic_disease` field.
- **Risk Factor Ranking**: horizontal bar chart, top 15 features, single color `#2c5aa0`. Dropdown to switch disease.
- **Pathway Enrichment**: classic enrichment dot plot. X = enrichment ratio, Y = pathway name (top 15 by significance), dot size = gene count, dot color = -log10(p_adjusted). Dropdown to switch disease.

### Color palettes (data encoding only, separate from UI palette)

- Binary (sex): `["#e07b39", "#4a90d9"]`
- Continuous (age): Viridis
- Categorical ≤10: Tableau 10
- Categorical ~20 (ICD chapters): d3.schemeCategory10 + d3.schemeSet3
- Diverging (ablation delta): RdBu
- Sequential (enrichment significance): Viridis or YlOrRd

## Testing Decisions

No automated tests for this implementation. The project is a Quarto static site with OJS cells — there is no test framework in place, and the visualizations are best verified by manual inspection in the browser.

Verification approach:
- Each page is visually inspected in `quarto preview` after implementation.
- Check: all charts render with data, tooltips appear on hover, dropdowns switch correctly, zoom/pan/reset work, search box filters correctly.
- Check: dark mode does not break chart readability.
- Check: 114k point scatter plot renders without freezing or excessive load time.

## Out of Scope

- **Patient detail panel on click**: no click-to-expand per-patient sidebar. Hover tooltip only.
- **Cross-chart linking**: no linked brushing or coordinated views between charts on the same page.
- **Patient-level local explanations**: risk factor ranking is global-level only, not per-patient.
- **Shiny server deployment**: all pages are static. No server-side computation.
- **Data pipeline**: this PRD covers the frontend visualization only. Data export scripts and model training are separate concerns.
- **Mobile-optimized layout**: responsive down to tablet is nice-to-have, but mobile scatter plot interaction is not a target.
- **Animated transitions**: no animated transitions between dropdown selections or chart states.

## Further Notes

- The full technical specification (including per-module chart properties, tooltip field tables, and implementation notes) is in `viz_planning/INTERACTIVE_VIZ_PLAN.md`.
- Model architecture may change in future iterations. The visualization design is intentionally modular — each chart reads a single CSV with a defined schema. If the model changes, only the data export step changes; the frontend code remains the same as long as the schema is respected.
- Privacy: all patient IDs must be anonymised. No field combination should allow re-identification. Feature importance must not be presented as causal.
- The 7 fibrotic diseases in the use case are: CKD, IPF, NASH, Pulmonary Fibrosis, SSc/Connective Tissue, Crohn's Disease, Fibrosis of Skin. This list may be updated as the paper evolves.

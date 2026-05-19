# ALIGATEHR-Gen Research Website

A Quarto-based academic website for the ALIGATEHR-Gen project — a graph attention network integrating EHR, genetic data, and medical ontology for disease risk prediction in the UK Biobank.

Paper: "Multimodal Data Integration Improves Disease Risk Prediction in the UK Biobank" by Xiayuan Huang, Hang Zhou, Yitao Hong, Xin Zhou, Johann de Jong, Zuoheng Wang (Yale University & UCB Biosciences).

## Status

### Completed

- [x] Quarto website scaffolding (homepage hero, navbar, dual theme)
- [x] Full paper content in `report/paper1.qmd` with Nature-style citations
- [x] Page 1 — Overall Performance: Patient UMAP (sex/age via regl-scatterplot), ICD UMAP with search, Evaluation Metrics dot plot
- [x] Page 2 — Ablation Study: Delta bar chart with disease/metric dropdown selectors
- [x] Page 3 — Use Case: Fibrotic patient UMAP, Risk Factor bar chart, Pathway Enrichment dot plot
- [x] Mock CSV data for all visualizations (7 files in `viz/data/`)
- [x] Dark mode support for all OJS charts (SVG + WebGL)
- [x] Old Shiny dashboard files removed

### TODO

**Data**
- [ ] Replace mock CSVs with real experimental data
- [ ] Validate data schemas against `viz_planning/INTERACTIVE_VIZ_PLAN.md`

**Deployment**
- [ ] Configure GitHub Pages (or Netlify) for static hosting
- [ ] Set up GitHub Actions for auto-render on push

**Content**
- [ ] Update `site-url` and `repo-url` in `_quarto.yml` (currently placeholder `yourusername`)
- [ ] Add proper citation information (BibTeX entry for the paper)
- [ ] Update page footer copyright holder

**Feature Enhancements**
- [ ] Cross-chart brushing/linking between UMAP and metrics
- [ ] Patient detail panel on click
- [ ] Animated transitions on dropdown switch
- [ ] Mobile-responsive chart sizing

**Code Quality**
- [ ] Archive or remove `viz_planning/` after real data lands
- [ ] Add `robots.txt` and `sitemap.xml`
- [ ] Review accessibility (alt text, ARIA labels on charts)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Site framework | [Quarto](https://quarto.org) (website project type) |
| Visualization | [Observable JS (OJS)](https://observablehq.com/@observablehq/observable-javascript) cells in `.qmd` |
| Charts (SVG) | [Observable Plot](https://observablehq.com/plot/) |
| Charts (WebGL) | [regl-scatterplot](https://github.com/flekschas/regl-scatterplot) for large point clouds |
| Styling | SCSS (`styles/custom.scss`) + CSS (`styles/styles.css`) |
| Themes | Light (cosmo) / Dark (darkly) with custom extensions |
| Citations | BibTeX + Nature CSL |

## Project Structure

```
report-web/
├── _quarto.yml              # Site config: navbar, theme, format
├── index.qmd                # Homepage (hero section)
├── references.bib           # BibTeX bibliography
├── paper_v1.pdf             # Source PDF
├── report/
│   ├── index.qmd            # Report landing page
│   ├── paper1.qmd           # Full paper content
│   └── figures/             # Paper figures (PNG/JPEG)
├── viz/
│   ├── overall-performance.qmd  # Page 1: UMAP + Metrics
│   ├── ablation.qmd             # Page 2: Ablation delta chart
│   ├── use-case.qmd             # Page 3: Fibrotic disease analysis
│   └── data/                    # CSV data files (7 mock files)
├── viz_planning/            # Design specs (to be archived)
│   ├── INTERACTIVE_VIZ_PLAN.md
│   └── PRD_INTERACTIVE_VIZ.md
├── styles/
│   ├── custom.scss          # SCSS theme variables + components
│   ├── styles.css           # Layout, dark mode overrides
│   └── nature.csl           # Citation format
└── _site/                   # Generated output (gitignored)
```

## Local Development

### Prerequisites

- [Quarto](https://quarto.org/docs/get-started/) (v1.4+)

No Python or R dependencies required — all visualizations use browser-native OJS.

### Preview

```bash
quarto preview              # Dev server at http://localhost:4200
quarto render               # Full build to _site/
quarto render viz/ablation.qmd  # Single page render
```

## Deployment

Not yet configured. Plan: GitHub Pages via GitHub Actions (render on push to `main`).

## Citation

```bibtex
@article{huang2025aligatehr,
  title={Multimodal Data Integration Improves Disease Risk Prediction in the UK Biobank},
  author={Huang, Xiayuan and Zhou, Hang and Hong, Yitao and Zhou, Xin and de Jong, Johann and Wang, Zuoheng},
  year={2025}
}
```

## License

CC BY 4.0

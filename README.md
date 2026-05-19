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
- [x] GitHub Pages deployment via GitHub Actions
- [x] Deployment-time OJS asset validation via `scripts/check_ojs_assets.py`

### TODO

**Data**
- [ ] Replace mock CSVs with real experimental data
- [ ] Validate data schemas against `viz_planning/INTERACTIVE_VIZ_PLAN.md`

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
- `conda activate pytorch_env`

The charts run in the browser via OJS, but local validation and deployment checks in this repo should be run from `pytorch_env`.

### Preview

```bash
conda activate pytorch_env
quarto preview              # Dev server at http://localhost:4200
quarto render               # Full build to _site/
quarto render viz/ablation.qmd  # Single page render
```

## Deployment

The site is deployed on GitHub Pages from `main` through `.github/workflows/deploy.yml`.

Published URL: [patricktangwen.github.io/report-web](https://patricktangwen.github.io/report-web/)

### Deployment Contract

- GitHub Pages does not publish your local `_site/`. The workflow checks out the repository on GitHub Actions and runs `quarto render` there.
- Any file referenced by OJS `FileAttachment(...)` in `viz/*.qmd` must exist in the repository and be tracked by Git.
- Published visualization assets live in `viz/data/`. `viz/data/raw/` and `viz/data/processed/` remain non-published directories and stay ignored.
- Before pushing deployment-related changes, run the validation commands below from `pytorch_env`.

### Deployment Validation

```bash
conda activate pytorch_env
python scripts/check_ojs_assets.py
quarto render
```

If `scripts/check_ojs_assets.py` fails, treat it as a deployment blocker. The most common cause is adding or renaming a `FileAttachment(...)` target without committing the corresponding file under `viz/data/`.

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

# ALIGATEHR-Gen Research Website

## Project Overview

A Quarto-based website for the ALIGATEHR-Gen research project — a graph attention network that integrates EHR, genetic data, and external medical ontology to improve disease risk prediction. The site serves as an academic paper reporting platform with interactive data visualization dashboards.

The paper: "Multimodal Data Integration Improves Disease Risk Prediction in the UK Biobank" by Xiayuan Huang, Hang Zhou, Yitao Hong, Xin Zhou, Johann de Jong, Zuoheng Wang (Yale University & UCB Biosciences).

## Technical Stack

- **Quarto**: Site generation framework (website project type)
- **SCSS/CSS**: `styles/custom.scss` (theme variables, component rules) + `styles/styles.css` (layout, hero, cards)
- **Nature CSL**: Citation style via `styles/nature.csl`
- **Python**: Dashboard visualizations in `viz/`
- **Bibliography**: `references.bib` for all citations

## Project Structure

```
report-web/
├── _quarto.yml            # Site config: navbar, theme, format, bibliography
├── index.qmd              # Homepage (hero + project overview)
├── references.bib         # BibTeX bibliography
├── paper_v1.pdf           # Source PDF of the paper
├── report/
│   ├── index.qmd          # Report listing page
│   ├── paper1.qmd         # Full paper content
│   └── figures/           # Paper figures (PNG/JPEG)
├── viz/
│   ├── dashboard.qmd      # Interactive dashboard
│   ├── dashboard.ipynb    # Dashboard notebook
│   ├── dashboard_shiny.*  # Shiny dashboard variant (excluded from render)
│   ├── data/              # Raw and processed data
│   ├── modules/           # Visualization modules
│   └── utils/             # Utility scripts
├── styles/
│   ├── custom.scss        # SCSS theme: colors ($primary: #2c5aa0), typography, components
│   ├── styles.css         # CSS: hero section, card grid, homepage layout
│   └── nature.csl         # Nature citation format
└── _site/                 # Generated output (gitignored)
```

## Key Conventions

- Homepage (`index.qmd`) uses `pagetitle` instead of `title` to avoid Quarto's auto-generated title block; the hero section is the sole visual title. The `body-classes: homepage` enables CSS-targeted hiding of `#title-block-header` and `.quarto-title-block`.
- Navbar is defined in `_quarto.yml` with three tabs: Home, Report, Viz.
- `dashboard_shiny.qmd` is excluded from render in `_quarto.yml` (`render: ["!viz/dashboard_shiny.qmd"]`).
- Dual theme support: light (cosmo) and dark (darkly), both extended by `custom.scss`.

## Build & Preview

```bash
quarto preview          # Dev server on port 4200
quarto render           # Full site build to _site/
quarto render index.qmd # Render single page
```

# ALIGATEHR-Gen Research Website

## Project Overview

A Quarto-based website for the ALIGATEHR-Gen research project — a graph attention network that integrates EHR, genetic data, and external medical ontology to improve disease risk prediction. The site serves as an academic paper reporting platform with interactive data visualization dashboards.


## Technical Stack

- **Quarto**: Site generation framework (website project type)
- **OJS (Observable JS)**: All interactive charts are OJS cells in `.qmd` files
- **Observable Plot**: SVG-based charts (bar charts, dot plots, ICD UMAP, Fibrotic UMAP)
- **regl-scatterplot**: WebGL point cloud renderer (Sex/Age UMAPs on Use Case page)
- **SCSS/CSS**: `styles/custom.scss` (theme variables, component rules) + `styles/styles.css` (layout, hero, cards, dark mode overrides)
- **Nature CSL**: Citation style via `styles/nature.csl`
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
│   ├── overall-performance.qmd  # Page 1: ICD UMAP, Eval Metrics
│   ├── ablation.qmd             # Page 2: Ablation delta bar chart
│   ├── use-case.qmd             # Page 3: Fibrotic UMAP, Patient UMAP (sex/age), Risk Factors, Pathway Enrichment
│   └── data/                    # CSV data files (3 real + 4 mock)
├── viz_planning/          # Design specs (to be archived after real data)
│   ├── INTERACTIVE_VIZ_PLAN.md
│   └── PRD_INTERACTIVE_VIZ.md
├── styles/
│   ├── custom.scss        # SCSS theme: colors ($primary: #2c5aa0), typography, components
│   ├── styles.css         # CSS: hero, cards, dark mode chart overrides
│   └── nature.csl         # Nature citation format
└── _site/                 # Generated output (gitignored)
```

## Key Conventions

- Homepage (`index.qmd`) uses `pagetitle` instead of `title` to avoid Quarto's auto-generated title block; the hero section is the sole visual title. The `body-classes: homepage` enables CSS-targeted hiding of `#title-block-header` and `.quarto-title-block`.
- Navbar is defined in `_quarto.yml` with five items: Home, Report, Performance, Ablation, Use Case.
- Dual theme support: light (cosmo) and dark (darkly), both extended by `custom.scss`.
- Dark mode CSS uses `.quarto-dark` selector (NOT `[data-bs-theme="dark"]`).
- Viz pages use wider layout: `body-width: 1100px` with `sidebar-width: 0px`.
- All chart data lives in `viz/data/*.csv`. Three embedding files use real data (patient embeddings, ICD embeddings, fibrotic patient features); four files remain mock (evaluation metrics, ablation results, feature importance, pathway enrichment).

## Build & Preview

```bash
quarto preview          # Dev server on port 4200
quarto render           # Full site build to _site/
quarto render index.qmd # Render single page
```

## Deployment Contract

- GitHub Pages deploys from `.github/workflows/deploy.yml`, not from the local `_site/` directory. The workflow checks out the repository and runs `quarto render` on GitHub Actions.
- Treat any OJS `FileAttachment(...)` reference in `viz/*.qmd` as a published-asset contract. The target file must exist in the repo and be tracked by Git, or the deployed chart will fail even if local preview worked before.
- Published visualization assets belong in `viz/data/`. Keep `viz/data/raw/` and `viz/data/processed/` as ignored non-published directories.
- When editing `viz/*.qmd`, `viz/data/*`, `.gitignore`, or deployment workflow files, run these checks in an environment with Quarto and Python available before finishing:

```bash
python scripts/check_ojs_assets.py
quarto render
```

- Treat a failing `scripts/check_ojs_assets.py` run as a deployment blocker. Do not assume GitHub Pages can recover from missing or untracked `FileAttachment(...)` assets.

## Agent skills

### Issue tracker

GitHub Issues (via `gh` CLI). See `docs/agents/issue-tracker.md`.

### Triage labels

Default label vocabulary (needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout. See `docs/agents/domain.md`.

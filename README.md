# EHR Research Project Website

A comprehensive platform for academic research reporting and interactive data visualization in electronic health records analysis, built with Quarto.

## Overview

This website features:
- **Home**: Project overview and introduction
- **Report**: Academic papers with citations and reproducible research
- **Viz**: Interactive dashboard for data exploration (Shiny-based)

## Installation

### 1. Install Quarto

**macOS:**
```bash
brew install quarto
```

**Windows:**
Download installer from https://quarto.org/docs/get-started/

**Linux:**
```bash
# Download and install from https://quarto.org/docs/get-started/
```

### 2. Install Python Dependencies

For the interactive dashboard:

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install required packages
pip install quarto shiny plotly pandas
```

Additional packages for future development:
```bash
pip install numpy scikit-learn networkx jupyter
```

## Local Development

### Preview the Website

```bash
# Preview entire website
quarto preview

# Preview specific page
quarto preview index.qmd
quarto preview viz/dashboard.qmd
```

The site will open at http://localhost:4200

### Render the Website

```bash
# Build the complete site
quarto render

# Output will be in _site/ directory
```

### Check for Issues

```bash
# Check for broken links and other issues
quarto check
```

## Project Structure

```
EHR_website/
├── _quarto.yml              # Main configuration
├── index.qmd                # Home page
├── references.bib           # Bibliography
│
├── report/                  # Academic papers
│   ├── index.qmd            # Report landing page
│   └── paper1.qmd           # Sample paper template
│
├── viz/                     # Interactive dashboard
│   ├── dashboard.qmd        # Main dashboard
│   ├── data/                # Data files (gitignored)
│   ├── modules/             # Modular components
│   └── utils/               # Utility functions
│
├── styles/                  # Styling
│   ├── custom.scss          # SCSS variables
│   ├── styles.css           # Additional CSS
│   └── nature.csl           # Citation style
│
└── assets/                  # Static resources
    ├── images/
    ├── logos/
    └── downloads/
```

## Adding Content

### Adding a New Paper

1. Create new `.qmd` file in `report/` directory:

```markdown
---
title: "Your Paper Title"
author:
  - name: Author Name
    affiliation: Institution
date: "2026-01-20"
categories: [topic1, topic2]
---

## Introduction

Your content here with citations [@citationkey].

## References

::: {#refs}
:::
```

2. Add citations to `references.bib`

3. The paper will automatically appear on the Report page

### Adding Data for Visualizations

1. Place processed data files in `viz/data/processed/`
2. See `viz/data/README.md` for expected data formats
3. Update `viz/dashboard.qmd` to load and visualize the data

### Customizing Styles

- Edit `styles/custom.scss` for theme variables
- Edit `styles/styles.css` for additional styling
- Changes will apply to all pages

## Dashboard Status

The interactive dashboard framework is established with:
- ✅ Introduction tab with project overview
- ✅ Example interactive section demonstrating Shiny framework
- ⏳ Model Performance section (awaiting data)
- ⏳ Variable Importance section (awaiting data)
- ⏳ Multimorbidity Analysis section (awaiting data)
- ⏳ Individual Risk Prediction section (awaiting data)

See `viz/data/README.md` for data format specifications.

## Deployment

### Static Pages (Home, Report)

**GitHub Pages:**
```bash
# Render site
quarto render

# Push _site/ to gh-pages branch
# Configure GitHub Pages to serve from gh-pages branch
```

**Netlify:**
- Connect GitHub repository
- Build command: `quarto render`
- Publish directory: `_site`

### Interactive Dashboard

**shinyapps.io:**
```bash
# Install rsconnect-python
pip install rsconnect-python

# Deploy dashboard
rsconnect deploy quarto viz/dashboard.qmd
```

Free tier provides 25 active hours/month.

## Citation

If you use this work, please cite:

```
[Your citation information]
```

## License

This project is licensed under CC BY 4.0.

## Contact

- GitHub: [yourusername/EHR_website](https://github.com/yourusername/EHR_website)
- Issues: [GitHub Issues](https://github.com/yourusername/EHR_website/issues)

## Acknowledgments

Built with:
- [Quarto](https://quarto.org) - Scientific and technical publishing
- [Shiny for Python](https://shiny.posit.co/py/) - Interactive dashboards
- [Plotly](https://plotly.com/python/) - Interactive visualizations

Inspired by the [UKB-MDRMF Dashboard](https://luminite.shinyapps.io/ukb-mdrmf/).

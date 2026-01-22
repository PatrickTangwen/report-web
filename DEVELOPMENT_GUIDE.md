# EHR Website Development & Deployment Guide

This guide provides comprehensive instructions for developing, launching, and deploying the EHR Research Website.

---

## Table of Contents

1. [Current Project Status](#current-project-status)
2. [Prerequisites](#prerequisites)
3. [Quick Start](#quick-start)
4. [Development Workflow](#development-workflow)
5. [Adding New Content](#adding-new-content)
6. [Activating the Interactive Dashboard](#activating-the-interactive-dashboard)
7. [Deployment](#deployment)
8. [Project Structure Reference](#project-structure-reference)
9. [Troubleshooting](#troubleshooting)

---

## Current Project Status

### ✅ Completed Components

| Component | File(s) | Status |
|-----------|---------|--------|
| Main Configuration | `_quarto.yml` | Complete |
| Home Page | `index.qmd` | Complete |
| Report Landing | `report/index.qmd` | Complete |
| Paper Template | `report/paper1.qmd` | Complete with sample content |
| Bibliography | `references.bib` | 14 sample citations |
| Dashboard (Static) | `viz/dashboard.qmd` | Placeholder ready |
| Dashboard (Shiny) | `viz/dashboard_shiny.qmd` | Ready for data integration |
| Styling | `styles/custom.scss`, `styles/styles.css` | Complete |
| Citation Style | `styles/nature.csl` | Nature journal format |

### ⏳ Pending (When Data Available)

- [ ] Add real data to `viz/data/processed/`
- [ ] Activate Shiny dashboard with real visualizations
- [ ] Deploy Shiny dashboard to shinyapps.io
- [ ] Replace paper template content with actual research

---

## Prerequisites

### 1. Quarto Installation

Quarto is already installed at `~/tools/bin/quarto`. To verify:

```bash
~/tools/bin/quarto --version
```

If you need to reinstall or update:

**Option A: Homebrew (requires password)**
```bash
brew install quarto
```

**Option B: Manual installation (no password needed)**
```bash
mkdir -p ~/tools && cd ~/tools
curl -LO https://github.com/quarto-dev/quarto-cli/releases/download/v1.4.553/quarto-1.4.553-macos.tar.gz
tar -xzf quarto-1.4.553-macos.tar.gz
rm quarto-1.4.553-macos.tar.gz
# Quarto will be at ~/tools/bin/quarto
```

### 2. Python Dependencies

```bash
# Required for dashboard development
pip install shiny plotly pandas

# Additional (when implementing full dashboard)
pip install numpy scikit-learn networkx
```

### 3. Add Quarto to PATH (Optional)

Add to your `~/.zshrc` or `~/.bash_profile`:

```bash
export PATH="$HOME/tools/bin:$PATH"
```

Then restart terminal or run `source ~/.zshrc`.

---

## Quick Start

### Preview the Website Locally

```bash
cd /Users/tangwenhua/Desktop/EHR_website

# Using full path
~/tools/bin/quarto preview

# Or if added to PATH
quarto preview
```

The website will open at **http://localhost:4200**

### Render Static Site (for deployment)

```bash
~/tools/bin/quarto render
# Output: _site/ directory
```

### Stop Preview Server

```bash
pkill -f "quarto preview"
```

---

## Development Workflow

### Editing Content

1. **Edit `.qmd` files** using any text editor (VS Code recommended)
2. **Preview changes** - Quarto auto-reloads when files are saved
3. **Render** when ready to deploy

### File Editing Tips

- `.qmd` files use Markdown with YAML frontmatter
- Code blocks use triple backticks with language identifier
- Citations use `[@citationkey]` syntax
- Callouts use `::: {.callout-note}` blocks

### Example: Edit Home Page

```bash
# 1. Start preview server
~/tools/bin/quarto preview

# 2. Edit index.qmd in your editor
code index.qmd

# 3. Save file - browser auto-refreshes
```

---

## Adding New Content

### Adding a New Research Paper

1. **Create new file** in `report/` directory:

```bash
touch report/paper2.qmd
```

2. **Add YAML frontmatter**:

```yaml
---
title: "Your Paper Title"
description: "Brief description for listing page"
author:
  - name: Author Name
    affiliation: Institution
    email: author@institution.edu
date: "2026-01-20"
categories: [keyword1, keyword2, keyword3]
bibliography: ../references.bib
citation: true
abstract: |
  Your abstract text here...
---
```

3. **Write content** using Markdown:

```markdown
## Introduction

Your introduction text with citations [@citationkey].

## Methods

### Study Design

Details here...

## Results

::: {.callout-note}
### Key Finding
Important result highlighted here.
:::

## Discussion

## References

::: {#refs}
:::
```

4. **Add citations** to `references.bib`:

```bibtex
@article{newcitation2026,
  title={Paper Title},
  author={Author, First and Author, Second},
  journal={Journal Name},
  volume={1},
  pages={1--10},
  year={2026},
  doi={10.1234/example}
}
```

5. **Paper automatically appears** on Report listing page

### Adding Images

1. Place images in `assets/images/`
2. Reference in `.qmd` files:

```markdown
![Figure caption](../assets/images/figure1.png){#fig-label}
```

### Modifying Navigation

Edit `_quarto.yml` navbar section:

```yaml
navbar:
  left:
    - text: "Home"
      href: index.qmd
    - text: "Report"
      href: report/index.qmd
    - text: "Viz"
      href: viz/dashboard.qmd
    - text: "New Section"      # Add new items here
      href: new-section.qmd
```

---

## Activating the Interactive Dashboard

When your data is ready, follow these steps to activate the full Shiny dashboard:

### Step 1: Prepare Data Files

Create CSV files in `viz/data/processed/`:

**model_performance.csv**
```csv
disease,model,auc,accuracy,precision,recall,f1
Cardiovascular,RandomForest,0.87,0.82,0.79,0.85,0.82
Cardiovascular,XGBoost,0.89,0.84,0.81,0.87,0.84
Diabetes,RandomForest,0.85,0.80,0.77,0.83,0.80
```

**variable_importance.csv**
```csv
disease,variable,importance,category
Cardiovascular,age,0.18,demographic
Cardiovascular,bmi,0.14,clinical
Cardiovascular,smoking,0.11,lifestyle
```

**multimorbidity_network.csv**
```csv
disease_1,disease_2,correlation,odds_ratio,p_value
Diabetes,Hypertension,0.65,3.8,0.001
```

See `viz/data/README.md` for complete specifications.

### Step 2: Update Shiny Dashboard Code

Edit `viz/dashboard_shiny.qmd`:

1. Uncomment data loading code in setup block
2. Replace placeholder visualizations with real data queries
3. Update dropdown choices with actual disease/model names

### Step 3: Test Locally

```bash
# Preview Shiny dashboard (runs standalone, not in website)
~/tools/bin/quarto preview viz/dashboard_shiny.qmd
```

### Step 4: Deploy to shinyapps.io

See [Deployment - Shiny Dashboard](#deploy-shiny-dashboard-to-shinyappsio) section.

---

## Deployment

### Deploy Static Pages to GitHub Pages

#### Option A: Manual Deployment

```bash
# 1. Render the site
~/tools/bin/quarto render

# 2. Initialize git (if not done)
cd /Users/tangwenhua/Desktop/EHR_website
git init
git add .
git commit -m "Initial commit"

# 3. Create GitHub repository and push
# Go to github.com, create new repo "EHR_website"

git remote add origin https://github.com/yourusername/EHR_website.git
git branch -M main
git push -u origin main

# 4. Enable GitHub Pages
# Go to repo Settings > Pages > Source: Deploy from branch > main > /docs or gh-pages
```

#### Option B: Using Quarto Publish

```bash
# Publish directly to GitHub Pages
~/tools/bin/quarto publish gh-pages
```

#### Option C: Netlify

1. Connect GitHub repo to Netlify
2. Build settings:
   - Build command: `quarto render`
   - Publish directory: `_site`

### Deploy Shiny Dashboard to shinyapps.io

The Shiny dashboard must be deployed separately (cannot be part of static site).

#### 1. Create shinyapps.io Account

1. Go to https://www.shinyapps.io/
2. Sign up for free account (25 active hours/month)
3. Get your token from Account > Tokens

#### 2. Install rsconnect

```bash
pip install rsconnect-python
```

#### 3. Configure Account

```bash
rsconnect add \
  --account <YOUR_ACCOUNT_NAME> \
  --token <YOUR_TOKEN> \
  --secret <YOUR_SECRET>
```

#### 4. Deploy Dashboard

```bash
cd /Users/tangwenhua/Desktop/EHR_website
rsconnect deploy quarto viz/dashboard_shiny.qmd --name <YOUR_ACCOUNT_NAME>
```

#### 5. Update Website Link

After deployment, update `_quarto.yml` to link to deployed dashboard:

```yaml
navbar:
  left:
    - text: "Viz"
      href: https://youraccount.shinyapps.io/dashboard_shiny/
```

Or keep both static placeholder and link to Shiny app.

---

## Project Structure Reference

```
EHR_website/
├── _quarto.yml              # Main configuration
├── index.qmd                # Home page
├── references.bib           # Master bibliography
├── .gitignore               # Git ignore rules
├── README.md                # Project readme
├── DEVELOPMENT_GUIDE.md     # This file
├── IMPLEMENTATION_PLAN.md   # Original implementation plan
│
├── report/                  # Academic papers
│   ├── index.qmd            # Listing page (auto-generates)
│   ├── paper1.qmd           # Sample paper template
│   └── [paper2.qmd]         # Add more papers here
│
├── viz/                     # Visualizations
│   ├── dashboard.qmd        # Static placeholder (in website)
│   ├── dashboard_shiny.qmd  # Full Shiny version (deploy separately)
│   ├── data/
│   │   ├── README.md        # Data format specifications
│   │   ├── processed/       # Analysis-ready data
│   │   └── raw/             # Original data
│   ├── modules/             # Shiny modules (future)
│   └── utils/               # Helper functions (future)
│
├── styles/                  # Styling
│   ├── custom.scss          # Theme customization
│   ├── styles.css           # Additional CSS
│   └── nature.csl           # Citation style
│
├── assets/                  # Static resources
│   ├── images/              # Figures, screenshots
│   ├── logos/               # Logo files
│   └── downloads/           # Downloadable files
│
└── _site/                   # Generated site (gitignored)
```

---

## Troubleshooting

### Common Issues

#### "quarto: command not found"

Use full path or add to PATH:
```bash
~/tools/bin/quarto preview
# OR add to ~/.zshrc: export PATH="$HOME/tools/bin:$PATH"
```

#### Preview server won't start

Check if already running:
```bash
ps aux | grep quarto
pkill -f "quarto preview"  # Kill existing
~/tools/bin/quarto preview  # Restart
```

#### Port 4200 already in use

```bash
# Use different port
~/tools/bin/quarto preview --port 4300
```

#### Citations not rendering

1. Check `references.bib` syntax
2. Ensure citation key matches: `[@exactkey]`
3. Verify `bibliography: references.bib` in YAML

#### Shiny dashboard error in website render

The Shiny dashboard (`dashboard_shiny.qmd`) is excluded from website build. This is expected. Deploy it separately to shinyapps.io.

#### Changes not appearing

1. Hard refresh browser: `Cmd+Shift+R`
2. Clear Quarto cache: `rm -rf .quarto/`
3. Re-render: `~/tools/bin/quarto render`

### Getting Help

- **Quarto Documentation**: https://quarto.org/docs/
- **Shiny for Python**: https://shiny.posit.co/py/
- **GitHub Issues**: Create issue in your repository

---

## Quick Reference Commands

```bash
# Navigate to project
cd /Users/tangwenhua/Desktop/EHR_website

# Preview website (auto-reload on save)
~/tools/bin/quarto preview

# Preview specific file
~/tools/bin/quarto preview report/paper1.qmd

# Render full site
~/tools/bin/quarto render

# Check for issues
~/tools/bin/quarto check

# Stop preview server
pkill -f "quarto preview"

# Preview Shiny dashboard (standalone)
~/tools/bin/quarto preview viz/dashboard_shiny.qmd

# Deploy to GitHub Pages
~/tools/bin/quarto publish gh-pages

# Deploy Shiny to shinyapps.io
rsconnect deploy quarto viz/dashboard_shiny.qmd
```

---

*Last updated: January 20, 2026*

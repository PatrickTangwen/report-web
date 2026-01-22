# Implementation Plan: Quarto EHR Website with Interactive Dashboard

## Overview

Build a Quarto website with three main sections:
- **Home**: Project overview with markdown support
- **Report**: Academic paper content with markdown and citation support
- **Viz**: Interactive multi-section dashboard similar to [UKB-MDRMF reference](https://luminite.shinyapps.io/ukb-mdrmf/)

## Key Architectural Decision

**Visualization Technology: Shiny for Python** (instead of Observable JS)

**Rationale:**
- The reference website uses Shiny's reactive framework
- Requires server-side computation for model comparisons and risk predictions
- Observable JS only supports client-side interactivity with static data (cannot perform backend calculations)
- Seamless integration with Python data science stack (pandas, plotly, scikit-learn)

**Trade-off:** Requires server hosting (shinyapps.io free tier: 25 hours/month, or paid plans $9-299/month)

## Project Structure

```
EHR_website/
├── _quarto.yml                    # Main website configuration
├── index.qmd                      # Home page
├── references.bib                 # Master bibliography
│
├── report/                        # Academic papers
│   ├── index.qmd                  # Report landing page (auto-listing)
│   ├── paper1.qmd                 # Individual paper
│   └── _metadata.yml              # Shared report metadata
│
├── viz/                           # Interactive dashboard
│   ├── dashboard.qmd              # Main Shiny dashboard (5 tabs)
│   ├── data/
│   │   ├── processed/             # Analysis-ready data
│   │   └── raw/                   # Original data files
│   ├── modules/                   # Modular Shiny components
│   │   ├── introduction.py
│   │   ├── model_performance.py
│   │   ├── variable_importance.py
│   │   ├── multimorbidity.py
│   │   └── risk_prediction.py
│   └── utils/                     # Helper functions
│       ├── plotting.py
│       └── data_processing.py
│
├── styles/                        # Styling
│   ├── custom.scss                # Custom SCSS variables
│   ├── styles.css                 # Additional CSS
│   └── nature.csl                 # Citation style
│
└── assets/                        # Static resources
    ├── images/
    ├── logos/
    └── downloads/
```

## Implementation Steps

### Phase 1: Initialize Project Structure

1. **Create _quarto.yml** with:
   - Website type configuration
   - Navbar with three sections: Home, Report, Viz
   - Theme configuration (cosmo light, darkly dark)
   - Bibliography settings

   ```yaml
   website:
     navbar:
       left:
         - text: "Home"
           href: index.qmd
         - text: "Report"
           href: report/index.qmd
         - text: "Viz"
           href: viz/dashboard.qmd

   bibliography: references.bib
   csl: styles/nature.csl
   ```

2. **Create directory structure**:
   - `report/` directory
   - `viz/` directory with `data/`, `modules/`, `utils/` subdirectories
   - `styles/` directory
   - `assets/images/` and `assets/logos/`

3. **Create placeholder files**:
   - `index.qmd` (Home page)
   - `report/index.qmd` (Report landing)
   - `viz/dashboard.qmd` (Dashboard)
   - `references.bib` (empty bibliography file)

4. **Set up styling**:
   - Create `styles/custom.scss` for custom theme variables
   - Create `styles/styles.css` for additional styling
   - Download `styles/nature.csl` from [CSL repository](https://github.com/citation-style-language/styles)

### Phase 2: Build Home and Report Pages

5. **Develop Home page** (`index.qmd`):
   - Project overview section
   - Research goals
   - Quick links to Report and Viz sections
   - Markdown formatting with headers, lists, callouts

6. **Create Report landing page** (`report/index.qmd`):
   - Use Quarto's `listing` feature to auto-generate paper grid:
     ```yaml
     listing:
       contents: "*.qmd"
       type: grid
       sort: "date desc"
     ```

7. **Create first academic paper** (`report/paper1.qmd`):
   - YAML frontmatter with title, authors, date, abstract
   - Sections: Introduction, Methods, Results, Discussion
   - In-text citations using `[@citationkey]` syntax
   - References section with `:::{#refs}:::`
   - Add sample entries to `references.bib`

### Phase 3: Build Interactive Dashboard (Minimal Scope)

8. **Set up Python environment**:
   ```bash
   pip install quarto shiny plotly pandas
   ```

9. **Create basic dashboard structure** (`viz/dashboard.qmd`):
   - Use Quarto dashboard format with `server: shiny`
   - Create 2 tabbed sections using level 2 headings with `.tabset`:
     1. Introduction (static content)
     2. Example Interactive Section (placeholder showing Shiny framework)

10. **Implement dashboard sections**:

    **Introduction Tab**:
    - Static markdown describing:
      - Future dashboard purpose and capabilities
      - Planned sections (Model Performance, Variable Importance, etc.)
      - Note that visualizations will be added when data becomes available
      - Reference to the UKB-MDRMF dashboard as inspiration

    **Example Interactive Section Tab**:
    - Demonstrate Shiny framework with simple interactive elements:
      - Sample dropdown/slider controls (non-functional placeholders)
      - Placeholder chart showing where visualizations will appear
      - Comments in code explaining how real data will be integrated
    - This establishes the pattern for future sections

11. **Create directory structure for future data** (`viz/data/`):
    - Create `processed/` subdirectory with README explaining expected data format
    - Create `modules/` subdirectory for future modular components
    - Add `.gitkeep` files to maintain empty directories in version control

### Phase 4: Styling and Polish

12. **Refine visual design**:
    - Customize colors in `styles/custom.scss` to match academic aesthetic
    - Ensure responsive design works on mobile
    - Add logo to navbar (if available)

13. **Add content enhancements**:
    - Add example figures to `assets/images/` (if available)
    - Add code folding and syntax highlighting to paper template
    - Create professional-looking placeholders for future content

### Phase 5: Testing and Deployment

14. **Local testing**:
    ```bash
    quarto preview  # Preview entire site
    quarto preview viz/dashboard.qmd  # Preview dashboard only
    ```

15. **Deploy static pages** (Home, Report):
    - Render site: `quarto render`
    - Deploy to GitHub Pages, Netlify, or Vercel
    - Output is in `_site/` directory

16. **Prepare for future dashboard deployment**:
    - Dashboard will remain local-only until data is available
    - Document deployment process for future:
      - Sign up at [shinyapps.io](https://www.shinyapps.io/)
      - Install rsconnect-python: `pip install rsconnect-python`
      - Deploy: `rsconnect deploy quarto viz/dashboard.qmd`
      - Update Viz link in `_quarto.yml` to point to deployed dashboard URL

## Critical Files to Create

1. **_quarto.yml** - Defines website structure, navigation, and theme
2. **viz/dashboard.qmd** - Main Shiny dashboard with 5 interactive sections
3. **index.qmd** - Home page with project overview
4. **report/paper1.qmd** - Academic paper template with citations
5. **report/index.qmd** - Auto-listing page for all papers
6. **styles/custom.scss** - Custom theme styling

## Dashboard Section Details (Initial Implementation)

### Section 1: Introduction
**Static content describing:**
- Dashboard purpose: Interactive visualization of multimorbidity patterns and disease risk prediction
- Planned capabilities (to be implemented when data arrives):
  - Model Performance comparison across disease categories
  - Variable Importance analysis
  - Multimorbidity network analysis
  - Individual Risk Prediction calculator
- Reference to UKB-MDRMF dashboard as inspiration
- Note that visualizations are placeholders awaiting real data

### Section 2: Example Interactive Section
**Purpose**: Demonstrate Shiny framework and establish pattern for future sections

**Placeholder interactive elements:**
- Sample dropdown (e.g., "Select Category" with dummy options)
- Sample slider (e.g., "Adjust Parameter" with range 0-100)
- Placeholder button showing where actions will trigger

**Placeholder visualization:**
- Simple example chart (e.g., empty plotly chart with axis labels)
- Text explaining: "Interactive visualizations will appear here when data is loaded"
- Code comments showing where real data processing will happen

**Code structure to demonstrate:**
```python
@reactive.Calc
def filtered_data():
    # When data is available, filtering logic goes here
    return None

@render_plotly
def example_plot():
    # When data is available, visualization code goes here
    return create_placeholder_chart()
```

### Future Sections (To Be Added When Data Arrives)

The plan includes these sections, which will follow the pattern established in Section 2:

- **Model Performance**: Disease/model selection dropdowns → Boxplots showing metrics
- **Variable Importance**: Disease selection + top N slider → Feature importance bar charts
- **Multimorbidity Analysis**: Threshold slider → Network graphs of disease co-occurrence
- **Individual Risk Prediction**: Patient questionnaire inputs → Risk score calculator with visualizations

## Technical Dependencies

**Required installations:**
```bash
# Python packages (minimal for initial implementation)
pip install quarto shiny plotly pandas

# Additional packages for future (when adding complex visualizations):
# pip install numpy scikit-learn networkx jupyter

# Quarto (download from quarto.org or use package manager)
# macOS: brew install quarto
# Windows: Download installer from quarto.org
```

## Deployment Strategy

**Selected Approach: Hybrid Deployment**
- Static pages (Home, Report) → GitHub Pages (free)
- Shiny dashboard → shinyapps.io when data is ready (free tier: 25 active hours/month)

**Initial Deployment** (before data is available):
- Deploy only static pages (Home, Report) to GitHub Pages
- Viz page will be included but show placeholder content
- Dashboard functionality will be testable locally via `quarto preview viz/dashboard.qmd`

**Future Deployment** (when data becomes available):
- Deploy populated dashboard to shinyapps.io
- Update Viz navbar link in `_quarto.yml` to point to live dashboard URL
- Keep static pages on GitHub Pages

## Verification Plan

After implementation, verify:

1. **Navigation works**: All three topbar links (Home, Report, Viz) navigate correctly
2. **Markdown rendering**: Home and Report pages display markdown formatting properly
3. **Citations work**: Paper template shows proper citation formatting with bibliography at end
4. **Dashboard loads**: Both tabs (Introduction, Example Interactive Section) display without errors
5. **Dashboard framework functional**:
   - Introduction tab shows static content clearly
   - Example Interactive Section demonstrates:
     - Shiny components (dropdowns, sliders) render correctly
     - Placeholder visualization displays
     - Code structure is clear and well-commented for future expansion
6. **Responsive design**: Site works on mobile and tablet screens
7. **Cross-browser**: Test on Chrome, Firefox, Safari
8. **Directory structure**: All placeholder directories (viz/data/, viz/modules/) exist and contain README files

**Test commands:**
```bash
# Preview locally
quarto preview

# Check for broken links
quarto check

# Render full site
quarto render

# Verify output in _site/ directory
ls -la _site/
```

## Implementation Scope (Based on User Preferences)

**Data Status**: No data available yet
- Leave dashboard visualization sections blank/placeholder for now
- Structure will be ready to populate when real data arrives

**Hosting**: Hybrid deployment
- Static pages (Home, Report) → GitHub Pages
- Dashboard → shinyapps.io (when data is ready)

**Initial Dashboard Scope**: Minimal - 2 sections
- Introduction (static content explaining future dashboard)
- One placeholder interactive section showing dashboard structure
- Framework ready to add remaining 3 sections when data arrives

**Report Content**: Template structure
- Create well-structured template with example sections
- Include proper citation formatting examples
- User will replace with actual research content later

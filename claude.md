# EHR Website Project

## Project Overview

This project aims to build a website for academic paper reporting with plans to expand into interactive data visualization dashboards. The site will be built using Quarto as the primary framework.

## Goals

### Phase 1: Academic Paper Reporting
- Create a professional website to showcase academic papers
- Include paper abstracts, methodologies, and findings
- Organize content by topics or publication dates
- Support citations and references

### Phase 2: Data Visualization Dashboard
- Add interactive dashboards for data exploration
- Integrate visualization libraries (e.g., Observable, Plotly, D3.js)
- Enable dynamic filtering and exploration of research data
- Provide reproducible analysis examples

## Technical Stack

### Core Framework
- **Quarto**: Main framework for content authoring and site generation
  - Supports multiple formats: HTML, PDF, presentations
  - Native integration with R, Python, Julia, and Observable
  - Built-in support for academic citations and references
  - Responsive design themes

### Planned Integrations
- **Observable JS**: For interactive data visualizations
- **Python/R**: For data analysis and chart generation
- **GitHub Pages / Netlify**: For hosting (to be decided)

## Project Structure

```
EHR_website/
├── _quarto.yml           # Main configuration file
├── index.qmd             # Homepage
├── papers/               # Academic papers directory
│   ├── paper1.qmd
│   └── paper2.qmd
├── dashboard/            # Future dashboard directory
│   └── viz1.qmd
├── about.qmd             # About page
├── references.bib        # Bibliography file
└── _site/                # Generated site (gitignored)
```

## Next Steps

1. Initialize Quarto project structure
2. Configure _quarto.yml for website settings
3. Create initial homepage and navigation
4. Set up paper template structure
5. Plan dashboard integration strategy

## Resources

- [Quarto Documentation](https://quarto.org)
- [Quarto Websites Guide](https://quarto.org/docs/websites/)
- [Quarto Dashboards](https://quarto.org/docs/dashboards/)
- [Observable JS in Quarto](https://quarto.org/docs/interactive/ojs/)

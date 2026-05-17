# ALIGATEHR-Gen Website — Style Specification

This document defines the visual design system for the ALIGATEHR-Gen research website. Use it as a reference when creating or modifying any page, component, or visualization to ensure stylistic consistency.

---

## 1. Design Philosophy

- **Academic, clean, and professional.** The site presents biomedical research; every design choice should communicate credibility and clarity.
- **Minimal decoration.** No gradients, no background images, no ornamental borders. White space and typographic hierarchy do the work.
- **Restrained color usage.** A single accent color (ink-blue) for interactive and emphasis elements; neutral grays for body text and secondary information.
- **Content-first layout.** The reader should encounter meaningful content immediately. Avoid large empty areas or decorative hero banners that push content below the fold.

---

## 2. Color Palette

| Token       | Hex       | Usage                                               |
|-------------|-----------|-----------------------------------------------------|
| `primary`   | `#2c5aa0` | Links, buttons, card headings, accent borders, navbar background, table headers (10% opacity fill) |
| `secondary` | `#6c757d` | Body secondary text, figure captions, metadata, hero description |
| `headings`  | `#2c3e50` | All heading text (h1–h6), hero title                |
| `border`    | `#dee2e6` | Card borders, general dividers                      |
| `surface`   | `#f8f9fa` | Light background fills (abstract blocks, citations, placeholders) |
| `surface-dark` | `#495057` | Placeholder heading text                         |
| `code-border` | `#e1e4e8` | Code block borders                               |
| `success`   | `#28a745` | Callout-tip accent                                  |
| `info`      | `#17a2b8` | Callout-note accent                                 |
| `warning`   | `#ffc107` | Callout-warning accent                              |
| `danger`    | `#dc3545` | Callout-important accent                            |

### Dark Mode

The site supports a dark theme via Bootswatch `darkly`. The same `custom.scss` overrides apply to both themes. Colors that reference SCSS variables auto-adapt; hardcoded hex values in `styles.css` do not — keep this in mind when adding new styles.

---

## 3. Typography

| Element           | Family                      | Size      | Weight | Color       |
|-------------------|-----------------------------|-----------|--------|-------------|
| Body text         | Source Sans Pro (sans-serif) | base      | 400    | theme default |
| Headings (h1–h6)  | Source Sans Pro              | —         | 600    | `#2c3e50`   |
| Hero title        | Source Sans Pro              | 2.8rem    | 700    | `#2c3e50`   |
| Hero subtitle     | Source Sans Pro              | 1.15rem   | 500    | `#2c5aa0`   |
| Hero description  | Source Sans Pro              | 1.05rem   | 400    | `#6c757d`   |
| Code / monospace  | Source Code Pro              | —         | 400    | —           |
| Figure captions   | Source Sans Pro              | 0.9rem    | 400 italic | `#6c757d` |
| References        | Source Sans Pro              | 0.9rem    | 400    | —           |
| Footer disclaimer | Source Sans Pro              | 0.9rem    | 400    | `#6c757d`   |

### Fallback Stack

```
sans-serif: "Source Sans Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif
monospace:  "Source Code Pro", Menlo, Monaco, Consolas, "Courier New", monospace
```

---

## 4. Layout & Grid

| Property        | Value   |
|-----------------|---------|
| Body width      | 900px   |
| Sidebar width   | 250px   |
| Margin width    | 250px   |
| TOC             | Right-side, depth 3 (disabled on homepage) |
| Base spacer     | 1rem    |

### Responsive Breakpoint

At `max-width: 768px`:

- Hero title shrinks from 2.8rem → 2rem
- Hero subtitle shrinks from 1.15rem → 1rem
- Card grid collapses from multi-column → single column

---

## 5. Component Specifications

### 5.1 Navbar

- **Background**: `primary` (`#2c5aa0`)
- **Shadow**: `0 2px 4px rgba(0,0,0,0.1)`
- **Search**: Enabled
- **Left items**: Home · Report · Viz
- **Right items**: GitHub icon link

### 5.2 Hero Section (Homepage Only)

The homepage uses `pagetitle` (not `title`) in YAML to suppress Quarto's auto-generated title block. The hero `<div>` is the sole visual title area.

- **Container**: centered text, padding `1.5rem 0 2rem`
- **Title** (`.hero-title`): `2.8rem / 700 / #2c3e50`, block display
- **Subtitle** (`.hero-subtitle`): `1.15rem / 500 / #2c5aa0`, block display
- **Description** (`.hero-desc`): `1.05rem / 400 / #6c757d`, max-width `700px`, centered, line-height `1.6`

Quarto Markdown pattern:

```markdown
::: {.hero-section}
[Project Name]{.hero-title}
[One-line paper title]{.hero-subtitle}
[One-sentence description]{.hero-desc}
:::
```

### 5.3 Card Grid

- **Grid**: `repeat(auto-fit, minmax(250px, 1fr))`, gap `1.5rem`, margin `2rem 0`
- **Card border**: `1px solid #dee2e6`, radius `8px`, padding `1.5rem`
- **Card hover**: shadow `0 4px 12px rgba(0,0,0,0.15)`, translateY `-2px`, transition `0.2s ease`
- **Card heading (h3)**: `margin-top: 0`, color `#2c5aa0`

### 5.4 Abstract Block

- **Background**: `#f8f9fa`
- **Left border**: `4px solid #2c5aa0`
- **Padding**: `1.5rem`, margin `2rem 0`
- **Heading (h2)**: `1.2rem`, `#2c5aa0`, no top margin

### 5.5 Callouts

All callouts share: `border-left: 4px solid`, padding `1rem`, margin `1.5rem 0`.

| Type        | Border color | Background            |
|-------------|--------------|-----------------------|
| `.callout-note`      | `#17a2b8` | `rgba(#17a2b8, 0.05)` |
| `.callout-tip`       | `#28a745` | `rgba(#28a745, 0.05)` |
| `.callout-warning`   | `#ffc107` | `rgba(#ffc107, 0.05)` |
| `.callout-important` | `#dc3545` | `rgba(#dc3545, 0.05)` |

### 5.6 Tables

- **Margin**: `1.5rem 0`
- **Header (`th`)**: background `rgba(#2c5aa0, 0.1)`, weight `600`

### 5.7 Code Blocks

- **Border**: `1px solid #e1e4e8`, radius `4px`
- **Code fold**: enabled by default, summary text "Show code"
- **Code copy**: enabled
- **Code tools**: enabled (source view button)

### 5.8 Citations & References

- **Citation format**: Nature style (`styles/nature.csl`), numeric superscript
- **Citation inline block**: background `#f8f9fa`, padding `0.5rem 1rem`, radius `4px`
- **References section**: font-size `0.9rem`, line-height `1.6`, item spacing `0.8rem`

### 5.9 Figure Captions

- **Style**: italic
- **Color**: `#6c757d`
- **Size**: `0.9rem`
- **Alignment**: centered
- **Top margin**: `0.5rem`

### 5.10 Placeholder Visualization

For dashboard sections awaiting data:

- **Background**: `#f8f9fa`
- **Border**: `2px dashed #dee2e6`, radius `8px`
- **Padding**: `3rem 2rem`, centered text, color `#6c757d`
- **Heading**: color `#495057`

### 5.11 Links & Buttons

- **Link transition**: `color 0.2s ease`
- **Primary button** (`.btn-primary`): uses `primary` color, standard Bootstrap sizing
- **External links**: open in new window

### 5.12 Footer

- **Left**: copyright notice + license (CC BY 4.0)
- **Right**: GitHub icon link

---

## 6. Quarto-Specific Conventions

| Setting              | Value                                    |
|----------------------|------------------------------------------|
| Project type         | `website`                                |
| Light theme          | `cosmo` + `styles/custom.scss`           |
| Dark theme           | `darkly` + `styles/custom.scss`          |
| Additional CSS       | `styles/styles.css`                      |
| Bibliography         | `references.bib` (BibTeX)               |
| Citation style       | `styles/nature.csl`                      |
| Link citations       | `true`                                   |
| TOC default          | right, depth 3                           |
| Homepage TOC         | disabled via per-page YAML               |
| Homepage body class  | `homepage` (enables CSS-targeted hiding) |

### Homepage Title Pattern

To avoid duplicate title blocks, the homepage uses this YAML pattern:

```yaml
---
pagetitle: "ALIGATEHR-Gen"
format:
  html:
    toc: false
    body-classes: homepage
---
```

The CSS rule `.homepage #title-block-header, .homepage .quarto-title-block { display: none; }` hides Quarto's auto-generated elements. The `::: {.hero-section}` div is the sole visual title.

### Regular Page Title Pattern

Non-homepage pages use standard Quarto titles:

```yaml
---
title: "Page Title"
subtitle: "Optional subtitle"
date: last-modified
---
```

---

## 7. Do / Don't

### Do

- Use `#2c5aa0` as the only accent color for interactive elements and emphasis.
- Use `#2c3e50` for all headings; never use pure black `#000`.
- Keep card content concise — title + 1–2 sentences + optional CTA link.
- Use Quarto's `::: {}` fenced div syntax for custom containers (not raw `<div>` when a heading is inside).
- Let white space define hierarchy; avoid adding decorative rules or boxes.
- Use `**bold**` sparingly for key metrics within body text.

### Don't

- Don't add background colors or gradients to full-width sections.
- Don't use more than two font weights on a single page (400 body, 600/700 headings).
- Don't hardcoded colors in inline styles — use the defined palette tokens so dark mode can adapt.
- Don't add hero sections to non-homepage pages; use standard Quarto title blocks.
- Don't increase body width beyond 900px — the academic reading width is intentional.
- Don't use decorative icons or emoji in headings or body text.

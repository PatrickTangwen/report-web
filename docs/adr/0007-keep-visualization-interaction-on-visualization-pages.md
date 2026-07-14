---
status: superseded by ADR-0012
---

# Keep visualization interaction on visualization pages

The Guided Research Assistant will help visitors choose and open a visualization, but it will not become a remote control for that visualization. Full-page visualization surfaces retain ownership of filtering, walkthroughs, explanations, replay, reset, and other chart interactions because they have the necessary space and context; duplicating those controls inside the Assistant would split interaction state across two surfaces and make the experience harder to understand and maintain. A Cohort Comparison Result remains visible in the Assistant until the visitor explicitly chooses View matched references in visualization; the result never redirects automatically.

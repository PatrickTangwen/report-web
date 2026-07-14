---
status: accepted
---

# Serve fibrotic matching and visualization data from one backend authority

Hugging Face will own each complete Dataset Release: private/noised matching fields remain backend-only, while a public endpoint exposes only Visual Reference ID, disease, display group, and t-SNE coordinates for the same release. GitHub Pages deploys visualization code and fetches the display-safe endpoint, so matching responses and plotted points cannot drift across separately deployed data copies; release-scoped random IDs remain valid, while dataset versions are used for response metadata and caching rather than cross-host reconciliation. If the backend is unavailable, the visualization shows an explicit retry state and does not fall back to stale or guessed mappings.

---
status: accepted
---

# Share opaque visual reference IDs across matching and visualization data

The fibrotic matching backend and public embedding visualization will be generated with the same stable, opaque Visual Reference ID for each Reference Patient. The public asset will contain only display-safe fields, while matching features remain in the backend record; matching results return Visual Reference IDs so the frontend can highlight exact points without joining on clinical values, coordinates, source participant identifiers, or row order. This replaces the current incompatible dual-file identity contract while preserving the 2026-06-28 anonymization memo as a historical record.

Accepted extension, 2026-07-13: both artifacts must be generated together by one validated preprocessing pipeline from the Git-ignored `embedding_data/patient_feature_matrix.csv`; neither published artifact is edited independently, and CI validates generated outputs without requiring the raw source.

Accepted extension, 2026-07-13: Hugging Face is the single runtime data authority for both artifacts. It keeps matching fields private and exposes the display-safe artifact through an embedding endpoint; GitHub Pages deploys visualization code and fetches that endpoint instead of publishing a second production copy of the fibrotic dataset.

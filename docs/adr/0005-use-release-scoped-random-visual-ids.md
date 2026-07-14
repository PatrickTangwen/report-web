---
status: superseded by ADR-0006
---

# Use release-scoped random Visual Reference IDs

Each Dataset Release will assign cryptographically random Visual Reference IDs in the single preprocessing run that emits both backend and frontend artifacts, and both artifacts will carry the same dataset version. IDs remain stable within that release but may change on regeneration; they are not derived from UKB `eid`, avoiding enumerable plain hashes without introducing a secret-key dependency. Visualization requests include the dataset version so independently deployed GitHub Pages and Hugging Face components can detect incompatible releases.

Superseded because ADR-0006 makes Hugging Face the single runtime authority for both artifacts, eliminating the independent data-release deployment this ADR assumed while retaining release-scoped random IDs.

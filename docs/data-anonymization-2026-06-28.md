# Data Anonymization Memo — 2026-06-28

## Summary

Removed UK Biobank participant identifiers (`eid`) from all published CSV files and applied consistent anonymous IDs. One file (`chatbot-backend`) retains a previously applied Gaussian noise perturbation on clinical features.

## Files Modified

### 1. `viz/data/patient_embeddings.csv` (114,285 rows)

- Column renamed: `eid` → `id`
- Values replaced: real UK Biobank eids → sequential `P000001`–`P114285`
- Clinical features: **not perturbed** (only age, sex, and UMAP/t-SNE coordinates; low re-identification risk)

### 2. `viz/data/fibrotic_patient_embeddings.csv` (6,010 rows)

- Column renamed: `eid` → `id`
- Values replaced: real UK Biobank eids → sequential `F000001`–`F006010`
- Clinical features: **not perturbed** (BMI, blood pressure, creatinine, HbA1c, etc. are original values)
- Note: this file contains detailed clinical features; re-identification risk is moderate but acceptable given eid removal

### 3. `chatbot-backend/data/fibrotic_patient_embeddings.csv` (6,010 rows)

- Column renamed: `eid` → `id`
- Values: sequential integers `1`–`6010` (from a prior anonymization pass)
- Clinical features: **Gaussian noise applied** (values differ from originals — e.g., age, BMI, t-SNE coordinates are all perturbed)
- This is the version used by the chatbot risk assessment module for case-matching

## Files NOT Modified (already safe)

| File | Reason |
|------|--------|
| `viz/data/icd_code_embeddings.csv` | ICD codes only, no patient data |
| `viz/data/evaluation_metrics.csv` | Aggregate model metrics |
| `viz/data/ablation_results.csv` | Aggregate ablation results |
| `viz/data/feature_importance.csv` | Feature-level statistics |
| `viz/data/pathway_enrichment.csv` | Pathway-level statistics |
| `chatbot-backend/data/` (other files) | Same aggregate data as above |

## Raw Data Protection

- `embedding_data/` contains original UK Biobank data with real eids — added to `.gitignore` to prevent accidental commits
- `viz/data/raw/` and `viz/data/processed/` were already gitignored

## Code Changes

- `viz/overall-performance.qmd`: tooltip references updated `d.eid` → `d.id` (2 locations)
- `viz/use-case.qmd`: tooltip reference updated `d.eid` → `d.id` (1 location)
- No backend code changes needed (backend does not reference `eid` by name)

## Deployment — Dual-Repo Sync

This project publishes to **two remotes** that must stay in sync:

| Remote | Content | URL |
|--------|---------|-----|
| **GitHub** (`PatrickTangwen/report-web`) | Full repo (site + backend + viz data) | patricktangwen.github.io/report-web |
| **HuggingFace Space** (`patirckistc/report-web`) | `chatbot-backend/` only (Docker service) | patirckistc-report-web.hf.space |

**Rule: every push must consider both remotes.**

- Changes to `chatbot-backend/` → push to GitHub **and** upload to HF Space
- Changes to `viz/`, `index.qmd`, styles, etc. → push to GitHub only (GitHub Pages auto-deploys)
- Data file changes under `chatbot-backend/data/` → must be synced to HF so the live chatbot uses the same data as the repo

HF upload method (via `huggingface_hub`):
```python
from huggingface_hub import HfApi
api = HfApi()
api.upload_file(
    path_or_fileobj="chatbot-backend/<file>",
    path_in_repo="<file>",
    repo_id="patirckistc/report-web",
    repo_type="space",
    commit_message="<description>",
)
```

## Remaining Considerations

- `viz/data/fibrotic_patient_embeddings.csv` has original (unperturbed) clinical feature values. If stronger anonymization is needed, Gaussian noise should be applied to continuous clinical columns (BMI, blood pressure, creatinine, HbA1c, waist, hip, height, weight).
- The two copies of fibrotic data (viz vs chatbot-backend) now have **different clinical values** — viz has originals, backend has Gaussian-noised. This is intentional: the viz UMAP needs true coordinates for visual accuracy, while the backend case-matching tolerates noise.

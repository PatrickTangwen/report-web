# Visualization Data

CSV files consumed by OJS `FileAttachment(...)` in `viz/*.qmd` pages. Currently **mock data** — to be replaced with real experimental results.

## Files

| File | Size | Used By | Description |
|------|------|---------|-------------|
| `patient_embeddings.csv` | 311 KB | `overall-performance.qmd` | Patient UMAP coordinates (sex, age, diagnosis) |
| `icd_code_embeddings.csv` | 113 KB | `overall-performance.qmd` | ICD code UMAP coordinates (chapter, frequency) |
| `evaluation_metrics.csv` | 20 KB | `overall-performance.qmd` | Model comparison metrics (AUROC, AUPRC, F1, etc.) |
| `ablation_results.csv` | 10 KB | `ablation.qmd` | Ablation deltas per variant/disease/metric |
| `fibrotic_patient_embeddings.csv` | 376 KB | `use-case.qmd` | Fibrotic disease patient UMAP coordinates |
| `feature_importance.csv` | 12 KB | `use-case.qmd` | Top risk factors per disease |
| `pathway_enrichment.csv` | 20 KB | `use-case.qmd` | Pathway enrichment results (gene count, enrichment ratio, p-values) |

## Column Schemas

### patient_embeddings.csv
`patient_id, umap_x, umap_y, age, sex, primary_diagnosis, primary_diagnosis_desc, disease_count`

### icd_code_embeddings.csv
`icd_code, description, icd_chapter, icd_chapter_name, frequency, umap_x, umap_y`

### evaluation_metrics.csv
`model, disease, metric, value, ci_lower, ci_upper, is_proposed`

### ablation_results.csv
`variant, disease, metric, value, full_model_value, delta`

### fibrotic_patient_embeddings.csv
`patient_id, umap_x, umap_y, age, sex, fibrotic_disease, primary_diagnosis, primary_diagnosis_desc, disease_count`

### feature_importance.csv
`disease, feature, importance_score, rank`

### pathway_enrichment.csv
`disease, pathway, source, gene_count, enrichment_ratio, p_value, p_adjusted, rank`

## Deployment Contract

Every file referenced by `FileAttachment(...)` in `viz/*.qmd` must be Git-tracked. Run `python scripts/check_ojs_assets.py` before pushing to verify.

## Non-published Directories

`raw/` and `processed/` are gitignored and not deployed. Published assets live at this level (`viz/data/*.csv`).

## Data Privacy

Do not commit patient-level identifiable data. Current files use synthetic/mock data. When replacing with real results, use only aggregated or de-identified outputs.

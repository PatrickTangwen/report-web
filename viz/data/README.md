# Visualization Data

CSV files consumed by OJS `FileAttachment(...)` in `viz/*.qmd` pages. Three embedding files contain **real data**; four remaining files are **mock data**.

## Files

| File | Size | Used By | Data | Description |
|------|------|---------|------|-------------|
| `patient_embeddings.csv` | 8.2 MB | `overall-performance.qmd` | Real | 114K patient UMAP/t-SNE coordinates with age and sex |
| `icd_code_embeddings.csv` | 738 KB | `overall-performance.qmd` | Real | 12K ICD-10 code UMAP/t-SNE coordinates by chapter |
| `fibrotic_patient_embeddings.csv` | 1.3 MB | `use-case.qmd` | Real | 6K fibrotic patient t-SNE coordinates with clinical features |
| `evaluation_metrics.csv` | 20 KB | `overall-performance.qmd` | Mock | Model comparison metrics (AUROC, AUPRC, F1, etc.) |
| `ablation_results.csv` | 10 KB | `ablation.qmd` | Mock | Ablation deltas per variant/disease/metric |
| `feature_importance.csv` | 12 KB | `use-case.qmd` | Mock | Top risk factors per disease |
| `pathway_enrichment.csv` | 20 KB | `use-case.qmd` | Mock | Pathway enrichment results (gene count, enrichment ratio, p-values) |

## Column Schemas

### patient_embeddings.csv (real)
`eid, age, sex_male, umap_1, umap_2, tsne_1, tsne_2`

### icd_code_embeddings.csv (real)
`code, chapter, umap_1, umap_2, tsne_1, tsne_2`

### fibrotic_patient_embeddings.csv (real)
`eid, label_int, disease, abbrev, tsne_x, tsne_y, purity_2d, purity_256d, group, purity_2d_k30, purity_2d_k50, age_recruit, sex, BMI, waist, hip, height, weight, DBP, SBP, creatinine, HbA1c, smoking_status, alcohol_freq, age_at_onset, n_rel1, n_rel2, n_rel3, n_affected_rel, has_affected_rel, p_true, p_max, correct, is_male, current_smoker`

### evaluation_metrics.csv (mock)
`model, disease, metric, value, ci_lower, ci_upper, is_proposed`

### ablation_results.csv (mock)
`variant, disease, metric, value, full_model_value, delta`

### feature_importance.csv (mock)
`disease, feature, importance_score, rank`

### pathway_enrichment.csv (mock)
`disease, pathway, source, gene_count, enrichment_ratio, p_value, p_adjusted, rank`

## Deployment Contract

Every file referenced by `FileAttachment(...)` in `viz/*.qmd` must be Git-tracked. Run `python scripts/check_ojs_assets.py` before pushing to verify.

## Non-published Directories

`raw/` and `processed/` are gitignored and not deployed. Published assets live at this level (`viz/data/*.csv`).

## Data Privacy

Do not commit patient-level identifiable data. Real data files use de-identified UK Biobank eids. When replacing remaining mock files with real results, use only aggregated or de-identified outputs.

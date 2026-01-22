# Data Directory

This directory will contain datasets for the interactive dashboard visualizations.

## Directory Structure

- `processed/` - Analysis-ready datasets (cleaned, formatted, aggregated)
- `raw/` - Original data files (before processing)

## Expected Data Formats

### Model Performance Data (`processed/model_performance.csv`)

Expected columns:
- `disease` (string): Disease category name
- `model` (string): Model type (RandomForest, XGBoost, DNN)
- `auc` (float): Area under ROC curve (0-1)
- `accuracy` (float): Classification accuracy (0-1)
- `precision` (float): Precision score (0-1)
- `recall` (float): Recall score (0-1)
- `f1` (float): F1-score (0-1)

Example:
```csv
disease,model,auc,accuracy,precision,recall,f1
Cardiovascular,RandomForest,0.87,0.82,0.79,0.85,0.82
Cardiovascular,XGBoost,0.89,0.84,0.81,0.87,0.84
Diabetes,RandomForest,0.85,0.80,0.77,0.83,0.80
```

### Variable Importance Data (`processed/variable_importance.csv`)

Expected columns:
- `disease` (string): Disease category
- `variable` (string): Variable/feature name
- `importance` (float): Importance score (0-1 or other scale)
- `category` (string): Variable category (demographic, lifestyle, clinical, genetic)

Example:
```csv
disease,variable,importance,category
Cardiovascular,age,0.18,demographic
Cardiovascular,bmi,0.14,clinical
Cardiovascular,smoking,0.11,lifestyle
```

### Multimorbidity Network Data (`processed/multimorbidity_network.csv`)

Expected columns:
- `disease_1` (string): First disease
- `disease_2` (string): Second disease
- `correlation` (float): Correlation coefficient (-1 to 1)
- `odds_ratio` (float): Odds ratio of co-occurrence
- `p_value` (float): Statistical significance

Example:
```csv
disease_1,disease_2,correlation,odds_ratio,p_value
Diabetes,Hypertension,0.65,3.8,0.001
Diabetes,CVD,0.58,3.2,0.002
```

## Data Privacy

**Important:** Do not include patient-level identifiable data in this repository.

- Use only aggregated or anonymized data
- For public dashboards, consider using synthetic data that preserves statistical properties
- Ensure compliance with data protection regulations (HIPAA, GDPR, etc.)

## Data Processing

When adding new data:

1. Place raw data files in `raw/` directory
2. Run processing scripts (to be created in `/scripts/` directory)
3. Save cleaned, analysis-ready data to `processed/` directory
4. Update dashboard code in `../dashboard.qmd` to load new datasets

## .gitignore

Data files are gitignored by default to prevent accidental commits of sensitive information.
To track specific processed data files, use `git add -f <file>` explicitly.

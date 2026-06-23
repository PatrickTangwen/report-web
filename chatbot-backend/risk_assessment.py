import os
import numpy as np
import pandas as pd

from clinical_form import DISEASE_DISPLAY_NAMES, _resolve_disease

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
TOP_N_SIMILAR = 20

# Map canonical disease names (from feature_importance.csv) to embedding CSV names
_EMBED_DISEASE_MAP = {
    "CKD": "CKD",
    "NASH": "MASH",
    "Pulmonary Fibrosis": "Pulmonary_fibrosis",
    "SSc_Connective_Tissue": "SSc_Connective_Tissue",
    "Crohns_Disease": "Crohns_Disease",
    "Fibrosis_of_Skin": "Fibrosis_of_Skin",
}

# Map form field keys (from FEATURE_FIELDS) to embedding CSV column names
_FEATURE_COL_MAP = {
    "BMI": "BMI",
    "Systolic Blood Pressure": "SBP",
    "Diastolic Blood Pressure": "DBP",
    "Creatinine": "creatinine",
    "HbA1c": "HbA1c",
    "Waist Circumference": "waist",
    "Hip Circumference": "hip",
    "Age at Diagnosis": "age_at_onset",
}

DISCLAIMER = (
    "This is a research prototype for demonstration purposes only. "
    "Results are based on pre-computed model outputs and should not be "
    "used for clinical decision-making."
)

_embed_df = None


def _load_embeddings():
    global _embed_df
    if _embed_df is None:
        path = os.path.join(DATA_DIR, "fibrotic_patient_embeddings.csv")
        _embed_df = pd.read_csv(path)
    return _embed_df


def _risk_level(prob):
    if prob >= 0.7:
        return "high"
    if prob >= 0.4:
        return "medium"
    return "low"


def query_patient_risk(features, disease_query, top_n=TOP_N_SIMILAR):
    canonical = _resolve_disease(disease_query)
    if canonical is None:
        return None

    embed_disease = _EMBED_DISEASE_MAP.get(canonical)
    if embed_disease is None:
        return None

    df = _load_embeddings()
    cohort = df[df["disease"] == embed_disease].copy()
    if cohort.empty:
        return None

    # Find matchable features: user provided AND exists in embedding columns
    match_cols = []
    user_vals = []
    for feat_key, val in features.items():
        col = _FEATURE_COL_MAP.get(feat_key)
        if col is None or col not in cohort.columns:
            continue
        if not isinstance(val, (int, float)):
            continue
        match_cols.append(col)
        user_vals.append(float(val))

    if match_cols:
        sub = cohort[match_cols].copy()
        col_min = sub.min()
        col_max = sub.max()
        col_range = col_max - col_min
        col_range = col_range.replace(0, 1)

        normalized = (sub - col_min) / col_range
        user_norm = [(user_vals[i] - col_min.iloc[i]) / col_range.iloc[i] for i in range(len(match_cols))]

        dist = np.sqrt(((normalized.values - np.array(user_norm)) ** 2).mean(axis=1))
        # NaN rows get max distance
        dist = np.where(np.isnan(dist), dist[~np.isnan(dist)].max() + 1 if (~np.isnan(dist)).any() else 1.0, dist)
        cohort = cohort.assign(_dist=dist)
        matched = cohort.nsmallest(top_n, "_dist")
    else:
        matched = cohort.sample(n=min(top_n, len(cohort)), random_state=42)

    # 1. Risk score
    mean_p = float(matched["p_true"].mean())
    risk_level = _risk_level(mean_p)

    # 2. Key risk factors — top 5 from feature_importance
    fi_path = os.path.join(DATA_DIR, "feature_importance.csv")
    fi_df = pd.read_csv(fi_path)
    top_features = fi_df[fi_df["disease"] == canonical].sort_values("rank").head(5)

    risk_factors = []
    for _, row in top_features.iterrows():
        feat_key = row["feature"]
        col = _FEATURE_COL_MAP.get(feat_key)
        entry = {
            "feature": feat_key,
            "rank": int(row["rank"]),
            "importance": float(row["importance_score"]),
            "user_value": features.get(feat_key),
        }
        if col and col in matched.columns:
            vals = matched[col].dropna()
            if len(vals) > 0:
                entry["cohort_mean"] = round(float(vals.mean()), 2)
                entry["cohort_min"] = round(float(vals.min()), 2)
                entry["cohort_max"] = round(float(vals.max()), 2)
        risk_factors.append(entry)

    # 3. Similar patient statistics
    high_risk_count = int((matched["p_true"] >= 0.7).sum())
    age_vals = matched["age_recruit"].dropna()
    male_count = int(matched["is_male"].sum()) if "is_male" in matched.columns else None
    fam_hist = int(matched["has_affected_rel"].sum()) if "has_affected_rel" in matched.columns else None

    similar_patients = {
        "count": len(matched),
        "high_risk_pct": round(100.0 * high_risk_count / len(matched), 1),
        "mean_age": round(float(age_vals.mean()), 1) if len(age_vals) > 0 else None,
        "male_pct": round(100.0 * male_count / len(matched), 1) if male_count is not None else None,
        "family_history_pct": round(100.0 * fam_hist / len(matched), 1) if fam_hist is not None else None,
    }

    return {
        "disease": canonical,
        "disease_label": DISEASE_DISPLAY_NAMES.get(canonical, canonical),
        "risk_level": risk_level,
        "risk_probability": round(mean_p, 4),
        "risk_factors": risk_factors,
        "similar_patients": similar_patients,
        "disclaimer": DISCLAIMER,
    }

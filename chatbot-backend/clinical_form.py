from data_query import get_datasets, _DISEASE_ALIASES, _normalize

DISEASE_DISPLAY_NAMES = {
    "CKD": "Chronic Kidney Disease (CKD)",
    "Crohns_Disease": "Crohn's Disease",
    "Fibrosis_of_Skin": "Skin Fibrosis",
    "IPF": "Idiopathic Pulmonary Fibrosis (IPF)",
    "NASH": "Non-Alcoholic Steatohepatitis (NASH/MASH)",
    "Pulmonary Fibrosis": "Pulmonary Fibrosis",
    "SSc_Connective_Tissue": "Systemic Sclerosis (SSc)",
}

FEATURE_FIELDS = {
    "Free T4": {"label": "Free T4 (pmol/L)", "type": "numeric", "min": 9.0, "max": 25.0, "step": 0.1},
    "BMI": {"label": "BMI (kg/m²)", "type": "numeric", "min": 15.0, "max": 60.0, "step": 0.1},
    "Haemoglobin": {"label": "Haemoglobin (g/dL)", "type": "numeric", "min": 8.0, "max": 20.0, "step": 0.1},
    "Sodium": {"label": "Sodium (mmol/L)", "type": "numeric", "min": 130, "max": 150, "step": 1},
    "Fibrinogen": {"label": "Fibrinogen (g/L)", "type": "numeric", "min": 1.5, "max": 6.0, "step": 0.1},
    "Physical Activity": {"label": "Physical Activity (days/week)", "type": "numeric", "min": 0, "max": 7, "step": 1},
    "ALT": {"label": "ALT (U/L)", "type": "numeric", "min": 5, "max": 200, "step": 1},
    "AST": {"label": "AST (U/L)", "type": "numeric", "min": 5, "max": 200, "step": 1},
    "Urea": {"label": "Urea (mmol/L)", "type": "numeric", "min": 1.0, "max": 20.0, "step": 0.1},
    "LDL Cholesterol": {"label": "LDL Cholesterol (mmol/L)", "type": "numeric", "min": 0.5, "max": 8.0, "step": 0.1},
    "Testosterone": {"label": "Testosterone (nmol/L)", "type": "numeric", "min": 0.5, "max": 50.0, "step": 0.1},
    "Phosphate": {"label": "Phosphate (mmol/L)", "type": "numeric", "min": 0.5, "max": 2.5, "step": 0.1},
    "Potassium": {"label": "Potassium (mmol/L)", "type": "numeric", "min": 3.0, "max": 6.5, "step": 0.1},
    "Systolic Blood Pressure": {"label": "Systolic BP (mmHg)", "type": "numeric", "min": 80, "max": 220, "step": 1},
    "Apolipoprotein A": {"label": "Apolipoprotein A (g/L)", "type": "numeric", "min": 0.5, "max": 3.0, "step": 0.01},
    "TSH": {"label": "TSH (mU/L)", "type": "numeric", "min": 0.1, "max": 10.0, "step": 0.1},
    "Creatinine": {"label": "Creatinine (µmol/L)", "type": "numeric", "min": 30, "max": 500, "step": 1},
    "Bilirubin": {"label": "Bilirubin (µmol/L)", "type": "numeric", "min": 2, "max": 50, "step": 1},
    "FEV1": {"label": "FEV1 (L)", "type": "numeric", "min": 0.5, "max": 6.0, "step": 0.1},
    "Hip Circumference": {"label": "Hip Circumference (cm)", "type": "numeric", "min": 60, "max": 170, "step": 1},
    "Glucose": {"label": "Glucose (mmol/L)", "type": "numeric", "min": 2.0, "max": 30.0, "step": 0.1},
    "Albumin": {"label": "Albumin (g/L)", "type": "numeric", "min": 20, "max": 60, "step": 1},
    "HbA1c": {"label": "HbA1c (mmol/mol)", "type": "numeric", "min": 20, "max": 120, "step": 1},
    "Iron": {"label": "Iron (µmol/L)", "type": "numeric", "min": 5, "max": 50, "step": 1},
    "IGF-1": {"label": "IGF-1 (nmol/L)", "type": "numeric", "min": 5, "max": 50, "step": 1},
    "HDL Cholesterol": {"label": "HDL Cholesterol (mmol/L)", "type": "numeric", "min": 0.3, "max": 4.0, "step": 0.1},
    "Age at Diagnosis": {"label": "Age (years)", "type": "numeric", "min": 18, "max": 100, "step": 1},
    "SHBG": {"label": "SHBG (nmol/L)", "type": "numeric", "min": 5, "max": 150, "step": 1},
    "Alcohol Intake": {"label": "Alcohol Intake (units/week)", "type": "numeric", "min": 0, "max": 50, "step": 1},
    "Uric Acid": {"label": "Uric Acid (µmol/L)", "type": "numeric", "min": 100, "max": 700, "step": 1},
    "Calcium": {"label": "Calcium (mmol/L)", "type": "numeric", "min": 1.5, "max": 3.5, "step": 0.1},
    "FVC": {"label": "FVC (L)", "type": "numeric", "min": 0.5, "max": 7.0, "step": 0.1},
    "Waist Circumference": {"label": "Waist Circumference (cm)", "type": "numeric", "min": 50, "max": 170, "step": 1},
    "CRP": {"label": "CRP (mg/L)", "type": "numeric", "min": 0.1, "max": 50.0, "step": 0.1},
    "Ferritin": {"label": "Ferritin (ng/mL)", "type": "numeric", "min": 5, "max": 1000, "step": 1},
    "Alkaline Phosphatase": {"label": "Alkaline Phosphatase (U/L)", "type": "numeric", "min": 20, "max": 300, "step": 1},
    "Platelet Count": {"label": "Platelet Count (×10⁹/L)", "type": "numeric", "min": 50, "max": 500, "step": 1},
    "Smoking Status": {"label": "Smoking Status", "type": "select", "options": ["Never", "Former", "Current"]},
    "Triglycerides": {"label": "Triglycerides (mmol/L)", "type": "numeric", "min": 0.3, "max": 10.0, "step": 0.1},
    "eGFR": {"label": "eGFR (mL/min/1.73m²)", "type": "numeric", "min": 5, "max": 150, "step": 1},
    "Cystatin C": {"label": "Cystatin C (mg/L)", "type": "numeric", "min": 0.3, "max": 3.0, "step": 0.1},
    "Vitamin D": {"label": "Vitamin D (nmol/L)", "type": "numeric", "min": 10, "max": 200, "step": 1},
    "Diastolic Blood Pressure": {"label": "Diastolic BP (mmHg)", "type": "numeric", "min": 40, "max": 140, "step": 1},
    "Apolipoprotein B": {"label": "Apolipoprotein B (g/L)", "type": "numeric", "min": 0.3, "max": 2.5, "step": 0.01},
    "Gamma GT": {"label": "Gamma GT (U/L)", "type": "numeric", "min": 5, "max": 500, "step": 1},
    "Insulin": {"label": "Insulin (pmol/L)", "type": "numeric", "min": 10, "max": 500, "step": 1},
    "Lipoprotein(a)": {"label": "Lipoprotein(a) (nmol/L)", "type": "numeric", "min": 1, "max": 500, "step": 1},
    "White Blood Cell Count": {"label": "WBC Count (×10⁹/L)", "type": "numeric", "min": 2.0, "max": 20.0, "step": 0.1},
    "Cortisol": {"label": "Cortisol (nmol/L)", "type": "numeric", "min": 100, "max": 700, "step": 1},
    "Total Cholesterol": {"label": "Total Cholesterol (mmol/L)", "type": "numeric", "min": 2.0, "max": 10.0, "step": 0.1},
}

TOP_N_DEFAULT = 10


def get_available_diseases():
    ds = get_datasets()
    df = ds.get("feature_importance")
    if df is None:
        return []
    diseases = sorted(df["disease"].unique().tolist())
    return [
        {"id": d, "label": DISEASE_DISPLAY_NAMES.get(d, d)}
        for d in diseases
    ]


def _resolve_disease(query):
    """Strict disease resolver: exact canonical match or known alias only."""
    ds = get_datasets()
    df = ds.get("feature_importance")
    if df is None:
        return None
    diseases = set(df["disease"].unique())

    q = _normalize(query)
    for d in diseases:
        if _normalize(d) == q:
            return d

    for alias, canonical in _DISEASE_ALIASES.items():
        if alias == q and canonical in diseases:
            return canonical

    return None


def get_form_fields(disease_query, top_n=TOP_N_DEFAULT):
    canonical = _resolve_disease(disease_query)
    if canonical is None:
        return None

    ds = get_datasets()
    df = ds.get("feature_importance")
    if df is None:
        return None

    rows = df[df["disease"] == canonical].sort_values("rank").head(top_n)
    if rows.empty:
        return None

    fields = []
    for _, row in rows.iterrows():
        feature = row["feature"]
        meta = FEATURE_FIELDS.get(feature)
        if meta is None:
            meta = {"label": feature, "type": "numeric", "min": 0, "max": 1000, "step": 1}
        field = {"key": feature, "rank": int(row["rank"]), **meta}
        fields.append(field)

    return {
        "disease": canonical,
        "disease_label": DISEASE_DISPLAY_NAMES.get(canonical, canonical),
        "fields": fields,
    }

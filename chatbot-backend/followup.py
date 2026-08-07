import os

import pandas as pd

from data_query import _DISEASE_ALIASES, _normalize


DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
DISEASE_DISPLAY_NAMES = {
    "CKD": "Chronic Kidney Disease (CKD)",
    "Cardiac_Fibrosis": "Cardiac Fibrosis",
    "Crohns_Disease": "Crohn's Disease",
    "Fibrosis_of_Skin": "Skin Fibrosis",
    "IPF": "Idiopathic Pulmonary Fibrosis (IPF)",
    "NASH": "Metabolic Dysfunction-Associated Steatohepatitis (MASH)",
    "Pulmonary Fibrosis": "Pulmonary Fibrosis",
    "SSc_Connective_Tissue": "Systemic Sclerosis (SSc)",
}
_pathway_df = None


def _load_pathways():
    global _pathway_df
    if _pathway_df is None:
        path = os.path.join(DATA_DIR, "pathway_enrichment.csv")
        _pathway_df = pd.read_csv(path)
    return _pathway_df


def _resolve_disease(query, diseases):
    normalized = _normalize(query)
    for disease in diseases:
        if _normalize(disease) == normalized:
            return disease
    for alias, canonical in _DISEASE_ALIASES.items():
        if alias == normalized and canonical in diseases:
            return canonical
    return None


def get_pathway_enrichment(disease_query, top_n=10):
    df = _load_pathways()
    canonical = _resolve_disease(disease_query, set(df["disease"].unique()))
    if canonical is None:
        return None

    cohort = df[df["disease"] == canonical].sort_values("rank").head(top_n)
    if cohort.empty:
        return None

    pathways = []
    for _, row in cohort.iterrows():
        pathways.append(
            {
                "pathway": row["pathway"],
                "source": row["source"],
                "gene_count": int(row["gene_count"]),
                "enrichment_ratio": round(float(row["enrichment_ratio"]), 2),
                "p_adjusted": f"{row['p_adjusted']:.2e}",
            }
        )

    return {
        "disease": canonical,
        "disease_label": DISEASE_DISPLAY_NAMES.get(canonical, canonical),
        "pathways": pathways,
    }

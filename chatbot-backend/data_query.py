import pandas as pd

from research_data_release import (
    public_release_metadata,
    research_data_path,
    validate_release,
)

_datasets = {}


def _load():
    if _datasets:
        return
    validate_release()
    files = {
        "evaluation_metrics": "evaluation_metrics.csv",
        "ablation_results": "ablation_results.csv",
        "pathway_enrichment": "pathway_enrichment.csv",
    }
    for key in files:
        _datasets[key] = pd.read_csv(research_data_path(key))


def get_datasets():
    _load()
    return _datasets


def research_release_context():
    metadata = public_release_metadata()
    return {
        "dataset_version": metadata["dataset_version"],
        "data_status": metadata["status"],
    }


# --- Disease matching ---

_DISEASE_ALIASES = {
    "mash": "NASH",
    "metabolic dysfunction associated steatohepatitis": "NASH",
    "non alcoholic steatohepatitis": "NASH",
    "nafld": "NASH",
    "crohn": "Crohns_Disease",
    "crohn's": "Crohns_Disease",
    "crohns": "Crohns_Disease",
    "idiopathic pulmonary fibrosis": "IPF",
    "systemic sclerosis": "SSc_Connective_Tissue",
    "scleroderma": "SSc_Connective_Tissue",
    "ssc": "SSc_Connective_Tissue",
    "chronic kidney disease": "CKD",
    "coronary artery disease": "Coronary Heart Disease",
    "cad": "Coronary Heart Disease",
}


def _normalize(s):
    return s.lower().replace("_", " ").replace("-", " ").replace("'", "").strip()


def _all_diseases():
    _load()
    names = set()
    for df in _datasets.values():
        if "disease" in df.columns:
            names.update(df["disease"].unique())
    return names


def match_disease(query):
    q = _normalize(query)

    for alias, canonical in _DISEASE_ALIASES.items():
        if alias in q:
            return canonical

    best = None
    best_score = 0
    for d in _all_diseases():
        dn = _normalize(d)
        if dn in q or q in dn:
            if len(dn) > best_score:
                best = d
                best_score = len(dn)
        for token in dn.split():
            if len(token) >= 3 and token in q and len(token) > best_score:
                best = d
                best_score = len(token)
    return best

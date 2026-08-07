import os
import pandas as pd

_local = os.path.join(os.path.dirname(__file__), "data")
_repo = os.path.join(os.path.dirname(__file__), "..", "viz", "data")
DATA_DIR = _local if os.path.isdir(_local) else _repo

_datasets = {}


def _load():
    if _datasets:
        return
    files = {
        "evaluation_metrics": "evaluation_metrics.csv",
        "ablation_results": "ablation_results.csv",
        "pathway_enrichment": "pathway_enrichment.csv",
    }
    for key, fname in files.items():
        path = os.path.join(DATA_DIR, fname)
        if os.path.exists(path):
            _datasets[key] = pd.read_csv(path)


def get_datasets():
    _load()
    return _datasets


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



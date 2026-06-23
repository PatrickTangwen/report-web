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
        "feature_importance": "feature_importance.csv",
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

def _normalize(s):
    return s.lower().replace("_", " ").replace("-", " ").strip()


def _all_diseases():
    _load()
    names = set()
    for df in _datasets.values():
        if "disease" in df.columns:
            names.update(df["disease"].unique())
    return names


def match_disease(query):
    q = _normalize(query)
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


# --- Dataset routing ---

_EVAL_KEYWORDS = [
    "auroc", "auprc", "auc", "precision", "recall", "f1",
    "metric", "performance", "model", "baseline", "compare",
    "best model", "worst model", "accuracy",
]

_ABLATION_KEYWORDS = [
    "ablation", "without", "w/o", "remove", "removing",
    "genetic data", "ontology graph", "attention mechanism",
    "ehr sequence", "pre-training", "component",
]

_FEATURE_KEYWORDS = [
    "feature", "risk factor", "importance", "important",
    "top feature", "most important", "contribut",
]

_PATHWAY_KEYWORDS = [
    "pathway", "enrichment", "enriched", "go_bp", "kegg",
    "gene", "biological process", "signaling",
]


def match_datasets(query):
    q = _normalize(query)
    matched = []
    for keywords, name in [
        (_EVAL_KEYWORDS, "evaluation_metrics"),
        (_ABLATION_KEYWORDS, "ablation_results"),
        (_FEATURE_KEYWORDS, "feature_importance"),
        (_PATHWAY_KEYWORDS, "pathway_enrichment"),
    ]:
        if any(kw in q for kw in keywords):
            matched.append(name)
    if not matched:
        matched = ["evaluation_metrics"]
    return matched


# --- Query execution ---

def query_data(user_message):
    _load()
    dataset_names = match_datasets(user_message)
    disease = match_disease(user_message)

    results = {}
    for name in dataset_names:
        df = _datasets.get(name)
        if df is None:
            continue
        if disease and "disease" in df.columns:
            filtered = df[df["disease"] == disease]
            if not filtered.empty:
                results[name] = filtered.to_string(index=False)
                continue
        results[name] = df.to_string(index=False)

    return results, disease, dataset_names


def format_data_context(results, disease, dataset_names):
    _load()
    parts = []
    parts.append("Available datasets: evaluation_metrics, ablation_results, "
                 "feature_importance, pathway_enrichment.")
    if disease:
        parts.append(f"Detected disease filter: {disease}")
    parts.append(f"Queried datasets: {', '.join(dataset_names)}")
    parts.append("")

    for name, data_str in results.items():
        parts.append(f"=== {name} ===")
        parts.append(data_str)
        parts.append("")

    available_diseases = {}
    for name, df in _datasets.items():
        if "disease" in df.columns:
            available_diseases[name] = sorted(df["disease"].unique().tolist())
    parts.append("=== Available diseases per dataset ===")
    for name, diseases in available_diseases.items():
        parts.append(f"{name}: {', '.join(diseases)}")

    return "\n".join(parts)

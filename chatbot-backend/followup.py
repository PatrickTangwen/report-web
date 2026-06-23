import os
import pandas as pd

from clinical_form import DISEASE_DISPLAY_NAMES, _resolve_disease
from risk_assessment import _EMBED_DISEASE_MAP

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")

_pathway_df = None
_embed_df = None


def _load_pathways():
    global _pathway_df
    if _pathway_df is None:
        path = os.path.join(DATA_DIR, "pathway_enrichment.csv")
        _pathway_df = pd.read_csv(path)
    return _pathway_df


def _load_embeddings():
    global _embed_df
    if _embed_df is None:
        path = os.path.join(DATA_DIR, "fibrotic_patient_embeddings.csv")
        _embed_df = pd.read_csv(path)
    return _embed_df


def get_pathway_enrichment(disease_query, top_n=10):
    canonical = _resolve_disease(disease_query)
    if canonical is None:
        return None

    df = _load_pathways()
    cohort = df[df["disease"] == canonical].sort_values("rank").head(top_n)
    if cohort.empty:
        return None

    pathways = []
    for _, row in cohort.iterrows():
        pathways.append({
            "pathway": row["pathway"],
            "source": row["source"],
            "gene_count": int(row["gene_count"]),
            "enrichment_ratio": round(float(row["enrichment_ratio"]), 2),
            "p_adjusted": f"{row['p_adjusted']:.2e}",
        })

    return {
        "disease": canonical,
        "disease_label": DISEASE_DISPLAY_NAMES.get(canonical, canonical),
        "pathways": pathways,
    }


def describe_embedding_context(disease_query):
    canonical = _resolve_disease(disease_query)
    if canonical is None:
        return None

    embed_disease = _EMBED_DISEASE_MAP.get(canonical)
    if embed_disease is None:
        return None

    df = _load_embeddings()
    cohort = df[df["disease"] == embed_disease]
    if cohort.empty:
        return None

    total = len(cohort)
    group_counts = cohort["group"].value_counts()

    # Purity distribution
    groups = {}
    for g in ("pure", "intermediate", "overlap"):
        count = int(group_counts.get(g, 0))
        groups[g] = {"count": count, "pct": round(100.0 * count / total, 1)}

    # Centroid in UMAP space
    centroid_x = round(float(cohort["tsne_x"].mean()), 2)
    centroid_y = round(float(cohort["tsne_y"].mean()), 2)

    # Mean purity
    mean_purity = round(float(cohort["purity_2d"].mean()), 3)

    # Nearest other disease clusters by centroid distance
    other_diseases = df[df["disease"] != embed_disease]["disease"].unique()
    neighbors = []
    for other in other_diseases:
        other_cohort = df[df["disease"] == other]
        ox = float(other_cohort["tsne_x"].mean())
        oy = float(other_cohort["tsne_y"].mean())
        dist = ((centroid_x - ox) ** 2 + (centroid_y - oy) ** 2) ** 0.5
        neighbors.append({"disease": other, "distance": round(dist, 2)})
    neighbors.sort(key=lambda x: x["distance"])

    return {
        "disease": canonical,
        "disease_label": DISEASE_DISPLAY_NAMES.get(canonical, canonical),
        "embed_disease": embed_disease,
        "total_patients": total,
        "centroid": {"x": centroid_x, "y": centroid_y},
        "mean_purity_2d": mean_purity,
        "groups": groups,
        "nearest_clusters": neighbors[:3],
    }

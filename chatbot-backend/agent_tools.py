"""Typed research tools for the in-task agent.

Each tool is a pure function over existing data modules with a Pydantic
input schema. Tool descriptions are first-class prompt artifacts: they are
what the model reads when deciding which tool to call, so treat every edit
to them as a behavior change (spec: docs/spec-agent-refactor-2026-08-07.md).

The roster is intentionally limited to Study Evidence: the published paper
and the published study result data. The profile/matching flow and ICD
keyword lookup are excluded by design (ADR-0014).
"""

import json
import re
from collections import Counter
from statistics import median
from typing import Optional

from pydantic import BaseModel, Field, ValidationError

from data_query import _normalize, get_datasets, match_disease
from fibrotic_release import load_fibrotic_release
from followup import get_pathway_enrichment
from paper_context import PAPER_TEXT
from profile_matching import (
    CATEGORY_VALUES,
    _category_code,
    _row_value,
    load_matching_release,
)


# --- get_paper_content ---

_SECTION_HEADING = re.compile(r"^([A-Z][A-Za-z' -]{1,60}):\s*$")


def _paper_sections():
    sections = {}
    current = "Title"
    lines = []
    for line in PAPER_TEXT.strip().splitlines():
        match = _SECTION_HEADING.match(line)
        if match:
            sections[current] = "\n".join(lines).strip()
            current = match.group(1)
            lines = []
        else:
            lines.append(line)
    sections[current] = "\n".join(lines).strip()
    return {name: text for name, text in sections.items() if text}


class PaperContentInput(BaseModel):
    section: Optional[str] = Field(
        default=None,
        description=(
            "Exact section name to fetch (e.g. 'Methods', 'Conclusions'). "
            "Omit to get the full paper text."
        ),
    )


def get_paper_content(params):
    sections = _paper_sections()
    if params.section is None:
        return {"content": PAPER_TEXT.strip(), "available_sections": sorted(sections)}
    for name, text in sections.items():
        if name.lower() == params.section.lower():
            return {"section": name, "content": text}
    return {
        "error": f"Unknown section: {params.section!r}",
        "available_sections": sorted(sections),
    }


# --- query_metrics / query_ablation ---


def _match_text_column(df, column, wanted):
    values = sorted(df[column].unique().tolist())
    matches = [v for v in values if str(v).casefold() == wanted.strip().casefold()]
    if not matches:
        return None, values
    return df[df[column] == matches[0]], values


def _match_disease_column(df, column, wanted):
    canonical = match_disease(wanted)
    available = sorted(df[column].unique().tolist())
    if canonical is None or canonical not in available:
        return None, available
    return df[df[column] == canonical], available


def _apply_filters(df, filters):
    """Apply (column, value, resolver) filters; value=None means unfiltered.

    The first unresolvable value short-circuits into a {"matched": False}
    payload listing that column's available values.
    """
    applied = {}
    for column, value, resolver in filters:
        if value is None:
            continue
        subset, available = resolver(df, column, value)
        if subset is None:
            return {"matched": False, f"available_{column}s": available}
        applied[column] = subset[column].iloc[0]
        df = subset
    return {
        "filters": applied,
        "row_count": len(df),
        "rows": df.to_dict(orient="records"),
    }


class MetricsInput(BaseModel):
    disease: Optional[str] = Field(
        default=None, description="Disease name or common alias (e.g. 'CKD', 'MASH')."
    )
    model: Optional[str] = Field(
        default=None,
        description="Model name (e.g. 'ALIGATEHR-Gen', a baseline model name).",
    )
    metric: Optional[str] = Field(
        default=None, description="Metric name (e.g. 'AUROC', 'AUPRC', 'F1')."
    )


def query_metrics(params):
    return _apply_filters(
        get_datasets()["evaluation_metrics"],
        [
            ("disease", params.disease, _match_disease_column),
            ("model", params.model, _match_text_column),
            ("metric", params.metric, _match_text_column),
        ],
    )


class AblationInput(BaseModel):
    disease: Optional[str] = Field(
        default=None, description="Disease name or common alias (e.g. 'CKD', 'MASH')."
    )
    variant: Optional[str] = Field(
        default=None,
        description=(
            "Ablation variant name (e.g. 'w/o Genetic Data', 'w/o Ontology Graph')."
        ),
    )
    metric: Optional[str] = Field(
        default=None, description="Metric name (e.g. 'AUROC', 'AUPRC')."
    )


def query_ablation(params):
    return _apply_filters(
        get_datasets()["ablation_results"],
        [
            ("disease", params.disease, _match_disease_column),
            ("variant", params.variant, _match_text_column),
            ("metric", params.metric, _match_text_column),
        ],
    )


# --- query_enrichment ---


class EnrichmentInput(BaseModel):
    disease: str = Field(
        description="Disease name or common alias (e.g. 'CKD', 'MASH')."
    )
    top_n: int = Field(
        default=10, ge=1, le=25, description="Number of top-ranked pathways to return."
    )


def query_enrichment(params):
    result = get_pathway_enrichment(params.disease, top_n=params.top_n)
    if result is None:
        df = get_datasets()["pathway_enrichment"]
        return {
            "matched": False,
            "available_diseases": sorted(df["disease"].unique().tolist()),
        }
    return result


# --- summarize_fibrotic_cohort ---

# The matching release names its targets in the Comparison Target vocabulary
# (fibrotic_contract.TARGETS), which differs from the enrichment dataset's
# disease names — resolve against this vocabulary, not data_query's.
TARGET_LABELS = {
    "CKD": "Chronic Kidney Disease (CKD)",
    "Cardiac_Fibrosis": "Cardiac Fibrosis",
    "MASH": "Metabolic Dysfunction-Associated Steatohepatitis (MASH)",
    "Pulmonary_fibrosis": "Pulmonary Fibrosis",
    "SSc_Connective_Tissue": "Systemic Sclerosis / Connective Tissue",
    "Crohns_Disease": "Crohn's Disease",
    "Fibrosis_of_Skin": "Skin Fibrosis",
}

TARGET_ALIASES = {
    "chronic kidney disease": "CKD",
    "nash": "MASH",
    "metabolic dysfunction associated steatohepatitis": "MASH",
    "non alcoholic steatohepatitis": "MASH",
    "nafld": "MASH",
    "ipf": "Pulmonary_fibrosis",
    "idiopathic pulmonary fibrosis": "Pulmonary_fibrosis",
    "systemic sclerosis": "SSc_Connective_Tissue",
    "scleroderma": "SSc_Connective_Tissue",
    "ssc": "SSc_Connective_Tissue",
    "connective tissue": "SSc_Connective_Tissue",
    "crohn": "Crohns_Disease",
    "crohns": "Crohns_Disease",
    "skin fibrosis": "Fibrosis_of_Skin",
}


def _resolve_target(query, targets):
    normalized = _normalize(query)
    for target in targets:
        if _normalize(target) == normalized:
            return target
    canonical = TARGET_ALIASES.get(normalized)
    if canonical in targets:
        return canonical
    return None


class FibroticCohortInput(BaseModel):
    disease: Optional[str] = Field(
        default=None,
        description=(
            "Comparison target name or common alias (e.g. 'CKD', 'MASH', "
            "'pulmonary fibrosis'). Omit to summarize all targets."
        ),
    )


def _sex_distribution(rows, suppression_minimum):
    reverse = {
        encoded: category for category, encoded in CATEGORY_VALUES["sex"].items()
    }
    counts = Counter(
        reverse[_category_code(value)]
        for row in rows
        if (value := _row_value(row, "sex")) is not None
    )
    if not counts:
        return None
    missing = len(rows) - sum(counts.values())
    if min(counts.values()) < suppression_minimum or 0 < missing < suppression_minimum:
        return {"suppressed": True}
    return {
        "distribution": [
            {"sex": category, "count": count}
            for category, count in sorted(counts.items())
        ]
    }


def _age_summary(rows, suppression_minimum):
    values = [
        float(value)
        for row in rows
        if (value := _row_value(row, "age_recruit")) is not None
    ]
    if not values:
        return None
    missing = len(rows) - len(values)
    if len(values) < suppression_minimum or 0 < missing < suppression_minimum:
        return {"suppressed": True}
    return {
        "median": round(median(values), 1),
        "range": [round(min(values), 1), round(max(values), 1)],
    }


def _target_summary(target, rows, display_by_id, suppression_minimum):
    groups = Counter(
        display_by_id[row["visual_reference_id"]]["group"] for row in rows
    )
    return {
        "target": target,
        "label": TARGET_LABELS[target],
        "reference_count": len(rows),
        "embedding_groups": dict(sorted(groups.items())),
        "age_at_recruitment": _age_summary(rows, suppression_minimum),
        "sex": _sex_distribution(rows, suppression_minimum),
    }


def summarize_fibrotic_cohort(params):
    release = load_matching_release()
    embedding, _ = load_fibrotic_release()
    display_by_id = {point["visual_reference_id"]: point for point in embedding["points"]}
    suppression_minimum = release["calibration"]["methodology"][
        "aggregate_cell_suppression_minimum"
    ]

    rows_by_target = {}
    for row in release["rows"]:
        rows_by_target.setdefault(row["disease"], []).append(row)

    if params.disease is not None:
        canonical = _resolve_target(params.disease, set(rows_by_target))
        if canonical is None:
            return {
                "matched": False,
                "available_targets": sorted(rows_by_target),
            }
        targets = [canonical]
    else:
        targets = sorted(rows_by_target)

    return {
        "dataset_version": release["dataset_version"],
        "note": (
            "Cohort-level aggregates of the fibrotic reference cohort; "
            "sparse cells are suppressed. Not individual patient data."
        ),
        "targets": [
            _target_summary(
                target, rows_by_target[target], display_by_id, suppression_minimum
            )
            for target in targets
        ],
    }


# --- Registry ---

TOOLS = {
    "get_paper_content": {
        "label": "Reading the published paper",
        "description": (
            "Fetch the published ALIGATEHR-Gen paper text: the full paper or a "
            "single named section. Use this to ground any claim about the "
            "paper's methods, results, contributions, or limitations."
        ),
        "input_model": PaperContentInput,
        "handler": get_paper_content,
    },
    "query_metrics": {
        "label": "Querying evaluation metrics",
        "description": (
            "Look up published evaluation metrics (AUROC, AUPRC, Precision, "
            "Recall, F1) for ALIGATEHR-Gen and baseline models, optionally "
            "filtered by disease, model, or metric. Returns exact published "
            "values with confidence intervals."
        ),
        "input_model": MetricsInput,
        "handler": query_metrics,
    },
    "query_ablation": {
        "label": "Consulting ablation results",
        "description": (
            "Look up published ablation results: how removing a model "
            "component (e.g. genetic data, ontology graph) changes a metric "
            "for a disease, including the delta against the full model."
        ),
        "input_model": AblationInput,
        "handler": query_ablation,
    },
    "query_enrichment": {
        "label": "Looking up pathway enrichment",
        "description": (
            "Look up published pathway enrichment results for a disease: "
            "top-ranked enriched pathways with source (GO_BP/KEGG), gene "
            "counts, enrichment ratios, and adjusted p-values."
        ),
        "input_model": EnrichmentInput,
        "handler": query_enrichment,
    },
    "summarize_fibrotic_cohort": {
        "label": "Summarizing the fibrotic reference cohort",
        "description": (
            "Cohort-level aggregates of the fibrotic reference cohort per "
            "comparison target: reference counts, embedding group breakdown "
            "(pure/intermediate/overlap), median age at recruitment, and sex "
            "distribution. Aggregates only — never individual patient rows."
        ),
        "input_model": FibroticCohortInput,
        "handler": summarize_fibrotic_cohort,
    },
}


def openai_tool_specs():
    return [
        {
            "type": "function",
            "function": {
                "name": name,
                "description": tool["description"],
                "parameters": tool["input_model"].model_json_schema(),
            },
        }
        for name, tool in TOOLS.items()
    ]


def execute_tool(name, arguments):
    """Run one tool call and always return a JSON-serializable dict.

    Invalid tool names and invalid arguments are returned as explicit error
    payloads so the agent loop can surface them to the model as a normal
    tool-result turn (general protocol handling, no silent retry).
    """
    tool = TOOLS.get(name)
    if tool is None:
        return {"error": f"Unknown tool: {name}", "available_tools": sorted(TOOLS)}
    if isinstance(arguments, str):
        try:
            arguments = json.loads(arguments) if arguments.strip() else {}
        except json.JSONDecodeError as error:
            return {"error": f"Tool arguments are not valid JSON: {error}"}
    try:
        params = tool["input_model"].model_validate(arguments or {})
    except ValidationError as error:
        return {"error": f"Invalid tool arguments: {error}"}
    return tool["handler"](params)

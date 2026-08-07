import json

import pytest

from agent_tools import (
    EVIDENCE_ROW_CAP,
    TOOLS,
    _age_summary,
    _sex_distribution,
    execute_tool,
    openai_tool_specs,
    summarize_evidence,
)


# --- get_paper_content ---


def test_paper_content_full_text_lists_sections():
    result = execute_tool("get_paper_content", {})
    assert "ALIGATEHR-Gen" in result["content"]
    assert "Methods" in result["available_sections"]
    assert "Conclusions" in result["available_sections"]


def test_paper_content_section_lookup_is_case_insensitive():
    result = execute_tool("get_paper_content", {"section": "conclusions"})
    assert result["section"] == "Conclusions"
    assert "attention-based graph neural network" in result["content"]


def test_paper_content_unknown_section_returns_available_sections():
    result = execute_tool("get_paper_content", {"section": "Appendix Z"})
    assert "error" in result
    assert "Methods" in result["available_sections"]


# --- query_metrics ---


def test_query_metrics_resolves_disease_alias_and_filters():
    result = execute_tool(
        "query_metrics",
        {"disease": "chronic kidney disease", "model": "ALIGATEHR-Gen", "metric": "AUROC"},
    )
    assert result["filters"]["disease"] == "CKD"
    assert result["row_count"] == len(result["rows"]) == 1
    row = result["rows"][0]
    assert row["model"] == "ALIGATEHR-Gen"
    assert 0 < row["value"] < 1


def test_query_metrics_unknown_disease_lists_available():
    result = execute_tool("query_metrics", {"disease": "influenza"})
    assert result["matched"] is False
    assert "CKD" in result["available_diseases"]


def test_query_metrics_unfiltered_returns_all_rows():
    result = execute_tool("query_metrics", {})
    assert result["filters"] == {}
    assert result["row_count"] == 350


# --- query_ablation ---


def test_query_ablation_variant_filter_is_case_insensitive():
    result = execute_tool(
        "query_ablation", {"variant": "W/O GENETIC DATA", "disease": "CKD"}
    )
    assert result["filters"]["variant"] == "w/o Genetic Data"
    assert all("delta" in row for row in result["rows"])


def test_query_ablation_unknown_variant_lists_available():
    result = execute_tool("query_ablation", {"variant": "w/o Everything"})
    assert result["matched"] is False
    assert "w/o Genetic Data" in result["available_variants"]


# --- query_enrichment ---


def test_query_enrichment_returns_top_n_pathways():
    result = execute_tool("query_enrichment", {"disease": "CKD", "top_n": 3})
    assert result["disease"] == "CKD"
    assert len(result["pathways"]) == 3
    assert result["pathways"][0]["pathway"]


def test_query_enrichment_unknown_disease_lists_available():
    result = execute_tool("query_enrichment", {"disease": "influenza"})
    assert result["matched"] is False
    assert "CKD" in result["available_diseases"]


def test_query_enrichment_rejects_out_of_bounds_top_n():
    result = execute_tool("query_enrichment", {"disease": "CKD", "top_n": 100})
    assert "Invalid tool arguments" in result["error"]


# --- summarize_fibrotic_cohort ---


def test_fibrotic_summary_covers_all_targets_with_aggregates_only():
    result = execute_tool("summarize_fibrotic_cohort", {})
    assert result["dataset_version"]
    assert len(result["targets"]) >= 5
    for target in result["targets"]:
        assert target["reference_count"] > 0
        assert set(target["embedding_groups"]) <= {"pure", "intermediate", "overlap"}
        assert "rows" not in target
        assert "visual_reference_id" not in json.dumps(target)


def test_fibrotic_summary_resolves_alias_to_single_target():
    result = execute_tool("summarize_fibrotic_cohort", {"disease": "nash"})
    assert [t["target"] for t in result["targets"]] == ["MASH"]
    summary = result["targets"][0]
    assert summary["label"].endswith("(MASH)")
    age = summary["age_at_recruitment"]
    assert age is None or "suppressed" in age or "median" in age


def test_fibrotic_summary_resolves_glossary_name_to_target_code():
    result = execute_tool("summarize_fibrotic_cohort", {"disease": "Skin Fibrosis"})
    assert [t["target"] for t in result["targets"]] == ["Fibrosis_of_Skin"]


def test_fibrotic_summary_unknown_disease_lists_targets():
    result = execute_tool("summarize_fibrotic_cohort", {"disease": "influenza"})
    assert result["matched"] is False
    assert "CKD" in result["available_targets"]


def test_age_summary_suppresses_sparse_cells():
    rows = [{"age_recruit": "60"}] * 3
    assert _age_summary(rows, suppression_minimum=5) == {"suppressed": True}
    rows = [{"age_recruit": "60"}] * 5 + [{"age_recruit": ""}] * 2
    assert _age_summary(rows, suppression_minimum=5) == {"suppressed": True}
    assert _age_summary([{"age_recruit": str(50 + i)} for i in range(5)], 5) == {
        "median": 52,
        "range": [50, 54],
    }


def test_sex_distribution_decodes_categories_and_suppresses():
    rows = [{"sex": "0"}] * 6 + [{"sex": "1"}] * 6
    assert _sex_distribution(rows, suppression_minimum=5) == {
        "distribution": [
            {"sex": "female", "count": 6},
            {"sex": "male", "count": 6},
        ]
    }
    rows = [{"sex": "0"}] * 6 + [{"sex": "1"}] * 2
    assert _sex_distribution(rows, suppression_minimum=5) == {"suppressed": True}


def test_sex_distribution_fails_loudly_on_unknown_code():
    with pytest.raises(KeyError):
        _sex_distribution([{"sex": "7"}] * 6, suppression_minimum=5)


# --- registry protocol ---


def test_openai_tool_specs_expose_all_tools():
    specs = openai_tool_specs()
    assert {s["function"]["name"] for s in specs} == set(TOOLS)
    for spec in specs:
        assert spec["type"] == "function"
        assert spec["function"]["description"]
        assert spec["function"]["parameters"]["type"] == "object"


def test_execute_tool_unknown_tool_is_an_error_payload():
    result = execute_tool("match_patient_profile", {})
    assert "Unknown tool" in result["error"]
    assert "match_patient_profile" not in result["available_tools"]


def test_execute_tool_malformed_json_arguments_is_an_error_payload():
    result = execute_tool("query_metrics", "{not json")
    assert "not valid JSON" in result["error"]


def test_execute_tool_accepts_json_string_arguments():
    result = execute_tool("query_metrics", json.dumps({"disease": "CKD"}))
    assert result["filters"]["disease"] == "CKD"


# --- Answer Evidence (ADR-0016) ---


def test_tabular_evidence_caps_rows_and_states_the_total():
    result = execute_tool("query_ablation", {})
    evidence = summarize_evidence("query_ablation", result)
    assert evidence["total_rows"] == 175
    assert len(evidence["rows"]) == EVIDENCE_ROW_CAP
    assert evidence["truncated"] is True

    small = execute_tool(
        "query_ablation", {"disease": "CKD", "metric": "AUROC"}
    )
    small_evidence = summarize_evidence("query_ablation", small)
    assert small_evidence["total_rows"] == 5
    assert len(small_evidence["rows"]) == 5
    assert "truncated" not in small_evidence


def test_paper_evidence_never_carries_content():
    full = summarize_evidence(
        "get_paper_content", execute_tool("get_paper_content", {})
    )
    assert "content" not in full
    assert "Methods" in full["available_sections"]

    section = summarize_evidence(
        "get_paper_content", execute_tool("get_paper_content", {"section": "Methods"})
    )
    assert section == {"section": "Methods"}


def test_unmatched_and_error_results_summarize_safely():
    unmatched = summarize_evidence(
        "query_metrics", execute_tool("query_metrics", {"disease": "influenza"})
    )
    assert unmatched["matched"] is False

    error = summarize_evidence(
        "query_enrichment", execute_tool("query_enrichment", {"disease": "CKD", "top_n": 99})
    )
    assert set(error) == {"error"}


def test_cohort_and_enrichment_evidence_pass_through_bounded_payloads():
    enrichment = execute_tool("query_enrichment", {"disease": "CKD", "top_n": 3})
    assert summarize_evidence("query_enrichment", enrichment) == enrichment

    cohort = execute_tool("summarize_fibrotic_cohort", {"disease": "CKD"})
    assert summarize_evidence("summarize_fibrotic_cohort", cohort) == cohort

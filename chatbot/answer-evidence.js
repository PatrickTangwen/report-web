(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.ALIGATEHR_ANSWER_EVIDENCE = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  // Pure builders for Answer Evidence provenance display (issue #56,
  // ADR-0016). Input entries come from SSE tool_result events or the
  // non-streaming tool_trace: {tool, ok, evidence}. Everything rendered
  // derives from the evidence payload — never from answer prose.

  var TOOL_TITLES = {
    get_paper_content: "Paper content",
    query_metrics: "Evaluation metrics",
    query_ablation: "Ablation results",
    query_enrichment: "Pathway enrichment",
    summarize_fibrotic_cohort: "Fibrotic cohort aggregates",
  };

  var TABLE_COLUMNS = {
    query_metrics: ["model", "disease", "metric", "value", "ci_lower", "ci_upper"],
    query_ablation: ["variant", "disease", "metric", "value", "full_model_value", "delta"],
  };

  function filtersText(filters) {
    var parts = [];
    Object.keys(filters || {}).forEach(function (key) {
      parts.push(String(filters[key]));
    });
    return parts.join(" · ");
  }

  function rowsCountText(evidence) {
    if (evidence.truncated) {
      return "first " + evidence.rows.length + " of " + evidence.total_rows + " rows";
    }
    return evidence.total_rows + (evidence.total_rows === 1 ? " row" : " rows");
  }

  function chipFor(entry) {
    var title = TOOL_TITLES[entry.tool] || entry.tool;
    var evidence = entry.evidence || {};
    if (!entry.ok || evidence.error) {
      return { title: title, detail: "error", error: true };
    }
    if (evidence.matched === false) {
      return { title: title, detail: "no match", error: false };
    }
    var detail = "";
    if (entry.tool === "get_paper_content") {
      detail = evidence.section ? "section: " + evidence.section : "full paper";
    } else if (entry.tool === "query_metrics" || entry.tool === "query_ablation") {
      var scope = filtersText(evidence.filters);
      detail = (scope ? scope + " · " : "") + rowsCountText(evidence);
    } else if (entry.tool === "query_enrichment") {
      detail =
        (evidence.disease_label || evidence.disease || "") +
        " · " +
        (evidence.pathways || []).length +
        " pathways";
    } else if (entry.tool === "summarize_fibrotic_cohort") {
      var targets = evidence.targets || [];
      detail =
        targets.length === 1
          ? targets[0].label
          : targets.length + " comparison targets";
    }
    return { title: title, detail: detail, error: false };
  }

  function numberText(value) {
    return typeof value === "number" ? String(value) : value == null ? "" : String(value);
  }

  function tableFor(entry) {
    var evidence = entry.evidence || {};
    if (!entry.ok || evidence.error) {
      return { kind: "text", text: String(evidence.error || "Tool call failed.") };
    }
    if (evidence.matched === false) {
      var available = [];
      Object.keys(evidence).forEach(function (key) {
        if (key.indexOf("available_") === 0 && Array.isArray(evidence[key])) {
          available = evidence[key];
        }
      });
      return { kind: "text", text: "No match. Available: " + available.join(", ") };
    }
    if (entry.tool === "get_paper_content") {
      return {
        kind: "text",
        text: evidence.section
          ? "Consulted section: " + evidence.section
          : "Consulted the full paper. Sections: " +
            (evidence.available_sections || []).join(", "),
      };
    }
    if (entry.tool === "query_metrics" || entry.tool === "query_ablation") {
      var columns = TABLE_COLUMNS[entry.tool];
      return {
        kind: "table",
        columns: columns,
        rows: (evidence.rows || []).map(function (row) {
          return columns.map(function (column) {
            return numberText(row[column]);
          });
        }),
        note: evidence.truncated
          ? "Showing the first " + evidence.rows.length + " of " + evidence.total_rows + " rows."
          : null,
      };
    }
    if (entry.tool === "query_enrichment") {
      return {
        kind: "table",
        columns: ["rank", "pathway", "source", "enrichment_ratio", "p_adjusted"],
        rows: (evidence.pathways || []).map(function (p, index) {
          return [
            numberText(index + 1),
            p.pathway,
            p.source,
            numberText(p.enrichment_ratio),
            numberText(p.p_adjusted),
          ];
        }),
        note: null,
      };
    }
    if (entry.tool === "summarize_fibrotic_cohort") {
      return {
        kind: "table",
        columns: ["target", "references", "median age", "female", "male"],
        rows: (evidence.targets || []).map(function (target) {
          var age = target.age_at_recruitment || {};
          var sexCounts = { female: "suppressed", male: "suppressed" };
          if (target.sex && target.sex.distribution) {
            target.sex.distribution.forEach(function (item) {
              sexCounts[item.sex] = numberText(item.count);
            });
          }
          return [
            target.label,
            numberText(target.reference_count),
            age.suppressed ? "suppressed" : numberText(age.median),
            sexCounts.female,
            sexCounts.male,
          ];
        }),
        note: evidence.note || null,
      };
    }
    return { kind: "text", text: JSON.stringify(evidence) };
  }

  function presetLinkFor(entry) {
    var evidence = entry.evidence || {};
    if (!entry.ok || evidence.error || evidence.matched === false) return null;
    if (entry.tool === "query_ablation") {
      var ablationQuery = [];
      var scope = [];
      if (evidence.filters && evidence.filters.disease) {
        ablationQuery.push("disease=" + encodeURIComponent(evidence.filters.disease));
        scope.push(evidence.filters.disease);
      }
      if (evidence.filters && evidence.filters.metric) {
        ablationQuery.push("metric=" + encodeURIComponent(evidence.filters.metric));
        scope.push(evidence.filters.metric);
      }
      return {
        path: "/viz/ablation.html",
        query: ablationQuery.join("&"),
        anchor: "",
        label: "Open in Ablation view" + (scope.length ? " (" + scope.join(" · ") + ")" : ""),
      };
    }
    if (entry.tool === "query_metrics") {
      var metric = evidence.filters && evidence.filters.metric;
      return {
        path: "/viz/overall-performance.html",
        query: metric ? "metric=" + encodeURIComponent(metric) : "",
        anchor: "evaluation-metrics-comparison",
        label: "Open in Performance view" + (metric ? " (" + metric + ")" : ""),
      };
    }
    if (entry.tool === "query_enrichment") {
      var disease = evidence.disease;
      if (!disease) return null;
      return {
        path: "/viz/use-case.html",
        query: "pathway_disease=" + encodeURIComponent(disease),
        anchor: "pathway-enrichment-analysis",
        label: "Open in Use Case view (" + (evidence.disease_label || disease) + ")",
      };
    }
    return null;
  }

  // Deterministic related-question templates (issue #59): follow-ups are
  // derived from what the evidence shows was actually consulted — reviewed
  // phrasing, no extra LLM calls. Falls back to the example bank upstream
  // when nothing was consulted.

  var CONTRAST_DISEASES = ["Type 2 Diabetes", "CKD", "COPD"];
  var CONTRAST_METRICS = ["AUROC", "AUPRC", "F1"];
  var CONTRAST_ENRICHMENT = ["CKD", "NASH", "IPF"];
  var DISPLAY_DISEASE = { NASH: "MASH" };

  function displayDisease(name) {
    return DISPLAY_DISEASE[name] || name;
  }

  function firstOther(list, current) {
    for (var i = 0; i < list.length; i++) {
      if (list[i] !== current) return list[i];
    }
    return list[0];
  }

  function questionsForEntry(entry) {
    var evidence = entry.evidence || {};
    if (!entry.ok || evidence.error || evidence.matched === false) return [];
    var filters = evidence.filters || {};
    if (entry.tool === "query_ablation") {
      var ablationDisease = filters.disease || "CKD";
      var ablationMetric = filters.metric || "AUROC";
      return [
        "Which ablation variant hurts " +
          displayDisease(firstOther(CONTRAST_DISEASES, ablationDisease)) +
          " most on " + ablationMetric + "?",
        "Which ablation variant hurts " + displayDisease(ablationDisease) +
          " most on " + firstOther(CONTRAST_METRICS, ablationMetric) + "?",
        "Does the ablation pattern align with the paper's claims about genetic data?",
      ];
    }
    if (entry.tool === "query_metrics") {
      var metricsMetric = filters.metric || "AUROC";
      var metricsDisease = filters.disease;
      return [
        "For which disease does ALIGATEHR-Gen achieve its highest " + metricsMetric + "?",
        "Compare ALIGATEHR-Gen and the best baseline on " +
          displayDisease(firstOther(CONTRAST_DISEASES, metricsDisease)) +
          " " + metricsMetric + ".",
        metricsDisease
          ? "Which ablation variant hurts " + displayDisease(metricsDisease) +
            " most on " + metricsMetric + "?"
          : "Which model is the strongest baseline overall?",
      ];
    }
    if (entry.tool === "query_enrichment") {
      var enrichmentDisease = evidence.disease || "CKD";
      return [
        "Which top pathways do " + displayDisease(enrichmentDisease) + " and " +
          displayDisease(firstOther(CONTRAST_ENRICHMENT, enrichmentDisease)) +
          " share?",
        "How does the paper interpret the fibrotic disease case study?",
      ];
    }
    if (entry.tool === "summarize_fibrotic_cohort") {
      var targets = evidence.targets || [];
      var target = targets.length === 1 ? targets[0].label : null;
      return [
        target
          ? "How does the " + target + " cohort compare with the other comparison targets?"
          : "Which comparison target has the largest reference cohort?",
        "How does the fibrotic reference cohort size compare with the paper's study population?",
      ];
    }
    return [];
  }

  function relatedQuestionsFor(entries, justAsked) {
    var normalizedAsked = String(justAsked || "").trim().toLowerCase();
    var seen = {};
    var questions = [];
    (entries || []).forEach(function (entry) {
      questionsForEntry(entry).forEach(function (question) {
        var key = question.trim().toLowerCase();
        if (seen[key] || key === normalizedAsked) return;
        seen[key] = true;
        questions.push(question);
      });
    });
    return questions.slice(0, 3);
  }

  return {
    TOOL_TITLES: TOOL_TITLES,
    chipFor: chipFor,
    tableFor: tableFor,
    presetLinkFor: presetLinkFor,
    relatedQuestionsFor: relatedQuestionsFor,
  };
});

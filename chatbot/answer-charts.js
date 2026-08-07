(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.ALIGATEHR_ANSWER_CHARTS = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  // Inline evidence mini-charts (issue #58, ADR-0016). Charts are built
  // exclusively from Answer Evidence rows — never from answer prose — and
  // only when the evidence is a single unambiguous (disease, metric)
  // slice; anything broader stays in the evidence table.

  var WIDTH = 320;
  var BAR_HEIGHT = 16;
  var GAP = 6;
  var LABEL_WIDTH = 150;

  function uniformSlice(rows) {
    if (!rows || rows.length < 2) return null;
    var disease = rows[0].disease;
    var metric = rows[0].metric;
    for (var i = 1; i < rows.length; i++) {
      if (rows[i].disease !== disease || rows[i].metric !== metric) return null;
    }
    return { disease: disease, metric: metric };
  }

  function buildAblationChart(evidence) {
    if (!evidence || evidence.error || evidence.matched === false) return null;
    var slice = uniformSlice(evidence.rows);
    if (!slice) return null;
    var bars = evidence.rows.map(function (row) {
      return {
        label: row.variant,
        value: row.delta,
        negative: row.delta < 0,
      };
    });
    return {
      kind: "ablation",
      title: "Ablation deltas — " + slice.disease + " · " + slice.metric,
      bars: bars,
    };
  }

  function buildMetricsChart(evidence) {
    if (!evidence || evidence.error || evidence.matched === false) return null;
    var slice = uniformSlice(evidence.rows);
    if (!slice) return null;
    var bars = evidence.rows
      .slice()
      .sort(function (a, b) {
        return b.value - a.value;
      })
      .map(function (row) {
        return {
          label: row.model,
          value: row.value,
          highlight: row.is_proposed === true || row.is_proposed === "True",
        };
      });
    return {
      kind: "metrics",
      title: slice.metric + " by model — " + slice.disease,
      bars: bars,
    };
  }

  function escapeXml(text) {
    return String(text).replace(/[<>&"']/g, function (ch) {
      return {
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        '"': "&quot;",
        "'": "&#39;",
      }[ch];
    });
  }

  function svgFor(chart) {
    if (!chart) return null;
    var plotWidth = WIDTH - LABEL_WIDTH - 54;
    var height = chart.bars.length * (BAR_HEIGHT + GAP) + GAP;
    var maxAbs = 0;
    chart.bars.forEach(function (bar) {
      maxAbs = Math.max(maxAbs, Math.abs(bar.value));
    });
    if (maxAbs === 0) return null;

    var zeroX = chart.kind === "ablation" ? LABEL_WIDTH + plotWidth / 2 : LABEL_WIDTH;
    var scale =
      chart.kind === "ablation" ? plotWidth / 2 / maxAbs : plotWidth / maxAbs;

    var parts = [
      '<svg class="chatbot-chart-svg" viewBox="0 0 ' +
        WIDTH +
        " " +
        height +
        '" role="img" aria-label="' +
        escapeXml(chart.title) +
        '">',
    ];
    chart.bars.forEach(function (bar, index) {
      var y = GAP + index * (BAR_HEIGHT + GAP);
      var length = Math.max(1, Math.abs(bar.value) * scale);
      var x = bar.value < 0 && chart.kind === "ablation" ? zeroX - length : zeroX;
      var barClass =
        chart.kind === "ablation"
          ? bar.negative
            ? "chatbot-chart-bar-neg"
            : "chatbot-chart-bar-pos"
          : bar.highlight
            ? "chatbot-chart-bar-highlight"
            : "chatbot-chart-bar";
      parts.push(
        '<text class="chatbot-chart-label" x="' +
          (LABEL_WIDTH - 6) +
          '" y="' +
          (y + BAR_HEIGHT - 4) +
          '" text-anchor="end">' +
          escapeXml(bar.label) +
          "</text>"
      );
      parts.push(
        '<rect class="' +
          barClass +
          '" x="' +
          x.toFixed(1) +
          '" y="' +
          y +
          '" width="' +
          length.toFixed(1) +
          '" height="' +
          BAR_HEIGHT +
          '"></rect>'
      );
      parts.push(
        '<text class="chatbot-chart-value" x="' +
          (bar.value < 0 && chart.kind === "ablation"
            ? (x - 4).toFixed(1)
            : (x + length + 4).toFixed(1)) +
          '" y="' +
          (y + BAR_HEIGHT - 4) +
          '"' +
          (bar.value < 0 && chart.kind === "ablation"
            ? ' text-anchor="end"'
            : "") +
          ">" +
          escapeXml(bar.value) +
          "</text>"
      );
    });
    if (chart.kind === "ablation") {
      parts.push(
        '<line class="chatbot-chart-axis" x1="' +
          zeroX +
          '" y1="0" x2="' +
          zeroX +
          '" y2="' +
          height +
          '"></line>'
      );
    }
    parts.push("</svg>");
    return parts.join("");
  }

  function chartFor(entry) {
    if (!entry || !entry.ok) return null;
    var chart = null;
    if (entry.tool === "query_ablation") {
      chart = buildAblationChart(entry.evidence);
    } else if (entry.tool === "query_metrics") {
      chart = buildMetricsChart(entry.evidence);
    }
    if (!chart) return null;
    var svg = svgFor(chart);
    if (!svg) return null;
    return { title: chart.title, svg: svg };
  }

  return {
    buildAblationChart: buildAblationChart,
    buildMetricsChart: buildMetricsChart,
    svgFor: svgFor,
    chartFor: chartFor,
  };
});

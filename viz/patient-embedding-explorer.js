import { createGroupedEmbeddingExplorer } from "./grouped-embedding-explorer.js";


export function patientHighlightOptions(color) {
  return {
    pointColor: ["#aeb7c2", color],
    opacity: [0.16, 0.95],
    pointSize: [2, 2.5],
    select: false,
  };
}


export function createPatientEmbeddingExplorer(config) {
  return createGroupedEmbeddingExplorer({
    data: config.data,
    xField: config.xField,
    yField: config.yField,
    title: config.title,
    subtitle: config.subtitle,
    datasetLabel: config.datasetLabel,
    className: "patient-embedding-explorer",
    legendClassName: "patient-embedding-legend",
    legendActionClassName: "patient-embedding-legend-action",
    canvasLabel: (count) => `${count.toLocaleString()} patient embeddings`,
    createScatterplot: config.createScatterplot,
    pointSize: 2.5,
    opacity: 0.5,
    groups: config.groups.map((group, index) => ({
      ...group,
      key: index,
    })),
    tooltipLabel: (_point, group) => group.label,
    highlightOptions: (group) => patientHighlightOptions(group.color),
  });
}

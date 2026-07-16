import { createGroupedEmbeddingExplorer } from "./grouped-embedding-explorer.js";


export async function createEmbeddingScatter(config) {
  const diseases = [...new Set(config.data.map((point) => point.disease))];
  const groups = diseases.map((disease, index) => ({
    key: disease,
    label: config.displayName(disease),
    color: config.colors[index],
    indices: config.data
      .map((point, pointIndex) => point.disease === disease ? pointIndex : null)
      .filter((pointIndex) => pointIndex !== null),
  }));

  const shell = await createGroupedEmbeddingExplorer({
    data: config.data,
    xField: "tsne_x",
    yField: "tsne_y",
    title: "Patient Embeddings — 7 Fibrotic Diseases",
    subtitle: "Display-safe reference cohort · t-SNE view only",
    datasetLabel: config.datasetVersion,
    ariaLabel: "Fibrotic disease embedding explorer",
    canvasLabel: (count) => `${count.toLocaleString()} reference points`,
    createScatterplot: config.createScatterplot,
    pointSize: 3,
    opacity: 0.72,
    groups,
    initialGroup: config.initialDisease,
    highlightOptions: (group) => ({
      pointColor: ["#aeb7c2", group.color],
      opacity: [0.12, 0.9],
      pointSize: [2.5, 3],
      select: false,
    }),
    renderTooltip: (tooltip, point) => {
      tooltip.textContent =
        `${config.displayName(point.disease)} · ${config.displayName(point.group)}`;
    },
  });
  shell.selectDisease = shell.selectGroup;
  return shell;
}

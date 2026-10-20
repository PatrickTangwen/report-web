// Canonical model names for every chart, legend, tooltip and table on the
// site. Data files carry short keys (the AUROC tables) or display names (the
// mock result tables); both resolve here so the same model is never spelled
// two ways on one page.

export const MODEL_FAMILIES = [
  {
    key: "classical",
    label: "Classical machine learning",
    models: ["logit", "elasticnet", "xgboost"],
  },
  {
    key: "sequence",
    label: "Sequence models",
    models: ["rnn", "lstm", "bilstm", "transformer"],
  },
  {
    key: "attention",
    label: "Attention-based EHR models",
    models: ["retain", "dipole"],
  },
  {
    key: "graph",
    label: "Graph neural networks",
    models: ["gram", "graphsage", "han", "rgat", "gtn", "healthgat"],
  },
  {
    key: "generative",
    label: "Generative EHR models",
    models: ["foresight", "delphi"],
  },
];


const REGISTRY = {
  logit: { name: "Logistic Regression", fullName: "Logistic regression", color: "#9a9a9a" },
  elasticnet: { name: "Elastic Net", fullName: "Elastic Net regularised logistic regression", color: "#767676" },
  xgboost: { name: "XGBoost", fullName: "Extreme Gradient Boosting", color: "#4d4d4d" },
  rnn: { name: "RNN", fullName: "Recurrent Neural Network", color: "#f7b267" },
  lstm: { name: "LSTM", fullName: "Long Short-Term Memory network", color: "#ef8f2e" },
  bilstm: { name: "Bi-LSTM", fullName: "Bidirectional Long Short-Term Memory network", color: "#d8700f" },
  transformer: { name: "Transformer", fullName: "Transformer encoder", color: "#a9520a" },
  retain: { name: "RETAIN", fullName: "Reverse Time Attention model", color: "#b08fd9" },
  dipole: { name: "Dipole", fullName: "Dipole bidirectional attention RNN", color: "#7b4fc4" },
  gram: { name: "GRAM", fullName: "Graph-based Attention Model", color: "#a6cee3" },
  graphsage: { name: "GraphSAGE", fullName: "Graph Sample and Aggregate network", color: "#6fb0d8" },
  han: { name: "HAN", fullName: "Heterogeneous Graph Attention Network", color: "#4292c6" },
  rgat: { name: "RGAT", fullName: "Relational Graph Attention Network", color: "#2171b5" },
  gtn: { name: "GTN", fullName: "Graph Transformer Network", color: "#08519c" },
  healthgat: { name: "HealthGAT", fullName: "HealthGAT graph attention network for EHR", color: "#08306b" },
  foresight: { name: "Foresight", fullName: "Foresight generative EHR transformer", color: "#74c476" },
  delphi: { name: "Delphi", fullName: "Delphi generative disease-trajectory model", color: "#238b45" },
  // Names that appear only in the mock result tables.
  aligatehrgen: { name: "ALIGATEHR-Gen", fullName: "ALIGATEHR-Gen", color: "#2c5aa0" },
  deeppatient: { name: "DeepPatient", fullName: "Deep Patient autoencoder", color: "#999999" },
  gru: { name: "GRU", fullName: "Gated Recurrent Unit network", color: "#999999" },
  medbert: { name: "Med-BERT", fullName: "Med-BERT pretrained EHR transformer", color: "#999999" },
  randomforest: { name: "Random Forest", fullName: "Random Forest", color: "#999999" },
};

const FAMILY_BY_MODEL = new Map();
MODEL_FAMILIES.forEach((family) => {
  family.models.forEach((key) => FAMILY_BY_MODEL.set(key, family));
});

const KEY_BY_NORMALISED_NAME = new Map();
Object.entries(REGISTRY).forEach(([key, entry]) => {
  KEY_BY_NORMALISED_NAME.set(normalise(key), key);
  KEY_BY_NORMALISED_NAME.set(normalise(entry.name), key);
});


function normalise(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]/g, "");
}


// Resolves a data-file spelling (key or display name) to its registry key.
export function canonicalModelKey(value) {
  const key = KEY_BY_NORMALISED_NAME.get(normalise(value));
  if (!key) throw new Error(`Unknown model name: ${value}`);
  return key;
}


export function modelDisplayName(value) {
  return REGISTRY[canonicalModelKey(value)].name;
}


export function modelFullName(value) {
  return REGISTRY[canonicalModelKey(value)].fullName;
}


export function modelColor(value) {
  return REGISTRY[canonicalModelKey(value)].color;
}


export function modelFamily(value) {
  const family = FAMILY_BY_MODEL.get(canonicalModelKey(value));
  if (!family) throw new Error(`Model has no family: ${value}`);
  return family;
}


// Orders model keys by family, then by the family's own order, so legends and
// matrix columns read as a hierarchy rather than alphabetically.
export function orderModelsByFamily(values) {
  const keys = values.map(canonicalModelKey);
  const rank = new Map();
  MODEL_FAMILIES.forEach((family, familyIndex) => {
    family.models.forEach((key, modelIndex) => rank.set(key, familyIndex * 100 + modelIndex));
  });
  keys.forEach((key) => {
    if (!rank.has(key)) throw new Error(`Model has no family order: ${key}`);
  });
  return [...keys].sort((a, b) => rank.get(a) - rank.get(b));
}

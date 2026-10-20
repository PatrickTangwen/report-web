import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  MODEL_FAMILIES,
  canonicalModelKey,
  modelColor,
  modelDisplayName,
  modelFamily,
  modelFullName,
  orderModelsByFamily,
} from "./model-naming.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const csvHeader = (file) =>
  fs.readFileSync(path.join(here, "data", file), "utf8").split("\n")[0].split(",");


test("every AUROC table column resolves to one registry entry with a family", () => {
  for (const file of ["auroc_by_icd_baseline.csv", "auroc_by_icd_plus_env.csv"]) {
    const models = csvHeader(file).filter((column) => column !== "icd");
    assert.equal(models.length, 17);
    const names = new Set(models.map(modelDisplayName));
    assert.equal(names.size, 17, "display names must be distinct");
    models.forEach((model) => {
      assert.ok(modelFamily(model).label);
      assert.ok(modelFullName(model).length > 0);
      assert.match(modelColor(model), /^#[0-9a-f]{6}$/);
    });
  }
});


test("mock evaluation table names resolve to the same spelling the registry uses", () => {
  const text = fs.readFileSync(path.join(here, "data", "evaluation_metrics.csv"), "utf8");
  const models = new Set(text.trim().split("\n").slice(1).map((line) => line.split(",")[0]));
  models.forEach((model) => assert.equal(modelDisplayName(model), model));
});


test("spelling variants collapse to one key", () => {
  assert.equal(canonicalModelKey("Bi-LSTM"), "bilstm");
  assert.equal(canonicalModelKey("bilstm"), "bilstm");
  assert.equal(canonicalModelKey("XGBoost"), "xgboost");
  assert.equal(canonicalModelKey("Logistic Regression"), "logit");
  assert.equal(modelDisplayName("graphsage"), "GraphSAGE");
  assert.equal(modelDisplayName("healthgat"), "HealthGAT");
  assert.throws(() => canonicalModelKey("not-a-model"), /Unknown model name/);
});


test("family ordering groups models and keeps the families' declared order", () => {
  const families = MODEL_FAMILIES.flatMap((family) => family.models);
  assert.equal(new Set(families).size, families.length, "a model belongs to one family");
  const shuffled = ["delphi", "logit", "gtn", "rnn", "retain", "xgboost"];
  assert.deepEqual(orderModelsByFamily(shuffled), ["logit", "xgboost", "rnn", "retain", "gtn", "delphi"]);
});

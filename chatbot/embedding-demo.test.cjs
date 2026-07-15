const assert = require("node:assert/strict");
const test = require("node:test");

const demo = require("./embedding-demo.js");


function memoryStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    },
  };
}


const preset = {
  dataset_version: "fibrotic-2026-07-13-example",
  preset_id: "pulmonary-fibrosis-walkthrough",
  target: "Pulmonary_fibrosis",
  display_mode: "overview",
  visual_reference_ids: ["vr_one", "vr_two"],
  summary: {
    reference_count: 2,
    title: "Pulmonary fibrosis reference neighborhood",
    description: "Preset interaction demo.",
  },
};


test("preset request stores only the visualization contract", () => {
  const request = demo.createPresetRequest(preset, "2026-07-13T12:00:00.000Z");

  assert.deepEqual(Object.keys(request).sort(), [
    "consumed",
    "created_at",
    "dataset_version",
    "display_mode",
    "preset_id",
    "summary",
    "target",
    "type",
    "visual_reference_ids",
  ]);
  assert.equal(request.type, "preset_selection");
  assert.deepEqual(request.visual_reference_ids, ["vr_one", "vr_two"]);
  assert.equal(JSON.stringify(request).includes("profile"), false);
});


test("multi-region preset requires and preserves its release geometry contract", () => {
  const multiRegion = { ...preset, display_mode: "multi_region" };
  assert.throws(
    () => demo.createPresetRequest(multiRegion),
    /missing the visualization contract/,
  );

  const request = demo.createPresetRequest({
    ...multiRegion,
    minimum_region_size: 5,
  });
  assert.equal(request.minimum_region_size, 5);
});


test("request plays once and remains available as a final replayable state", () => {
  const storage = memoryStorage();
  const request = demo.createPresetRequest(preset, "2026-07-13T12:00:00.000Z");
  demo.saveRequest(storage, request);

  const first = demo.consumeRequest(storage, preset.dataset_version);
  const second = demo.consumeRequest(storage, preset.dataset_version);

  assert.equal(first.should_play, true);
  assert.equal(second.should_play, false);
  assert.deepEqual(second.request.visual_reference_ids, ["vr_one", "vr_two"]);
});


test("request from another release is rejected instead of guessed", () => {
  const storage = memoryStorage();
  demo.saveRequest(
    storage,
    demo.createPresetRequest(preset, "2026-07-13T12:00:00.000Z"),
  );

  const result = demo.consumeRequest(storage, "fibrotic-new-release");

  assert.equal(result.status, "version_mismatch");
  assert.equal(result.request, null);
});


test("same-page request event reaches the active visualization consumer", () => {
  const storage = memoryStorage();
  const target = new EventTarget();
  const request = demo.createPresetRequest(preset, "2026-07-13T12:00:00.000Z");
  let playedRequest;
  const disconnect = demo.connectRequestConsumer(
    target,
    storage,
    preset.dataset_version,
    (latest) => { playedRequest = latest; },
  );

  demo.saveRequest(storage, request);
  demo.notifyRequest(target, request);
  disconnect();

  assert.deepEqual(playedRequest.visual_reference_ids, ["vr_one", "vr_two"]);
  assert.equal(playedRequest.display_mode, "overview");
});


test("API authority is resolved once for local preview and deployment", () => {
  assert.equal(
    demo.resolveApiUrl({ hostname: "localhost" }),
    "http://127.0.0.1:7860",
  );
  assert.equal(
    demo.resolveApiUrl({ hostname: "127.0.0.1" }),
    "http://127.0.0.1:7860",
  );
  assert.equal(
    demo.resolveApiUrl({ hostname: "patricktangwen.github.io" }),
    "https://aligatehr-gen-backend.onrender.com",
  );
  assert.equal(
    demo.resolveApiUrl({ hostname: "localhost" }, "https://example.test"),
    "https://example.test",
  );
});


test("matched result request stores exact references and only the compact Matched Reference Summary", () => {
  const result = {
    dataset_version: "fibrotic-2026-07-13-example",
    cohort_comparison_result: {
      status: "matched_reference_neighborhood",
      target: "MASH",
      neighborhood_size: 2,
      minimum_display_region_size: 5,
    },
    visual_reference_ids: ["vr_match_one", "vr_match_two"],
    aggregate_callout_data: {
      reference_count: 2,
      title: "MASH matched reference neighborhood",
      description: "Aggregate comparison context.",
      domains: [
        {
          domain: "demographics",
          metrics: [
            { feature: "age", label: "Age", median: 55, range: [50, 60], unit: "years" },
            {
              feature: "sex",
              label: "Sex",
              distribution: [
                { category: "female", count: 1 },
                { category: "male", count: 1 },
              ],
            },
          ],
        },
        {
          domain: "optional_laboratory",
          metrics: [
            { feature: "hba1c", label: "HbA1c", median: 40, range: [35, 45], unit: "mmol/mol" },
          ],
        },
      ],
    },
  };

  const request = demo.createMatchedRequest(
    result,
    "2026-07-13T12:00:00.000Z",
  );

  assert.deepEqual(Object.keys(request).sort(), [
    "consumed",
    "created_at",
    "dataset_version",
    "display_mode",
    "minimum_region_size",
    "summary",
    "target",
    "type",
    "visual_reference_ids",
  ]);
  assert.equal(request.type, "matched_reference_neighborhood");
  assert.equal(request.display_mode, "matched_selection");
  assert.equal(request.minimum_region_size, 5);
  assert.deepEqual(request.visual_reference_ids, ["vr_match_one", "vr_match_two"]);
  // Compact summary keeps only count, median age, and sex distribution.
  assert.deepEqual(Object.keys(request.summary).sort(), ["age", "reference_count", "sex", "title"]);
  assert.equal(request.summary.reference_count, 2);
  assert.equal(request.summary.age.median, 55);
  assert.deepEqual(request.summary.sex.distribution, [
    { category: "female", count: 1 },
    { category: "male", count: 1 },
  ]);
  // The detailed per-domain aggregate is not carried into the request.
  assert.equal(request.summary.domains, undefined);
  assert.equal(JSON.stringify(request).includes("hba1c"), false);
  assert.equal(JSON.stringify(request).includes("optional_laboratory"), false);
  assert.equal(JSON.stringify(request).includes("confirmed_profile"), false);
  assert.equal(JSON.stringify(request).includes("reported_features"), false);
});


test("a matched request preserves privacy suppression of age and sex cells", () => {
  const request = demo.createMatchedRequest(
    {
      dataset_version: "fibrotic-2026-07-13-example",
      cohort_comparison_result: {
        status: "matched_reference_neighborhood",
        target: "CKD",
        neighborhood_size: 5,
        minimum_display_region_size: 5,
      },
      visual_reference_ids: ["a", "b", "c", "d", "e"],
      aggregate_callout_data: {
        reference_count: 5,
        title: "CKD matched reference neighborhood",
        description: "Aggregate comparison context.",
        domains: [
          {
            domain: "demographics",
            metrics: [
              { feature: "age", label: "Age", suppressed: true },
              { feature: "sex", label: "Sex", suppressed: true },
            ],
          },
        ],
      },
    },
    "2026-07-13T12:00:00.000Z",
  );

  assert.equal(request.summary.age.suppressed, true);
  assert.equal(request.summary.sex.suppressed, true);
  assert.equal(request.summary.age.median, undefined);
});


test("a matched request tolerates a demographics-free aggregate", () => {
  const request = demo.createMatchedRequest(
    {
      dataset_version: "fibrotic-2026-07-13-example",
      cohort_comparison_result: {
        status: "matched_reference_neighborhood",
        target: "CKD",
        neighborhood_size: 5,
        minimum_display_region_size: 5,
      },
      visual_reference_ids: ["a", "b", "c", "d", "e"],
      aggregate_callout_data: {
        reference_count: 5,
        title: "CKD matched reference neighborhood",
        description: "Aggregate comparison context.",
        domains: [
          {
            domain: "blood_pressure",
            metrics: [
              { feature: "sbp", label: "SBP", median: 130, range: [120, 140], unit: "mmHg" },
            ],
          },
        ],
      },
    },
    "2026-07-13T12:00:00.000Z",
  );

  assert.equal(request.summary.age, null);
  assert.equal(request.summary.sex, null);
  assert.equal(request.summary.reference_count, 5);
});


test("new backend request cancels the stale request token", () => {
  const controller = demo.createRequestController();
  const first = controller.start();
  const second = controller.start();

  assert.equal(first.signal.aborted, true);
  assert.equal(controller.isCurrent(first.token), false);
  assert.equal(controller.isCurrent(second.token), true);
});


test("JSON request exposes timeout as a retryable failure", async () => {
  const neverCompletes = function (_url, options) {
    return new Promise(function (_resolve, reject) {
      options.signal.addEventListener("abort", function () {
        reject(options.signal.reason);
      });
    });
  };

  await assert.rejects(
    demo.requestJson(neverCompletes, "https://example.test/data", {}, 1),
    /timed out/i,
  );
});

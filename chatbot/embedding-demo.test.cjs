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
    "https://patirckistc-report-web.hf.space",
  );
  assert.equal(
    demo.resolveApiUrl({ hostname: "localhost" }, "https://example.test"),
    "https://example.test",
  );
});

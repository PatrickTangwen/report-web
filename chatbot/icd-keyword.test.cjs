const assert = require("node:assert/strict");
const test = require("node:test");

const icd = require("./icd-keyword.js");
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


const tuberculosis = {
  id: "tuberculosis",
  canonical_keyword: "tuberculosis",
  matched_keyword: "tb",
  display_label: "Tuberculosis",
  selector: { type: "range", start: "A15", end: "A19" },
  selector_label: "A15-A19",
};


test("ICD action stores only one inspectable selector on its own request channel", () => {
  const request = icd.createRequest(
    tuberculosis,
    "2026-07-13.v1",
    "2026-07-13T12:00:00.000Z",
  );

  assert.notEqual(icd.REQUEST_KEY, demo.REQUEST_KEY);
  assert.deepEqual(request, {
    type: "icd_keyword_match",
    vocabulary_version: "2026-07-13.v1",
    keyword_id: "tuberculosis",
    display_label: "Tuberculosis",
    selector: { type: "range", start: "A15", end: "A19" },
    selector_label: "A15-A19",
    created_at: "2026-07-13T12:00:00.000Z",
    consumed: false,
  });
  assert.equal(JSON.stringify(request).includes("profile"), false);
  assert.equal(JSON.stringify(request).includes("visual_reference"), false);
});


test("each ICD match is consumed independently once and remains resettable", () => {
  const storage = memoryStorage();
  const request = icd.createRequest(tuberculosis, "2026-07-13.v1");
  icd.saveRequest(storage, request);

  const first = icd.consumeRequest(storage);
  const second = icd.consumeRequest(storage);

  assert.equal(first.should_play, true);
  assert.equal(second.should_play, false);
  assert.deepEqual(second.request.selector, tuberculosis.selector);
});


test("invalid or unreviewed selector shapes are rejected", () => {
  assert.throws(
    () => icd.createRequest({ ...tuberculosis, selector: { type: "range", start: "A15" } }, "v1"),
    /missing the ICD visualization contract/,
  );
  assert.throws(
    () => icd.createRequest({ ...tuberculosis, selector: { type: "nearest" } }, "v1"),
    /missing the ICD visualization contract/,
  );
});


test("same-page ICD event delivers the exact single action", () => {
  const storage = memoryStorage();
  const target = new EventTarget();
  const request = icd.createRequest(tuberculosis, "2026-07-13.v1");
  let played;
  const disconnect = icd.connectRequestConsumer(target, storage, (latest) => {
    played = latest;
  });

  icd.saveRequest(storage, request);
  icd.notifyRequest(target, request);
  disconnect();

  assert.equal(played.keyword_id, "tuberculosis");
  assert.deepEqual(played.selector, tuberculosis.selector);
});

const assert = require("node:assert/strict");
const test = require("node:test");

const profileSession = require("./profile-session.js");


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


const height = {
  field: "height",
  raw_value: 180,
  raw_unit: "cm",
  source_text: "height 180 cm",
  operation: "set",
};


test("single-turn and multi-turn candidates stay in one tab-scoped draft", () => {
  const storage = memoryStorage();
  const session = profileSession.create(storage);

  session.start();
  session.appendCandidates([height]);
  session.appendCandidates([
    {
      field: "weight",
      raw_value: 81,
      raw_unit: "kg",
      source_text: "weight 81 kg",
      operation: "set",
    },
  ]);

  assert.equal(session.getState().phase, "draft");
  assert.deepEqual(
    session.getState().candidates.map((candidate) => candidate.field),
    ["height", "weight"],
  );
  assert.deepEqual(
    profileSession.create(storage).getState().candidates,
    session.getState().candidates,
  );
});


test("Draft becomes Confirmed only through the explicit confirm transition", () => {
  const storage = memoryStorage();
  const session = profileSession.create(storage);
  session.start();
  session.appendCandidates([height]);
  session.applyDraft({ state: "draft", can_confirm: true, reported_features: {} });

  assert.equal(session.getState().phase, "draft");

  session.confirm({
    state: "confirmed",
    matching_started: false,
    reported_features: {},
  });

  assert.equal(session.getState().phase, "confirmed");
  assert.equal(session.getState().confirmed.matching_started, false);
});


test("Start Over clears only profile state and keeps unrelated chatbot state", () => {
  const storage = memoryStorage();
  storage.setItem("aligatehr-chatbot-history", "unrelated conversation");
  const session = profileSession.create(storage);
  session.start();
  session.appendCandidates([height]);

  session.reset();

  assert.equal(session.getState().phase, "inactive");
  assert.deepEqual(session.getState().candidates, []);
  assert.equal(
    storage.getItem("aligatehr-chatbot-history"),
    "unrelated conversation",
  );
  assert.equal(storage.getItem(profileSession.STORAGE_KEY), null);
});


test("review edits become explicit correction candidates", () => {
  const corrections = profileSession.createCorrections(
    {
      reported_features: {
        age: {
          normalized_value: 55,
          normalized_unit: "years",
          label: "Age",
        },
        smoking_status: {
          normalized_value: "former",
          normalized_unit: null,
          label: "Smoking status",
        },
      },
    },
    { age: "57", smoking_status: "former" },
  );

  assert.deepEqual(corrections, [
    {
      field: "age",
      raw_value: 57,
      raw_unit: null,
      source_text: "Edited in review: Age",
      operation: "correct",
    },
  ]);
});


test("review can explicitly resolve a conflict in favor of an existing value", () => {
  const corrections = profileSession.createCorrections(
    {
      reported_features: {
        age: {
          normalized_value: 55,
          normalized_unit: "years",
          label: "Age",
          status: "conflicting",
        },
      },
    },
    { age: "55" },
  );

  assert.equal(corrections[0].operation, "correct");
  assert.equal(corrections[0].raw_value, 55);
});

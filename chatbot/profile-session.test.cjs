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


test("a Profile Draft cannot start before a Comparison Target is selected", () => {
  const storage = memoryStorage();
  const session = profileSession.create(storage);

  assert.equal(session.getState().phase, "inactive");
  assert.throws(() => session.start());
});


test("selecting an unsupported Comparison Target is rejected", () => {
  const storage = memoryStorage();
  const session = profileSession.create(storage);

  assert.throws(() => session.selectTarget("not_a_real_target"));
  assert.equal(session.getState().target, null);
});


test("the system never infers or substitutes a Comparison Target — only one of the seven is accepted", () => {
  assert.deepEqual(profileSession.TARGETS, [
    "CKD",
    "Cardiac_Fibrosis",
    "MASH",
    "Pulmonary_fibrosis",
    "SSc_Connective_Tissue",
    "Crohns_Disease",
    "Fibrosis_of_Skin",
  ]);
});


test("selecting a target moves the session to target_selected and persists tab-scoped", () => {
  const storage = memoryStorage();
  profileSession.create(storage).selectTarget("MASH");

  const reopened = profileSession.create(storage);
  assert.equal(reopened.getState().phase, "target_selected");
  assert.equal(reopened.getState().target, "MASH");
});


test("starting a Profile Draft after target selection carries the target through and defaults to manual source", () => {
  const storage = memoryStorage();
  const session = profileSession.create(storage);
  session.selectTarget("CKD");

  session.start();

  assert.equal(session.getState().phase, "draft");
  assert.equal(session.getState().target, "CKD");
  assert.equal(session.getState().source, "manual");
});


test("loading a Synthetic Example Profile is tracked as example source, not manual", () => {
  const storage = memoryStorage();
  const session = profileSession.create(storage);
  session.selectTarget("Crohns_Disease");

  session.start("example");

  assert.equal(session.getState().source, "example");
  assert.equal(session.getState().target, "Crohns_Disease");
});


test("single-turn and multi-turn candidates stay in one tab-scoped draft", () => {
  const storage = memoryStorage();
  const session = profileSession.create(storage);

  session.selectTarget("CKD");
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


test("Draft becomes Confirmed only through the explicit confirm transition, and the target survives confirmation", () => {
  const storage = memoryStorage();
  const session = profileSession.create(storage);
  session.selectTarget("MASH");
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
  assert.equal(session.getState().target, "MASH");
  assert.equal(session.getState().confirmed.matching_started, false);
});


test("Start Over clears the target too, so a new session must choose again", () => {
  const storage = memoryStorage();
  storage.setItem("aligatehr-chatbot-history", "unrelated conversation");
  const session = profileSession.create(storage);
  session.selectTarget("CKD");
  session.start();
  session.appendCandidates([height]);

  session.reset();

  assert.equal(session.getState().phase, "inactive");
  assert.equal(session.getState().target, null);
  assert.deepEqual(session.getState().candidates, []);
  assert.equal(
    storage.getItem("aligatehr-chatbot-history"),
    "unrelated conversation",
  );
  assert.equal(storage.getItem(profileSession.STORAGE_KEY), null);
});


test("a corrupted or pre-target-first stored phase falls back to inactive", () => {
  const storage = memoryStorage();
  storage.setItem(
    profileSession.STORAGE_KEY,
    JSON.stringify({ phase: "legacy-unknown-phase", candidates: [] }),
  );

  const session = profileSession.create(storage);

  assert.equal(session.getState().phase, "inactive");
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

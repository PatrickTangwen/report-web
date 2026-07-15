const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const wizard = require("./profile-wizard.js");


function entry(raw, unit) {
  return { raw, unit, original: { raw, unit } };
}


test("the wizard has exactly the five reviewed stages, in order, ending with Review", () => {
  assert.deepEqual(
    wizard.STAGES.map((stage) => stage.label),
    [
      "Basic Information",
      "Body Measurements",
      "Blood Pressure and Labs",
      "Lifestyle and Family Context",
      "Review",
    ],
  );
});


test("every supported matchable field is assigned to a non-review stage and stays optional", () => {
  assert.deepEqual(wizard.FIELD_ORDER.slice().sort(), [
    "affected_relative",
    "age",
    "alcohol_frequency",
    "bmi",
    "creatinine",
    "dbp",
    "hba1c",
    "height",
    "hip",
    "sbp",
    "sex",
    "smoking_status",
    "waist",
    "weight",
  ]);
  wizard.FIELD_ORDER.forEach((field) => {
    const stage = wizard.FIELDS[field].stage;
    assert.notEqual(stage, "review");
    assert.ok(wizard.STAGES.some((s) => s.id === stage), `unknown stage for ${field}`);
  });
});


test("reviewed unit choices match the spec: height ft/in|cm, weight lb|kg, circumferences in|cm, creatinine mg/dL|µmol/L, HbA1c %|mmol/mol", () => {
  assert.deepEqual(wizard.FIELDS.height.units, ["cm", "ft/in"]);
  assert.deepEqual(wizard.FIELDS.weight.units, ["kg", "lb"]);
  assert.deepEqual(wizard.FIELDS.waist.units, ["cm", "in"]);
  assert.deepEqual(wizard.FIELDS.hip.units, ["cm", "in"]);
  assert.deepEqual(wizard.FIELDS.creatinine.units, ["µmol/L", "mg/dL"]);
  assert.deepEqual(wizard.FIELDS.hba1c.units, ["mmol/mol", "%"]);
});


test("age and blood pressure use visible fixed units instead of a unit choice", () => {
  ["age", "sbp", "dbp", "bmi"].forEach((field) => {
    assert.equal(wizard.FIELDS[field].fixedUnit, true);
    assert.equal(wizard.FIELDS[field].units.length, 1);
  });
});


test("canonical conversions mirror the backend exactly for the backend's own test values", () => {
  // Same values asserted in chatbot-backend/test_demo_profile.py.
  assert.equal(wizard.toCanonical("height", { feet: "5", inches: "6" }, "ft/in").value, 167.64);
  assert.equal(wizard.toCanonical("weight", "400", "lb").value, 181.44);
  assert.equal(wizard.toCanonical("creatinine", "1.2", "mg/dL").value, 106.08);
  assert.equal(wizard.toCanonical("hba1c", "6.5", "%").value, 47.5);
  assert.equal(wizard.toCanonical("waist", "34", "in").value, 86.36);
});


test("changing a unit converts the displayed value in both directions", () => {
  const ftIn = wizard.convertDisplay("height", "170", "cm", "ft/in");
  assert.deepEqual(ftIn, { feet: "5", inches: "6.9" });
  assert.equal(wizard.convertDisplay("weight", "70", "kg", "lb"), "154.3");
  assert.equal(wizard.convertDisplay("creatinine", "106.08", "µmol/L", "mg/dL"), "1.2");
  assert.equal(wizard.convertDisplay("hba1c", "47.5", "mmol/mol", "%"), "6.5");
});


test("a unit change preserves the visitor's original value and unit for review", () => {
  const converted = wizard.convertEntry("height", entry("170", "cm"), "ft/in");
  assert.equal(converted.unit, "ft/in");
  assert.deepEqual(converted.original, { raw: "170", unit: "cm" });
  const back = wizard.convertEntry("height", converted, "cm");
  assert.deepEqual(back.original, { raw: "170", unit: "cm" });
});


test("assigning the first unit to a typed value is not a conversion", () => {
  const typed = wizard.editEntry("weight", wizard.newEntry("weight"), "154");
  assert.equal(typed.unit, null);
  const withUnit = wizard.convertEntry("weight", typed, "lb");
  assert.equal(withUnit.raw, "154");
  assert.deepEqual(withUnit.original, { raw: "154", unit: "lb" });
});


test("typing a new value makes the current representation the original one", () => {
  const converted = wizard.convertEntry("height", entry("170", "cm"), "ft/in");
  const retyped = wizard.editEntry("height", converted, { feet: "6", inches: "0" });
  assert.deepEqual(retyped.original, { raw: { feet: "6", inches: "0" }, unit: "ft/in" });
});


test("blank optional fields stay neutral on validation", () => {
  assert.equal(wizard.validateEntry("age", wizard.newEntry("age"), {}).status, "neutral");
  assert.equal(
    wizard.validateEntry("height", { raw: { feet: "", inches: "" }, unit: "ft/in", original: null }, {}).status,
    "neutral",
  );
  assert.equal(wizard.validateEntry("sex", wizard.newEntry("sex"), {}).status, "neutral");
});


test("an entered value without a selected unit asks to add a unit and is never guessed by magnitude", () => {
  const result = wizard.validateEntry("weight", { raw: "154", unit: null, original: null }, {});
  assert.equal(result.status, "add_unit");
  assert.match(result.message, /never guessed from magnitude/);
});


test("non-numeric and out-of-input-bounds values use only the Check this value state", () => {
  assert.equal(wizard.validateEntry("age", entry("abc", "years"), {}).status, "check_value");
  assert.equal(wizard.validateEntry("age", entry("40.5", "years"), {}).status, "check_value");
  assert.equal(wizard.validateEntry("height", entry("301", "cm"), {}).status, "check_value");
  assert.equal(wizard.validateEntry("sbp", entry("29", "mmHg"), {}).status, "check_value");
});


test("input bounds are inclusive and support boundaries switch to Outside reference support, not an error", () => {
  assert.equal(wizard.validateEntry("height", entry("300", "cm"), {}).status, "outside_reference_support");
  assert.equal(wizard.validateEntry("age", entry("33", "years"), {}).status, "valid");
  assert.equal(wizard.validateEntry("age", entry("90", "years"), {}).status, "valid");
  assert.equal(wizard.validateEntry("age", entry("32", "years"), {}).status, "outside_reference_support");
  assert.equal(wizard.validateEntry("age", entry("91", "years"), {}).status, "outside_reference_support");
});


test("outside-reference-support copy says the value is preserved and never applies clinical labels", () => {
  const result = wizard.validateEntry("age", entry("95", "years"), {});
  assert.match(result.message, /[Pp]reserved/);
  Object.keys(wizard.FIELDS).forEach((field) => {
    ["5000", "-1", "abc", "42"].forEach((raw) => {
      const meta = wizard.FIELDS[field];
      const unit = meta.kind === "number" ? meta.canonicalUnit : null;
      const message = wizard.validateEntry(field, entry(raw, unit), {}).message;
      assert.doesNotMatch(message, /\b(normal|abnormal|healthy|unhealthy)\b/i);
    });
  });
});


test("a reported BMI that disagrees with the deterministic BMI from height and weight is a Conflict", () => {
  const entries = {
    height: entry("170", "cm"),
    weight: entry("70", "kg"),
    bmi: entry("30", "kg/m²"),
  };
  const result = wizard.validateEntry("bmi", entries.bmi, entries);
  assert.equal(result.status, "conflict");
  assert.match(result.message, /24\.2/);
  entries.bmi = entry("24.2", "kg/m²");
  assert.equal(wizard.validateEntry("bmi", entries.bmi, entries).status, "valid");
});


test("derived match features are computed deterministically from usable entries", () => {
  const derived = wizard.deriveFeatures({
    height: entry("170", "cm"),
    weight: entry("70", "kg"),
    waist: entry("80", "cm"),
    hip: entry("100", "cm"),
  });
  assert.equal(derived.bmi.value, 24.2);
  assert.deepEqual(derived.bmi.derivedFrom, ["height", "weight"]);
  assert.equal(derived.waist_to_hip_ratio.value, 0.8);
});


test("step continuation blocks on Add a unit, Check this value, and Conflict — never on Outside reference support or blanks", () => {
  const target = "CKD";
  assert.equal(
    wizard.validateStage("body_measurements", { weight: { raw: "154", unit: null, original: null } }, target).blocked,
    true,
  );
  assert.equal(
    wizard.validateStage("body_measurements", { height: entry("301", "cm") }, target).blocked,
    true,
  );
  assert.equal(
    wizard.validateStage("body_measurements", { height: entry("135", "cm") }, target).blocked,
    false,
  );
  assert.equal(wizard.validateStage("body_measurements", {}, target).blocked, false);
});


test("target-recommended fields come first within a stage and no supported field is hidden", () => {
  const fields = wizard.fieldsForStage("blood_pressure_labs", "CKD");
  assert.deepEqual(
    fields.map((item) => item.field),
    ["creatinine", "sbp", "dbp", "hba1c"],
  );
  assert.deepEqual(
    fields.map((item) => item.recommended),
    [true, false, false, false],
  );
});


test("candidates submit the visitor's original value and unit, embedding the reviewed unit in the source text", () => {
  const converted = wizard.convertEntry("height", entry("68", "in"), "cm");
  const candidates = wizard.buildCandidates({
    height: converted,
    weight: entry("154", "lb"),
    creatinine: entry("1.2", "mg/dL"),
    hba1c: entry("6.5", "%"),
    affected_relative: { raw: "true", unit: null, original: null },
  });
  const byField = Object.fromEntries(candidates.map((c) => [c.field, c]));
  assert.equal(byField.height.raw_value, 68);
  assert.equal(byField.height.raw_unit, "in");
  assert.match(byField.height.source_text, /\bin\b/);
  assert.equal(byField.weight.raw_unit, "lb");
  assert.match(byField.weight.source_text, /\blb\b/);
  assert.match(byField.creatinine.source_text, /mg\s*\/\s*dl/i);
  assert.match(byField.hba1c.source_text, /%/);
  assert.equal(byField.affected_relative.raw_value, "Yes");
  assert.equal(byField.affected_relative.raw_unit, null);
  candidates.forEach((candidate) => assert.equal(candidate.operation, "set"));
});


test("compound feet-and-inches entries submit the backend's compound string contract", () => {
  const candidates = wizard.buildCandidates({
    height: entry({ feet: "5", inches: "6" }, "ft/in"),
  });
  assert.equal(candidates[0].raw_value, "5 ft 6 in");
  assert.equal(candidates[0].raw_unit, "ft/in");
  assert.match(candidates[0].source_text, /\bft\b/);
  assert.match(candidates[0].source_text, /\bin\b/);
});


test("every reviewed choice option round-trips through its submitted label", () => {
  wizard.FIELD_ORDER
    .filter((field) => wizard.FIELDS[field].kind === "choice")
    .forEach((field) => {
      wizard.FIELDS[field].choices.forEach(([key]) => {
        const candidates = wizard.buildCandidates({
          [field]: { raw: key, unit: null, original: null },
        });
        const entries = wizard.entriesFromCandidates(candidates);
        assert.equal(entries[field].raw, key, `${field}:${key} did not round-trip`);
      });
    });
});


test("blank entries never produce candidates", () => {
  assert.deepEqual(
    wizard.buildCandidates({ age: wizard.newEntry("age"), sex: wizard.newEntry("sex") }),
    [],
  );
});


const examples = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "..", "chatbot-backend", "data", "synthetic_example_profiles.json"),
    "utf8",
  ),
);


test("every reviewed Synthetic Example Profile loads into wizard entries with no blocking state", () => {
  Object.entries(examples.profiles).forEach(([target, profile]) => {
    const entries = wizard.entriesFromCandidates(profile.candidates);
    const expected = profile.candidates.flatMap((candidate) =>
      candidate.field === "blood_pressure" ? ["sbp", "dbp"] : [candidate.field],
    );
    assert.deepEqual(Object.keys(entries).sort(), expected.sort(), `field loss for ${target}`);
    Object.keys(entries).forEach((field) => {
      const status = wizard.validateEntry(field, entries[field], entries).status;
      assert.ok(
        ["valid", "outside_reference_support"].includes(status),
        `${target}.${field} loaded as ${status}`,
      );
    });
    const roundTrip = wizard.buildCandidates(entries);
    assert.deepEqual(
      roundTrip.map((candidate) => candidate.field).sort(),
      expected.sort(),
      `candidate loss for ${target}`,
    );
  });
});


test("TARGET_RECOMMENDED_FIELDS stays in sync with the reviewed Synthetic Example Profiles", () => {
  assert.deepEqual(
    Object.keys(wizard.TARGET_RECOMMENDED_FIELDS).sort(),
    Object.keys(examples.profiles).sort(),
  );
  Object.entries(examples.profiles).forEach(([target, profile]) => {
    const expected = profile.candidates.flatMap((candidate) =>
      candidate.field === "blood_pressure" ? ["sbp", "dbp"] : [candidate.field],
    );
    assert.deepEqual(
      wizard.TARGET_RECOMMENDED_FIELDS[target].slice().sort(),
      expected.sort(),
      `recommendation drift for ${target}`,
    );
  });
});


test("entered fields use only the five reviewed user-facing states", () => {
  assert.deepEqual(wizard.BLOCKING_STATUSES, ["add_unit", "check_value", "conflict"]);
  assert.equal(wizard.statusLabel("valid"), "Valid");
  assert.equal(wizard.statusLabel("add_unit"), "Add a unit");
  assert.equal(wizard.statusLabel("check_value"), "Check this value");
  assert.equal(wizard.statusLabel("outside_reference_support"), "Outside reference support");
  assert.equal(wizard.statusLabel("conflict"), "Conflict");
  assert.equal(wizard.statusLabel("neutral"), "");
});


test("backend draft statuses map onto the same five user-facing states", () => {
  assert.equal(wizard.backendStatusLabel("valid"), "Valid");
  assert.equal(
    wizard.backendStatusLabel("ambiguous", "measurement unit is missing from the source text"),
    "Add a unit",
  );
  assert.equal(wizard.backendStatusLabel("ambiguous", "value is not numeric"), "Check this value");
  assert.equal(wizard.backendStatusLabel("out_of_range"), "Check this value");
  assert.equal(wizard.backendStatusLabel("outside_reference_support"), "Outside reference support");
  assert.equal(wizard.backendStatusLabel("conflicting"), "Conflict");
  // No sixth user-facing state: an unreachable backend "unsupported" still
  // maps into the five reviewed states.
  const allowed = ["Valid", "Add a unit", "Check this value", "Outside reference support", "Conflict"];
  assert.ok(allowed.includes(wizard.backendStatusLabel("unsupported", "")));
});

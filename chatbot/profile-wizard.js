(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.ALIGATEHR_PROFILE_WIZARD = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  // Staged Demo Profile Wizard model. This module is the frontend's reviewed
  // mirror of chatbot-backend/demo_profile.py: the same fields, units,
  // conversion factors, input bounds, and reference support ranges, expressed
  // as timely per-field feedback. The backend /profile/validate contract
  // remains the deterministic authority at the Review stage.
  // See docs/adr/0008-use-a-guided-form-for-demo-profiles.md.

  var STAGES = [
    { id: "basic_information", label: "Basic Information" },
    { id: "body_measurements", label: "Body Measurements" },
    { id: "blood_pressure_labs", label: "Blood Pressure and Labs" },
    { id: "lifestyle_family", label: "Lifestyle and Family Context" },
    { id: "review", label: "Review" },
  ];

  var SEX_CHOICES = [
    ["female", "Female"],
    ["male", "Male"],
  ];
  var SMOKING_CHOICES = [
    ["never", "Never"],
    ["former", "Former"],
    ["current", "Current"],
  ];
  var ALCOHOL_CHOICES = [
    ["never", "Never"],
    ["special_occasions", "Special occasions only"],
    ["one_to_three_per_month", "1–3 times a month"],
    ["one_to_two_per_week", "1–2 times a week"],
    ["three_to_four_per_week", "3–4 times a week"],
    ["daily_or_almost_daily", "Daily or almost daily"],
  ];
  var RELATIVE_CHOICES = [
    ["true", "Yes"],
    ["false", "No"],
  ];

  // bounds/support are in the canonical unit and mirror INPUT_BOUNDS and
  // REFERENCE_SUPPORT in chatbot-backend/demo_profile.py.
  var FIELDS = {
    age: {
      label: "Age",
      stage: "basic_information",
      kind: "number",
      units: ["years"],
      canonicalUnit: "years",
      fixedUnit: true,
      integer: true,
      bounds: [0, 130],
      support: [33, 90],
    },
    sex: {
      label: "Sex",
      stage: "basic_information",
      kind: "choice",
      choices: SEX_CHOICES,
    },
    height: {
      label: "Height",
      stage: "body_measurements",
      kind: "number",
      units: ["cm", "ft/in"],
      canonicalUnit: "cm",
      bounds: [50, 300],
      support: [140, 210],
    },
    weight: {
      label: "Weight",
      stage: "body_measurements",
      kind: "number",
      units: ["kg", "lb"],
      canonicalUnit: "kg",
      bounds: [1, 500],
      support: [37.6, 165.8],
    },
    waist: {
      label: "Waist circumference",
      stage: "body_measurements",
      kind: "number",
      units: ["cm", "in"],
      canonicalUnit: "cm",
      bounds: [20, 300],
      support: [50.7, 163.1],
    },
    hip: {
      label: "Hip circumference",
      stage: "body_measurements",
      kind: "number",
      units: ["cm", "in"],
      canonicalUnit: "cm",
      bounds: [20, 300],
      support: [65.3, 177.5],
    },
    bmi: {
      label: "BMI",
      stage: "body_measurements",
      kind: "number",
      units: ["kg/m²"],
      canonicalUnit: "kg/m²",
      fixedUnit: true,
      bounds: [5, 150],
      support: [15, 60],
    },
    sbp: {
      label: "Systolic blood pressure",
      stage: "blood_pressure_labs",
      kind: "number",
      units: ["mmHg"],
      canonicalUnit: "mmHg",
      fixedUnit: true,
      bounds: [30, 350],
      support: [80, 220],
    },
    dbp: {
      label: "Diastolic blood pressure",
      stage: "blood_pressure_labs",
      kind: "number",
      units: ["mmHg"],
      canonicalUnit: "mmHg",
      fixedUnit: true,
      bounds: [20, 250],
      support: [46, 120],
    },
    creatinine: {
      label: "Creatinine",
      stage: "blood_pressure_labs",
      kind: "number",
      units: ["µmol/L", "mg/dL"],
      canonicalUnit: "µmol/L",
      bounds: [1, 5000],
      support: [20.4, 500],
    },
    hba1c: {
      label: "HbA1c",
      stage: "blood_pressure_labs",
      kind: "number",
      units: ["mmol/mol", "%"],
      canonicalUnit: "mmol/mol",
      bounds: [1, 250],
      support: [20, 113],
    },
    smoking_status: {
      label: "Smoking status",
      stage: "lifestyle_family",
      kind: "choice",
      choices: SMOKING_CHOICES,
    },
    alcohol_frequency: {
      label: "Alcohol frequency",
      stage: "lifestyle_family",
      kind: "choice",
      choices: ALCOHOL_CHOICES,
    },
    affected_relative: {
      label: "Affected relative",
      stage: "lifestyle_family",
      kind: "choice",
      choices: RELATIVE_CHOICES,
    },
  };

  var FIELD_ORDER = Object.keys(FIELDS);

  // Fields whose value feeds a Derived Match Feature or a derived-vs-reported
  // conflict check. Editing any of them re-runs deriveFeatures and the BMI
  // conflict check, so the UI knows which edits to react to without
  // duplicating deriveFeatures' input knowledge.
  var DERIVED_TRIGGER_FIELDS = ["height", "weight", "waist", "hip", "bmi"];

  // Reviewed target-recommended fields: exactly the fields demonstrated by
  // each target's versioned Synthetic Example Profile (blood_pressure expands
  // to sbp + dbp). A sync test asserts this stays equal to
  // chatbot-backend/data/synthetic_example_profiles.json.
  var TARGET_RECOMMENDED_FIELDS = {
    CKD: ["age", "sex", "height", "weight", "creatinine", "affected_relative", "smoking_status"],
    Cardiac_Fibrosis: ["age", "sex", "sbp", "dbp", "smoking_status", "height", "weight"],
    MASH: ["age", "sex", "height", "weight", "alcohol_frequency", "affected_relative"],
    Pulmonary_fibrosis: ["age", "sex", "smoking_status", "height", "weight", "affected_relative"],
    SSc_Connective_Tissue: ["age", "sex", "waist", "hip", "affected_relative", "alcohol_frequency"],
    Crohns_Disease: ["age", "sex", "height", "weight", "alcohol_frequency", "affected_relative"],
    Fibrosis_of_Skin: ["age", "sex", "hba1c", "height", "weight", "affected_relative", "smoking_status"],
  };

  var STATUS_LABELS = {
    neutral: "",
    valid: "Valid",
    add_unit: "Add a unit",
    check_value: "Check this value",
    outside_reference_support: "Outside reference support",
    conflict: "Conflict",
  };

  var BLOCKING_STATUSES = ["add_unit", "check_value", "conflict"];

  function newEntry(field) {
    var meta = FIELDS[field];
    var unit = meta.kind === "number" && meta.fixedUnit ? meta.canonicalUnit : null;
    return { raw: "", unit: unit, original: null };
  }

  function isBlankRaw(raw) {
    if (raw == null) return true;
    if (typeof raw === "object") {
      return isBlankRaw(raw.feet) && isBlankRaw(raw.inches);
    }
    return String(raw).trim() === "";
  }

  function isBlank(entry) {
    return !entry || isBlankRaw(entry.raw);
  }

  function round(value, digits) {
    var factor = Math.pow(10, digits);
    return Math.round((value + Number.EPSILON) * factor) / factor;
  }

  function parseNumber(raw) {
    if (raw == null || String(raw).trim() === "") return NaN;
    return Number(String(raw).trim());
  }

  // Deterministic conversion to the field's canonical unit, mirroring the
  // backend _normalize_* helpers. Returns {ok, value} or {ok:false, message}.
  function toCanonical(field, raw, unit) {
    var meta = FIELDS[field];
    if (meta.kind !== "number") return { ok: true, value: raw };
    if (unit === "ft/in") {
      var feet = isBlankRaw(raw && raw.feet) ? 0 : parseNumber(raw.feet);
      var inches = isBlankRaw(raw && raw.inches) ? 0 : parseNumber(raw.inches);
      if (!isFinite(feet) || !isFinite(inches)) {
        return { ok: false, message: "Enter feet and inches as numbers." };
      }
      return { ok: true, value: round(feet * 30.48 + inches * 2.54, 2) };
    }
    var value = parseNumber(raw);
    if (!isFinite(value)) return { ok: false, message: "Enter a number." };
    if (field === "age" && !Number.isInteger(value)) {
      return { ok: false, message: "Enter age in whole years." };
    }
    var factors = {
      cm: 1,
      in: 2.54,
      kg: 1,
      lb: 0.45359237,
      "µmol/L": 1,
      "mmol/mol": 1,
      years: 1,
      "kg/m²": 1,
      mmHg: 1,
    };
    var converted;
    if (unit === "mg/dL") converted = value * 88.4;
    else if (unit === "%") converted = (value - 2.15) * 10.929;
    else converted = value * (factors[unit] == null ? 1 : factors[unit]);
    var digits = { hba1c: 1, bmi: 1, sbp: 0, dbp: 0, age: 0 }[field];
    return { ok: true, value: round(converted, digits == null ? 2 : digits) };
  }

  // Converts a display value between two reviewed units of the same field.
  // Used when the visitor changes a unit control; the entry's original
  // value and unit are preserved separately for review.
  function convertDisplay(field, raw, fromUnit, toUnit) {
    var canonical = toCanonical(field, raw, fromUnit);
    if (!canonical.ok) return raw;
    var value = canonical.value;
    if (toUnit === "ft/in") {
      var totalInches = value / 2.54;
      var feet = Math.floor(totalInches / 12);
      var inches = round(totalInches - feet * 12, 1);
      if (inches >= 12) {
        feet += 1;
        inches = 0;
      }
      return { feet: String(feet), inches: String(inches) };
    }
    var display;
    if (toUnit === "in") display = round(value / 2.54, 1);
    else if (toUnit === "lb") display = round(value / 0.45359237, 1);
    else if (toUnit === "mg/dL") display = round(value / 88.4, 2);
    else if (toUnit === "%") display = round(value / 10.929 + 2.15, 1);
    else display = value;
    return String(display);
  }

  function convertEntry(field, entry, newUnit) {
    var meta = FIELDS[field];
    if (!meta || meta.kind !== "number") return entry;
    if (meta.units.indexOf(newUnit) === -1 || entry.unit === newUnit) return entry;
    if (isBlank(entry) || !entry.unit) {
      // Assigning a unit to an existing value is not a conversion: the typed
      // value becomes the visitor's original representation in that unit.
      return {
        raw: entry.raw,
        unit: newUnit,
        original: isBlank(entry) ? null : { raw: entry.raw, unit: newUnit },
      };
    }
    return {
      raw: convertDisplay(field, entry.raw, entry.unit, newUnit),
      unit: newUnit,
      original: entry.original || { raw: entry.raw, unit: entry.unit },
    };
  }

  // The visitor typed a value: the current representation becomes the
  // original one preserved for review.
  function editEntry(field, entry, raw) {
    var unit = entry ? entry.unit : newEntry(field).unit;
    return {
      raw: raw,
      unit: unit,
      original: isBlankRaw(raw) ? null : { raw: raw, unit: unit },
    };
  }

  function usableCanonical(field, entry) {
    if (!entry || isBlank(entry)) return null;
    var meta = FIELDS[field];
    if (meta.kind !== "number" || !entry.unit) return null;
    var canonical = toCanonical(field, entry.raw, entry.unit);
    if (!canonical.ok) return null;
    var bounds = meta.bounds;
    if (canonical.value < bounds[0] || canonical.value > bounds[1]) return null;
    return canonical.value;
  }

  // Deterministic Derived Match Features previewed inside the wizard. The
  // backend recomputes these at validation; this preview only mirrors it.
  function deriveFeatures(entries) {
    var derived = {};
    var height = usableCanonical("height", entries.height);
    var weight = usableCanonical("weight", entries.weight);
    if (height != null && weight != null && height > 0) {
      derived.bmi = {
        label: "BMI",
        value: round(weight / Math.pow(height / 100, 2), 1),
        unit: "kg/m²",
        derivedFrom: ["height", "weight"],
      };
    }
    var waist = usableCanonical("waist", entries.waist);
    var hip = usableCanonical("hip", entries.hip);
    if (waist != null && hip != null && hip > 0) {
      derived.waist_to_hip_ratio = {
        label: "Waist-to-hip ratio",
        value: round(waist / hip, 2),
        unit: "ratio",
        derivedFrom: ["waist", "hip"],
      };
    }
    return derived;
  }

  // Field-exit and step-continuation validation. Blank optional fields stay
  // neutral; entered fields use only the reviewed status vocabulary. Values
  // outside reference support are preserved, never clamped, and the copy
  // never labels a value normal, abnormal, healthy, or unhealthy.
  function validateEntry(field, entry, entries) {
    var meta = FIELDS[field];
    if (!meta || !entry || isBlank(entry)) return { status: "neutral", message: "" };
    if (meta.kind === "choice") return { status: "valid", message: "" };
    if (!entry.unit) {
      return {
        status: "add_unit",
        message: "Add a unit so this value can be interpreted. It is never guessed from magnitude.",
      };
    }
    var canonical = toCanonical(field, entry.raw, entry.unit);
    if (!canonical.ok) return { status: "check_value", message: canonical.message };
    var bounds = meta.bounds;
    if (canonical.value < bounds[0] || canonical.value > bounds[1]) {
      return {
        status: "check_value",
        message:
          "This is outside the accepted input range for this demo (" +
          bounds[0] + "–" + bounds[1] + " " + meta.canonicalUnit +
          "). Edit or remove it.",
      };
    }
    if (field === "bmi" && entries) {
      var derived = deriveFeatures(entries);
      if (derived.bmi && Math.abs(derived.bmi.value - canonical.value) > 0.1) {
        return {
          status: "conflict",
          message:
            "Reported BMI differs from the BMI calculated from height and weight (" +
            derived.bmi.value + " kg/m²). Edit or remove one of them.",
        };
      }
    }
    var support = meta.support;
    if (canonical.value < support[0] || canonical.value > support[1]) {
      return {
        status: "outside_reference_support",
        message:
          "Preserved exactly as entered. This value is outside the range represented " +
          "by the reference cohort, which can prevent a stable neighborhood.",
      };
    }
    return { status: "valid", message: "" };
  }

  function validateStage(stageId, entries, target) {
    var results = {};
    var blocked = false;
    fieldsForStage(stageId, target).forEach(function (item) {
      var result = validateEntry(item.field, entries[item.field], entries);
      results[item.field] = result;
      if (BLOCKING_STATUSES.indexOf(result.status) !== -1) blocked = true;
    });
    return { fields: results, blocked: blocked };
  }

  // Target-recommended fields come first within each stage; every supported
  // field remains available after them.
  function fieldsForStage(stageId, target) {
    var recommended = TARGET_RECOMMENDED_FIELDS[target] || [];
    var inStage = FIELD_ORDER.filter(function (field) {
      return FIELDS[field].stage === stageId;
    });
    var first = inStage.filter(function (field) {
      return recommended.indexOf(field) !== -1;
    });
    var rest = inStage.filter(function (field) {
      return recommended.indexOf(field) === -1;
    });
    return first.concat(rest).map(function (field) {
      return { field: field, recommended: first.indexOf(field) !== -1 };
    });
  }

  function formatRaw(raw, unit) {
    if (raw != null && typeof raw === "object") {
      return (
        (isBlankRaw(raw.feet) ? "0" : String(raw.feet).trim()) + " ft " +
        (isBlankRaw(raw.inches) ? "0" : String(raw.inches).trim()) + " in"
      );
    }
    return String(raw).trim() + (unit && unit !== "ft/in" ? " " + unit : "");
  }

  function choiceLabel(field, value) {
    var meta = FIELDS[field];
    if (!meta || meta.kind !== "choice") return String(value);
    var match = meta.choices.filter(function (choice) {
      return choice[0] === String(value);
    })[0];
    return match ? match[1] : String(value);
  }

  // Feature Candidates for the deterministic /profile/validate contract. The
  // visitor's ORIGINAL value and unit are submitted (unit conversions in the
  // wizard are display-only), and the source text embeds the reviewed unit so
  // the backend's explicit-unit rule holds for wizard entries exactly as it
  // does for the reviewed Synthetic Example Profiles.
  function buildCandidates(entries) {
    var candidates = [];
    FIELD_ORDER.forEach(function (field) {
      var entry = entries[field];
      if (!entry || isBlank(entry)) return;
      var meta = FIELDS[field];
      if (meta.kind === "choice") {
        // The visible choice label is what the backend category maps accept;
        // internal option keys such as one_to_two_per_week are frontend-only.
        var label = choiceLabel(field, entry.raw);
        candidates.push({
          field: field,
          raw_value: label,
          raw_unit: null,
          source_text: meta.label.toLowerCase() + ": " + label.toLowerCase(),
          operation: "set",
        });
        return;
      }
      var original = entry.original || { raw: entry.raw, unit: entry.unit };
      var rawValue;
      if (original.unit === "ft/in") {
        rawValue = formatRaw(original.raw, "ft/in");
      } else {
        var number = parseNumber(original.raw);
        rawValue = isFinite(number) ? number : String(original.raw);
      }
      candidates.push({
        field: field,
        raw_value: rawValue,
        raw_unit: original.unit,
        source_text: meta.label.toLowerCase() + " " + formatRaw(original.raw, original.unit),
        operation: "set",
      });
    });
    return candidates;
  }

  var UNIT_ALIASES = {
    cm: "cm",
    centimeter: "cm",
    centimeters: "cm",
    in: "in",
    inch: "in",
    inches: "in",
    "ft/in": "ft/in",
    kg: "kg",
    kilogram: "kg",
    kilograms: "kg",
    lb: "lb",
    lbs: "lb",
    pound: "lb",
    pounds: "lb",
    "µmol/l": "µmol/L",
    "umol/l": "µmol/L",
    "micromol/l": "µmol/L",
    "mg/dl": "mg/dL",
    "%": "%",
    percent: "%",
    "mmol/mol": "mmol/mol",
    years: "years",
    year: "years",
    yr: "years",
    yrs: "years",
    "kg/m2": "kg/m²",
    "kg/m²": "kg/m²",
    mmhg: "mmHg",
  };

  var CATEGORY_ALIASES = {
    sex: { female: "female", woman: "female", male: "male", man: "male" },
    smoking_status: {
      never: "never",
      "never smoked": "never",
      former: "former",
      "former smoker": "former",
      previous: "former",
      current: "current",
      "current smoker": "current",
    },
    alcohol_frequency: {
      never: "never",
      "special occasions only": "special_occasions",
      "special occasions": "special_occasions",
      monthly: "one_to_three_per_month",
      "1 3 times a month": "one_to_three_per_month",
      "once or twice a week": "one_to_two_per_week",
      "1 2 times a week": "one_to_two_per_week",
      "three or four times a week": "three_to_four_per_week",
      "3 4 times a week": "three_to_four_per_week",
      daily: "daily_or_almost_daily",
      "daily or almost daily": "daily_or_almost_daily",
    },
    affected_relative: {
      yes: "true",
      "true": "true",
      affected: "true",
      no: "false",
      "false": "false",
      none: "false",
    },
  };

  function canonicalCategory(field, value) {
    var key = String(value).trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    var map = CATEGORY_ALIASES[field] || {};
    return map[key] != null ? map[key] : null;
  }

  // Loads reviewed Feature Candidates (e.g. a Synthetic Example Profile) into
  // wizard entries, so both entry paths converge on one staged review.
  function entriesFromCandidates(candidates) {
    var entries = {};
    (candidates || []).forEach(function (candidate) {
      var field = String(candidate.field || "").trim();
      var rawValue = candidate.raw_value;
      if (field === "blood_pressure") {
        var match = /^\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)\s*$/.exec(String(rawValue));
        if (!match) return;
        entries.sbp = editEntry("sbp", newEntry("sbp"), match[1]);
        entries.dbp = editEntry("dbp", newEntry("dbp"), match[2]);
        return;
      }
      var meta = FIELDS[field];
      if (!meta) return;
      if (meta.kind === "choice") {
        var category = canonicalCategory(field, rawValue);
        if (category == null) return;
        entries[field] = { raw: category, unit: null, original: null };
        return;
      }
      var unit = UNIT_ALIASES[String(candidate.raw_unit || "").trim().toLowerCase()] || null;
      if (meta.fixedUnit) unit = meta.canonicalUnit;
      if (!unit || meta.units.indexOf(unit) === -1) return;
      var raw = String(rawValue);
      if (unit === "ft/in") {
        var compound = /^\s*(\d+(?:\.\d+)?)\s*(?:ft|foot|feet|')\s*(\d+(?:\.\d+)?)\s*(?:in|inch|inches|")\s*$/i.exec(raw);
        if (!compound) return;
        raw = { feet: compound[1], inches: compound[2] };
      }
      entries[field] = {
        raw: raw,
        unit: unit,
        original: { raw: raw, unit: unit },
      };
    });
    return entries;
  }

  function statusLabel(status) {
    return STATUS_LABELS[status] != null ? STATUS_LABELS[status] : status;
  }

  // Maps the backend draft status vocabulary onto the same five reviewed
  // user-facing states the wizard uses for entered fields.
  function backendStatusLabel(status, message) {
    if (status === "valid") return "Valid";
    if (status === "ambiguous") {
      return /unit/i.test(message || "") ? "Add a unit" : "Check this value";
    }
    if (status === "out_of_range") return "Check this value";
    if (status === "outside_reference_support") return "Outside reference support";
    if (status === "conflicting") return "Conflict";
    // The wizard only ever submits schema fields, so a backend "unsupported"
    // status is unreachable here; keep the entered-field vocabulary to the
    // five reviewed states rather than introduce a sixth.
    return "Check this value";
  }

  return {
    STAGES: STAGES,
    FIELDS: FIELDS,
    FIELD_ORDER: FIELD_ORDER,
    DERIVED_TRIGGER_FIELDS: DERIVED_TRIGGER_FIELDS,
    TARGET_RECOMMENDED_FIELDS: TARGET_RECOMMENDED_FIELDS,
    BLOCKING_STATUSES: BLOCKING_STATUSES,
    newEntry: newEntry,
    isBlank: isBlank,
    toCanonical: toCanonical,
    convertDisplay: convertDisplay,
    convertEntry: convertEntry,
    editEntry: editEntry,
    deriveFeatures: deriveFeatures,
    validateEntry: validateEntry,
    validateStage: validateStage,
    fieldsForStage: fieldsForStage,
    buildCandidates: buildCandidates,
    entriesFromCandidates: entriesFromCandidates,
    formatRaw: formatRaw,
    choiceLabel: choiceLabel,
    statusLabel: statusLabel,
    backendStatusLabel: backendStatusLabel,
  };
});

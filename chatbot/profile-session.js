(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.ALIGATEHR_PROFILE_SESSION = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  var STORAGE_KEY = "aligatehr-demo-profile-session";

  function initialState() {
    return {
      phase: "inactive",
      candidates: [],
      draft: null,
      confirmed: null,
    };
  }

  function restore(storage) {
    var raw = storage.getItem(STORAGE_KEY);
    if (!raw) return initialState();
    try {
      var parsed = JSON.parse(raw);
      if (
        !parsed ||
        !["inactive", "draft", "confirmed"].includes(parsed.phase) ||
        !Array.isArray(parsed.candidates)
      ) {
        throw new Error("invalid profile session");
      }
      return parsed;
    } catch (error) {
      storage.removeItem(STORAGE_KEY);
      return initialState();
    }
  }

  function create(storage) {
    var state = restore(storage);

    function save() {
      storage.setItem(STORAGE_KEY, JSON.stringify(state));
    }

    return {
      getState: function () {
        return state;
      },
      start: function () {
        state = {
          phase: "draft",
          candidates: [],
          draft: null,
          confirmed: null,
        };
        save();
        return state;
      },
      appendCandidates: function (candidates) {
        if (state.phase !== "draft") {
          throw new Error("Feature Candidates require an active Profile Draft");
        }
        state.candidates = state.candidates.concat(candidates);
        save();
        return state;
      },
      applyDraft: function (draft) {
        if (state.phase !== "draft" || !draft || draft.state !== "draft") {
          throw new Error("Only a Profile Draft can be applied");
        }
        state.draft = draft;
        save();
        return state;
      },
      confirm: function (confirmed) {
        if (
          state.phase !== "draft" ||
          !confirmed ||
          confirmed.state !== "confirmed" ||
          confirmed.matching_started !== false
        ) {
          throw new Error("Confirmation requires an explicit confirmed response");
        }
        state.phase = "confirmed";
        state.confirmed = confirmed;
        state.draft = null;
        save();
        return state;
      },
      reset: function () {
        state = initialState();
        storage.removeItem(STORAGE_KEY);
        return state;
      },
    };
  }

  function editValue(current, raw) {
    if (typeof current === "number") {
      var number = Number(raw);
      return Number.isFinite(number) ? number : raw;
    }
    if (typeof current === "boolean") return raw === true || raw === "true";
    return raw;
  }

  function createCorrections(draft, edits) {
    var corrections = [];
    var features = (draft && draft.reported_features) || {};
    Object.keys(edits).forEach(function (field) {
      var feature = features[field];
      if (!feature) return;
      var value = editValue(feature.normalized_value, edits[field]);
      if (
        value === feature.normalized_value &&
        !["ambiguous", "out_of_range", "conflicting"].includes(feature.status)
      ) return;
      corrections.push({
        field: field,
        raw_value: value,
        raw_unit: null,
        source_text: "Edited in review: " + feature.label,
        operation: "correct",
      });
    });
    return corrections;
  }

  return {
    STORAGE_KEY: STORAGE_KEY,
    create: create,
    createCorrections: createCorrections,
  };
});

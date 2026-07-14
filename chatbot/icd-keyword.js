(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.ALIGATEHR_ICD_KEYWORD = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  var REQUEST_KEY = "aligatehr-icd-keyword-visualization-request";
  var REQUEST_EVENT = "aligatehr:icd-keyword-visualization-request";

  function copySelector(selector) {
    if (!selector || !["exact", "prefix", "range"].includes(selector.type)) {
      return null;
    }
    if (selector.type === "exact" && selector.code) {
      return { type: "exact", code: String(selector.code) };
    }
    if (selector.type === "prefix" && selector.prefix) {
      return { type: "prefix", prefix: String(selector.prefix) };
    }
    if (selector.type === "range" && selector.start && selector.end) {
      return {
        type: "range",
        start: String(selector.start),
        end: String(selector.end),
      };
    }
    return null;
  }

  function createRequest(match, vocabularyVersion, createdAt) {
    var selector = copySelector(match && match.selector);
    if (
      !match ||
      !match.id ||
      !match.display_label ||
      !match.selector_label ||
      !vocabularyVersion ||
      !selector
    ) {
      throw new Error("Match is missing the ICD visualization contract");
    }
    return {
      type: "icd_keyword_match",
      vocabulary_version: vocabularyVersion,
      keyword_id: match.id,
      display_label: match.display_label,
      selector: selector,
      selector_label: match.selector_label,
      created_at: createdAt || new Date().toISOString(),
      consumed: false,
    };
  }

  function saveRequest(storage, request) {
    storage.setItem(REQUEST_KEY, JSON.stringify(request));
  }

  function consumeRequest(storage) {
    var raw = storage.getItem(REQUEST_KEY);
    if (!raw) return { status: "empty", request: null, should_play: false };
    var request;
    try {
      request = JSON.parse(raw);
    } catch (_error) {
      storage.removeItem(REQUEST_KEY);
      return { status: "invalid", request: null, should_play: false };
    }
    try {
      createRequest(
        {
          id: request.keyword_id,
          display_label: request.display_label,
          selector: request.selector,
          selector_label: request.selector_label,
        },
        request.vocabulary_version,
        request.created_at,
      );
    } catch (_error) {
      storage.removeItem(REQUEST_KEY);
      return { status: "invalid", request: null, should_play: false };
    }
    var shouldPlay = request.consumed !== true;
    request.consumed = true;
    saveRequest(storage, request);
    return { status: "ready", request: request, should_play: shouldPlay };
  }

  function notifyRequest(target, request) {
    if (!target || typeof target.dispatchEvent !== "function") return;
    target.dispatchEvent(new CustomEvent(REQUEST_EVENT, { detail: request }));
  }

  function connectRequestConsumer(target, storage, play) {
    function consumeAndPlay() {
      var latest = consumeRequest(storage);
      if (latest.status === "ready" && latest.should_play) play(latest.request);
    }
    target.addEventListener(REQUEST_EVENT, consumeAndPlay);
    return function () {
      target.removeEventListener(REQUEST_EVENT, consumeAndPlay);
    };
  }

  return {
    REQUEST_KEY: REQUEST_KEY,
    REQUEST_EVENT: REQUEST_EVENT,
    createRequest: createRequest,
    saveRequest: saveRequest,
    consumeRequest: consumeRequest,
    notifyRequest: notifyRequest,
    connectRequestConsumer: connectRequestConsumer,
  };
});

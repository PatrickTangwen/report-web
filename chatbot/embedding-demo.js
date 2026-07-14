(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.ALIGATEHR_EMBEDDING_DEMO = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  var REQUEST_KEY = "aligatehr-embedding-visualization-request";
  var REQUEST_EVENT = "aligatehr:embedding-visualization-request";
  var LOCAL_API_URL = "http://127.0.0.1:7860";
  var REMOTE_API_URL = "https://patirckistc-report-web.hf.space";

  function resolveApiUrl(locationLike, override) {
    if (override) return override;
    var hostname = locationLike && locationLike.hostname;
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1"
      ? LOCAL_API_URL
      : REMOTE_API_URL;
  }

  function createPresetRequest(preset, createdAt) {
    if (
      !preset ||
      !preset.dataset_version ||
      !preset.preset_id ||
      !preset.target ||
      !["compact", "multi_region", "overview"].includes(preset.display_mode) ||
      !Array.isArray(preset.visual_reference_ids) ||
      !preset.visual_reference_ids.length
    ) {
      throw new Error("Preset response is missing the visualization contract");
    }
    return {
      type: "preset_selection",
      dataset_version: preset.dataset_version,
      preset_id: preset.preset_id,
      target: preset.target,
      display_mode: preset.display_mode,
      visual_reference_ids: preset.visual_reference_ids.slice(),
      summary: {
        reference_count: preset.summary.reference_count,
        title: preset.summary.title,
        description: preset.summary.description,
      },
      created_at: createdAt || new Date().toISOString(),
      consumed: false,
    };
  }

  function saveRequest(storage, request) {
    storage.setItem(REQUEST_KEY, JSON.stringify(request));
  }

  function notifyRequest(target, request) {
    if (!target || typeof target.dispatchEvent !== "function") return;
    target.dispatchEvent(new CustomEvent(REQUEST_EVENT, { detail: request }));
  }

  function connectRequestConsumer(target, storage, datasetVersion, play) {
    function consumeAndPlay() {
      var latest = consumeRequest(storage, datasetVersion);
      if (latest.status === "ready" && latest.should_play) play(latest.request);
    }
    target.addEventListener(REQUEST_EVENT, consumeAndPlay);
    return function () {
      target.removeEventListener(REQUEST_EVENT, consumeAndPlay);
    };
  }

  function consumeRequest(storage, datasetVersion) {
    var raw = storage.getItem(REQUEST_KEY);
    if (!raw) return { status: "empty", request: null, should_play: false };

    var request;
    try {
      request = JSON.parse(raw);
    } catch (error) {
      storage.removeItem(REQUEST_KEY);
      return { status: "invalid", request: null, should_play: false };
    }

    if (request.dataset_version !== datasetVersion) {
      storage.removeItem(REQUEST_KEY);
      return {
        status: "version_mismatch",
        request: null,
        should_play: false,
      };
    }

    var shouldPlay = request.consumed !== true;
    request.consumed = true;
    saveRequest(storage, request);
    return { status: "ready", request: request, should_play: shouldPlay };
  }

  return {
    REQUEST_KEY: REQUEST_KEY,
    REQUEST_EVENT: REQUEST_EVENT,
    createPresetRequest: createPresetRequest,
    saveRequest: saveRequest,
    notifyRequest: notifyRequest,
    connectRequestConsumer: connectRequestConsumer,
    consumeRequest: consumeRequest,
    resolveApiUrl: resolveApiUrl,
  };
});

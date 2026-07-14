(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.ALIGATEHR_EMBEDDING_DEMO = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  var REQUEST_KEY = "aligatehr-embedding-visualization-request";
  var REQUEST_EVENT = "aligatehr:embedding-visualization-request";
  var LOCAL_API_URL = "http://127.0.0.1:7860";
  var REMOTE_API_URL = "https://aligatehr-gen-backend.onrender.com";

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
      (preset.display_mode === "multi_region" &&
        (!Number.isInteger(preset.minimum_region_size) ||
          preset.minimum_region_size < 1)) ||
      !Array.isArray(preset.visual_reference_ids) ||
      !preset.visual_reference_ids.length
    ) {
      throw new Error("Preset response is missing the visualization contract");
    }
    var request = {
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
    if (preset.display_mode === "multi_region") {
      request.minimum_region_size = preset.minimum_region_size;
    }
    return request;
  }

  function createMatchedRequest(result, createdAt) {
    var comparison = result && result.cohort_comparison_result;
    var aggregate = result && result.aggregate_callout_data;
    if (
      !result ||
      !result.dataset_version ||
      !comparison ||
      comparison.status !== "matched_reference_neighborhood" ||
      !comparison.target ||
      !Number.isInteger(comparison.minimum_display_region_size) ||
      comparison.minimum_display_region_size < 1 ||
      !Array.isArray(result.visual_reference_ids) ||
      !result.visual_reference_ids.length ||
      !aggregate ||
      aggregate.reference_count !== result.visual_reference_ids.length
    ) {
      throw new Error("Match response is missing the visualization contract");
    }
    return {
      type: "matched_reference_neighborhood",
      dataset_version: result.dataset_version,
      target: comparison.target,
      display_mode: "matched_selection",
      minimum_region_size: comparison.minimum_display_region_size,
      visual_reference_ids: result.visual_reference_ids.slice(),
      summary: {
        reference_count: aggregate.reference_count,
        title: aggregate.title,
        description: aggregate.description,
        domains: Array.isArray(aggregate.domains)
          ? JSON.parse(JSON.stringify(aggregate.domains))
          : [],
      },
      created_at: createdAt || new Date().toISOString(),
      consumed: false,
    };
  }

  function createRequestController() {
    var generation = 0;
    var activeController = null;
    return {
      start: function () {
        generation += 1;
        if (activeController) {
          activeController.abort(new Error("Superseded by a newer request"));
        }
        activeController = new AbortController();
        return { token: generation, signal: activeController.signal };
      },
      cancel: function () {
        generation += 1;
        if (activeController) {
          activeController.abort(new Error("Request cancelled"));
          activeController = null;
        }
      },
      isCurrent: function (token) {
        return token === generation;
      },
    };
  }

  function requestJson(fetchImpl, url, options, timeoutMs) {
    var requestOptions = Object.assign({}, options || {});
    var externalSignal = requestOptions.signal;
    var controller = new AbortController();
    var timedOut = false;
    var timeout = setTimeout(function () {
      timedOut = true;
      controller.abort(new Error("Backend request timed out"));
    }, timeoutMs || 30000);
    var cancelFromExternal = function () {
      controller.abort(externalSignal.reason || new Error("Request cancelled"));
    };
    if (externalSignal) {
      if (externalSignal.aborted) cancelFromExternal();
      else externalSignal.addEventListener("abort", cancelFromExternal, { once: true });
    }
    requestOptions.signal = controller.signal;

    return fetchImpl(url, requestOptions)
      .then(function (response) {
        if (!response.ok) throw new Error("Backend returned " + response.status);
        return response.json();
      })
      .catch(function (error) {
        if (timedOut) throw new Error("Backend request timed out. Retry when ready.");
        throw error;
      })
      .finally(function () {
        clearTimeout(timeout);
        if (externalSignal) {
          externalSignal.removeEventListener("abort", cancelFromExternal);
        }
      });
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
    createMatchedRequest: createMatchedRequest,
    createRequestController: createRequestController,
    saveRequest: saveRequest,
    notifyRequest: notifyRequest,
    requestJson: requestJson,
    connectRequestConsumer: connectRequestConsumer,
    consumeRequest: consumeRequest,
    resolveApiUrl: resolveApiUrl,
  };
});

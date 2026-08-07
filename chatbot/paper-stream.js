(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.ALIGATEHR_PAPER_STREAM = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  // Incremental SSE parser and fetch-based streaming client for
  // POST /paper/question/stream (issue #50). EventSource cannot POST, so
  // events are read from fetch's body reader. Only connection-level
  // failures (network error, non-2xx, missing body) are marked
  // connectionFailure so the caller may fall back to the non-streaming
  // endpoint; a mid-stream "error" event or a broken stream is terminal
  // and must never be silently refetched.

  function createParser() {
    return { buffer: "" };
  }

  function parseChunk(parser, text) {
    parser.buffer += text;
    var events = [];
    var boundary;
    while ((boundary = parser.buffer.indexOf("\n\n")) !== -1) {
      var block = parser.buffer.slice(0, boundary);
      parser.buffer = parser.buffer.slice(boundary + 2);
      var event = null;
      var dataLines = [];
      block.split("\n").forEach(function (line) {
        if (line.indexOf("event:") === 0) {
          event = line.slice(6).trim();
        } else if (line.indexOf("data:") === 0) {
          dataLines.push(line.slice(5).trim());
        }
      });
      if (!event && !dataLines.length) continue;
      var data = null;
      if (dataLines.length) {
        try {
          data = JSON.parse(dataLines.join("\n"));
        } catch (parseError) {
          data = null;
        }
      }
      events.push({ event: event, data: data });
    }
    return events;
  }

  function connectionFailure(message) {
    var error = new Error(message);
    error.connectionFailure = true;
    return error;
  }

  function streamPaperQuestion(fetchImpl, url, payload, handlers) {
    handlers = handlers || {};
    return fetchImpl(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(
      function (response) {
        if (!response.ok || !response.body) {
          throw connectionFailure(
            "stream connection failed: HTTP " + (response && response.status)
          );
        }
        var reader = response.body.getReader();
        var decoder = new TextDecoder();
        var parser = createParser();
        var reply = "";
        var toolTrace = null;
        var terminalError = null;

        function dispatch(evt) {
          if (evt.event === "token" && evt.data) {
            reply += evt.data.text;
            if (handlers.onToken) handlers.onToken(evt.data.text, reply);
          } else if (evt.event === "tool_call" && evt.data) {
            if (handlers.onToolCall) handlers.onToolCall(evt.data);
          } else if (evt.event === "tool_result" && evt.data) {
            if (handlers.onToolResult) handlers.onToolResult(evt.data);
          } else if (evt.event === "done") {
            toolTrace = (evt.data && evt.data.tool_trace) || [];
          } else if (evt.event === "error") {
            terminalError = new Error(
              (evt.data && evt.data.detail) || "stream error"
            );
          }
        }

        function pump() {
          return reader.read().then(function (result) {
            if (result.value) {
              parseChunk(parser, decoder.decode(result.value, { stream: true })).forEach(
                dispatch
              );
              if (terminalError) throw terminalError;
              if (toolTrace !== null) {
                return { reply: reply, toolTrace: toolTrace };
              }
            }
            if (result.done) {
              if (toolTrace !== null) {
                return { reply: reply, toolTrace: toolTrace };
              }
              throw new Error("stream ended before the done event");
            }
            return pump();
          });
        }

        return pump();
      },
      function (networkError) {
        throw connectionFailure(
          "stream connection failed: " + (networkError && networkError.message)
        );
      }
    );
  }

  return {
    createParser: createParser,
    parseChunk: parseChunk,
    streamPaperQuestion: streamPaperQuestion,
  };
});

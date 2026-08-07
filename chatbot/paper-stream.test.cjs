const assert = require("node:assert/strict");
const test = require("node:test");

const stream = require("./paper-stream.js");


function sse(event, data) {
  return "event: " + event + "\ndata: " + JSON.stringify(data) + "\n\n";
}

function fakeResponse(chunks, { ok = true, status = 200, body = true } = {}) {
  const encoder = new TextEncoder();
  const queue = chunks.map((chunk) => encoder.encode(chunk));
  return {
    ok,
    status,
    body: body
      ? {
          getReader() {
            return {
              read() {
                if (queue.length) {
                  return Promise.resolve({ value: queue.shift(), done: false });
                }
                return Promise.resolve({ value: undefined, done: true });
              },
            };
          },
        }
      : null,
  };
}


test("parseChunk assembles events across arbitrary chunk boundaries", () => {
  const parser = stream.createParser();
  const whole = sse("token", { text: "Hel" }) + sse("token", { text: "lo" });
  const cut = 17;
  const first = stream.parseChunk(parser, whole.slice(0, cut));
  const second = stream.parseChunk(parser, whole.slice(cut));
  const events = first.concat(second);
  assert.deepEqual(events, [
    { event: "token", data: { text: "Hel" } },
    { event: "token", data: { text: "lo" } },
  ]);
  assert.equal(parser.buffer, "");
});


test("streamPaperQuestion dispatches handlers and resolves with the full reply", async () => {
  const chunks = [
    sse("tool_call", { tool: "query_metrics", label: "Querying evaluation metrics" }),
    sse("tool_result", { tool: "query_metrics", ok: true }),
    sse("token", { text: "CKD AUROC " }) + sse("token", { text: "is 0.8755." }),
    sse("done", { tool_trace: [{ tool: "query_metrics", ok: true }] }),
  ];
  const seen = { tokens: [], toolCalls: [], toolResults: [] };
  const result = await stream.streamPaperQuestion(
    async () => fakeResponse(chunks),
    "http://x/paper/question/stream",
    { message: "q" },
    {
      onToken: (text) => seen.tokens.push(text),
      onToolCall: (data) => seen.toolCalls.push(data.label),
      onToolResult: (data) => seen.toolResults.push(data.ok),
    }
  );
  assert.equal(result.reply, "CKD AUROC is 0.8755.");
  assert.deepEqual(result.toolTrace, [{ tool: "query_metrics", ok: true }]);
  assert.deepEqual(seen.toolCalls, ["Querying evaluation metrics"]);
  assert.deepEqual(seen.toolResults, [true]);
  assert.deepEqual(seen.tokens, ["CKD AUROC ", "is 0.8755."]);
});


test("non-2xx and network failures are marked connectionFailure for fallback", async () => {
  await assert.rejects(
    stream.streamPaperQuestion(
      async () => fakeResponse([], { ok: false, status: 503 }),
      "u",
      {}
    ),
    (error) => error.connectionFailure === true
  );
  await assert.rejects(
    stream.streamPaperQuestion(
      async () => {
        throw new Error("ECONNREFUSED");
      },
      "u",
      {}
    ),
    (error) => error.connectionFailure === true
  );
});


test("a mid-stream error event is terminal, not a connection failure", async () => {
  const chunks = [
    sse("token", { text: "partial" }),
    sse("error", { detail: "LLM API error: boom" }),
  ];
  await assert.rejects(
    stream.streamPaperQuestion(async () => fakeResponse(chunks), "u", {}),
    (error) =>
      error.connectionFailure === undefined &&
      /LLM API error: boom/.test(error.message)
  );
});


test("a stream that ends without done is terminal, not a connection failure", async () => {
  const chunks = [sse("token", { text: "partial" })];
  await assert.rejects(
    stream.streamPaperQuestion(async () => fakeResponse(chunks), "u", {}),
    (error) =>
      error.connectionFailure === undefined &&
      /before the done event/.test(error.message)
  );
});

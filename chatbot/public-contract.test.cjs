const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");


const source = fs.readFileSync(path.join(__dirname, "chatbot.js"), "utf8");


test("every public chatbot API request uses the bounded JSON request helper", () => {
  assert.equal(source.includes("fetch(API_URL"), false);
  assert.match(source, /DEMO\.requestJson\([\s\S]*API_URL \+ "\/chat"/);
  assert.match(source, /DEMO\.requestJson\([\s\S]*API_URL \+ "\/profile\/extract"/);
  assert.match(source, /DEMO\.requestJson\([\s\S]*API_URL \+ "\/profile\/validate"/);
  assert.match(source, /DEMO\.requestJson\([\s\S]*API_URL \+ "\/profile\/confirm"/);
});


test("a failed ordinary chat exposes an explicit retry action", () => {
  assert.match(source, /"data-chatbot-action"\s*:\s*"retry-chat"/);
  assert.match(source, /if \(action === "retry-chat"\) retryChat\(button\)/);
});

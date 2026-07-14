const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");


const source = fs.readFileSync(path.join(__dirname, "chatbot.js"), "utf8");
const styles = fs.readFileSync(path.join(__dirname, "chatbot.css"), "utf8");


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


test("the message input shows a scrollbar only after real vertical overflow", () => {
  assert.match(
    styles,
    /\.chatbot-input\s*{[^}]*overflow-y:\s*hidden;/s,
  );
  assert.match(
    source,
    /this\.style\.overflowY = this\.scrollHeight > 80 \? "auto" : "hidden"/,
  );
});


test("the message input never displays preset placeholder copy", () => {
  assert.doesNotMatch(source, /placeholder:\s*["']/);
  assert.doesNotMatch(source, /input\.placeholder\s*=/);
});


function extractFunctionSource(name) {
  const match = source.match(
    new RegExp("function " + name + "\\([^)]*\\) \\{[\\s\\S]*?\\n  \\}"),
  );
  assert.ok(match, `expected chatbot.js to define function ${name}`);
  return match[0];
}


test("opening the Assistant for the first time shows exactly the three Research Tasks", () => {
  assert.match(source, /label: "Understand the Research"/);
  assert.match(source, /label: "Explore Visualizations"/);
  assert.match(source, /label: "Build a Demo Profile"/);
  const taskIds = source.match(/id: "(paper|visualizations|profile)"/g) || [];
  assert.equal(taskIds.length, 3);
});


test("each Research Task routes into the shared Assistant Shell through one explicit contract", () => {
  assert.match(source, /"data-chatbot-action"\s*:\s*"select-task"/);
  assert.match(source, /if \(action === "select-task"\) selectTask\(button\.getAttribute\("data-task"\)\)/);
  const selectTask = extractFunctionSource("selectTask");
  assert.match(selectTask, /shellSession\.selectTask\(task\)/);
  assert.match(selectTask, /showTask\(task\)/);
});


test("a persistent Back to tasks action returns to the task menu without clearing sessions", () => {
  assert.match(source, /"data-chatbot-action"\s*:\s*"back-to-tasks"/);
  assert.match(source, /if \(action === "back-to-tasks"\) backToTasks\(\)/);
  const backToTasks = extractFunctionSource("backToTasks");
  assert.match(backToTasks, /shellSession\.backToTasks\(\)/);
  assert.match(backToTasks, /showTask\(null\)/);
  assert.doesNotMatch(backToTasks, /innerHTML/);
});


test("closing and reopening the Assistant resumes the previously active task", () => {
  assert.match(source, /var activeTaskOnLoad = shellSession\.getState\(\)\.activeTask/);
  assert.match(source, /showTask\(activeTaskOnLoad\)/);
});


test("Understand the Research has its own explicit clear action scoped to only that session", () => {
  assert.match(source, /"data-chatbot-action"\s*:\s*"clear-paper-conversation"/);
  const clearPaper = extractFunctionSource("clearPaperConversation");
  assert.match(clearPaper, /paperHistory = \[\]/);
  assert.match(clearPaper, /paperMessagesEl\.innerHTML = ""/);
  assert.doesNotMatch(clearPaper, /profileSession|profileMessagesEl/);
});


test("Build a Demo Profile's Start Over clears only the Profile Session", () => {
  const startOver = extractFunctionSource("startOverDemoProfile");
  assert.match(startOver, /profileSession\.reset\(\)/);
  assert.match(startOver, /profileMessagesEl\.innerHTML = ""/);
  assert.doesNotMatch(startOver, /paperHistory|paperMessagesEl/);
});


test("Paper Question and Profile Sessions persist under distinct tab-scoped storage keys", () => {
  assert.match(source, /STORAGE_PREFIX \+ "paper-history"/);
  assert.match(source, /STORAGE_PREFIX \+ "paper-messages"/);
  assert.match(source, /STORAGE_PREFIX \+ "profile-messages"/);
});


test("the Assistant Shell storage prefix is version-boundaried from the pre-shell chatbot", () => {
  assert.match(source, /STORAGE_PREFIX = "aligatehr-chatbot-shell-v1-"/);
});


test("the composer is not part of the Research Task Menu and is gated by the active task", () => {
  const showTask = extractFunctionSource("showTask");
  assert.match(showTask, /menuEl\.hidden = task !== null/);
  assert.match(showTask, /updateComposerVisibility\(\)/);
  const updateComposerVisibility = extractFunctionSource("updateComposerVisibility");
  assert.match(
    updateComposerVisibility,
    /activeTask === "paper" ||\s*\n\s*\(activeTask === "profile" && profileSession\.getState\(\)\.phase === "draft"\)/,
  );
});


test("Research Task cards are semantic, focusable buttons rather than decorative elements", () => {
  assert.match(source, /createEl\("button", "chatbot-task-card", \{/);
});

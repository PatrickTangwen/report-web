const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");


const source = fs.readFileSync(path.join(__dirname, "chatbot.js"), "utf8");
const styles = fs.readFileSync(path.join(__dirname, "chatbot.css"), "utf8");


test("every public chatbot API request uses the bounded JSON request helper", () => {
  assert.equal(source.includes("fetch(API_URL"), false);
  assert.match(source, /DEMO\.requestJson\([\s\S]*API_URL \+ "\/paper\/question"/);
  assert.match(source, /DEMO\.requestJson\([\s\S]*API_URL \+ "\/profile\/extract"/);
  assert.match(source, /DEMO\.requestJson\([\s\S]*API_URL \+ "\/profile\/validate"/);
  assert.match(source, /DEMO\.requestJson\([\s\S]*API_URL \+ "\/profile\/confirm"/);
});


test("Understand the Research uses the explicit paper-only backend contract, not generic /chat", () => {
  assert.doesNotMatch(source, /API_URL \+ "\/chat"/);
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


test("Explore Visualizations shows exactly the three Visualization Destination cards", () => {
  assert.match(source, /label: "Performance"/);
  assert.match(source, /label: "Ablation"/);
  assert.match(source, /label: "Use Case"/);
  const destinationIds = source.match(/id: "(performance|ablation|use-case)"/g) || [];
  assert.equal(destinationIds.length, 3);
});


test("selecting a Visualization Destination collapses the Assistant", () => {
  assert.match(source, /"data-chatbot-action"\s*:\s*"open-visualization-destination"/);
  const openDestination = extractFunctionSource("openVisualizationDestination");
  assert.match(openDestination, /closeAssistant\(\)/);
});


test("the Assistant no longer exposes ICD prompt actions or a Preset Walkthrough card", () => {
  assert.doesNotMatch(source, /"data-chatbot-action"\s*:\s*"view-icd-keyword"/);
  assert.doesNotMatch(source, /"data-chatbot-action"\s*:\s*"preset-embedding-demo"/);
  assert.doesNotMatch(source, /function renderIcdKeywordMatches/);
  assert.doesNotMatch(source, /function startPresetDemo/);
  assert.doesNotMatch(source, /function renderPresetDemoCard/);
});


test("Understand the Research shows visible scope copy that answers come from the paper", () => {
  assert.match(source, /Paper Question/);
  assert.match(source, /chatbot-scope-copy/);
  assert.match(source, /Answers are limited to the ALIGATEHR-Gen paper\./);
});


test("reviewed example questions fill the composer but never submit automatically", () => {
  assert.match(source, /var PAPER_EXAMPLE_QUESTIONS = \[/);
  assert.match(source, /"data-chatbot-action"\s*:\s*"fill-paper-question"/);
  assert.match(source, /if \(action === "fill-paper-question"\) fillPaperQuestion\(button\)/);
  const fillPaperQuestion = extractFunctionSource("fillPaperQuestion");
  assert.match(fillPaperQuestion, /input\.value = button\.getAttribute\("data-question"\)/);
  assert.doesNotMatch(fillPaperQuestion, /send\(\)/);
});


test("a paper answer offers reviewed related-question suggestions from the same bank", () => {
  const send = extractFunctionSource("send");
  assert.match(send, /renderQuestionChips\(paperMessagesEl, "Related Questions", pickRelatedQuestions\(justAsked\)\)/);
  const pickRelatedQuestions = extractFunctionSource("pickRelatedQuestions");
  assert.match(pickRelatedQuestions, /PAPER_EXAMPLE_QUESTIONS/);
});


test("a slow paper answer shows friendly preparing copy instead of HTTP status text", () => {
  assert.match(source, /Preparing the research assistant/);
  assert.doesNotMatch(source, /502|503|Bad Gateway|Service Unavailable/);
});


test("Build a Demo Profile shows the full Research Use Notice before any target or field entry", () => {
  const renderTargetSelection = extractFunctionSource("renderTargetSelection");
  assert.match(renderTargetSelection, /Research Use Notice/);
  assert.match(renderTargetSelection, /synthetic or sufficiently de-identified/);
  assert.match(renderTargetSelection, /COMPARISON_TARGETS\.forEach/);
});


test("exactly the seven approved Comparison Targets are offered, and none is ever auto-selected", () => {
  const comparisonTargetsBlock = source.match(/var COMPARISON_TARGETS = \[[\s\S]*?\n  \];/)[0];
  const targetEntries = comparisonTargetsBlock.match(/^\s*\[".+?", ".+?"\],?$/gm) || [];
  assert.equal(targetEntries.length, 7);

  const selectTargetCalls = source.match(/\.selectTarget\(/g) || [];
  assert.equal(selectTargetCalls.length, 1, "profileSession.selectTarget must have exactly one call site");
  const selectProfileTarget = extractFunctionSource("selectProfileTarget");
  assert.match(selectProfileTarget, /var target = button\.getAttribute\("data-target"\)/);
  assert.match(selectProfileTarget, /profileSession\.selectTarget\(target\)/);
});


test("target selection is described as a research cohort choice, never a diagnosis", () => {
  const renderTargetSelection = extractFunctionSource("renderTargetSelection");
  assert.match(renderTargetSelection, /research cohort/);
  const renderTargetConfirmedCard = extractFunctionSource("renderTargetConfirmedCard");
  assert.match(renderTargetConfirmedCard, /research cohort choice, not a diagnosis/);
});


test("after target selection the visitor can build a profile or load the reviewed Synthetic Example Profile", () => {
  assert.match(source, /"data-chatbot-action"\s*:\s*"load-synthetic-example"/);
  assert.match(source, /if \(action === "load-synthetic-example"\) loadSyntheticExample\(button\)/);
  const loadSyntheticExample = extractFunctionSource("loadSyntheticExample");
  assert.match(loadSyntheticExample, /API_URL \+ "\/profile\/synthetic-example\/"/);
  assert.match(loadSyntheticExample, /profileSession\.start\("example"\)/);
});


test("loading a Synthetic Example Profile never confirms the draft or starts comparison", () => {
  const loadSyntheticExample = extractFunctionSource("loadSyntheticExample");
  assert.doesNotMatch(loadSyntheticExample, /confirmDemoProfile|compareConfirmedProfile|\/profile\/confirm|\/profile\/match/);
});


test("a loaded Synthetic Example Profile is visibly labeled as reviewed and remains editable", () => {
  const renderProfileDraft = extractFunctionSource("renderProfileDraft");
  assert.match(renderProfileDraft, /Synthetic Example Profile — review required/);
  assert.match(renderProfileDraft, /Reviewed example — editable, not a real patient/);
});


test("the confirmed profile compares against the pre-chosen target with no target picker at review", () => {
  assert.doesNotMatch(source, /chatbot-profile-target"/);
  const renderConfirmedProfile = extractFunctionSource("renderConfirmedProfile");
  assert.match(renderConfirmedProfile, /targetLabel\(profileSession\.getState\(\)\.target\)/);
  const compareConfirmedProfile = extractFunctionSource("compareConfirmedProfile");
  assert.match(compareConfirmedProfile, /target: state\.target/);
});


test("Start Over returns all the way to target selection, not a target-less starter", () => {
  const startOverDemoProfile = extractFunctionSource("startOverDemoProfile");
  assert.match(startOverDemoProfile, /renderTargetSelection\(\)/);
});

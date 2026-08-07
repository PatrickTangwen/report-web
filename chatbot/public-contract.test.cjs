const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");


const source = fs.readFileSync(path.join(__dirname, "chatbot.js"), "utf8");
const styles = fs.readFileSync(path.join(__dirname, "chatbot.css"), "utf8");


test("every public chatbot API request uses the bounded JSON request helper", () => {
  assert.equal(source.includes("fetch(API_URL"), false);
  assert.match(source, /DEMO\.requestJson\([\s\S]*API_URL \+ "\/paper\/question"/);
  assert.match(source, /DEMO\.requestJson\([\s\S]*API_URL \+ "\/profile\/validate"/);
  assert.match(source, /DEMO\.requestJson\([\s\S]*API_URL \+ "\/profile\/coverage"/);
  assert.match(source, /DEMO\.requestJson\([\s\S]*API_URL \+ "\/profile\/confirm"/);
  assert.match(source, /DEMO\.requestJson\([\s\S]*API_URL \+ "\/profile\/match"/);
});


test("the public UI never calls free-text Feature Candidate extraction — the wizard replaced it", () => {
  assert.doesNotMatch(source, /profile\/extract/);
  assert.doesNotMatch(source, /function sendProfileMessage/);
});


test("Understand the Research uses the explicit paper-only backend contract, not generic /chat", () => {
  assert.doesNotMatch(source, /API_URL \+ "\/chat"/);
});


test("a failed ordinary chat exposes an explicit retry action", () => {
  assert.match(source, /"data-chatbot-action"\s*:\s*"retry-chat"/);
  assert.match(source, /if \(action === "retry-chat"\) retryChat\(button\)/);
});


test("backend preparation starts only after a backend-backed task is selected", () => {
  const selectTask = extractFunctionSource("selectTask");
  assert.match(selectTask, /isBackendBackedTask\(task\)/);
  assert.match(selectTask, /prepareBackend\(\)/);
  const isBackendBackedTask = extractFunctionSource("isBackendBackedTask");
  assert.match(isBackendBackedTask, /task === "paper" \|\| task === "profile"/);
  const fabClick = source.match(/fab\.addEventListener\("click", function \(\) \{[\s\S]*?\n  \}\);/)[0];
  assert.doesNotMatch(fabClick, /prepareBackend/);
});


test("backend preparation uses health without blocking locally rendered profile editing", () => {
  const prepareBackend = extractFunctionSource("prepareBackend");
  assert.match(prepareBackend, /API_URL \+ "\/health"/);
  assert.match(prepareBackend, /60000/);
  assert.doesNotMatch(prepareBackend, /disabled|profileSession|renderProfileWizard/);
  assert.match(source, /You can continue locally while the service wakes/);
});


test("service recovery offers Retry, Continue editing, and Back to tasks without raw HTTP copy", () => {
  const renderBackendPreparation = extractFunctionSource("renderBackendPreparation");
  assert.match(renderBackendPreparation, /"retry-service", "Retry"/);
  assert.match(renderBackendPreparation, /"continue-editing", "Continue editing"/);
  assert.match(renderBackendPreparation, /"back-to-tasks", "Back to tasks"/);
  assert.doesNotMatch(source, /502|503|Bad Gateway|Service Unavailable/);
  const showTask = extractFunctionSource("showTask");
  assert.match(showTask, /renderBackendPreparation\(\)/);
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


test("mobile uses the dynamic visual viewport, full-screen single-column shell, and safe areas", () => {
  assert.match(source, /window\.visualViewport/);
  assert.match(source, /--chatbot-viewport-height/);
  assert.match(styles, /@media \(max-width: 700px\)[\s\S]*height: var\(--chatbot-viewport-height, 100dvh\)/);
  assert.match(styles, /\.chatbot-input-row[\s\S]*env\(safe-area-inset-bottom\)/);
  assert.match(styles, /\.chatbot-wizard-nav[\s\S]*position: sticky[\s\S]*bottom: 0[\s\S]*env\(safe-area-inset-bottom\)/);
  assert.doesNotMatch(styles, /\.chatbot-wizard-nav[\s\S]*bottom:\s*calc\(-/);
  assert.match(styles, /overflow-wrap: anywhere/);
});


test("closing the Assistant unlocks the page and restores its exact scroll position", () => {
  const closeAssistant = extractFunctionSource("closeAssistant");
  const lockPageScroll = extractFunctionSource("lockPageScroll");
  const unlockPageScroll = extractFunctionSource("unlockPageScroll");
  assert.match(closeAssistant, /unlockPageScroll\(\)/);
  assert.match(lockPageScroll, /matchMedia\("\(max-width: 700px\)"\)\.matches/);
  assert.match(lockPageScroll, /lockedPageScrollY = window\.scrollY/);
  assert.match(unlockPageScroll, /window\.scrollTo\(\{ top: restoreY, behavior: "auto" \}\)/);
});


test("Continue editing returns focus to the first real profile control", () => {
  const continueEditing = extractFunctionSource("continueEditing");
  assert.match(continueEditing, /button:not\(\[disabled\]\), input:not\(\[disabled\]\), select:not\(\[disabled\]\)/);
  assert.match(continueEditing, /editable\.focus\(\{ preventScroll: true \}\)/);
  assert.doesNotMatch(continueEditing, /profileMessagesEl\.focus/);
});


test("light and dark themes style the same service and wizard-safe-area surfaces", () => {
  assert.match(styles, /\.quarto-dark \.chatbot-service-status/);
  assert.match(styles, /\.quarto-dark \.chatbot-wizard-nav/);
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


test("the composer exists only in Paper Question Mode; Build a Demo Profile never shows one", () => {
  const showTask = extractFunctionSource("showTask");
  assert.match(showTask, /menuEl\.hidden = task !== null/);
  assert.match(showTask, /updateComposerVisibility\(\)/);
  const updateComposerVisibility = extractFunctionSource("updateComposerVisibility");
  assert.match(updateComposerVisibility, /inputRow\.hidden = activeTask !== "paper"/);
});


test("an active Profile Draft widens the Assistant Shell into the wizard layout", () => {
  const updateComposerVisibility = extractFunctionSource("updateComposerVisibility");
  assert.match(
    updateComposerVisibility,
    /"is-wizard",\s*\n\s*activeTask === "profile" && profileSession\.getState\(\)\.phase === "draft"/,
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
  const finishPaperAnswer = extractFunctionSource("finishPaperAnswer");
  assert.match(finishPaperAnswer, /renderQuestionChips\(paperMessagesEl, "Related Questions", pickRelatedQuestions\(justAsked\)\)/);
  const streaming = extractFunctionSource("sendViaStream");
  const nonStreaming = extractFunctionSource("sendNonStreaming");
  assert.match(streaming, /finishPaperAnswer\(reply, justAsked\)/);
  assert.match(nonStreaming, /finishPaperAnswer\(reply, justAsked\)/);
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
  assert.match(loadSyntheticExample, /profileSession\.start\("example"/);
});


test("a Synthetic Example Profile populates the same wizard state manual entry uses", () => {
  const loadSyntheticExample = extractFunctionSource("loadSyntheticExample");
  assert.match(loadSyntheticExample, /WIZARD\.entriesFromCandidates\(example\.candidates/);
  assert.match(loadSyntheticExample, /renderProfileWizard\(\)/);
});


test("loading a Synthetic Example Profile never confirms the draft or starts comparison", () => {
  const loadSyntheticExample = extractFunctionSource("loadSyntheticExample");
  assert.doesNotMatch(loadSyntheticExample, /confirmDemoProfile|compareConfirmedProfile|\/profile\/confirm|\/profile\/match/);
});


test("a loaded Synthetic Example Profile is visibly labeled as reviewed and remains editable", () => {
  const renderProfileDraft = extractFunctionSource("renderProfileDraft");
  assert.match(renderProfileDraft, /Reviewed example — editable, not a real patient/);
  const renderProfileWizard = extractFunctionSource("renderProfileWizard");
  assert.match(renderProfileWizard, /Synthetic Example Profile loaded — reviewed, editable/);
});


test("comparison uses the pre-chosen target with no target picker at review", () => {
  assert.doesNotMatch(source, /chatbot-profile-target"/);
  const renderProfileDraft = extractFunctionSource("renderProfileDraft");
  assert.match(renderProfileDraft, /targetLabel\(profileSession\.getState\(\)\.target\)/);
  const runComparison = extractFunctionSource("runComparison");
  assert.match(runComparison, /target: state\.target/);
});


test("Start Over returns all the way to target selection, not a target-less starter", () => {
  const startOverDemoProfile = extractFunctionSource("startOverDemoProfile");
  assert.match(startOverDemoProfile, /renderTargetSelection\(\)/);
});


test("Build Demo Profile opens the staged wizard, never a free-text prompt", () => {
  const startDemoProfile = extractFunctionSource("startDemoProfile");
  assert.match(startDemoProfile, /profileSession\.start\("manual"/);
  assert.match(startDemoProfile, /renderProfileWizard\(\)/);
  assert.doesNotMatch(startDemoProfile, /input\.focus/);
  assert.doesNotMatch(source, /Describe your profile in your own words/);
});


test("the wizard renders the reviewed stages from the shared wizard module", () => {
  const renderProfileWizard = extractFunctionSource("renderProfileWizard");
  assert.match(renderProfileWizard, /WIZARD\.STAGES\.forEach/);
  assert.match(renderProfileWizard, /"data-chatbot-action":\s*"wizard-back"/);
  assert.match(renderProfileWizard, /"data-chatbot-action":\s*"wizard-continue"/);
});


test("an active Profile Draft is restored into a live wizard, not stale persisted markup", () => {
  const initProfileView = extractFunctionSource("initProfileView");
  assert.match(initProfileView, /phase === "draft"/);
  assert.match(initProfileView, /renderProfileWizard\(\)/);
});


test("validation runs on field exit and on step continuation", () => {
  assert.match(
    source,
    /addEventListener\("focusout",[\s\S]*?refreshWizardFieldRow\(field, row\)/,
  );
  const wizardContinue = extractFunctionSource("wizardContinue");
  assert.match(wizardContinue, /WIZARD\.validateStage\(/);
  assert.match(wizardContinue, /validation\.blocked/);
});


test("changing a unit converts through the shared module, preserving the original for review", () => {
  assert.match(source, /WIZARD\.convertEntry\(/);
  assert.match(source, /Original value preserved for review: /);
});


test("the Review stage validates through the deterministic backend contract", () => {
  const runReviewValidation = extractFunctionSource("runReviewValidation");
  assert.match(runReviewValidation, /WIZARD\.buildCandidates\(wizard\.entries\)/);
  assert.match(runReviewValidation, /API_URL \+ "\/profile\/validate"/);
  assert.match(runReviewValidation, /"data-chatbot-action":\s*"wizard-retry-validate"/);
});


test("review rows expose actionable edit and removal controls for entered fields", () => {
  const renderProfileDraft = extractFunctionSource("renderProfileDraft");
  assert.match(renderProfileDraft, /"data-chatbot-action":\s*"wizard-goto-stage"/);
  assert.match(renderProfileDraft, /"data-chatbot-action":\s*"wizard-remove-review-field"/);
  assert.match(renderProfileDraft, /Reported Features/);
  assert.match(renderProfileDraft, /Derived Match Features/);
});


test("validation copy never labels values normal, abnormal, healthy, or unhealthy", () => {
  assert.doesNotMatch(source, /\b(abnormal|unhealthy)\b/i);
  assert.doesNotMatch(source, /\b(normal|healthy)\b(?! neighborhood)/i);
});


test("the Review stage checks target-aware coverage alongside deterministic validation", () => {
  const runReviewValidation = extractFunctionSource("runReviewValidation");
  assert.match(runReviewValidation, /API_URL \+ "\/profile\/validate"/);
  assert.match(runReviewValidation, /API_URL \+ "\/profile\/coverage"/);
  assert.match(runReviewValidation, /Promise\.all\(/);
  assert.match(runReviewValidation, /renderProfileDraft\(draft, results\[1\]\.profile_coverage, holder\)/);
});


test("Coverage Guidance is domain-based and never shows a percentage, confidence, or accuracy", () => {
  const renderCoverageGuidance = extractFunctionSource("renderCoverageGuidance");
  assert.match(renderCoverageGuidance, /WIZARD\.COVERAGE_DOMAINS\.forEach/);
  assert.match(renderCoverageGuidance, /Profile Coverage/);
  assert.doesNotMatch(renderCoverageGuidance, /percent|%|confidence|accuracy|score/i);
});


test("Add this information actions navigate to the domain's wizard stage", () => {
  const renderCoverageGuidance = extractFunctionSource("renderCoverageGuidance");
  assert.match(renderCoverageGuidance, /Add this information/);
  assert.match(renderCoverageGuidance, /"data-chatbot-action":\s*"wizard-goto-stage"/);
  assert.match(renderCoverageGuidance, /"data-stage":\s*domain\.stage/);
});


test("comparison is gated on both no blocking values and target-specific eligibility", () => {
  const renderProfileDraft = extractFunctionSource("renderProfileDraft");
  assert.match(renderProfileDraft, /var eligible = !!\(coverage && coverage\.eligible\)/);
  assert.match(renderProfileDraft, /confirmButton\.disabled = !\(canConfirm && eligible\)/);
});


test("Confirm and compare with reference cohort is the only confirmation action and has no checkbox", () => {
  assert.match(source, /Confirm and compare with reference cohort/);
  assert.doesNotMatch(source, /"data-chatbot-action":\s*"confirm-demo-profile"/);
  assert.doesNotMatch(source, /"data-chatbot-action":\s*"compare-confirmed-profile"/);
  assert.doesNotMatch(source, /type:\s*"checkbox"/);
  const confirmActions = source.match(/"data-chatbot-action":\s*"confirm-and-compare"/g) || [];
  assert.ok(confirmActions.length >= 1);
});


test("the single action confirms then compares, and reaching eligibility never auto-starts it", () => {
  const confirmAndCompareProfile = extractFunctionSource("confirmAndCompareProfile");
  assert.match(confirmAndCompareProfile, /API_URL \+ "\/profile\/confirm"/);
  assert.match(confirmAndCompareProfile, /runComparison\(\)/);
  // Comparison only starts from the explicit action, never from render paths.
  const renderProfileDraft = extractFunctionSource("renderProfileDraft");
  assert.doesNotMatch(renderProfileDraft, /runComparison\(\)/);
});


test("a recoverable comparison failure offers Retry, Continue editing, and Back to tasks", () => {
  const renderComparisonFailure = extractFunctionSource("renderComparisonFailure");
  assert.match(renderComparisonFailure, /outcomeActionButton\("confirm-and-compare", "Retry comparison"/);
  assert.match(renderComparisonFailure, /outcomeActionButton\("wizard-reopen-editing", "Continue editing"/);
  assert.match(renderComparisonFailure, /outcomeActionButton\("back-to-tasks", "Back to tasks"/);
});


test("returning from Review to edit preserves valid wizard state", () => {
  const reopenWizardForEditing = extractFunctionSource("reopenWizardForEditing");
  assert.match(reopenWizardForEditing, /profileSession\.reopenForEditing\(\)/);
  assert.match(reopenWizardForEditing, /renderProfileWizard\(\)/);
  assert.doesNotMatch(reopenWizardForEditing, /entries = \{\}|reset\(\)/);
});


test("the comparison result routes matched to handoff and every other outcome into the wizard", () => {
  const handleComparisonResult = extractFunctionSource("handleComparisonResult");
  assert.match(handleComparisonResult, /status === "matched_reference_neighborhood"/);
  assert.match(handleComparisonResult, /handoffMatchedResult\(result\)/);
  assert.match(handleComparisonResult, /renderNoStableNeighborhood\(result\)/);
  const runComparison = extractFunctionSource("runComparison");
  assert.match(runComparison, /handleComparisonResult\(result\)/);
});


test("an insufficient-coverage match result is not mislabeled as No Stable Neighborhood", () => {
  const handleComparisonResult = extractFunctionSource("handleComparisonResult");
  assert.match(handleComparisonResult, /status === "no_stable_neighborhood"/);
  assert.match(handleComparisonResult, /renderCoverageShortfall\(result\)/);
  const renderCoverageShortfall = extractFunctionSource("renderCoverageShortfall");
  assert.match(renderCoverageShortfall, /Coverage no longer sufficient/);
  assert.doesNotMatch(renderCoverageShortfall, /no stable neighborhood/i);
  assert.doesNotMatch(renderCoverageShortfall, /risk|confidence|similarity|accuracy|%/i);
});


test("a matched result auto-creates the Visualization Request and collapses the Assistant to the menu", () => {
  const handoffMatchedResult = extractFunctionSource("handoffMatchedResult");
  assert.match(handoffMatchedResult, /DEMO\.createMatchedRequest\(result\)/);
  assert.match(handoffMatchedResult, /DEMO\.saveRequest\(sessionStorage, request\)/);
  assert.match(handoffMatchedResult, /DEMO\.notifyRequest\(window, request\)/);
  assert.match(handoffMatchedResult, /closeAssistant\(\)/);
  assert.match(handoffMatchedResult, /shellSession\.backToTasks\(\)/);
  assert.match(handoffMatchedResult, /findUseCaseUrl\(\)/);
});


test("the matched handoff is automatic — no manual View matched references button remains", () => {
  assert.doesNotMatch(source, /"data-chatbot-action":\s*"view-matched-references"/);
  assert.doesNotMatch(source, /View matched reference patients/);
  assert.doesNotMatch(source, /function viewMatchedReferences/);
  assert.doesNotMatch(source, /function renderCohortComparison/);
});


test("a No Stable Neighborhood stays in the wizard with the three agreed actions and no Visualization Request", () => {
  const renderNoStableNeighborhood = extractFunctionSource("renderNoStableNeighborhood");
  assert.match(renderNoStableNeighborhood, /No stable neighborhood/);
  assert.match(renderNoStableNeighborhood, /renderWizardOutcomeCard\(/);
  assert.doesNotMatch(renderNoStableNeighborhood, /createMatchedRequest|saveRequest|notifyRequest|findUseCaseUrl/);
  // The shared in-wizard outcome card carries the three agreed actions.
  const renderWizardOutcomeCard = extractFunctionSource("renderWizardOutcomeCard");
  assert.match(renderWizardOutcomeCard, /outcomeActionButton\("wizard-reopen-editing", "Edit Demo Profile"/);
  assert.match(renderWizardOutcomeCard, /outcomeActionButton\("start-over-demo-profile", "Start a new comparison"/);
  assert.match(renderWizardOutcomeCard, /outcomeActionButton\("back-to-tasks", "Back to tasks"/);
});


test("reopening after a matched transition offers an edit-or-restart Profile action", () => {
  const renderComparisonComplete = extractFunctionSource("renderComparisonComplete");
  assert.match(renderComparisonComplete, /Comparison complete/);
  assert.match(renderComparisonComplete, /outcomeActionButton\("wizard-reopen-editing", "Edit Demo Profile"/);
  assert.match(renderComparisonComplete, /outcomeActionButton\("start-over-demo-profile", "Start a new comparison"/);
});


test("no risk, confidence, similarity percentage, or full profile-coverage panel is shown with the outcome", () => {
  const renderComparisonComplete = extractFunctionSource("renderComparisonComplete");
  const renderNoStableNeighborhood = extractFunctionSource("renderNoStableNeighborhood");
  [renderComparisonComplete, renderNoStableNeighborhood].forEach((fn) => {
    assert.doesNotMatch(fn, /risk|confidence|similarity|accuracy|%/i);
  });
});

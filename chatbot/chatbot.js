(function () {
  "use strict";

  var DEMO = window.ALIGATEHR_EMBEDDING_DEMO;
  var PROFILE = window.ALIGATEHR_PROFILE_SESSION;
  var SHELL = window.ALIGATEHR_ASSISTANT_SHELL;
  var WIZARD = window.ALIGATEHR_PROFILE_WIZARD;
  var API_URL = DEMO.resolveApiUrl(window.location, window.ALIGATEHR_API_URL);
  var STORAGE_PREFIX = "aligatehr-chatbot-shell-v1-";
  var profileSession = PROFILE.create(sessionStorage);
  var shellSession = SHELL.create(sessionStorage);
  var profileMatchController = DEMO.createRequestController();
  var COMPARISON_TARGETS = [
    ["CKD", "Chronic Kidney Disease"],
    ["Cardiac_Fibrosis", "Cardiac Fibrosis"],
    ["MASH", "MASH"],
    ["Pulmonary_fibrosis", "Pulmonary Fibrosis"],
    ["SSc_Connective_Tissue", "Systemic Sclerosis / Connective Tissue"],
    ["Crohns_Disease", "Crohn's Disease"],
    ["Fibrosis_of_Skin", "Skin Fibrosis"],
  ];

  // Research Task Menu — the explicit contract between a visitor's selected
  // goal and the view the Assistant Shell shows. See docs/adr/0010 and 0011.
  var TASKS = [
    {
      id: "paper",
      label: "Understand the Research",
      description: "Ask questions about the paper's methodology, results, and clinical implications.",
    },
    {
      id: "visualizations",
      label: "Explore Visualizations",
      description: "Choose Performance, Ablation, or Use Case to open the destination that matches what you want to learn.",
    },
    {
      id: "profile",
      label: "Build a Demo Profile",
      description: "Build an editable synthetic or de-identified profile and compare it with the reference cohort.",
    },
  ];

  // Visualization Destinations — the three full-page research experiences
  // Explore Visualizations can open. Chart interaction stays page-owned.
  var VISUALIZATION_DESTINATIONS = [
    {
      id: "performance",
      label: "Performance",
      description: "See ICD code embeddings alongside evaluation metrics across diseases.",
      path: "/viz/overall-performance.html",
    },
    {
      id: "ablation",
      label: "Ablation",
      description: "See how each model component contributes to overall performance.",
      path: "/viz/ablation.html",
    },
    {
      id: "use-case",
      label: "Use Case",
      description: "See a fibrotic disease case study with patient embeddings and pathway enrichment.",
      path: "/viz/use-case.html",
    },
  ];

  // Reviewed Research Questions for Paper Question Mode — shown as example
  // questions on entry and drawn from again as related-question suggestions.
  var PAPER_EXAMPLE_QUESTIONS = [
    "What does ALIGATEHR-Gen stand for?",
    "How does the model use genetically inferred family relationships?",
    "How many diseases were evaluated, and what was the average AUC improvement?",
    "What are the main limitations of this study?",
  ];

  var BACKEND_STATES = {
    IDLE: "idle",
    PREPARING: "preparing",
    READY: "ready",
    UNAVAILABLE: "unavailable",
  };

  var ICON_EXPAND = '<svg viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>';
  var ICON_COLLAPSE = '<svg viewBox="0 0 24 24"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>';
  var ICON_BACK = '<svg viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>';

  var paperHistory = [];
  var busy = false;
  var backendPreparation = { state: BACKEND_STATES.IDLE, promise: null };
  var lockedPageScrollY = null;

  // ── Build DOM ──

  function createEl(tag, cls, attrs) {
    var el = document.createElement(tag);
    if (cls) el.className = cls;
    if (attrs) {
      for (var k in attrs) el.setAttribute(k, attrs[k]);
    }
    return el;
  }

  // FAB
  var fab = createEl("button", "chatbot-fab", {
    "aria-label": "Open the Guided Research Assistant",
    title: "Guided Research Assistant",
  });
  fab.innerHTML =
    '<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.2L4 17.2V4h16v12z"/><path d="M7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"/></svg>';

  // Panel
  var panel = createEl("div", "chatbot-panel");

  // Header
  var header = createEl("div", "chatbot-header");
  var headerLeft = createEl("div", "chatbot-header-left");
  var backBtn = createEl("button", "chatbot-back-btn", {
    type: "button",
    "aria-label": "Back to tasks",
    "data-chatbot-action": "back-to-tasks",
  });
  backBtn.innerHTML = ICON_BACK + "<span>Back to tasks</span>";
  var headerTitle = createEl("span", "chatbot-header-title");
  headerTitle.textContent = "Guided Research Assistant";
  headerLeft.append(backBtn, headerTitle);
  var headerActions = createEl("div", "chatbot-header-actions");
  var expandBtn = createEl("button", "chatbot-expand-btn", { "aria-label": "Expand assistant panel" });
  expandBtn.innerHTML = ICON_EXPAND;
  var closeBtn = createEl("button", "chatbot-close", { "aria-label": "Close the Guided Research Assistant" });
  closeBtn.innerHTML = "&times;";
  headerActions.append(expandBtn, closeBtn);
  header.append(headerLeft, headerActions);

  // One shell-level service state keeps cold-start copy and recovery actions
  // consistent across the two backend-backed Research Tasks. It is deliberately
  // absent from the task menu and Explore Visualizations.
  var serviceStatusEl = createEl("div", "chatbot-service-status", {
    "aria-live": "polite",
  });
  serviceStatusEl.hidden = true;

  // Body — the Research Task Menu plus one view per Research Task. Exactly
  // one of these four is visible at a time (see showTask()).
  var body = createEl("div", "chatbot-body");

  var menuEl = createEl("div", "chatbot-task-menu");
  var menuIntro = createEl("p", "chatbot-task-menu-intro");
  menuIntro.textContent = "Choose a research task to get started.";
  menuEl.appendChild(menuIntro);
  TASKS.forEach(function (task) {
    var card = createEl("button", "chatbot-task-card", {
      type: "button",
      "data-chatbot-action": "select-task",
      "data-task": task.id,
    });
    var cardLabel = createEl("span", "chatbot-task-card-label");
    cardLabel.textContent = task.label;
    var cardDescription = createEl("span", "chatbot-task-card-description");
    cardDescription.textContent = task.description;
    card.append(cardLabel, cardDescription);
    menuEl.appendChild(card);
  });

  var paperView = createEl("div", "chatbot-task-view");
  var paperMessagesEl = createEl("div", "chatbot-messages");
  var paperToolbar = createEl("div", "chatbot-view-toolbar");
  var paperScopeCopy = createEl("span", "chatbot-scope-copy");
  paperScopeCopy.textContent = "Answers are limited to the ALIGATEHR-Gen paper.";
  var clearPaperBtn = createEl("button", "chatbot-clear-btn", {
    type: "button",
    "data-chatbot-action": "clear-paper-conversation",
  });
  clearPaperBtn.textContent = "Clear conversation";
  paperToolbar.append(paperScopeCopy, clearPaperBtn);
  paperView.append(paperMessagesEl, paperToolbar);

  var visualizationsView = createEl("div", "chatbot-messages chatbot-visualizations-view");

  var profileView = createEl("div", "chatbot-task-view");
  var profileMessagesEl = createEl("div", "chatbot-messages");
  profileView.appendChild(profileMessagesEl);

  [menuEl, paperView, visualizationsView, profileView].forEach(function (view) {
    view.hidden = true;
  });
  body.append(menuEl, paperView, visualizationsView, profileView);

  // Input row (shared composer — visible only for Understand the Research
  // and, while a Profile Draft is active, Build a Demo Profile)
  var inputRow = createEl("div", "chatbot-input-row");
  var input = createEl("textarea", "chatbot-input", {
    rows: "1",
  });
  var sendBtn = createEl("button", "chatbot-send", { "aria-label": "Send" });
  sendBtn.innerHTML =
    '<svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>';
  inputRow.appendChild(input);
  inputRow.appendChild(sendBtn);

  // Disclaimer
  var disclaimer = createEl("div", "chatbot-disclaimer");
  disclaimer.textContent =
    "Research prototype — not medical advice. Powered by DeepSeek.";

  // Assemble
  panel.append(header, serviceStatusEl, body, inputRow, disclaimer);

  document.body.appendChild(fab);
  document.body.appendChild(panel);

  // ── Task routing (Research Task Menu ⇄ Assistant Shell views) ──

  function updateComposerVisibility() {
    var activeTask = shellSession.getState().activeTask;
    // Free-form input exists only for Paper Question Mode. Build a Demo
    // Profile is a staged wizard with reviewed controls, never a composer,
    // and while a Profile Draft is active the shell widens into the wizard.
    inputRow.hidden = activeTask !== "paper";
    panel.classList.toggle(
      "is-wizard",
      activeTask === "profile" && profileSession.getState().phase === "draft",
    );
  }

  function showTask(task) {
    menuEl.hidden = task !== null;
    paperView.hidden = task !== "paper";
    visualizationsView.hidden = task !== "visualizations";
    profileView.hidden = task !== "profile";
    backBtn.hidden = task === null;
    var current = TASKS.filter(function (t) { return t.id === task; })[0];
    headerTitle.textContent = current ? current.label : "Guided Research Assistant";
    updateComposerVisibility();
    renderBackendPreparation();
    if (task === "paper") paperMessagesEl.scrollTop = paperMessagesEl.scrollHeight;
    if (task === "profile") profileMessagesEl.scrollTop = profileMessagesEl.scrollHeight;
  }

  function selectTask(task) {
    shellSession.selectTask(task);
    showTask(task);
    if (task === "paper") initPaperView();
    if (task === "visualizations") initVisualizationsView();
    if (task === "profile") initProfileView();
    if (isBackendBackedTask(task)) prepareBackend();
    saveState();
    if (!inputRow.hidden) input.focus();
  }

  function backToTasks() {
    shellSession.backToTasks();
    showTask(null);
    saveState();
  }

  function isBackendBackedTask(task) {
    return task === "paper" || task === "profile";
  }

  function renderBackendPreparation() {
    var task = shellSession.getState().activeTask;
    var backendTask = isBackendBackedTask(task);
    serviceStatusEl.innerHTML = "";
    serviceStatusEl.hidden =
      !backendTask ||
      backendPreparation.state === BACKEND_STATES.IDLE ||
      backendPreparation.state === BACKEND_STATES.READY;
    if (serviceStatusEl.hidden) return;

    if (backendPreparation.state === BACKEND_STATES.PREPARING) {
      var preparing = createEl("p", "chatbot-service-copy");
      preparing.textContent =
        "Preparing the research assistant… You can continue locally while the service wakes.";
      serviceStatusEl.appendChild(preparing);
      return;
    }

    var copy = createEl("p", "chatbot-service-copy");
    copy.textContent =
      "The research service is not ready yet. Your work in this Assistant is unchanged.";
    var actions = createEl("div", "chatbot-service-actions");
    actions.appendChild(outcomeActionButton("retry-service", "Retry", "primary"));
    if (task === "profile") {
      actions.appendChild(
        outcomeActionButton("continue-editing", "Continue editing", "secondary"),
      );
    }
    actions.appendChild(outcomeActionButton("back-to-tasks", "Back to tasks", "link"));
    serviceStatusEl.append(copy, actions);
  }

  // Selecting a backend-backed task is the only proactive wake-up seam. The
  // Assistant opening and the task menu never contact the backend, and the
  // locally rendered Profile Wizard remains interactive during preparation.
  function prepareBackend(force) {
    if (
      !force &&
      (backendPreparation.state === BACKEND_STATES.PREPARING ||
        backendPreparation.state === BACKEND_STATES.READY)
    ) {
      renderBackendPreparation();
      return backendPreparation.promise;
    }
    backendPreparation.state = BACKEND_STATES.PREPARING;
    renderBackendPreparation();
    backendPreparation.promise = DEMO.requestJson(
      fetch,
      API_URL + "/health",
      { cache: "no-store" },
      60000,
    )
      .then(function () {
        backendPreparation.state = BACKEND_STATES.READY;
        renderBackendPreparation();
      })
      .catch(function () {
        backendPreparation.state = BACKEND_STATES.UNAVAILABLE;
        renderBackendPreparation();
      });
    return backendPreparation.promise;
  }

  function continueEditing() {
    serviceStatusEl.hidden = true;
    if (shellSession.getState().activeTask === "profile") {
      var editable = profileMessagesEl.querySelector(
        "button:not([disabled]), input:not([disabled]), select:not([disabled])",
      );
      if (editable) editable.focus({ preventScroll: true });
    }
  }

  // ── State persistence ──

  function syncMessageFormState(container) {
    container.querySelectorAll("input").forEach(function (field) {
      field.setAttribute("value", field.value);
    });
    container.querySelectorAll("select").forEach(function (field) {
      Array.from(field.options).forEach(function (option) {
        if (option.selected) option.setAttribute("selected", "selected");
        else option.removeAttribute("selected");
      });
    });
  }

  function saveState() {
    try {
      syncMessageFormState(paperMessagesEl);
      syncMessageFormState(profileMessagesEl);
      sessionStorage.setItem(STORAGE_PREFIX + "paper-history", JSON.stringify(paperHistory));
      sessionStorage.setItem(STORAGE_PREFIX + "paper-messages", paperMessagesEl.innerHTML);
      sessionStorage.setItem(STORAGE_PREFIX + "profile-messages", profileMessagesEl.innerHTML);
      sessionStorage.setItem(STORAGE_PREFIX + "expanded", panel.classList.contains("is-expanded") ? "1" : "");
      sessionStorage.setItem(STORAGE_PREFIX + "open", panel.classList.contains("is-open") ? "1" : "");
    } catch (e) { /* quota exceeded or private mode */ }
  }

  function restoreState() {
    try {
      var paperHtml = sessionStorage.getItem(STORAGE_PREFIX + "paper-messages");
      if (paperHtml) {
        paperMessagesEl.innerHTML = paperHtml;
        paperMessagesEl.querySelectorAll(".chatbot-typing").forEach(function (el) { el.remove(); });
      }
      var profileHtml = sessionStorage.getItem(STORAGE_PREFIX + "profile-messages");
      if (profileHtml) {
        profileMessagesEl.innerHTML = profileHtml;
        profileMessagesEl.querySelectorAll(".chatbot-typing").forEach(function (el) { el.remove(); });
      }
      var savedHistory = sessionStorage.getItem(STORAGE_PREFIX + "paper-history");
      if (savedHistory) {
        var parsed = JSON.parse(savedHistory);
        if (Array.isArray(parsed)) paperHistory = parsed;
      }
      if (sessionStorage.getItem(STORAGE_PREFIX + "expanded") === "1") {
        panel.classList.add("is-expanded");
        expandBtn.innerHTML = ICON_COLLAPSE;
        expandBtn.setAttribute("aria-label", "Collapse assistant panel");
      }
      if (sessionStorage.getItem(STORAGE_PREFIX + "open") === "1") {
        panel.classList.add("is-open");
        fab.style.display = "none";
      }
    } catch (e) { /* quota exceeded or private mode */ }
  }

  restoreState();
  var activeTaskOnLoad = shellSession.getState().activeTask;
  showTask(activeTaskOnLoad);
  if (activeTaskOnLoad === "paper") initPaperView();
  if (activeTaskOnLoad === "visualizations") initVisualizationsView();
  if (activeTaskOnLoad === "profile") initProfileView();
  if (isBackendBackedTask(activeTaskOnLoad)) prepareBackend();
  updateProfileInputState();

  // ── Events ──

  function closeAssistant() {
    panel.classList.remove("is-open");
    unlockPageScroll();
    fab.style.display = "";
    fab.setAttribute("aria-label", "Open the Guided Research Assistant");
    saveState();
  }

  function lockPageScroll() {
    if (!window.matchMedia("(max-width: 700px)").matches) return;
    if (lockedPageScrollY !== null) return;
    lockedPageScrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = -lockedPageScrollY + "px";
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.classList.add("chatbot-assistant-open");
  }

  function unlockPageScroll() {
    if (lockedPageScrollY === null) return;
    var restoreY = lockedPageScrollY;
    lockedPageScrollY = null;
    document.body.classList.remove("chatbot-assistant-open");
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    window.scrollTo({ top: restoreY, behavior: "auto" });
  }

  function syncAssistantViewport() {
    var viewport = window.visualViewport;
    var height = viewport ? viewport.height : window.innerHeight;
    var offsetTop = viewport ? viewport.offsetTop : 0;
    panel.style.setProperty("--chatbot-viewport-height", Math.round(height) + "px");
    panel.style.setProperty("--chatbot-viewport-top", Math.round(offsetTop) + "px");
  }

  syncAssistantViewport();
  window.addEventListener("resize", syncAssistantViewport);
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", syncAssistantViewport);
    window.visualViewport.addEventListener("scroll", syncAssistantViewport);
  }
  if (panel.classList.contains("is-open")) lockPageScroll();

  fab.addEventListener("click", function () {
    var opening = !panel.classList.contains("is-open");
    panel.classList.toggle("is-open");
    fab.setAttribute("aria-label", opening ? "Close the Guided Research Assistant" : "Open the Guided Research Assistant");
    if (opening) {
      lockPageScroll();
      fab.style.display = "none";
      updateComposerVisibility();
      if (!inputRow.hidden) input.focus();
      paperMessagesEl.scrollTop = paperMessagesEl.scrollHeight;
      profileMessagesEl.scrollTop = profileMessagesEl.scrollHeight;
    }
    saveState();
  });

  closeBtn.addEventListener("click", closeAssistant);

  expandBtn.addEventListener("click", function () {
    var expanding = !panel.classList.contains("is-expanded");
    panel.classList.toggle("is-expanded");
    expandBtn.innerHTML = expanding ? ICON_COLLAPSE : ICON_EXPAND;
    expandBtn.setAttribute("aria-label", expanding ? "Collapse assistant panel" : "Expand assistant panel");
    saveState();
  });

  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  });

  sendBtn.addEventListener("click", send);

  panel.addEventListener("click", function (event) {
    var button = event.target.closest("[data-chatbot-action]");
    if (!button) return;
    var action = button.getAttribute("data-chatbot-action");
    if (action === "select-task") selectTask(button.getAttribute("data-task"));
    if (action === "back-to-tasks") backToTasks();
    if (action === "clear-paper-conversation") clearPaperConversation();
    if (action === "fill-paper-question") fillPaperQuestion(button);
    if (action === "open-visualization-destination") openVisualizationDestination(button.getAttribute("data-destination"));
    if (action === "select-profile-target") selectProfileTarget(button);
    if (action === "start-demo-profile") startDemoProfile();
    if (action === "load-synthetic-example") loadSyntheticExample(button);
    if (action === "wizard-back") wizardBack();
    if (action === "wizard-continue") wizardContinue();
    if (action === "wizard-goto-stage") wizardGotoStage(button.getAttribute("data-stage"));
    if (action === "wizard-clear-field") wizardClearField(button.getAttribute("data-field"));
    if (action === "wizard-remove-review-field") wizardRemoveReviewField(button.getAttribute("data-field"));
    if (action === "wizard-retry-validate") runReviewValidation();
    if (action === "confirm-and-compare") confirmAndCompareProfile(button);
    if (action === "wizard-reopen-editing") reopenWizardForEditing();
    if (action === "start-over-demo-profile") startOverDemoProfile();
    if (action === "retry-chat") retryChat(button);
    if (action === "retry-service") prepareBackend(true);
    if (action === "continue-editing") continueEditing();
  });

  // Auto-resize textarea
  input.addEventListener("input", function () {
    this.style.height = "auto";
    this.style.overflowY = this.scrollHeight > 80 ? "auto" : "hidden";
    this.style.height = Math.min(this.scrollHeight, 80) + "px";
  });

  // ── Core logic ──

  function addMessage(container, role, text) {
    var msg = createEl("div", "chatbot-msg chatbot-msg-" + role);
    if (role === "assistant") {
      msg.innerHTML = renderMarkdown(text);
    } else {
      msg.textContent = text;
    }
    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;
    saveState();
    return msg;
  }

  function addRawElement(container, el) {
    container.appendChild(el);
    container.scrollTop = container.scrollHeight;
    saveState();
  }

  // ── Understand the Research (Paper Question Mode) ──

  function renderQuestionChips(container, heading, questions) {
    if (!questions.length) return;
    var wrap = createEl("div", "chatbot-msg chatbot-msg-assistant chatbot-question-chips");
    var label = createEl("div", "chatbot-demo-label");
    label.textContent = heading;
    wrap.appendChild(label);
    questions.forEach(function (question) {
      var chip = createEl("button", "chatbot-question-chip", {
        type: "button",
        "data-chatbot-action": "fill-paper-question",
        "data-question": question,
      });
      chip.textContent = question;
      wrap.appendChild(chip);
    });
    addRawElement(container, wrap);
  }

  function fillPaperQuestion(button) {
    input.value = button.getAttribute("data-question") || "";
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 80) + "px";
    input.focus();
  }

  function pickRelatedQuestions(justAskedText) {
    return PAPER_EXAMPLE_QUESTIONS.filter(function (question) {
      return question !== justAskedText;
    }).slice(0, 3);
  }

  function renderPaperWelcome() {
    addMessage(
      paperMessagesEl,
      "assistant",
      "Hello! I'm the ALIGATEHR-Gen Guided Research Assistant. This is Paper Question " +
        "Mode: every answer is limited to the ALIGATEHR-Gen paper's methodology, " +
        "results, and conclusions.",
    );
    renderQuestionChips(paperMessagesEl, "Example Questions", PAPER_EXAMPLE_QUESTIONS);
  }

  function initPaperView() {
    if (paperMessagesEl.children.length) return;
    renderPaperWelcome();
  }

  function clearPaperConversation() {
    paperHistory = [];
    paperMessagesEl.innerHTML = "";
    renderPaperWelcome();
    saveState();
  }

  function renderChatRetry(text, error) {
    var card = createEl(
      "div",
      "chatbot-msg chatbot-msg-assistant chatbot-retry-card",
    );
    var copy = createEl("p", "chatbot-demo-copy");
    copy.textContent = error && /timed out/i.test(error.message)
      ? "The backend did not become ready within 30 seconds."
      : "The backend is unavailable right now.";
    var button = createEl("button", "chatbot-demo-button", {
      "data-chatbot-action": "retry-chat",
      "data-chat-text": text,
    });
    button.textContent = "Retry";
    card.append(copy, button);
    addRawElement(paperMessagesEl, card);
  }

  function retryChat(button) {
    var card = button.closest(".chatbot-retry-card");
    var failedUserMessage = card && card.previousElementSibling;
    var text = button.getAttribute("data-chat-text") || "";
    if (failedUserMessage && failedUserMessage.classList.contains("chatbot-msg-user")) {
      failedUserMessage.remove();
    }
    if (card) card.remove();
    input.value = text;
    send();
  }

  function appendActivityLine(container, label) {
    var line = createEl("div", "chatbot-activity");
    line.textContent = label + "…";
    container.appendChild(line);
    container.scrollTop = container.scrollHeight;
    return line;
  }

  function finishPaperAnswer(reply, justAsked) {
    paperHistory.push({ role: "assistant", content: reply });
    renderQuestionChips(paperMessagesEl, "Related Questions", pickRelatedQuestions(justAsked));
  }

  function sendNonStreaming(payload, typing, coldStartNotice, justAsked) {
    return DEMO.requestJson(
      fetch,
      API_URL + "/paper/question",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
      30000,
    ).then(function (data) {
      clearTimeout(coldStartNotice);
      typing.remove();
      var reply = data.reply || "Sorry, I could not generate a response.";
      addMessage(paperMessagesEl, "assistant", reply);
      finishPaperAnswer(reply, justAsked);
    });
  }

  function sendViaStream(payload, typing, coldStartNotice, justAsked) {
    var answerEl = null;
    var activityLines = [];
    var started = false;

    function ensureStarted() {
      if (started) return;
      started = true;
      clearTimeout(coldStartNotice);
      typing.remove();
    }

    return window.ALIGATEHR_PAPER_STREAM.streamPaperQuestion(
      fetch.bind(window),
      API_URL + "/paper/question/stream",
      payload,
      {
        onToolCall: function (data) {
          ensureStarted();
          activityLines.push(
            appendActivityLine(paperMessagesEl, data.label || data.tool)
          );
        },
        onToolResult: function () {
          for (var i = activityLines.length - 1; i >= 0; i--) {
            if (!activityLines[i].classList.contains("is-done")) {
              activityLines[i].classList.add("is-done");
              break;
            }
          }
        },
        onToken: function (chunk, full) {
          ensureStarted();
          if (!answerEl) {
            answerEl = createEl("div", "chatbot-msg chatbot-msg-assistant");
            paperMessagesEl.appendChild(answerEl);
          }
          answerEl.innerHTML = renderMarkdown(full);
          paperMessagesEl.scrollTop = paperMessagesEl.scrollHeight;
        },
      }
    ).then(
      function (result) {
        ensureStarted();
        var reply = result.reply || "Sorry, I could not generate a response.";
        if (answerEl) {
          answerEl.innerHTML = renderMarkdown(reply);
        } else {
          addMessage(paperMessagesEl, "assistant", reply);
        }
        finishPaperAnswer(reply, justAsked);
      },
      function (err) {
        if (!err || !err.connectionFailure) {
          // Terminal mid-stream failure: clear the partial rendering so the
          // retry card reflects the actual (empty) conversation state.
          activityLines.forEach(function (line) { line.remove(); });
          if (answerEl) answerEl.remove();
        }
        throw err;
      }
    );
  }

  function send() {
    var text = input.value.trim();
    if (!text || busy) return;

    addMessage(paperMessagesEl, "user", text);
    paperHistory.push({ role: "user", content: text });

    input.value = "";
    input.style.height = "auto";
    busy = true;
    sendBtn.disabled = true;

    var typing = showTyping(paperMessagesEl);
    var coldStartNotice = setTimeout(function () {
      showColdStartNotice(paperMessagesEl, typing);
    }, 4000);

    var justAsked = text;
    var payload = {
      message: text,
      history: paperHistory
        .slice(0, -1)
        .map(function (item) { return { role: item.role, content: item.content }; }),
    };
    var canStream = !!(
      window.ALIGATEHR_PAPER_STREAM &&
      window.TextDecoder &&
      window.ReadableStream
    );

    var request = canStream
      ? sendViaStream(payload, typing, coldStartNotice, justAsked).catch(function (err) {
          if (err && err.connectionFailure) {
            // Connection-level fallback only: the stream never opened, so the
            // non-streaming endpoint answers instead. Mid-stream errors are
            // terminal and rethrow past this handler.
            return sendNonStreaming(payload, typing, coldStartNotice, justAsked);
          }
          throw err;
        })
      : sendNonStreaming(payload, typing, coldStartNotice, justAsked);

    request
      .catch(function (err) {
        clearTimeout(coldStartNotice);
        typing.remove();
        if (
          paperHistory.length &&
          paperHistory[paperHistory.length - 1].role === "user" &&
          paperHistory[paperHistory.length - 1].content === text
        ) {
          paperHistory.pop();
        }
        renderChatRetry(text, err);
        console.error("Paper Question Mode error:", err);
      })
      .finally(function () {
        busy = false;
        sendBtn.disabled = false;
        saveState();
      });
  }

  // ── Explore Visualizations (Visualization Destination navigation) ──

  function findVisualizationUrl(path, hash) {
    var links = document.querySelectorAll('a[href]');
    for (var i = 0; i < links.length; i++) {
      var candidate = new URL(links[i].href, window.location.href);
      if (candidate.pathname.endsWith(path)) {
        candidate.hash = hash || "";
        return candidate.href;
      }
    }
    var script = document.querySelector('script[src*="/chatbot/chatbot.js"]');
    var scriptUrl = new URL(script ? script.src : "/chatbot/chatbot.js", window.location.href);
    var siteRoot = scriptUrl.pathname.replace(/\/chatbot\/chatbot\.js$/, "");
    return scriptUrl.origin + siteRoot + path + (hash ? "#" + hash : "");
  }

  function findUseCaseUrl() {
    return findVisualizationUrl("/viz/use-case.html", "fibrotic-embedding");
  }

  function initVisualizationsView() {
    if (visualizationsView.children.length) return;
    VISUALIZATION_DESTINATIONS.forEach(function (destination) {
      var card = createEl("button", "chatbot-task-card", {
        type: "button",
        "data-chatbot-action": "open-visualization-destination",
        "data-destination": destination.id,
      });
      var label = createEl("span", "chatbot-task-card-label");
      label.textContent = destination.label;
      var description = createEl("span", "chatbot-task-card-description");
      description.textContent = destination.description;
      card.append(label, description);
      visualizationsView.appendChild(card);
    });
  }

  function openVisualizationDestination(destinationId) {
    var destination = VISUALIZATION_DESTINATIONS.filter(function (candidate) {
      return candidate.id === destinationId;
    })[0];
    if (!destination) return;
    closeAssistant();
    var destinationUrl = new URL(findVisualizationUrl(destination.path, null));
    var samePage =
      destinationUrl.origin === window.location.origin &&
      destinationUrl.pathname === window.location.pathname;
    if (samePage) {
      window.scrollTo({ top: 0, behavior: "auto" });
    } else {
      window.location.assign(destinationUrl.href);
    }
  }

  // ── Build a Demo Profile ──

  function updateProfileInputState() {
    var phase = profileSession.getState().phase;
    var startButton = profileMessagesEl.querySelector(
      '[data-chatbot-action="start-demo-profile"]',
    );
    if (startButton) {
      startButton.disabled = phase !== "target_selected";
      startButton.textContent =
        phase === "draft"
          ? "Profile Draft active"
          : phase === "confirmed"
            ? "Profile confirmed"
            : "Build Demo Profile";
    }
    var exampleButton = profileMessagesEl.querySelector(
      '[data-chatbot-action="load-synthetic-example"]',
    );
    if (exampleButton) {
      exampleButton.disabled = phase !== "target_selected";
    }
    updateComposerVisibility();
  }

  function initProfileView() {
    // An active Profile Draft is always re-rendered from the tab-scoped
    // wizard state, never resumed from persisted markup.
    if (profileSession.getState().phase === "draft") {
      renderProfileWizard();
      return;
    }
    if (profileMessagesEl.children.length) return;
    renderTargetSelection();
  }

  function renderTargetSelection() {
    if (profileMessagesEl.querySelector('[data-chatbot-action="select-profile-target"]')) return;
    var card = createEl(
      "div",
      "chatbot-msg chatbot-msg-assistant chatbot-profile-starter",
    );
    var noticeLabel = createEl("div", "chatbot-demo-label");
    noticeLabel.textContent = "Research Use Notice";
    var notice = createEl("p", "chatbot-demo-copy");
    notice.textContent =
      "Research demo only — not medical advice, diagnosis, or a personal outcome " +
      "prediction. Use a synthetic or sufficiently de-identified profile. Do not " +
      "enter names, exact birth dates, addresses, patient IDs, or real medical records.";
    var targetLabelEl = createEl("div", "chatbot-demo-label");
    targetLabelEl.textContent = "Choose a Research Cohort";
    var targetCopy = createEl("p", "chatbot-demo-copy");
    targetCopy.textContent =
      "Select exactly one Comparison Target below — this is a research cohort " +
      "choice, not a diagnosis or predicted disease. Nothing is inferred, " +
      "recommended, or substituted for you.";
    card.append(noticeLabel, notice, targetLabelEl, targetCopy);
    COMPARISON_TARGETS.forEach(function (target) {
      var button = createEl("button", "chatbot-task-card", {
        type: "button",
        "data-chatbot-action": "select-profile-target",
        "data-target": target[0],
      });
      var buttonLabel = createEl("span", "chatbot-task-card-label");
      buttonLabel.textContent = target[1];
      button.appendChild(buttonLabel);
      card.appendChild(button);
    });
    addRawElement(profileMessagesEl, card);
  }

  function selectProfileTarget(button) {
    var state = profileSession.getState();
    if (state.phase !== "inactive" && state.phase !== "target_selected") return;
    var target = button.getAttribute("data-target");
    profileSession.selectTarget(target);
    renderTargetConfirmedCard(target);
  }

  function renderTargetConfirmedCard(target) {
    var card = createEl(
      "div",
      "chatbot-msg chatbot-msg-assistant chatbot-profile-starter",
    );
    var label = createEl("div", "chatbot-demo-label");
    label.textContent = "Comparison Target: " + targetLabel(target);
    var copy = createEl("p", "chatbot-demo-copy");
    copy.textContent =
      "This is a research cohort choice, not a diagnosis. Build a profile with " +
      "your own values, or load the reviewed Synthetic Example Profile for this " +
      "target — both remain editable and neither confirms or starts comparison " +
      "automatically.";
    var buildButton = createEl("button", "chatbot-demo-button", {
      type: "button",
      "data-chatbot-action": "start-demo-profile",
    });
    buildButton.textContent = "Build Demo Profile";
    var exampleButton = createEl("button", "chatbot-profile-secondary", {
      type: "button",
      "data-chatbot-action": "load-synthetic-example",
    });
    exampleButton.textContent = "Load Synthetic Example Profile";
    var status = createEl("div", "chatbot-demo-status", { "aria-live": "polite" });
    card.append(label, copy, buildButton, exampleButton, status);
    addRawElement(profileMessagesEl, card);
  }

  function startDemoProfile() {
    var state = profileSession.getState();
    if (state.phase === "draft") {
      renderProfileWizard();
      return;
    }
    if (state.phase !== "target_selected") return;
    profileSession.start("manual", {
      stage: WIZARD.STAGES[0].id,
      entries: {},
    });
    renderProfileWizard();
  }

  function loadSyntheticExample(button) {
    var state = profileSession.getState();
    if (state.phase !== "target_selected" || button.disabled) return;
    var target = state.target;
    var status = button.parentElement.querySelector(".chatbot-demo-status");
    var buildButton = button.parentElement.querySelector(
      '[data-chatbot-action="start-demo-profile"]',
    );
    button.disabled = true;
    if (buildButton) buildButton.disabled = true;
    status.textContent = "Loading the reviewed Synthetic Example Profile…";
    DEMO.requestJson(
      fetch,
      API_URL + "/profile/synthetic-example/" + encodeURIComponent(target),
      { cache: "no-store" },
      30000,
    )
      .then(function (example) {
        // The reviewed example populates the same staged wizard state that
        // manual entry uses, so both paths converge on one Review stage.
        profileSession.start("example", {
          stage: WIZARD.STAGES[0].id,
          entries: WIZARD.entriesFromCandidates(example.candidates || []),
        });
        renderProfileWizard();
      })
      .catch(function (error) {
        button.disabled = false;
        if (buildButton) buildButton.disabled = false;
        status.textContent =
          "The Synthetic Example Profile is unavailable right now. Retry, continue with manual entry, or go Back to tasks.";
      });
  }

  // ── Demo Profile Wizard (staged form inside the Assistant Shell) ──

  function wizardState() {
    var state = profileSession.getState();
    return state.phase === "draft" ? state.wizard : null;
  }

  function stageIndex(stageId) {
    for (var i = 0; i < WIZARD.STAGES.length; i++) {
      if (WIZARD.STAGES[i].id === stageId) return i;
    }
    return 0;
  }

  function renderProfileWizard() {
    var state = profileSession.getState();
    if (state.phase !== "draft" || !state.wizard) return;
    var wizard = state.wizard;
    profileMessagesEl.innerHTML = "";

    var card = createEl("div", "chatbot-msg chatbot-msg-assistant chatbot-profile-wizard");
    var title = createEl("div", "chatbot-profile-title");
    title.textContent = "Demo Profile Wizard — " + targetLabel(state.target);
    card.appendChild(title);
    if (state.source === "example") {
      var exampleBadge = createEl("div", "chatbot-demo-label");
      exampleBadge.textContent =
        "Synthetic Example Profile loaded — reviewed, editable, not a real patient";
      card.appendChild(exampleBadge);
    }
    var notice = createEl("p", "chatbot-profile-notice");
    notice.textContent =
      "Every field is optional and values are preserved exactly as entered. " +
      "Use a synthetic or sufficiently de-identified profile. Nothing is " +
      "compared until you explicitly confirm on the Review stage.";
    card.appendChild(notice);

    var steps = createEl("ol", "chatbot-wizard-steps");
    var currentIndex = stageIndex(wizard.stage);
    WIZARD.STAGES.forEach(function (stage, index) {
      var step = createEl("li", "chatbot-wizard-step");
      if (index === currentIndex) step.classList.add("is-current");
      if (index < currentIndex) step.classList.add("is-done");
      step.textContent = stage.label;
      steps.appendChild(step);
    });
    card.appendChild(steps);

    var stageEl = createEl("div", "chatbot-wizard-stage");
    if (wizard.stage === "review") {
      stageEl.setAttribute("data-wizard-review", "1");
    } else {
      renderWizardStageFields(stageEl, wizard);
    }
    card.appendChild(stageEl);

    var nav = createEl("div", "chatbot-profile-actions chatbot-wizard-nav");
    var backButton = createEl("button", "chatbot-profile-secondary", {
      type: "button",
      "data-chatbot-action": "wizard-back",
    });
    backButton.textContent = "Back";
    backButton.disabled = currentIndex === 0;
    nav.appendChild(backButton);
    if (wizard.stage !== "review") {
      var continueButton = createEl("button", "chatbot-profile-primary", {
        type: "button",
        "data-chatbot-action": "wizard-continue",
      });
      continueButton.textContent =
        currentIndex === WIZARD.STAGES.length - 2 ? "Continue to Review" : "Continue";
      nav.appendChild(continueButton);
    }
    var startOverButton = createEl("button", "chatbot-profile-link", {
      type: "button",
      "data-chatbot-action": "start-over-demo-profile",
    });
    startOverButton.textContent = "Start Over";
    nav.appendChild(startOverButton);
    card.appendChild(nav);

    var status = createEl("div", "chatbot-profile-action-status chatbot-wizard-status", {
      "aria-live": "polite",
    });
    card.appendChild(status);

    addRawElement(profileMessagesEl, card);
    updateProfileInputState();
    if (wizard.stage === "review") runReviewValidation();
  }

  function renderWizardStageFields(stageEl, wizard) {
    var target = profileSession.getState().target;
    var fields = WIZARD.fieldsForStage(wizard.stage, target);
    var recommended = fields.filter(function (item) { return item.recommended; });
    var additional = fields.filter(function (item) { return !item.recommended; });
    if (recommended.length && additional.length) {
      var recommendedTitle = createEl("div", "chatbot-profile-subtitle");
      recommendedTitle.textContent = "Recommended for this Comparison Target";
      stageEl.appendChild(recommendedTitle);
    }
    recommended.forEach(function (item) {
      stageEl.appendChild(renderWizardFieldRow(item.field, wizard, true));
    });
    if (recommended.length && additional.length) {
      var additionalTitle = createEl("div", "chatbot-profile-subtitle");
      additionalTitle.textContent = "Additional optional fields";
      stageEl.appendChild(additionalTitle);
    }
    additional.forEach(function (item) {
      stageEl.appendChild(renderWizardFieldRow(item.field, wizard, false));
    });
    if (wizard.stage === "body_measurements") {
      var derivedEl = createEl("div", "chatbot-wizard-derived", {
        "data-wizard-derived": "1",
      });
      stageEl.appendChild(derivedEl);
      refreshDerivedPreview();
    }
  }

  function buildWizardUnitControl(field, meta, entry) {
    if (meta.fixedUnit) {
      var fixed = createEl("span", "chatbot-profile-unit");
      fixed.textContent = meta.canonicalUnit;
      return fixed;
    }
    var select = createEl("select", "chatbot-profile-input chatbot-wizard-unit", {
      "data-wizard-part": "unit",
      "aria-label": meta.label + " unit",
    });
    if (!entry.unit) {
      var prompt = createEl("option");
      prompt.value = "";
      prompt.textContent = "Select unit";
      select.appendChild(prompt);
    }
    meta.units.forEach(function (unit) {
      var option = createEl("option");
      option.value = unit;
      option.textContent = unit;
      select.appendChild(option);
    });
    select.value = entry.unit || "";
    return select;
  }

  function renderWizardFieldRow(field, wizard, recommended) {
    var meta = WIZARD.FIELDS[field];
    var entry = wizard.entries[field] || WIZARD.newEntry(field);
    var row = createEl("div", "chatbot-profile-field chatbot-wizard-field", {
      "data-wizard-field": field,
      "data-wizard-recommended": recommended ? "1" : "0",
    });

    var heading = createEl("div", "chatbot-profile-field-heading");
    var labelWrap = createEl("div", "chatbot-wizard-label-wrap");
    var label = createEl("label", "chatbot-profile-field-label", {
      for: "wizard-" + field,
    });
    label.textContent = meta.label;
    var optionalTag = createEl("span", "chatbot-wizard-optional");
    optionalTag.textContent = recommended ? "Optional — recommended" : "Optional";
    labelWrap.append(label, optionalTag);
    var badge = createEl("span", "chatbot-profile-status", {
      "data-wizard-status": "1",
    });
    badge.hidden = true;
    heading.append(labelWrap, badge);
    row.appendChild(heading);

    var edit = createEl("div", "chatbot-profile-edit");
    if (meta.kind === "choice") {
      var select = createEl("select", "chatbot-profile-input", {
        id: "wizard-" + field,
        "data-wizard-part": "value",
      });
      var prompt = createEl("option");
      prompt.value = "";
      prompt.textContent = "Choose a value (optional)";
      select.appendChild(prompt);
      meta.choices.forEach(function (choice) {
        var option = createEl("option");
        option.value = choice[0];
        option.textContent = choice[1];
        select.appendChild(option);
      });
      select.value = WIZARD.isBlank(entry) ? "" : String(entry.raw);
      edit.appendChild(select);
    } else if (entry.unit === "ft/in") {
      var feet = createEl("input", "chatbot-profile-input chatbot-wizard-number", {
        id: "wizard-" + field,
        type: "text",
        inputmode: "decimal",
        "data-wizard-part": "feet",
        value: entry.raw && entry.raw.feet != null ? entry.raw.feet : "",
        "aria-label": meta.label + " feet",
      });
      var feetUnit = createEl("span", "chatbot-profile-unit");
      feetUnit.textContent = "ft";
      var inches = createEl("input", "chatbot-profile-input chatbot-wizard-number", {
        type: "text",
        inputmode: "decimal",
        "data-wizard-part": "inches",
        value: entry.raw && entry.raw.inches != null ? entry.raw.inches : "",
        "aria-label": meta.label + " inches",
      });
      var inchUnit = createEl("span", "chatbot-profile-unit");
      inchUnit.textContent = "in";
      edit.append(feet, feetUnit, inches, inchUnit, buildWizardUnitControl(field, meta, entry));
    } else {
      var value = createEl("input", "chatbot-profile-input chatbot-wizard-number", {
        id: "wizard-" + field,
        type: "text",
        inputmode: "decimal",
        "data-wizard-part": "value",
        value: WIZARD.isBlank(entry) ? "" : String(entry.raw),
      });
      edit.append(value, buildWizardUnitControl(field, meta, entry));
    }
    var clearButton = createEl("button", "chatbot-profile-link chatbot-wizard-clear", {
      type: "button",
      "data-chatbot-action": "wizard-clear-field",
      "data-field": field,
    });
    clearButton.textContent = "Remove";
    edit.appendChild(clearButton);
    row.appendChild(edit);

    var original = createEl("div", "chatbot-wizard-original", {
      "data-wizard-original": "1",
    });
    original.hidden = true;
    row.appendChild(original);
    var message = createEl("div", "chatbot-profile-field-message", {
      "data-wizard-message": "1",
    });
    message.hidden = true;
    row.appendChild(message);

    refreshWizardFieldRow(field, row);
    return row;
  }

  function refreshWizardFieldRow(field, row) {
    var wizard = wizardState();
    if (!wizard || !row) return;
    var entry = wizard.entries[field] || WIZARD.newEntry(field);
    var result = WIZARD.validateEntry(field, entry, wizard.entries);
    var badge = row.querySelector("[data-wizard-status]");
    badge.hidden = result.status === "neutral";
    badge.textContent = WIZARD.statusLabel(result.status);
    badge.className = "chatbot-profile-status status-" + result.status;
    var message = row.querySelector("[data-wizard-message]");
    message.hidden = !result.message;
    message.textContent = result.message || "";
    message.classList.toggle("is-preserved", result.status === "outside_reference_support");
    var original = row.querySelector("[data-wizard-original]");
    var showOriginal =
      !WIZARD.isBlank(entry) && entry.original && entry.original.unit !== entry.unit;
    original.hidden = !showOriginal;
    original.textContent = showOriginal
      ? "Original value preserved for review: " +
        WIZARD.formatRaw(entry.original.raw, entry.original.unit)
      : "";
    var clearButton = row.querySelector('[data-chatbot-action="wizard-clear-field"]');
    if (clearButton) clearButton.hidden = WIZARD.isBlank(entry);
  }

  function replaceWizardFieldRow(field, row) {
    var wizard = wizardState();
    if (!wizard || !row) return;
    var recommended = row.getAttribute("data-wizard-recommended") === "1";
    var replacement = renderWizardFieldRow(field, wizard, recommended);
    row.replaceWith(replacement);
  }

  function refreshDerivedPreview() {
    var wizard = wizardState();
    var container = profileMessagesEl.querySelector("[data-wizard-derived]");
    if (!wizard || !container) return;
    container.innerHTML = "";
    var derived = WIZARD.deriveFeatures(wizard.entries);
    var fields = Object.keys(derived);
    container.hidden = !fields.length;
    if (!fields.length) return;
    var subtitle = createEl("div", "chatbot-profile-subtitle");
    subtitle.textContent = "Derived Match Features";
    container.appendChild(subtitle);
    fields.forEach(function (field) {
      var feature = derived[field];
      var item = createEl("div", "chatbot-profile-derived");
      var copy = createEl("span", "chatbot-profile-derived-copy");
      copy.textContent =
        feature.label + ": " + feature.value + " " + feature.unit +
        " — calculated deterministically from " + feature.derivedFrom.join(" + ");
      item.appendChild(copy);
      container.appendChild(item);
    });
  }

  function refreshDerivedAndConflicts(field) {
    if (WIZARD.DERIVED_TRIGGER_FIELDS.indexOf(field) === -1) return;
    refreshDerivedPreview();
    var bmiRow = profileMessagesEl.querySelector('[data-wizard-field="bmi"]');
    if (bmiRow && field !== "bmi") refreshWizardFieldRow("bmi", bmiRow);
  }

  function readWizardRaw(field, row) {
    var feet = row.querySelector('[data-wizard-part="feet"]');
    if (feet) {
      var inches = row.querySelector('[data-wizard-part="inches"]');
      return { feet: feet.value, inches: inches ? inches.value : "" };
    }
    var value = row.querySelector('[data-wizard-part="value"]');
    return value ? value.value : "";
  }

  profileMessagesEl.addEventListener("input", function (event) {
    var part = event.target.getAttribute("data-wizard-part");
    if (!part || part === "unit") return;
    var row = event.target.closest("[data-wizard-field]");
    var wizard = wizardState();
    if (!row || !wizard) return;
    var field = row.getAttribute("data-wizard-field");
    if (WIZARD.FIELDS[field].kind === "choice") return;
    wizard.entries[field] = WIZARD.editEntry(
      field,
      wizard.entries[field] || WIZARD.newEntry(field),
      readWizardRaw(field, row),
    );
    profileSession.updateWizard(wizard);
  });

  // Validation runs on field exit (and again on step continuation); blank
  // optional fields stay neutral.
  profileMessagesEl.addEventListener("focusout", function (event) {
    var part = event.target.getAttribute("data-wizard-part");
    if (!part || part === "unit") return;
    var row = event.target.closest("[data-wizard-field]");
    var wizard = wizardState();
    if (!row || !wizard) return;
    var field = row.getAttribute("data-wizard-field");
    refreshWizardFieldRow(field, row);
    refreshDerivedAndConflicts(field);
    saveState();
  });

  profileMessagesEl.addEventListener("change", function (event) {
    var part = event.target.getAttribute("data-wizard-part");
    if (!part) return;
    var row = event.target.closest("[data-wizard-field]");
    var wizard = wizardState();
    if (!row || !wizard) return;
    var field = row.getAttribute("data-wizard-field");
    var meta = WIZARD.FIELDS[field];
    if (part === "unit") {
      var newUnit = event.target.value;
      if (!newUnit) return;
      // Changing a unit converts the visible value; the original value and
      // unit stay preserved on the entry for review.
      wizard.entries[field] = WIZARD.convertEntry(
        field,
        wizard.entries[field] || WIZARD.newEntry(field),
        newUnit,
      );
      profileSession.updateWizard(wizard);
      replaceWizardFieldRow(field, row);
      refreshDerivedAndConflicts(field);
      saveState();
      return;
    }
    if (meta.kind === "choice") {
      wizard.entries[field] = { raw: event.target.value, unit: null, original: null };
      profileSession.updateWizard(wizard);
      refreshWizardFieldRow(field, row);
      saveState();
    }
  });

  function wizardBack() {
    var wizard = wizardState();
    if (!wizard) return;
    var index = stageIndex(wizard.stage);
    if (index === 0) return;
    wizard.stage = WIZARD.STAGES[index - 1].id;
    profileSession.updateWizard(wizard);
    renderProfileWizard();
  }

  function wizardContinue() {
    var wizard = wizardState();
    if (!wizard) return;
    var validation = WIZARD.validateStage(
      wizard.stage,
      wizard.entries,
      profileSession.getState().target,
    );
    profileMessagesEl.querySelectorAll("[data-wizard-field]").forEach(function (row) {
      refreshWizardFieldRow(row.getAttribute("data-wizard-field"), row);
    });
    var status = profileMessagesEl.querySelector(".chatbot-wizard-status");
    if (validation.blocked) {
      if (status) {
        status.textContent =
          "Resolve or remove the fields marked above to continue. Blank optional fields can stay blank.";
      }
      return;
    }
    var index = stageIndex(wizard.stage);
    if (index >= WIZARD.STAGES.length - 1) return;
    wizard.stage = WIZARD.STAGES[index + 1].id;
    profileSession.updateWizard(wizard);
    renderProfileWizard();
  }

  function wizardGotoStage(stageId) {
    var wizard = wizardState();
    if (!wizard) return;
    var known = WIZARD.STAGES.filter(function (stage) {
      return stage.id === stageId;
    });
    if (!known.length) return;
    wizard.stage = stageId;
    profileSession.updateWizard(wizard);
    renderProfileWizard();
  }

  function wizardClearField(field) {
    var wizard = wizardState();
    if (!wizard || !WIZARD.FIELDS[field]) return;
    delete wizard.entries[field];
    profileSession.updateWizard(wizard);
    var row = profileMessagesEl.querySelector('[data-wizard-field="' + field + '"]');
    if (row) replaceWizardFieldRow(field, row);
    refreshDerivedAndConflicts(field);
    saveState();
  }

  function wizardRemoveReviewField(field) {
    var wizard = wizardState();
    if (!wizard || !WIZARD.FIELDS[field]) return;
    delete wizard.entries[field];
    profileSession.updateWizard(wizard);
    runReviewValidation();
  }

  // The Review stage submits the wizard entries through the deterministic
  // /profile/validate contract and, in parallel, the target-aware
  // /profile/coverage contract. The backend remains the authority for both
  // field validation and target-specific Profile Coverage.
  function runReviewValidation() {
    var wizard = wizardState();
    var holder = profileMessagesEl.querySelector("[data-wizard-review]");
    if (!wizard || wizard.stage !== "review" || !holder) return;
    holder.innerHTML = "";
    var candidates = WIZARD.buildCandidates(wizard.entries);
    if (!candidates.length) {
      var empty = createEl("p", "chatbot-profile-notice");
      empty.textContent =
        "No fields are entered yet. Every field is optional, but the review " +
        "needs at least one entered value — use Back to add one on any stage.";
      holder.appendChild(empty);
      saveState();
      return;
    }
    profileSession.setCandidates(candidates);
    var target = profileSession.getState().target;
    var pending = createEl("p", "chatbot-profile-notice");
    pending.textContent = "Validating fields and checking target coverage…";
    holder.appendChild(pending);
    var coldStartNotice = setTimeout(function () {
      pending.textContent =
        "Preparing the research assistant — this can take up to a minute after inactivity.";
    }, 4000);
    Promise.all([
      DEMO.requestJson(
        fetch,
        API_URL + "/profile/validate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ candidates: candidates }),
        },
        30000,
      ),
      DEMO.requestJson(
        fetch,
        API_URL + "/profile/coverage",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ candidates: candidates, target: target }),
        },
        30000,
      ),
    ])
      .then(function (results) {
        clearTimeout(coldStartNotice);
        var draft = results[0];
        profileSession.applyDraft(draft);
        holder.innerHTML = "";
        renderProfileDraft(draft, results[1].profile_coverage, holder);
      })
      .catch(function (error) {
        clearTimeout(coldStartNotice);
        holder.innerHTML = "";
        var copy = createEl("p", "chatbot-profile-notice");
        copy.textContent =
          "The review is unavailable right now. Your entered values are unchanged.";
        var retry = createEl("button", "chatbot-demo-button", {
          type: "button",
          "data-chatbot-action": "wizard-retry-validate",
        });
        retry.textContent = "Retry";
        var editButton = createEl("button", "chatbot-profile-secondary", {
          type: "button",
          "data-chatbot-action": "wizard-goto-stage",
          "data-stage": WIZARD.STAGES[0].id,
        });
        editButton.textContent = "Continue editing";
        holder.append(copy, retry, editButton);
        console.error("Profile review error:", error);
      })
      .finally(function () {
        saveState();
      });
  }

  function renderProfileDraft(draft, coverage, holder) {
    var review = createEl("div", "chatbot-profile-review", {
      "data-profile-current": "1",
    });
    var title = createEl("div", "chatbot-profile-title");
    title.textContent = "Review — " + targetLabel(profileSession.getState().target);
    review.appendChild(title);
    if (profileSession.getState().source === "example") {
      var exampleBadge = createEl("div", "chatbot-demo-label");
      exampleBadge.textContent = "Reviewed example — editable, not a real patient";
      review.appendChild(exampleBadge);
    }
    var notice = createEl("p", "chatbot-profile-notice");
    notice.textContent =
      "Demo/research comparison only — use a synthetic or sufficiently " +
      "de-identified profile. No matching or personal prediction has started.";
    review.appendChild(notice);

    var features = draft.reported_features || {};
    var reportedTitle = createEl("div", "chatbot-profile-subtitle");
    reportedTitle.textContent = "Reported Features";
    review.appendChild(reportedTitle);
    Object.keys(features).forEach(function (field) {
      var feature = features[field];
      var row = createEl("div", "chatbot-profile-field", {
        "data-profile-field": field,
      });
      var heading = createEl("div", "chatbot-profile-field-heading");
      var label = createEl("span", "chatbot-profile-field-label");
      label.textContent = feature.label;
      var badge = createEl("span", "chatbot-profile-status status-" + feature.status);
      badge.textContent = WIZARD.backendStatusLabel(feature.status, feature.message);
      heading.append(label, badge);
      row.appendChild(heading);

      var entered = createEl("div", "chatbot-profile-source");
      var meta = WIZARD.FIELDS[field];
      if (meta && meta.kind === "choice") {
        entered.textContent =
          "Entered: " + WIZARD.choiceLabel(field, String(feature.original_value));
      } else {
        entered.textContent =
          "Entered: " + feature.original_value +
          (feature.original_unit ? " " + feature.original_unit : "");
      }
      row.appendChild(entered);
      if (feature.normalized_value != null) {
        var used = createEl("div", "chatbot-profile-source");
        used.textContent = meta && meta.kind === "choice"
          ? "Used for comparison: " + WIZARD.choiceLabel(field, String(feature.normalized_value))
          : "Used for comparison: " + feature.normalized_value +
            (feature.normalized_unit ? " " + feature.normalized_unit : "");
        row.appendChild(used);
      }
      if (feature.message) {
        var message = createEl("div", "chatbot-profile-field-message");
        message.textContent = feature.message;
        message.classList.toggle(
          "is-preserved",
          feature.status === "outside_reference_support",
        );
        row.appendChild(message);
      }
      if (feature.alternatives) {
        var alternatives = createEl("div", "chatbot-profile-conflicts");
        alternatives.textContent =
          "Conflicting values: " + feature.alternatives.join("; ");
        row.appendChild(alternatives);
      }

      var actions = createEl("div", "chatbot-profile-actions");
      var editButton = createEl("button", "chatbot-profile-link", {
        type: "button",
        "data-chatbot-action": "wizard-goto-stage",
        "data-stage": meta ? meta.stage : WIZARD.STAGES[0].id,
      });
      editButton.textContent = "Edit";
      var removeButton = createEl("button", "chatbot-profile-link", {
        type: "button",
        "data-chatbot-action": "wizard-remove-review-field",
        "data-field": field,
      });
      removeButton.textContent = "Remove";
      actions.append(editButton, removeButton);
      row.appendChild(actions);
      review.appendChild(row);
    });

    var derived = draft.derived_features || {};
    if (Object.keys(derived).length) {
      var derivedTitle = createEl("div", "chatbot-profile-subtitle");
      derivedTitle.textContent = "Derived Match Features";
      review.appendChild(derivedTitle);
      Object.keys(derived).forEach(function (field) {
        var feature = derived[field];
        var item = createEl("div", "chatbot-profile-derived");
        var derivedCopy = createEl("span", "chatbot-profile-derived-copy");
        derivedCopy.textContent =
          feature.label + ": " + feature.value + " " + feature.unit +
          " (calculated deterministically from " + feature.derived_from.join(" + ") + ")";
        var derivedBadge = createEl(
          "span",
          "chatbot-profile-status status-" + feature.status,
        );
        derivedBadge.textContent = WIZARD.backendStatusLabel(feature.status, feature.message);
        item.append(derivedCopy, derivedBadge);
        if (feature.message) {
          var derivedMessage = createEl("div", "chatbot-profile-field-message");
          derivedMessage.textContent = feature.message;
          item.appendChild(derivedMessage);
        }
        review.appendChild(item);
      });
    }

    renderCoverageGuidance(review, coverage);

    var eligible = !!(coverage && coverage.eligible);
    var canConfirm = !!draft.can_confirm;
    var actions = createEl("div", "chatbot-profile-actions");
    var confirmButton = createEl("button", "chatbot-profile-primary", {
      type: "button",
      "data-chatbot-action": "confirm-and-compare",
    });
    confirmButton.textContent = "Confirm and compare with reference cohort";
    confirmButton.disabled = !(canConfirm && eligible);
    actions.append(confirmButton);
    review.appendChild(actions);

    var status = createEl("div", "chatbot-profile-action-status", {
      "aria-live": "polite",
    });
    if (!canConfirm) {
      status.textContent =
        "Resolve the fields marked Add a unit, Check this value, or Conflict before comparing.";
    } else if (!eligible) {
      status.textContent =
        "Add the information highlighted under Profile Coverage to reach an eligible " +
        "target-specific pattern. Reaching eligibility never starts the comparison on its own.";
    }
    review.appendChild(status);
    holder.appendChild(review);
  }

  // Domain-based Coverage Guidance. It is actionable and never shows a
  // completion percentage, confidence, match accuracy, or a required field.
  function renderCoverageGuidance(review, coverage) {
    if (!coverage) return;
    var target = targetLabel(profileSession.getState().target);
    var section = createEl("div", "chatbot-coverage");
    var title = createEl("div", "chatbot-profile-subtitle");
    title.textContent = "Profile Coverage";
    section.appendChild(title);
    var intro = createEl("p", "chatbot-profile-notice");
    intro.textContent = coverage.eligible
      ? "This profile represents enough feature domains to satisfy a reviewed coverage " +
        "pattern for " + target + ". Missing domains are never imputed or treated as matches."
      : "Coverage is measured by feature domain, not by a single number. Add an optional " +
        "domain below to reach a reviewed pattern for " + target + " — no single field is required.";
    section.appendChild(intro);

    var available = coverage.available_domains || [];
    var list = createEl("ul", "chatbot-coverage-list");
    WIZARD.COVERAGE_DOMAINS.forEach(function (domain) {
      var represented = available.indexOf(domain.id) !== -1;
      var item = createEl(
        "li",
        "chatbot-coverage-item " + (represented ? "is-represented" : "is-missing"),
      );
      var mark = createEl("span", "chatbot-coverage-mark");
      mark.textContent = represented ? "✓" : "+";
      var label = createEl("span", "chatbot-coverage-domain");
      label.textContent =
        domain.label + (represented ? " — represented" : " — not yet represented");
      item.append(mark, label);
      list.appendChild(item);
    });
    section.appendChild(list);

    var recommendation = coverage.coverage_recommendation;
    if (!coverage.eligible && recommendation && recommendation.missing_domains.length) {
      var recTitle = createEl("div", "chatbot-coverage-rec-title");
      recTitle.textContent = "To reach an eligible pattern, add any of:";
      section.appendChild(recTitle);
      recommendation.missing_domains.forEach(function (domainId) {
        var domain = WIZARD.coverageDomain(domainId);
        var measurements =
          (recommendation.measurements_by_domain &&
            recommendation.measurements_by_domain[domainId]) || [];
        var recItem = createEl("div", "chatbot-coverage-rec");
        var copy = createEl("span", "chatbot-coverage-rec-copy");
        copy.textContent =
          domain.label +
          (measurements.length ? " — for example, " + measurements.join(" or ") : "");
        var add = createEl("button", "chatbot-profile-secondary chatbot-coverage-add", {
          type: "button",
          "data-chatbot-action": "wizard-goto-stage",
          "data-stage": domain.stage,
        });
        add.textContent = "Add this information";
        recItem.append(copy, add);
        section.appendChild(recItem);
      });
    } else if (!coverage.eligible) {
      var noRec = createEl("p", "chatbot-profile-notice");
      noRec.textContent =
        "Add measurements from more than one feature domain to reach a reviewed pattern.";
      section.appendChild(noRec);
    }

    var outside = coverage.outside_reference_support_domains || [];
    if (outside.length) {
      var outsideCopy = createEl("p", "chatbot-profile-notice");
      outsideCopy.textContent =
        "Values in these domains are outside this cohort's reference support and are " +
        "preserved without clamping: " +
        outside.map(function (id) { return WIZARD.coverageDomain(id).label; }).join(", ") + ".";
      section.appendChild(outsideCopy);
    }
    review.appendChild(section);
  }

  // The sole explicit confirmation action: confirm the reviewed Profile Draft
  // and immediately compare with the reference cohort. Phase-aware so that a
  // recoverable matching failure can retry the comparison alone without a
  // second confirmation.
  function confirmAndCompareProfile(button) {
    var state = profileSession.getState();
    var card = button.closest(".chatbot-profile-review, .chatbot-profile-recover");
    var status = card ? card.querySelector(".chatbot-profile-action-status") : null;
    if (state.phase === "confirmed" && state.confirmed) {
      button.disabled = true;
      runComparison();
      return;
    }
    if (state.phase !== "draft" || !state.draft || !state.draft.can_confirm) return;
    button.disabled = true;
    if (status) status.textContent = "Confirming the reviewed Profile Draft…";
    DEMO.requestJson(
      fetch,
      API_URL + "/profile/confirm",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft: state.draft }),
      },
      30000,
    )
      .then(function (confirmed) {
        profileSession.confirm(confirmed);
        runComparison();
      })
      .catch(function (error) {
        button.disabled = false;
        if (status) {
          status.textContent =
            "Could not confirm the profile — the backend is unavailable. Your entered values are unchanged.";
        }
        console.error("Profile confirm error:", error);
      });
  }

  function runComparison() {
    var state = profileSession.getState();
    if (state.phase !== "confirmed" || !state.confirmed || !state.target) return;
    profileMessagesEl.innerHTML = "";
    var progress = createEl(
      "div",
      "chatbot-msg chatbot-msg-assistant chatbot-profile-progress",
    );
    var progressCopy = createEl("p", "chatbot-profile-notice");
    progressCopy.textContent =
      "Profile confirmed. Comparing with the reference cohort…";
    progress.appendChild(progressCopy);
    addRawElement(profileMessagesEl, progress);
    updateProfileInputState();
    var run = profileMatchController.start();
    var coldStartNotice = setTimeout(function () {
      if (profileMatchController.isCurrent(run.token)) {
        progressCopy.textContent =
          "Preparing the research assistant — this can take up to a minute after inactivity.";
      }
    }, 4000);
    DEMO.requestJson(
      fetch,
      API_URL + "/profile/match",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmed_profile: state.confirmed,
          target: state.target,
        }),
        signal: run.signal,
      },
      30000,
    )
      .then(function (result) {
        clearTimeout(coldStartNotice);
        if (!profileMatchController.isCurrent(run.token)) return;
        handleComparisonResult(result);
      })
      .catch(function (error) {
        clearTimeout(coldStartNotice);
        if (!profileMatchController.isCurrent(run.token)) return;
        profileMessagesEl.innerHTML = "";
        renderComparisonFailure(error);
        console.error("Profile matching error:", error);
      });
  }

  // A Matched Reference Neighborhood hands off to the destination
  // visualization; every other outcome stays inside the Demo Profile Wizard.
  function outcomeActionButton(action, label, variant) {
    var button = createEl("button", "chatbot-profile-" + variant, {
      type: "button",
      "data-chatbot-action": action,
    });
    button.textContent = label;
    return button;
  }

  function handleComparisonResult(result) {
    var status = result.cohort_comparison_result.status;
    profileMessagesEl.innerHTML = "";
    if (status === "matched_reference_neighborhood") {
      handoffMatchedResult(result);
    } else if (status === "no_stable_neighborhood") {
      renderNoStableNeighborhood(result);
    } else {
      // The client gates comparison behind eligibility, but the backend
      // re-validates and is the authority. If it reports the confirmed profile
      // no longer satisfies a reviewed coverage pattern, say so honestly rather
      // than mislabeling it a No Stable Neighborhood.
      renderCoverageShortfall(result);
    }
  }

  // Recoverable comparison failure keeps the confirmed profile and offers the
  // three agreed next steps: Retry, Continue editing, and Back to tasks.
  function renderComparisonFailure(error) {
    var card = createEl(
      "div",
      "chatbot-msg chatbot-msg-assistant chatbot-profile-recover",
    );
    var title = createEl("div", "chatbot-profile-title");
    title.textContent = "Comparison unavailable";
    var copy = createEl("p", "chatbot-profile-notice");
    copy.textContent =
      error && /timed out/i.test(error.message || "")
        ? "The comparison timed out while the backend was waking. Your confirmed profile is unchanged."
        : "The comparison backend is unavailable right now. Your confirmed profile is unchanged.";
    var status = createEl("div", "chatbot-profile-action-status", {
      "aria-live": "polite",
    });
    var actions = createEl("div", "chatbot-profile-actions");
    actions.append(
      outcomeActionButton("confirm-and-compare", "Retry comparison", "primary"),
      outcomeActionButton("wizard-reopen-editing", "Continue editing", "secondary"),
      outcomeActionButton("back-to-tasks", "Back to tasks", "link"),
    );
    card.append(title, copy, actions, status);
    addRawElement(profileMessagesEl, card);
  }

  // Reopen a confirmed-but-uncompared profile for editing: the wizard entries
  // are retained, so returning to Review preserves valid state.
  function reopenWizardForEditing() {
    if (profileSession.getState().phase === "confirmed") {
      profileSession.reopenForEditing();
    }
    var wizard = wizardState();
    if (!wizard) return;
    wizard.stage = WIZARD.STAGES[0].id;
    profileSession.updateWizard(wizard);
    renderProfileWizard();
  }

  function targetLabel(target) {
    var match = COMPARISON_TARGETS.find(function (candidate) {
      return candidate[0] === target;
    });
    return match ? match[1] : String(target).replace(/_/g, " ");
  }

  // A matched result selects its disease group in the embedding, collapses the
  // Assistant, and opens the destination visualization in the current tab. The Assistant
  // returns to the Research Task Menu so reopening lands on the menu with an
  // edit-or-restart Profile action (rendered by renderComparisonComplete).
  function handoffMatchedResult(result) {
    var request;
    try {
      request = DEMO.createMatchedRequest(result);
    } catch (error) {
      renderComparisonFailure(error);
      console.error("Matched handoff error:", error);
      return;
    }
    DEMO.saveRequest(sessionStorage, request);
    DEMO.notifyRequest(window, request);
    renderComparisonComplete(result);
    shellSession.backToTasks();
    showTask(null);
    closeAssistant();
    var destination = new URL(findUseCaseUrl());
    var samePage =
      destination.origin === window.location.origin &&
      destination.pathname === window.location.pathname;
    if (samePage) {
      window.location.hash = destination.hash;
    } else {
      window.location.assign(destination.href);
    }
  }

  // Left in the Profile Session after a matched handoff, so reopening the
  // Assistant and returning to Build a Demo Profile offers edit-or-restart.
  function renderComparisonComplete(result) {
    var card = createEl(
      "div",
      "chatbot-msg chatbot-msg-assistant chatbot-profile-complete",
    );
    var title = createEl("div", "chatbot-profile-title");
    title.textContent = "Comparison complete";
    var copy = createEl("p", "chatbot-profile-notice");
    copy.textContent =
      "Your confirmed Demo Profile for " + targetLabel(result.cohort_comparison_result.target) +
      " matched a reference neighborhood. Its disease group is now highlighted in the Use Case visualization. " +
      "This is a research cohort comparison — not a diagnosis, prognosis, or personal outcome.";
    var actions = createEl("div", "chatbot-profile-actions");
    actions.append(
      outcomeActionButton("wizard-reopen-editing", "Edit Demo Profile", "secondary"),
      outcomeActionButton("start-over-demo-profile", "Start a new comparison", "primary"),
    );
    card.append(title, copy, actions);
    addRawElement(profileMessagesEl, card);
  }

  // A No Stable Neighborhood is an honest no-result: no Visualization Request,
  // stay in the wizard with Edit Demo Profile, Start a new comparison, and
  // Back to tasks.
  function renderNoStableNeighborhood(result) {
    var coverage = result.cohort_comparison_result.profile_coverage || {};
    var outside = coverage.outside_reference_support_domains || [];
    renderWizardOutcomeCard(
      "No stable neighborhood",
      "Too few reference patients satisfied the validated matching threshold, so no " +
        "stable neighborhood was formed. The system did not force nearest neighbors into a " +
        "result. This does not mean comparable people do not exist outside this research cohort." +
        (outside.length
          ? " Confirmed values in these domains were outside this cohort's reference support and " +
            "were preserved without clamping: " +
            outside.map(function (id) { return WIZARD.coverageDomain(id).label; }).join(", ") + "."
          : ""),
    );
  }

  // Defensive: the backend re-validated the confirmed profile and no longer
  // finds an eligible coverage pattern. Keep the same in-wizard recovery
  // actions instead of implying a matching no-result.
  function renderCoverageShortfall(result) {
    var recommendation =
      (result.cohort_comparison_result.profile_coverage || {}).coverage_recommendation;
    var additions = recommendation && recommendation.missing_domains.length
      ? " Add information from another feature domain — for example " +
        recommendation.missing_domains.map(function (id) {
          return WIZARD.coverageDomain(id).label;
        }).join(" or ") + " — then compare again."
      : "";
    renderWizardOutcomeCard(
      "Coverage no longer sufficient",
      "The confirmed profile no longer satisfies a reviewed coverage pattern for this " +
        "Comparison Target, so no comparison was run. Missing information was not imputed " +
        "or treated as a match." + additions,
    );
  }

  function renderWizardOutcomeCard(title, copyText) {
    var card = createEl(
      "div",
      "chatbot-msg chatbot-msg-assistant chatbot-profile-recover",
    );
    var titleEl = createEl("div", "chatbot-profile-title");
    titleEl.textContent = title;
    var copy = createEl("p", "chatbot-profile-notice");
    copy.textContent = copyText;
    var actions = createEl("div", "chatbot-profile-actions");
    actions.append(
      outcomeActionButton("wizard-reopen-editing", "Edit Demo Profile", "secondary"),
      outcomeActionButton("start-over-demo-profile", "Start a new comparison", "primary"),
      outcomeActionButton("back-to-tasks", "Back to tasks", "link"),
    );
    card.append(titleEl, copy, actions);
    addRawElement(profileMessagesEl, card);
  }

  function startOverDemoProfile() {
    profileMatchController.cancel();
    profileSession.reset();
    profileMessagesEl.innerHTML = "";
    updateProfileInputState();
    addMessage(profileMessagesEl, "assistant", "The Demo Profile session was cleared.");
    renderTargetSelection();
    saveState();
  }

  function showTyping(container) {
    var el = createEl("div", "chatbot-typing");
    for (var i = 0; i < 3; i++) {
      el.appendChild(createEl("div", "chatbot-typing-dot"));
    }
    container.appendChild(el);
    container.scrollTop = container.scrollHeight;
    return el;
  }

  function showColdStartNotice(container, typingEl) {
    if (!typingEl.isConnected) return;
    var notice = createEl("span", "chatbot-typing-note");
    notice.textContent = "Preparing the research assistant — this can take up to a minute after inactivity.";
    typingEl.appendChild(notice);
    container.scrollTop = container.scrollHeight;
  }

  // Minimal markdown: **bold**, `code`, newlines → <br>, paragraphs
  function renderMarkdown(text) {
    return text
      .split(/\n{2,}/)
      .map(function (para) {
        var s = para
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
          .replace(/`(.+?)`/g, "<code>$1</code>")
          .replace(/\n/g, "<br>");
        return "<p>" + s + "</p>";
      })
      .join("");
  }
})();

(function () {
  "use strict";

  var DEMO = window.ALIGATEHR_EMBEDDING_DEMO;
  var ICD = window.ALIGATEHR_ICD_KEYWORD;
  var PROFILE = window.ALIGATEHR_PROFILE_SESSION;
  var SHELL = window.ALIGATEHR_ASSISTANT_SHELL;
  var API_URL = DEMO.resolveApiUrl(window.location, window.ALIGATEHR_API_URL);
  var STORAGE_PREFIX = "aligatehr-chatbot-shell-v1-";
  var profileSession = PROFILE.create(sessionStorage);
  var shellSession = SHELL.create(sessionStorage);
  var profileMatchController = DEMO.createRequestController();
  var PROFILE_CHOICES = {
    sex: [
      ["female", "Female"],
      ["male", "Male"],
    ],
    smoking_status: [
      ["never", "Never"],
      ["former", "Former"],
      ["current", "Current"],
    ],
    alcohol_frequency: [
      ["never", "Never"],
      ["special_occasions", "Special occasions only"],
      ["one_to_three_per_month", "1–3 times a month"],
      ["one_to_two_per_week", "1–2 times a week"],
      ["three_to_four_per_week", "3–4 times a week"],
      ["daily_or_almost_daily", "Daily or almost daily"],
    ],
    affected_relative: [
      ["true", "Yes"],
      ["false", "No"],
    ],
  };
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
      description: "See a guided walkthrough of the fibrotic patient embedding visualization.",
    },
    {
      id: "profile",
      label: "Build a Demo Profile",
      description: "Build an editable synthetic or de-identified profile and compare it with the reference cohort.",
    },
  ];

  var ICON_EXPAND = '<svg viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>';
  var ICON_COLLAPSE = '<svg viewBox="0 0 24 24"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>';
  var ICON_BACK = '<svg viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>';

  var paperHistory = [];
  var busy = false;
  var profileCardCounter = 0;

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
  var clearPaperBtn = createEl("button", "chatbot-clear-btn", {
    type: "button",
    "data-chatbot-action": "clear-paper-conversation",
  });
  clearPaperBtn.textContent = "Clear conversation";
  paperToolbar.appendChild(clearPaperBtn);
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
  panel.append(header, body, inputRow, disclaimer);

  document.body.appendChild(fab);
  document.body.appendChild(panel);

  // ── Task routing (Research Task Menu ⇄ Assistant Shell views) ──

  function updateComposerVisibility() {
    var activeTask = shellSession.getState().activeTask;
    var showComposer =
      activeTask === "paper" ||
      (activeTask === "profile" && profileSession.getState().phase === "draft");
    inputRow.hidden = !showComposer;
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
    if (task === "paper") paperMessagesEl.scrollTop = paperMessagesEl.scrollHeight;
    if (task === "profile") profileMessagesEl.scrollTop = profileMessagesEl.scrollHeight;
  }

  function selectTask(task) {
    shellSession.selectTask(task);
    showTask(task);
    if (task === "paper") initPaperView();
    if (task === "visualizations") initVisualizationsView();
    if (task === "profile") initProfileView();
    saveState();
    if (!inputRow.hidden) input.focus();
  }

  function backToTasks() {
    shellSession.backToTasks();
    showTask(null);
    saveState();
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
  profileCardCounter = profileMessagesEl.querySelectorAll(".chatbot-profile-review").length;
  updateProfileInputState();

  // ── Events ──

  fab.addEventListener("click", function () {
    var opening = !panel.classList.contains("is-open");
    panel.classList.toggle("is-open");
    fab.setAttribute("aria-label", opening ? "Close the Guided Research Assistant" : "Open the Guided Research Assistant");
    if (opening) {
      fab.style.display = "none";
      updateComposerVisibility();
      if (!inputRow.hidden) input.focus();
      paperMessagesEl.scrollTop = paperMessagesEl.scrollHeight;
      profileMessagesEl.scrollTop = profileMessagesEl.scrollHeight;
    }
    saveState();
  });

  closeBtn.addEventListener("click", function () {
    panel.classList.remove("is-open");
    fab.style.display = "";
    fab.setAttribute("aria-label", "Open the Guided Research Assistant");
    saveState();
  });

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
    if (action === "preset-embedding-demo") startPresetDemo(button);
    if (action === "start-demo-profile") startDemoProfile();
    if (action === "save-profile-edits") saveProfileEdits(button);
    if (action === "confirm-demo-profile") confirmDemoProfile(button);
    if (action === "compare-confirmed-profile") compareConfirmedProfile(button);
    if (action === "view-matched-references") viewMatchedReferences(button);
    if (action === "view-icd-keyword") viewIcdKeyword(button);
    if (action === "start-over-demo-profile") startOverDemoProfile();
    if (action === "retry-chat") retryChat(button);
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

  // ── Understand the Research (paper/general questions) ──

  function renderPaperWelcome() {
    addMessage(
      paperMessagesEl,
      "assistant",
      "Hello! I'm the ALIGATEHR-Gen Guided Research Assistant. Ask me about the paper's methodology, results, and clinical implications.",
    );
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

  function renderIcdKeywordMatches(ui) {
    var matches = Array.isArray(ui.matches) ? ui.matches : [];
    matches.forEach(function (match, index) {
      var card = createEl(
        "div",
        "chatbot-msg chatbot-msg-assistant chatbot-demo-card chatbot-icd-card",
      );
      var label = createEl("div", "chatbot-demo-label");
      label.textContent = matches.length > 1
        ? "ICD Keyword Match " + (index + 1) + " of " + matches.length
        : "ICD Keyword Match";
      var title = createEl("div", "chatbot-icd-title");
      title.textContent = match.display_label;
      var selector = createEl("code", "chatbot-icd-selector");
      selector.textContent = match.selector_label;
      var copy = createEl("p", "chatbot-demo-copy");
      copy.textContent =
        "Reviewed code selector for graph navigation only. It does not use ICD " +
        "history, a Demo Profile, or patient-level similarity.";
      var button = createEl("button", "chatbot-demo-button", {
        type: "button",
        "data-chatbot-action": "view-icd-keyword",
      });
      button.textContent = "View ICD: " + match.display_label + " (" + match.selector_label + ")";
      button.setAttribute("data-icd-match", JSON.stringify(match));
      button.setAttribute("data-vocabulary-version", ui.vocabulary_version);
      var status = createEl("div", "chatbot-demo-status", { "aria-live": "polite" });
      card.append(label, title, selector, copy, button, status);
      addRawElement(paperMessagesEl, card);
    });
  }

  function viewIcdKeyword(button) {
    if (button.disabled) return;
    var status = button.parentElement.querySelector(".chatbot-demo-status");
    try {
      var match = JSON.parse(button.getAttribute("data-icd-match"));
      var request = ICD.createRequest(
        match,
        button.getAttribute("data-vocabulary-version"),
      );
      ICD.saveRequest(sessionStorage, request);
      ICD.notifyRequest(window, request);
      var destination = new URL(findPerformanceUrl());
      var samePage =
        destination.origin === window.location.origin &&
        destination.pathname === window.location.pathname;
      status.textContent = "Opening this reviewed ICD selector on the code graph.";
      if (samePage) {
        window.location.hash = destination.hash;
        button.textContent = "Show this ICD match again";
        status.textContent = "ICD points highlighted. Explanation and reset controls are below.";
      } else {
        window.location.assign(destination.href);
      }
    } catch (error) {
      status.textContent = "This ICD visualization request is unavailable. Ask for the keyword again.";
      console.error("ICD Keyword Match visualization error:", error);
    }
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

  function send() {
    var text = input.value.trim();
    if (!text || busy) return;

    if (shellSession.getState().activeTask === "profile" && profileSession.getState().phase === "draft") {
      sendProfileMessage(text);
      return;
    }

    addMessage(paperMessagesEl, "user", text);
    paperHistory.push({ role: "user", content: text });

    input.value = "";
    input.style.height = "auto";
    busy = true;
    sendBtn.disabled = true;

    var typing = showTyping(paperMessagesEl);

    var chatBody = {
      message: text,
      history: paperHistory
        .slice(0, -1)
        .map(function (item) { return { role: item.role, content: item.content }; }),
    };
    DEMO.requestJson(
      fetch,
      API_URL + "/chat",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(chatBody),
      },
      30000,
    )
      .then(function (data) {
        typing.remove();
        var reply = data.reply || "Sorry, I could not generate a response.";
        addMessage(paperMessagesEl, "assistant", reply);
        paperHistory.push({ role: "assistant", content: reply });

        if (data.ui && data.ui.type === "pathway_enrichment") {
          renderPathwayEnrichment(data.ui);
        }
        if (data.ui && data.ui.type === "icd_keyword_matches") {
          renderIcdKeywordMatches(data.ui);
        }
      })
      .catch(function (err) {
        typing.remove();
        if (
          paperHistory.length &&
          paperHistory[paperHistory.length - 1].role === "user" &&
          paperHistory[paperHistory.length - 1].content === text
        ) {
          paperHistory.pop();
        }
        renderChatRetry(text, err);
        console.error("Chatbot error:", err);
      })
      .finally(function () {
        busy = false;
        sendBtn.disabled = false;
        saveState();
      });
  }

  // ── Pathway enrichment card ──

  function renderPathwayEnrichment(data) {
    var card = createEl("div", "chatbot-msg chatbot-msg-assistant chatbot-pathway-card");

    var title = createEl("div", "chatbot-report-title");
    title.textContent = "Pathway Enrichment: " + data.disease_label;
    card.appendChild(title);

    var table = createEl("table", "chatbot-pathway-table");
    var thead = createEl("thead");
    var headerRow = createEl("tr");
    ["Pathway", "Source", "Genes", "Enrichment", "p-adj"].forEach(function (h) {
      var th = createEl("th");
      th.textContent = h;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    var tbody = createEl("tbody");
    data.pathways.forEach(function (p) {
      var tr = createEl("tr");
      var vals = [p.pathway, p.source, p.gene_count, p.enrichment_ratio + "×", p.p_adjusted];
      vals.forEach(function (v) {
        var td = createEl("td");
        td.textContent = v;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    card.appendChild(table);

    addRawElement(paperMessagesEl, card);
  }

  // ── Explore Visualizations (preset embedding walkthrough) ──

  function findVisualizationUrl(path, hash) {
    var links = document.querySelectorAll('a[href]');
    for (var i = 0; i < links.length; i++) {
      var candidate = new URL(links[i].href, window.location.href);
      if (candidate.pathname.endsWith(path)) {
        candidate.hash = hash;
        return candidate.href;
      }
    }
    var script = document.querySelector('script[src*="/chatbot/chatbot.js"]');
    var scriptUrl = new URL(script ? script.src : "/chatbot/chatbot.js", window.location.href);
    var siteRoot = scriptUrl.pathname.replace(/\/chatbot\/chatbot\.js$/, "");
    return scriptUrl.origin + siteRoot + path + "#" + hash;
  }

  function findUseCaseUrl() {
    return findVisualizationUrl("/viz/use-case.html", "fibrotic-embedding");
  }

  function findPerformanceUrl() {
    return findVisualizationUrl("/viz/overall-performance.html", "icd-embedding");
  }

  function initVisualizationsView() {
    if (visualizationsView.children.length) return;
    renderPresetDemoCard();
  }

  function renderPresetDemoCard() {
    var card = createEl("div", "chatbot-msg chatbot-msg-assistant chatbot-demo-card");
    var label = createEl("div", "chatbot-demo-label");
    label.textContent = "Preset research walkthrough";
    var copy = createEl("p", "chatbot-demo-copy");
    copy.textContent =
      "See how a fixed reference selection is highlighted on the fibrotic embedding. " +
      "This display preset is not a clinical match and does not predict an outcome.";
    var button = createEl("button", "chatbot-demo-button", {
      type: "button",
      "data-chatbot-action": "preset-embedding-demo",
    });
    button.textContent = "Try animated demo";
    var status = createEl("div", "chatbot-demo-status", { "aria-live": "polite" });
    card.append(label, copy, button, status);
    addRawElement(visualizationsView, card);
  }

  function startPresetDemo(button) {
    if (button.disabled) return;
    var status = button.parentElement.querySelector(".chatbot-demo-status");
    button.disabled = true;
    button.textContent = "Preparing demo…";
    status.textContent = "Loading the current dataset release.";
    var coldStartNotice = setTimeout(function () {
      status.textContent = "The backend is still waking from a cold start. You remain in control and can retry if it times out.";
    }, 4000);

    DEMO.requestJson(
      fetch,
      API_URL + "/embedding/fibrotic/preset",
      { cache: "no-store" },
      30000,
    )
      .then(function (preset) {
        clearTimeout(coldStartNotice);
        var request = DEMO.createPresetRequest(preset);
        DEMO.saveRequest(sessionStorage, request);
        DEMO.notifyRequest(window, request);
        status.textContent = "Opening the fibrotic embedding walkthrough.";
        var destination = new URL(findUseCaseUrl());
        var samePage =
          destination.origin === window.location.origin &&
          destination.pathname === window.location.pathname;
        if (samePage) {
          window.location.hash = destination.hash;
          button.disabled = false;
          button.textContent = "Run preset demo again";
          status.textContent =
            "Walkthrough started. Replay and reset controls are available below.";
        } else {
          window.location.assign(destination.href);
        }
      })
      .catch(function (error) {
        clearTimeout(coldStartNotice);
        button.disabled = false;
        button.textContent = "Try animated demo";
        status.textContent = "The demo backend is unavailable. Please try again.";
        console.error("Preset embedding demo error:", error);
      });
  }

  // ── Build a Demo Profile ──

  function updateProfileInputState() {
    var phase = profileSession.getState().phase;
    var startButton = profileMessagesEl.querySelector(
      '[data-chatbot-action="start-demo-profile"]',
    );
    if (startButton) {
      startButton.disabled = phase !== "inactive";
      startButton.textContent =
        phase === "draft"
          ? "Profile Draft active"
          : phase === "confirmed"
            ? "Profile confirmed"
            : "Build Demo Profile";
    }
    updateComposerVisibility();
  }

  function initProfileView() {
    if (profileMessagesEl.children.length) return;
    renderProfileStarterCard();
  }

  function renderProfileStarterCard() {
    if (profileMessagesEl.querySelector('[data-chatbot-action="start-demo-profile"]')) return;
    var card = createEl(
      "div",
      "chatbot-msg chatbot-msg-assistant chatbot-profile-starter",
    );
    var label = createEl("div", "chatbot-demo-label");
    label.textContent = "Research Demo Profile";
    var copy = createEl("p", "chatbot-demo-copy");
    copy.textContent =
      "Build an editable synthetic or de-identified profile. Values are reviewed " +
      "before confirmation and never start matching automatically.";
    var button = createEl("button", "chatbot-demo-button", {
      type: "button",
      "data-chatbot-action": "start-demo-profile",
    });
    button.textContent = "Build Demo Profile";
    card.append(label, copy, button);
    addRawElement(profileMessagesEl, card);
  }

  function startDemoProfile() {
    if (profileSession.getState().phase === "draft") {
      input.focus();
      return;
    }
    profileSession.start();
    addMessage(
      profileMessagesEl,
      "assistant",
      "**Research demo only — not medical advice, diagnosis, or a personal outcome prediction.** " +
        "Use a synthetic or sufficiently de-identified profile. Do not enter names, " +
        "exact birth dates, addresses, patient IDs, or real medical records. You can " +
        "provide details in one message or across several messages.",
    );
    updateProfileInputState();
    input.focus();
  }

  function validateProfileCandidates(statusEl) {
    var candidates = profileSession.getState().candidates;
    if (statusEl) statusEl.textContent = "Validating fields and units…";
    return DEMO.requestJson(
      fetch,
      API_URL + "/profile/validate",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidates: candidates }),
      },
      30000,
    )
      .then(function (draft) {
        profileSession.applyDraft(draft);
        renderProfileDraft(draft);
        return draft;
      });
  }

  function sendProfileMessage(text) {
    addMessage(profileMessagesEl, "user", text);
    input.value = "";
    input.style.height = "auto";
    busy = true;
    sendBtn.disabled = true;
    var typing = showTyping(profileMessagesEl);

    DEMO.requestJson(
      fetch,
      API_URL + "/profile/extract",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      },
      30000,
    )
      .then(function (data) {
        profileSession.appendCandidates(data.candidates || []);
        return validateProfileCandidates();
      })
      .then(function (draft) {
        typing.remove();
        var count = Object.keys(draft.reported_features || {}).length;
        var reply = count
          ? "I created an editable Profile Draft. Review every value and status below before confirming."
          : "I could not identify a supported field yet. Add an easy-to-know measurement such as age, height, weight, or blood pressure.";
        addMessage(profileMessagesEl, "assistant", reply);
      })
      .catch(function (error) {
        typing.remove();
        addMessage(
          profileMessagesEl,
          "assistant",
          "I could not update the Profile Draft. " + error.message + " Please correct the message or try again.",
        );
      })
      .finally(function () {
        busy = false;
        sendBtn.disabled = false;
        saveState();
      });
  }

  function statusLabel(status) {
    return {
      valid: "Valid",
      ambiguous: "Needs clarification",
      out_of_range: "Outside accepted input range",
      outside_reference_support: "Outside reference support",
      unsupported: "Unsupported for this demo",
      conflicting: "Conflicting values",
    }[status] || status;
  }

  function renderProfileDraft(draft) {
    profileCardCounter += 1;
    var cardId = "profile-review-" + profileCardCounter;
    var oldCards = profileMessagesEl.querySelectorAll(".chatbot-profile-review[data-profile-current='1']");
    oldCards.forEach(function (card) {
      card.remove();
    });

    var card = createEl(
      "div",
      "chatbot-msg chatbot-msg-assistant chatbot-profile-review",
      { "data-profile-current": "1" },
    );
    var title = createEl("div", "chatbot-profile-title");
    title.textContent = "Profile Draft — review required";
    card.appendChild(title);

    var notice = createEl("p", "chatbot-profile-notice");
    notice.textContent =
      "Demo/research comparison only. No matching or personal prediction has started.";
    card.appendChild(notice);

    var features = draft.reported_features || {};
    Object.keys(features).forEach(function (field) {
      var feature = features[field];
      var row = createEl("div", "chatbot-profile-field");
      row.setAttribute("data-profile-field", field);
      var heading = createEl("div", "chatbot-profile-field-heading");
      var label = createEl("label", "chatbot-profile-field-label");
      label.textContent = feature.label;
      label.setAttribute("for", cardId + "-" + field);
      var badge = createEl(
        "span",
        "chatbot-profile-status status-" + feature.status,
      );
      badge.textContent = statusLabel(feature.status);
      heading.append(label, badge);

      var edit = createEl("div", "chatbot-profile-edit");
      var inputEl;
      if (PROFILE_CHOICES[field]) {
        inputEl = createEl("select", "chatbot-profile-input", {
          id: cardId + "-" + field,
          name: field,
        });
        var promptOption = createEl("option");
        promptOption.value = "";
        promptOption.textContent = "Choose a value";
        inputEl.appendChild(promptOption);
        PROFILE_CHOICES[field].forEach(function (choice) {
          var option = createEl("option");
          option.value = choice[0];
          option.textContent = choice[1];
          inputEl.appendChild(option);
        });
        if (feature.normalized_value != null) {
          inputEl.value = String(feature.normalized_value);
        }
      } else {
        inputEl = createEl("input", "chatbot-profile-input", {
          id: cardId + "-" + field,
          name: field,
          type: "text",
          value:
            feature.normalized_value == null
              ? String(feature.original_value == null ? "" : feature.original_value)
              : String(feature.normalized_value),
        });
      }
      if (feature.status === "unsupported") inputEl.disabled = true;
      edit.appendChild(inputEl);
      if (feature.normalized_unit) {
        var unit = createEl("span", "chatbot-profile-unit");
        unit.textContent = feature.normalized_unit;
        edit.appendChild(unit);
      }

      var source = createEl("div", "chatbot-profile-source");
      source.textContent =
        "Source: “" + feature.source_text + "”" +
        (feature.original_unit ? " (original unit: " + feature.original_unit + ")" : "");
      row.append(heading, edit, source);
      if (feature.message) {
        var message = createEl("div", "chatbot-profile-field-message");
        message.textContent = feature.message;
        row.appendChild(message);
      }
      if (feature.alternatives) {
        var alternatives = createEl("div", "chatbot-profile-conflicts");
        alternatives.textContent = "Conflicting values: " + feature.alternatives.join("; ");
        row.appendChild(alternatives);
      }
      if (feature.source_texts) {
        var sources = createEl("div", "chatbot-profile-conflicts");
        sources.textContent =
          "Sources: “" + feature.source_texts.join("”; “") + "”";
        row.appendChild(sources);
      }
      if (feature.source_history && feature.source_history.length > 1) {
        var historyCopy = createEl("div", "chatbot-profile-source-history");
        historyCopy.textContent =
          "Source history: " +
          feature.source_history.map(function (entry) {
            return (
              "“" + entry.source_text + "”" +
              (entry.original_unit ? " (" + entry.original_unit + ")" : "")
            );
          }).join("; ");
        row.appendChild(historyCopy);
      }
      card.appendChild(row);
    });

    var derived = draft.derived_features || {};
    if (Object.keys(derived).length) {
      var derivedTitle = createEl("div", "chatbot-profile-subtitle");
      derivedTitle.textContent = "Derived Match Features";
      card.appendChild(derivedTitle);
      Object.keys(derived).forEach(function (field) {
        var feature = derived[field];
        var item = createEl("div", "chatbot-profile-derived");
        var derivedCopy = createEl("span", "chatbot-profile-derived-copy");
        derivedCopy.textContent =
          feature.label + ": " + feature.value + " " + feature.unit +
          " (from " + feature.derived_from.join(" + ") + ")";
        var derivedBadge = createEl(
          "span",
          "chatbot-profile-status status-" + feature.status,
        );
        derivedBadge.textContent = statusLabel(feature.status);
        item.append(derivedCopy, derivedBadge);
        if (feature.message) {
          var derivedMessage = createEl("div", "chatbot-profile-field-message");
          derivedMessage.textContent = feature.message;
          item.appendChild(derivedMessage);
        }
        card.appendChild(item);
      });
    }

    var actions = createEl("div", "chatbot-profile-actions");
    var saveButton = createEl("button", "chatbot-profile-secondary", {
      type: "button",
      "data-chatbot-action": "save-profile-edits",
    });
    saveButton.textContent = "Save corrections";
    var confirmButton = createEl("button", "chatbot-profile-primary", {
      type: "button",
      "data-chatbot-action": "confirm-demo-profile",
    });
    confirmButton.textContent = "Confirm Demo Profile";
    confirmButton.disabled = !draft.can_confirm;
    var startOverButton = createEl("button", "chatbot-profile-link", {
      type: "button",
      "data-chatbot-action": "start-over-demo-profile",
    });
    startOverButton.textContent = "Start Over";
    actions.append(saveButton, confirmButton, startOverButton);
    card.appendChild(actions);

    var status = createEl("div", "chatbot-profile-action-status", {
      "aria-live": "polite",
    });
    if (!draft.can_confirm) {
      status.textContent = "Resolve fields marked for clarification or conflict before confirming.";
    }
    card.appendChild(status);
    addRawElement(profileMessagesEl, card);
  }

  function saveProfileEdits(button) {
    var card = button.closest(".chatbot-profile-review");
    var state = profileSession.getState();
    if (!card || state.phase !== "draft" || !state.draft) return;
    var edits = {};
    card.querySelectorAll("[data-profile-field] input, [data-profile-field] select").forEach(function (fieldInput) {
      edits[fieldInput.name] = fieldInput.value.trim();
    });
    var corrections = PROFILE.createCorrections(state.draft, edits);
    var status = card.querySelector(".chatbot-profile-action-status");
    if (!corrections.length) {
      status.textContent = "No changed values to save.";
      return;
    }
    button.disabled = true;
    profileSession.appendCandidates(corrections);
    validateProfileCandidates(status).catch(function (error) {
      button.disabled = false;
      status.textContent = "Could not save corrections. " + error.message;
    });
  }

  function confirmDemoProfile(button) {
    var state = profileSession.getState();
    if (state.phase !== "draft" || !state.draft || !state.draft.can_confirm) return;
    var card = button.closest(".chatbot-profile-review");
    var status = card.querySelector(".chatbot-profile-action-status");
    button.disabled = true;
    status.textContent = "Confirming the reviewed Profile Draft…";
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
        card.setAttribute("data-profile-current", "0");
        card.querySelectorAll("input, select, button").forEach(function (control) {
          control.disabled = true;
        });
        status.textContent = "Profile confirmed.";
        renderConfirmedProfile(confirmed);
        updateProfileInputState();
      })
      .catch(function (error) {
        button.disabled = false;
        status.textContent = "Could not confirm the profile. " + error.message;
      });
  }

  function renderConfirmedProfile(confirmed) {
    var card = createEl(
      "div",
      "chatbot-msg chatbot-msg-assistant chatbot-profile-confirmed",
    );
    var title = createEl("div", "chatbot-profile-title");
    title.textContent = "Confirmed Profile";
    var copy = createEl("p", "chatbot-profile-notice");
    copy.textContent =
      "Your reviewed Demo Profile is confirmed for this tab. Matching has not started. " +
      "Choose one Comparison Target below; this remains a research cohort comparison, " +
      "not medical advice, diagnosis, prognosis, or a personal outcome prediction.";
    var count = createEl("div", "chatbot-profile-confirmed-count");
    count.textContent =
      Object.keys(confirmed.reported_features || {}).length +
      " reported features; " +
      Object.keys(confirmed.derived_features || {}).length +
      " derived features.";
    var targetLabelEl = createEl("label", "chatbot-profile-target-label");
    targetLabelEl.textContent = "Comparison Target";
    var targetSelect = createEl("select", "chatbot-profile-target", {
      "aria-label": "Comparison Target",
    });
    var emptyTarget = createEl("option");
    emptyTarget.value = "";
    emptyTarget.textContent = "Choose one target…";
    targetSelect.appendChild(emptyTarget);
    COMPARISON_TARGETS.forEach(function (target) {
      var option = createEl("option");
      option.value = target[0];
      option.textContent = target[1];
      targetSelect.appendChild(option);
    });
    var compare = createEl("button", "chatbot-profile-primary", {
      type: "button",
      "data-chatbot-action": "compare-confirmed-profile",
    });
    compare.textContent = "Compare with reference cohort";
    var matchStatus = createEl("div", "chatbot-profile-action-status", {
      "aria-live": "polite",
    });
    var startOver = createEl("button", "chatbot-profile-link", {
      type: "button",
      "data-chatbot-action": "start-over-demo-profile",
    });
    startOver.textContent = "Start Over";
    card.append(
      title,
      copy,
      count,
      targetLabelEl,
      targetSelect,
      compare,
      matchStatus,
      startOver,
    );
    addRawElement(profileMessagesEl, card);
  }

  function targetLabel(target) {
    var match = COMPARISON_TARGETS.find(function (candidate) {
      return candidate[0] === target;
    });
    return match ? match[1] : String(target).replace(/_/g, " ");
  }

  function formatDomain(domain) {
    return String(domain).replace(/_/g, " ");
  }

  function renderAggregateDomains(container, aggregate) {
    if (!aggregate || !Array.isArray(aggregate.domains)) return;
    aggregate.domains.forEach(function (domain) {
      var section = createEl("div", "chatbot-match-domain");
      var heading = createEl("strong");
      heading.textContent = formatDomain(domain.domain);
      var list = createEl("ul");
      domain.metrics.forEach(function (metric) {
        var item = createEl("li");
        if (metric.suppressed) {
          item.textContent = metric.label + ": suppressed because the aggregate cell is too small";
        } else if (metric.distribution) {
          item.textContent =
            metric.label + ": " +
            metric.distribution.map(function (entry) {
              return formatDomain(entry.category) + " (n=" + entry.count + ")";
            }).join(", ");
        } else {
          item.textContent =
            metric.label + ": median " + metric.median +
            (metric.unit ? " " + metric.unit : "") +
            "; range " + metric.range[0] + "–" + metric.range[1] +
            (metric.unit ? " " + metric.unit : "");
        }
        list.appendChild(item);
      });
      section.append(heading, list);
      container.appendChild(section);
    });
  }

  function renderCohortComparison(result) {
    var comparison = result.cohort_comparison_result;
    var coverage = comparison.profile_coverage || {};
    var card = createEl(
      "div",
      "chatbot-msg chatbot-msg-assistant chatbot-match-result",
    );
    var title = createEl("div", "chatbot-profile-title");
    title.textContent = "Cohort Comparison Result";
    var target = createEl("p", "chatbot-match-target");
    target.textContent = "Target: " + targetLabel(comparison.target);
    var presentation = {
      insufficient_profile_coverage: ["Coverage needed", "is-coverage-needed"],
      no_stable_neighborhood: ["No stable neighborhood", "is-no-result"],
      matched_reference_neighborhood: ["Matched neighborhood", "is-matched"],
    }[comparison.status] || ["Comparison status", "is-no-result"];
    card.classList.add(presentation[1]);
    var resultStatus = createEl("div", "chatbot-result-status");
    resultStatus.textContent = presentation[0];
    var coverageDetails = createEl("p", "chatbot-match-coverage");
    var availableDomains = coverage.available_domains || [];
    var unavailableDomains = coverage.unavailable_domains || [];
    coverageDetails.textContent =
      "Profile Coverage — available domains: " +
      (availableDomains.length ? availableDomains.map(formatDomain).join(", ") : "none") +
      "; unavailable domains: " +
      (unavailableDomains.length ? unavailableDomains.map(formatDomain).join(", ") : "none") +
      ". Missing domains were not imputed or treated as matches.";
    var outsideSupport = coverage.outside_reference_support_domains || [];
    if (outsideSupport.length) {
      coverageDetails.textContent +=
        " Values in these domains were outside this cohort's reference support and were preserved without clamping: " +
        outsideSupport.map(formatDomain).join(", ") + ".";
    }
    card.append(title, target, resultStatus, coverageDetails);

    if (comparison.status === "insufficient_profile_coverage") {
      var recommendation = coverage.coverage_recommendation;
      var coverageCopy = createEl("p", "chatbot-profile-notice");
      var recommendationCopy = recommendation
        ? recommendation.missing_domains.map(function (domain) {
            var measurements = recommendation.measurements_by_domain[domain] || [];
            return formatDomain(domain) +
              (measurements.length ? " (for example, " + measurements.join(" or ") + ")" : "");
          }).join("; ")
        : "";
      coverageCopy.textContent = recommendation
        ? "The confirmed profile does not match a calibrated coverage pattern for this target. " +
          "To reach the nearest complete calibrated pattern, add: " + recommendationCopy +
          ". Missing fields were not treated as matches."
        : "The confirmed profile does not match a calibrated coverage pattern for this target.";
      card.appendChild(coverageCopy);
    } else if (comparison.status === "no_stable_neighborhood") {
      var emptyCopy = createEl("p", "chatbot-profile-notice");
      emptyCopy.textContent =
        "No Stable Neighborhood: fewer than five references satisfied the validated threshold. " +
        "The system did not force nearest neighbors into the result. This does not mean " +
        "comparable people do not exist outside this research cohort." +
        (outsideSupport.length
          ? " Confirmed values in the " + outsideSupport.map(formatDomain).join(", ") +
            " domain were outside this cohort's reference support and were preserved without clamping."
          : "");
      card.appendChild(emptyCopy);
    } else {
      var matchedCopy = createEl("p", "chatbot-profile-notice");
      matchedCopy.textContent =
        comparison.neighborhood_size +
        " threshold-qualified reference patients were selected from the confirmed target cohort.";
      card.appendChild(matchedCopy);
      renderAggregateDomains(card, result.aggregate_callout_data);
      var limitations = createEl("p", "chatbot-match-limitations");
      limitations.textContent = comparison.limitations.join(" ");
      var view = createEl("button", "chatbot-demo-button", {
        type: "button",
        "data-chatbot-action": "view-matched-references",
      });
      view.textContent = "View matched reference patients";
      view.setAttribute("data-match-result", JSON.stringify(result));
      var viewStatus = createEl("div", "chatbot-demo-status", {
        "aria-live": "polite",
      });
      card.append(limitations, view, viewStatus);
    }
    var startOver = createEl("button", "chatbot-profile-link", {
      type: "button",
      "data-chatbot-action": "start-over-demo-profile",
    });
    startOver.textContent = "Start Over";
    card.appendChild(startOver);
    addRawElement(profileMessagesEl, card);
  }

  function compareConfirmedProfile(button) {
    var state = profileSession.getState();
    if (state.phase !== "confirmed" || !state.confirmed) return;
    var card = button.closest(".chatbot-profile-confirmed");
    var select = card.querySelector(".chatbot-profile-target");
    var status = card.querySelector(".chatbot-profile-action-status");
    if (!select.value) {
      status.textContent = "Choose one Comparison Target before starting the comparison.";
      select.focus();
      return;
    }
    button.disabled = true;
    select.disabled = true;
    status.textContent = "Checking calibrated Profile Coverage and reference distances…";
    var run = profileMatchController.start();
    var coldStartNotice = setTimeout(function () {
      if (profileMatchController.isCurrent(run.token)) {
        status.textContent = "The backend is still waking from a cold start. This request will time out with a Retry option rather than using stale results.";
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
          target: select.value,
        }),
        signal: run.signal,
      },
      30000,
    )
      .then(function (result) {
        clearTimeout(coldStartNotice);
        if (!profileMatchController.isCurrent(run.token)) return;
        status.textContent = "Comparison complete.";
        renderCohortComparison(result);
      })
      .catch(function (error) {
        clearTimeout(coldStartNotice);
        if (!profileMatchController.isCurrent(run.token)) return;
        button.disabled = false;
        select.disabled = false;
        status.textContent = error.message && error.message.toLowerCase().includes("timed out")
          ? "The comparison timed out while the backend was waking. Retry when ready."
          : "The comparison backend is unavailable. Retry when ready.";
        console.error("Profile matching error:", error);
      });
  }

  function viewMatchedReferences(button) {
    if (button.disabled) return;
    var status = button.parentElement.querySelector(".chatbot-demo-status");
    try {
      var result = JSON.parse(button.getAttribute("data-match-result"));
      var request = DEMO.createMatchedRequest(result);
      DEMO.saveRequest(sessionStorage, request);
      DEMO.notifyRequest(window, request);
      var destination = new URL(findUseCaseUrl());
      var samePage =
        destination.origin === window.location.origin &&
        destination.pathname === window.location.pathname;
      status.textContent = "Opening the exact matched references in the fibrotic walkthrough.";
      if (samePage) {
        window.location.hash = destination.hash;
        button.textContent = "Show matched references again";
        status.textContent = "Walkthrough started. Replay and reset controls are available below.";
      } else {
        window.location.assign(destination.href);
      }
    } catch (error) {
      button.disabled = false;
      status.textContent = "The visualization request is unavailable. Run the comparison again.";
      console.error("Matched reference walkthrough error:", error);
    }
  }

  function startOverDemoProfile() {
    profileMatchController.cancel();
    profileSession.reset();
    profileMessagesEl.innerHTML = "";
    updateProfileInputState();
    addMessage(profileMessagesEl, "assistant", "The Demo Profile session was cleared.");
    renderProfileStarterCard();
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

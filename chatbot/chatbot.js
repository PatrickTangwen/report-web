(function () {
  "use strict";

  var API_URL = "https://patirckistc-report-web.hf.space";

  var history = [];
  var busy = false;
  var lastAssessedDisease = null;

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
    "aria-label": "Open chat",
    title: "Chat with ALIGATEHR-Gen Assistant",
  });
  fab.innerHTML =
    '<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.2L4 17.2V4h16v12z"/><path d="M7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"/></svg>';

  // Panel
  var panel = createEl("div", "chatbot-panel");

  // Header
  var header = createEl("div", "chatbot-header");
  var headerTitle = createEl("span", "chatbot-header-title");
  headerTitle.textContent = "ALIGATEHR-Gen Assistant";
  var closeBtn = createEl("button", "chatbot-close", { "aria-label": "Close chat" });
  closeBtn.innerHTML = "&times;";
  header.appendChild(headerTitle);
  header.appendChild(closeBtn);

  // Messages
  var messagesEl = createEl("div", "chatbot-messages");

  // Input row
  var inputRow = createEl("div", "chatbot-input-row");
  var input = createEl("textarea", "chatbot-input", {
    placeholder: "Ask a question...",
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
  panel.appendChild(header);
  panel.appendChild(messagesEl);
  panel.appendChild(inputRow);
  panel.appendChild(disclaimer);

  document.body.appendChild(fab);
  document.body.appendChild(panel);

  // ── Welcome message ──

  addMessage(
    "assistant",
    "Hello! I'm the ALIGATEHR-Gen research assistant. I can help you understand our paper's methodology, results, and clinical implications. What would you like to know?"
  );

  // ── Events ──

  fab.addEventListener("click", function () {
    var opening = !panel.classList.contains("is-open");
    panel.classList.toggle("is-open");
    fab.setAttribute("aria-label", opening ? "Close chat" : "Open chat");
    if (opening) {
      fab.style.display = "none";
      input.focus();
    }
  });

  closeBtn.addEventListener("click", function () {
    panel.classList.remove("is-open");
    fab.style.display = "";
    fab.setAttribute("aria-label", "Open chat");
  });

  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  });

  sendBtn.addEventListener("click", send);

  // Auto-resize textarea
  input.addEventListener("input", function () {
    this.style.height = "auto";
    this.style.height = Math.min(this.scrollHeight, 80) + "px";
  });

  // ── Core logic ──

  function addMessage(role, text) {
    var msg = createEl("div", "chatbot-msg chatbot-msg-" + role);
    if (role === "assistant") {
      msg.innerHTML = renderMarkdown(text);
    } else {
      msg.textContent = text;
    }
    messagesEl.appendChild(msg);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return msg;
  }

  function addRawElement(el) {
    messagesEl.appendChild(el);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function showTyping() {
    var el = createEl("div", "chatbot-typing");
    for (var i = 0; i < 3; i++) {
      el.appendChild(createEl("div", "chatbot-typing-dot"));
    }
    messagesEl.appendChild(el);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return el;
  }

  function send() {
    var text = input.value.trim();
    if (!text || busy) return;

    addMessage("user", text);
    history.push({ role: "user", content: text });

    input.value = "";
    input.style.height = "auto";
    busy = true;
    sendBtn.disabled = true;

    var typing = showTyping();

    var chatBody = { message: text, history: history.slice(0, -1) };
    if (lastAssessedDisease) {
      chatBody.assessed_disease = lastAssessedDisease;
    }

    fetch(API_URL + "/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(chatBody),
    })
      .then(function (res) {
        if (!res.ok) throw new Error("API returned " + res.status);
        return res.json();
      })
      .then(function (data) {
        typing.remove();
        var reply = data.reply || "Sorry, I could not generate a response.";
        addMessage("assistant", reply);
        history.push({ role: "assistant", content: reply });

        if (data.ui && data.ui.type === "disease_select") {
          renderDiseaseSelect(data.ui.diseases);
        }
        if (data.ui && data.ui.type === "pathway_enrichment") {
          renderPathwayEnrichment(data.ui);
        }
      })
      .catch(function (err) {
        typing.remove();
        addMessage(
          "assistant",
          "Sorry, I'm unable to connect right now. Please try again later."
        );
        console.error("Chatbot error:", err);
      })
      .finally(function () {
        busy = false;
        sendBtn.disabled = false;
      });
  }

  // ── Disease selection ──

  function renderDiseaseSelect(diseases) {
    var container = createEl("div", "chatbot-msg chatbot-msg-assistant chatbot-disease-select");
    var grid = createEl("div", "chatbot-disease-grid");

    diseases.forEach(function (d) {
      var btn = createEl("button", "chatbot-disease-btn");
      btn.textContent = d.label;
      btn.setAttribute("data-id", d.id);
      btn.addEventListener("click", function () {
        onDiseaseSelected(d, container);
      });
      grid.appendChild(btn);
    });

    container.appendChild(grid);
    addRawElement(container);
  }

  function onDiseaseSelected(disease, selectContainer) {
    // Disable all disease buttons
    var btns = selectContainer.querySelectorAll(".chatbot-disease-btn");
    btns.forEach(function (btn) {
      btn.disabled = true;
      if (btn.getAttribute("data-id") === disease.id) {
        btn.classList.add("selected");
      }
    });

    addMessage("user", "I'd like to assess: " + disease.label);
    history.push({ role: "user", content: "I'd like to assess: " + disease.label });

    var typing = showTyping();
    busy = true;
    sendBtn.disabled = true;

    fetch(API_URL + "/form-fields?disease=" + encodeURIComponent(disease.id))
      .then(function (res) {
        if (!res.ok) throw new Error("API returned " + res.status);
        return res.json();
      })
      .then(function (formData) {
        typing.remove();
        addMessage(
          "assistant",
          "Please fill in the following clinical values for **" +
            formData.disease_label +
            "** risk assessment. These are the top " +
            formData.fields.length +
            " most important features identified by our model. All fields are optional — fill in what you know."
        );
        history.push({
          role: "assistant",
          content: "Please fill in the clinical values for " + formData.disease_label + " risk assessment.",
        });
        renderClinicalForm(formData);
      })
      .catch(function (err) {
        typing.remove();
        addMessage(
          "assistant",
          "Sorry, I could not load the form for this disease. Please try again."
        );
        console.error("Form fields error:", err);
      })
      .finally(function () {
        busy = false;
        sendBtn.disabled = false;
      });
  }

  // ── Clinical form ──

  function renderClinicalForm(formData) {
    var container = createEl("div", "chatbot-msg chatbot-msg-assistant chatbot-clinical-form");
    var form = createEl("form", "chatbot-form");
    form.setAttribute("data-disease", formData.disease);

    formData.fields.forEach(function (field) {
      var group = createEl("div", "chatbot-form-group");

      var label = createEl("label", "chatbot-form-label");
      label.textContent = field.label;
      label.setAttribute("for", "cf-" + field.key);
      group.appendChild(label);

      if (field.type === "select") {
        var sel = createEl("select", "chatbot-form-input", {
          id: "cf-" + field.key,
          name: field.key,
        });
        var emptyOpt = createEl("option");
        emptyOpt.value = "";
        emptyOpt.textContent = "— Select —";
        sel.appendChild(emptyOpt);
        field.options.forEach(function (opt) {
          var o = createEl("option");
          o.value = opt;
          o.textContent = opt;
          sel.appendChild(o);
        });
        group.appendChild(sel);
      } else {
        var inp = createEl("input", "chatbot-form-input", {
          id: "cf-" + field.key,
          name: field.key,
          type: "number",
          step: String(field.step),
          min: String(field.min),
          max: String(field.max),
          placeholder: field.min + " – " + field.max,
        });
        group.appendChild(inp);
      }

      form.appendChild(group);
    });

    var submitBtn = createEl("button", "chatbot-form-submit", { type: "submit" });
    submitBtn.textContent = "Submit Assessment";
    form.appendChild(submitBtn);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      onFormSubmit(form, formData, container);
    });

    container.appendChild(form);
    addRawElement(container);
  }

  function onFormSubmit(form, formData, formContainer) {
    var values = {};
    var hasValue = false;

    formData.fields.forEach(function (field) {
      var el = form.querySelector('[name="' + field.key + '"]');
      if (!el) return;
      var val = el.value.trim();
      if (val === "") return;
      if (field.type === "numeric") {
        values[field.key] = parseFloat(val);
      } else {
        values[field.key] = val;
      }
      hasValue = true;
    });

    if (!hasValue) {
      addMessage("assistant", "Please fill in at least one field before submitting.");
      return;
    }

    // Disable form
    var inputs = form.querySelectorAll("input, select, button");
    inputs.forEach(function (el) { el.disabled = true; });

    // Show submitted values as user message
    var summary = "Submitted values for " + formData.disease_label + ":\n";
    for (var key in values) {
      summary += "• " + key + ": " + values[key] + "\n";
    }
    addMessage("user", summary.trim());
    history.push({ role: "user", content: summary.trim() });

    var typing = showTyping();
    busy = true;
    sendBtn.disabled = true;

    fetch(API_URL + "/assess", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ disease: formData.disease, values: values }),
    })
      .then(function (res) {
        if (!res.ok) throw new Error("API returned " + res.status);
        return res.json();
      })
      .then(function (data) {
        typing.remove();
        renderRiskReport(data);
        lastAssessedDisease = data.disease;
        history.push({ role: "assistant", content: "Risk assessment for " + data.disease_label + ": " + data.risk_level + " risk." });
        renderFollowupSuggestions(data.disease_label);
      })
      .catch(function (err) {
        typing.remove();
        addMessage(
          "assistant",
          "Sorry, there was an error generating the risk assessment. Please try again."
        );
        console.error("Assess error:", err);
      })
      .finally(function () {
        busy = false;
        sendBtn.disabled = false;
      });
  }

  // ── Risk report ──

  function renderRiskReport(report) {
    var card = createEl("div", "chatbot-msg chatbot-msg-assistant chatbot-risk-report");

    // Title
    var title = createEl("div", "chatbot-report-title");
    title.textContent = "Risk Assessment: " + report.disease_label;
    card.appendChild(title);

    // Risk score badge
    var scoreSec = createEl("div", "chatbot-report-section");
    var badge = createEl("span", "chatbot-risk-badge chatbot-risk-" + report.risk_level);
    badge.textContent = report.risk_level.toUpperCase() + " RISK";
    scoreSec.appendChild(badge);
    var prob = createEl("span", "chatbot-risk-prob");
    prob.textContent = " (" + (report.risk_probability * 100).toFixed(1) + "% probability)";
    scoreSec.appendChild(prob);
    card.appendChild(scoreSec);

    // Key risk factors
    var rfTitle = createEl("div", "chatbot-report-subtitle");
    rfTitle.textContent = "Key Risk Factors";
    card.appendChild(rfTitle);

    var rfList = createEl("div", "chatbot-report-factors");
    report.risk_factors.forEach(function (rf) {
      var row = createEl("div", "chatbot-factor-row");
      var name = createEl("span", "chatbot-factor-name");
      name.textContent = "#" + rf.rank + " " + rf.feature;
      row.appendChild(name);
      if (rf.user_value != null && rf.cohort_mean != null) {
        var vals = createEl("span", "chatbot-factor-vals");
        vals.textContent = "You: " + rf.user_value + " | Cohort: " + rf.cohort_mean + " (" + rf.cohort_min + "–" + rf.cohort_max + ")";
        row.appendChild(vals);
      } else if (rf.user_value != null) {
        var uv = createEl("span", "chatbot-factor-vals");
        uv.textContent = "You: " + rf.user_value;
        row.appendChild(uv);
      }
      rfList.appendChild(row);
    });
    card.appendChild(rfList);

    // Similar patients
    var sp = report.similar_patients;
    var spTitle = createEl("div", "chatbot-report-subtitle");
    spTitle.textContent = "Similar Patient Statistics";
    card.appendChild(spTitle);

    var stats = createEl("div", "chatbot-report-stats");
    var items = [
      ["Matched patients", sp.count],
      ["High-risk", sp.high_risk_pct + "%"],
      ["Mean age", sp.mean_age],
    ];
    if (sp.male_pct != null) items.push(["Male", sp.male_pct + "%"]);
    if (sp.family_history_pct != null) items.push(["Family history", sp.family_history_pct + "%"]);
    items.forEach(function (pair) {
      var stat = createEl("div", "chatbot-stat-item");
      var val = createEl("div", "chatbot-stat-value");
      val.textContent = pair[1];
      var lbl = createEl("div", "chatbot-stat-label");
      lbl.textContent = pair[0];
      stat.appendChild(val);
      stat.appendChild(lbl);
      stats.appendChild(stat);
    });
    card.appendChild(stats);

    // Disclaimer
    var disc = createEl("div", "chatbot-report-disclaimer");
    disc.textContent = report.disclaimer;
    card.appendChild(disc);

    addRawElement(card);
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

    addRawElement(card);
  }

  // ── Follow-up suggestions ──

  function renderFollowupSuggestions(diseaseLabel) {
    var container = createEl("div", "chatbot-msg chatbot-msg-assistant chatbot-followup-suggestions");
    var label = createEl("div", "chatbot-followup-label");
    label.textContent = "You can ask follow-up questions:";
    container.appendChild(label);

    var grid = createEl("div", "chatbot-followup-grid");
    var suggestions = [
      "What pathways are involved?",
      "Where do similar patients cluster?",
      "What are the top risk factors?",
    ];
    suggestions.forEach(function (text) {
      var btn = createEl("button", "chatbot-followup-btn");
      btn.textContent = text;
      btn.addEventListener("click", function () {
        grid.querySelectorAll(".chatbot-followup-btn").forEach(function (b) {
          b.disabled = true;
        });
        input.value = text;
        send();
      });
      grid.appendChild(btn);
    });
    container.appendChild(grid);
    addRawElement(container);
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

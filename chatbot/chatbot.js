(function () {
  "use strict";

  var API_URL = "https://patirckistc-report-web.hf.space";

  var history = [];
  var busy = false;

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

    fetch(API_URL + "/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, history: history.slice(0, -1) }),
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

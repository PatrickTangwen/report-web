const assert = require("node:assert/strict");
const test = require("node:test");

const assistantShell = require("./assistant-shell.js");


function memoryStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    },
  };
}


test("opening the Assistant for the first time has no active task and shows the menu", () => {
  const storage = memoryStorage();
  const shell = assistantShell.create(storage);

  assert.equal(shell.getState().activeTask, null);
});


test("selecting a Research Task routes into that task and persists it tab-scoped", () => {
  const storage = memoryStorage();
  const shell = assistantShell.create(storage);

  shell.selectTask("paper");

  assert.equal(shell.getState().activeTask, "paper");
  assert.equal(storage.getItem(assistantShell.STORAGE_KEY), "paper");
});


test("closing and reopening the Assistant resumes the previously active task", () => {
  const storage = memoryStorage();
  assistantShell.create(storage).selectTask("profile");

  const reopened = assistantShell.create(storage);

  assert.equal(reopened.getState().activeTask, "profile");
});


test("Back to tasks returns to the menu without touching unrelated tab-scoped sessions", () => {
  const storage = memoryStorage();
  storage.setItem("aligatehr-demo-profile-session", "unrelated profile session");
  storage.setItem("aligatehr-chatbot-shell-v1-paper-history", "unrelated paper history");
  const shell = assistantShell.create(storage);
  shell.selectTask("visualizations");

  shell.backToTasks();

  assert.equal(shell.getState().activeTask, null);
  assert.equal(storage.getItem(assistantShell.STORAGE_KEY), null);
  assert.equal(
    storage.getItem("aligatehr-demo-profile-session"),
    "unrelated profile session",
  );
  assert.equal(
    storage.getItem("aligatehr-chatbot-shell-v1-paper-history"),
    "unrelated paper history",
  );
});


test("switching between tasks preserves that a task was selected across the current tab", () => {
  const storage = memoryStorage();
  const shell = assistantShell.create(storage);

  shell.selectTask("paper");
  shell.backToTasks();
  shell.selectTask("visualizations");

  assert.equal(assistantShell.create(storage).getState().activeTask, "visualizations");
});


test("selecting an unsupported task is rejected rather than silently routed", () => {
  const storage = memoryStorage();
  const shell = assistantShell.create(storage);

  assert.throws(() => shell.selectTask("not-a-real-task"));
  assert.equal(shell.getState().activeTask, null);
});


test("a corrupted or superseded stored task falls back to the menu", () => {
  const storage = memoryStorage();
  storage.setItem(assistantShell.STORAGE_KEY, "legacy-chat-intent");

  const shell = assistantShell.create(storage);

  assert.equal(shell.getState().activeTask, null);
  assert.equal(storage.getItem(assistantShell.STORAGE_KEY), null);
});

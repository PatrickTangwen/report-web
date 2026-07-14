(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.ALIGATEHR_ASSISTANT_SHELL = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  var STORAGE_KEY = "aligatehr-assistant-shell-active-task";
  var TASKS = ["paper", "visualizations", "profile"];

  function initialState() {
    return { activeTask: null };
  }

  function restore(storage) {
    var raw = storage.getItem(STORAGE_KEY);
    if (raw && TASKS.indexOf(raw) !== -1) {
      return { activeTask: raw };
    }
    if (raw) storage.removeItem(STORAGE_KEY);
    return initialState();
  }

  function create(storage) {
    var state = restore(storage);

    return {
      getState: function () {
        return state;
      },
      selectTask: function (task) {
        if (TASKS.indexOf(task) === -1) {
          throw new Error("Unsupported Research Task: " + task);
        }
        state = { activeTask: task };
        storage.setItem(STORAGE_KEY, task);
        return state;
      },
      backToTasks: function () {
        state = initialState();
        storage.removeItem(STORAGE_KEY);
        return state;
      },
    };
  }

  return {
    STORAGE_KEY: STORAGE_KEY,
    TASKS: TASKS,
    create: create,
  };
});

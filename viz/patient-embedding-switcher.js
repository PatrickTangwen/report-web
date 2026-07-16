export async function createPatientEmbeddingSwitcher(config) {
  const options = config.options;
  const optionByKey = new Map(options.map((option) => [option.key, option]));
  if (optionByKey.size !== options.length) {
    throw new Error("Patient embedding switcher keys must be unique");
  }
  if (!optionByKey.has(config.initialKey)) {
    throw new Error("Patient embedding switcher initial key is unavailable");
  }

  const shell = document.createElement("section");
  shell.className = "patient-embedding-switcher";

  const controls = document.createElement("div");
  controls.className = "patient-embedding-switcher-controls";
  const label = document.createElement("span");
  label.className = "patient-embedding-switcher-label";
  label.textContent = config.label;
  const actions = document.createElement("div");
  actions.className = "patient-embedding-switcher-actions";
  actions.setAttribute("role", "group");
  actions.setAttribute("aria-label", config.label);
  controls.append(label, actions);

  const panel = document.createElement("div");
  panel.className = "patient-embedding-switcher-panel";
  panel.setAttribute("aria-live", "polite");
  shell.append(controls, panel);

  const buttons = new Map();
  const views = new Map();
  let activeKey = null;
  let selectionVersion = 0;

  function updateButtons(key) {
    buttons.forEach((button, buttonKey) => {
      const isActive = buttonKey === key;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
  }

  async function viewFor(key) {
    if (!views.has(key)) {
      const option = optionByKey.get(key);
      views.set(key, Promise.resolve().then(() => option.create()));
    }
    return views.get(key);
  }

  async function select(key) {
    if (!optionByKey.has(key)) return false;
    if (activeKey === key && panel.children.length > 0) return true;
    activeKey = key;
    const version = ++selectionVersion;
    updateButtons(key);
    panel.setAttribute("aria-busy", "true");

    try {
      const view = await viewFor(key);
      if (version !== selectionVersion) return true;
      panel.replaceChildren(view);
      panel.removeAttribute("aria-busy");
      return true;
    } catch (error) {
      views.delete(key);
      if (version !== selectionVersion) return false;
      const message = document.createElement("p");
      message.className = "embedding-load-state embedding-load-error";
      message.textContent = `Unable to load the ${optionByKey.get(key).label} embedding.`;
      panel.replaceChildren(message);
      panel.removeAttribute("aria-busy");
      throw error;
    }
  }

  options.forEach((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "patient-embedding-switcher-button";
    button.textContent = option.label;
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", () => {
      select(option.key).catch((error) => console.error(error));
    });
    actions.appendChild(button);
    buttons.set(option.key, button);
  });

  shell.selectEmbedding = select;
  await select(config.initialKey);
  return shell;
}

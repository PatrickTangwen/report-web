export function highlightOpacity(group, activeGroup, dimOpacity = 0.16) {
  return activeGroup === null || group === activeGroup ? 1 : dimOpacity;
}


export function createHighlightController(groupKeys, apply) {
  const groups = new Set(groupKeys);
  let pinned = null;
  let hovered = null;

  function validate(group) {
    if (!groups.has(group)) {
      throw new Error(`Unknown highlight group: ${group}`);
    }
  }

  function render() {
    apply(hovered ?? pinned);
  }

  return {
    hover(group) {
      validate(group);
      hovered = group;
      render();
    },
    leave(group) {
      validate(group);
      if (hovered !== group) return;
      hovered = null;
      render();
    },
    toggle(group) {
      validate(group);
      pinned = pinned === group ? null : group;
      render();
    },
    clear() {
      pinned = null;
      hovered = null;
      render();
    },
    active() {
      return hovered ?? pinned;
    },
    pinned() {
      return pinned;
    },
  };
}


export function bindHighlightTarget(element, group, controller) {
  const enter = () => controller.hover(group);
  const leave = () => controller.leave(group);
  const toggle = (event) => {
    event?.preventDefault?.();
    controller.toggle(group);
  };
  const keydown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      toggle(event);
    } else if (event.key === "Escape") {
      event.preventDefault();
      controller.clear();
    }
  };

  element.addEventListener("pointerenter", enter);
  element.addEventListener("pointerleave", leave);
  element.addEventListener("focus", enter);
  element.addEventListener("blur", leave);
  element.addEventListener("click", toggle);
  element.addEventListener("keydown", keydown);

  return () => {
    element.removeEventListener("pointerenter", enter);
    element.removeEventListener("pointerleave", leave);
    element.removeEventListener("focus", enter);
    element.removeEventListener("blur", leave);
    element.removeEventListener("click", toggle);
    element.removeEventListener("keydown", keydown);
  };
}

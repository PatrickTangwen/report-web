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
    apply(pinned ?? hovered);
  }

  return {
    hover(group) {
      validate(group);
      if (pinned !== null) return;
      hovered = group;
      render();
    },
    leave(group) {
      validate(group);
      if (pinned !== null) return;
      if (hovered !== group) return;
      hovered = null;
      render();
    },
    toggle(group) {
      validate(group);
      pinned = pinned === group ? null : group;
      hovered = null;
      render();
    },
    select(group) {
      validate(group);
      pinned = group;
      hovered = null;
      render();
    },
    clear() {
      pinned = null;
      hovered = null;
      render();
    },
    active() {
      return pinned ?? hovered;
    },
    pinned() {
      return pinned;
    },
  };
}


export function bindHighlightTarget(element, group, controller, options = {}) {
  const enter = () => controller.hover(group);
  const leave = () => controller.leave(group);
  const toggle = (event) => {
    event?.preventDefault?.();
    if (options.persistent) controller.select(group);
    else controller.toggle(group);
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


export function bindSingleMarkTooltip(targets, tooltip, htmlForIndex) {
  const marks = [...targets];
  let activeMark = null;

  function position(event) {
    const maxLeft = window.innerWidth - tooltip.offsetWidth - 8;
    const maxTop = window.innerHeight - tooltip.offsetHeight - 8;
    tooltip.style.left = `${Math.max(8, Math.min(event.clientX + 12, maxLeft))}px`;
    tooltip.style.top = `${Math.max(8, Math.min(event.clientY + 12, maxTop))}px`;
  }

  const listeners = marks.map((mark, index) => {
    const enter = (event) => {
      activeMark = mark;
      tooltip.innerHTML = htmlForIndex(index);
      tooltip.style.display = "block";
      position(event);
    };
    const move = (event) => {
      if (activeMark === mark) position(event);
    };
    const leave = () => {
      if (activeMark !== mark) return;
      activeMark = null;
      tooltip.style.display = "none";
    };
    mark.addEventListener("mouseenter", enter);
    mark.addEventListener("mousemove", move);
    mark.addEventListener("mouseleave", leave);
    return { mark, enter, move, leave };
  });

  return () => {
    listeners.forEach(({ mark, enter, move, leave }) => {
      mark.removeEventListener("mouseenter", enter);
      mark.removeEventListener("mousemove", move);
      mark.removeEventListener("mouseleave", leave);
    });
  };
}


export function bindHighlightGroups(config) {
  const groupKeys = config.groupKeys;
  const targetsByGroup = config.targetsByGroup;
  const actionsByGroup = config.actionsByGroup || new Map();
  const labelForGroup = config.labelForGroup || ((group) => `Highlight ${group}`);
  let controller;

  controller = createHighlightController(groupKeys, (activeGroup) => {
    groupKeys.forEach((group) => {
      const isActive = group === activeGroup;
      (targetsByGroup.get(group) || []).forEach((target) => {
        target.style.opacity = highlightOpacity(
          group,
          activeGroup,
          config.dimOpacity,
        );
        target.setAttribute("aria-pressed", String(controller.pinned() === group));
      });
      const action = actionsByGroup.get(group);
      if (!action) return;
      action.classList.toggle("is-active", isActive);
      action.classList.toggle("is-muted", activeGroup !== null && !isActive);
      action.setAttribute("aria-pressed", String(controller.pinned() === group));
    });
  });

  groupKeys.forEach((group) => {
    const action = actionsByGroup.get(group);
    if (action) bindHighlightTarget(action, group, controller);
    (targetsByGroup.get(group) || []).forEach((target) => {
      target.setAttribute("tabindex", "0");
      target.setAttribute("role", "button");
      target.setAttribute("aria-label", labelForGroup(group));
      target.setAttribute("aria-pressed", "false");
      bindHighlightTarget(target, group, controller);
    });
  });

  return controller;
}

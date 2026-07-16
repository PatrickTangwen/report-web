export class FakeElement extends EventTarget {
  constructor(tagName = "div") {
    super();
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.attributes = new Map();
    this.parentNode = null;
    this.rectHeight = 0;
    this.style = {
      removeProperty: (property) => delete this.style[property],
    };
    const classes = new Set();
    this.classList = {
      add: (name) => classes.add(name),
      remove: (name) => classes.delete(name),
      contains: (name) => classes.has(name),
      toggle: (name, enabled) => enabled ? classes.add(name) : classes.delete(name),
    };
  }

  append(...children) {
    children.forEach((child) => this.appendChild(child));
  }

  appendChild(child) {
    this.children.push(child);
    if (child && typeof child === "object") child.parentNode = this;
    return child;
  }

  replaceChildren(...children) {
    this.children = [];
    children.forEach((child) => this.appendChild(child));
  }

  remove() {
    if (!this.parentNode) return;
    this.parentNode.children = this.parentNode.children.filter((child) => child !== this);
    this.parentNode = null;
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }

  removeAttribute(name) {
    this.attributes.delete(name);
  }

  getBoundingClientRect() {
    return { height: this.rectHeight, left: 0, right: 1000, top: 0, bottom: 620 };
  }
}


export function fakeDocument(options = {}) {
  return {
    body: new FakeElement("body"),
    documentElement: {
      clientWidth: options.clientWidth || 1200,
      clientHeight: options.clientHeight || 900,
    },
    createElement: (tagName) => {
      const element = new FakeElement(tagName);
      if (tagName === "section") element.rectHeight = options.shellHeight || 0;
      return element;
    },
    createTextNode: (text) => ({ textContent: text }),
    querySelector: () => null,
  };
}

import assert from "node:assert/strict";
import test from "node:test";

import { createPatientEmbeddingSwitcher } from "./patient-embedding-switcher.js";
import { FakeElement, fakeDocument } from "./test-dom.mjs";


test("patient embedding buttons switch views and reuse initialized plots", async () => {
  const originalDocument = globalThis.document;
  globalThis.document = fakeDocument();
  const created = { sex: 0, age: 0 };

  try {
    const sexView = new FakeElement("section");
    const ageView = new FakeElement("section");
    const switcher = await createPatientEmbeddingSwitcher({
      label: "Colour patient embeddings by",
      initialKey: "sex",
      options: [
        { key: "sex", label: "Sex", create: () => { created.sex += 1; return sexView; } },
        { key: "age", label: "Age", create: () => { created.age += 1; return ageView; } },
      ],
    });

    const controls = switcher.children[0];
    const buttons = controls.children[1].children;
    const panel = switcher.children[1];
    assert.deepEqual(created, { sex: 1, age: 0 });
    assert.equal(panel.children[0], sexView);
    assert.equal(buttons[0].getAttribute("aria-pressed"), "true");
    assert.equal(buttons[1].getAttribute("aria-pressed"), "false");

    buttons[1].dispatchEvent(new Event("click"));
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.deepEqual(created, { sex: 1, age: 1 });
    assert.equal(panel.children[0], ageView);
    assert.equal(buttons[0].getAttribute("aria-pressed"), "false");
    assert.equal(buttons[1].getAttribute("aria-pressed"), "true");

    buttons[0].dispatchEvent(new Event("click"));
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.deepEqual(created, { sex: 1, age: 1 });
    assert.equal(panel.children[0], sexView);
  } finally {
    globalThis.document = originalDocument;
  }
});

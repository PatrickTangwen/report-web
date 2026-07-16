import assert from "node:assert/strict";
import test from "node:test";

import {
  createRendererQueue,
  createRunController,
} from "./embedding-scatter.js";


test("run controller deterministically cancels an active render", () => {
  const controller = createRunController();
  const first = controller.start();
  assert.equal(controller.isCurrent(first), true);

  controller.cancel();

  assert.equal(controller.isCurrent(first), false);
  const second = controller.start();
  assert.equal(controller.isCurrent(second), true);
});


test("renderer queue applies the latest state after in-flight work", async () => {
  const queue = createRendererQueue();
  const writes = [];
  let releaseStale;
  let markStarted;
  const started = new Promise((resolve) => {
    markStarted = resolve;
  });
  const stale = queue.run(() => new Promise((resolve) => {
    releaseStale = () => {
      writes.push("stale highlight");
      resolve();
    };
    markStarted();
  }));
  const latest = queue.run(() => {
    writes.push("latest group");
  });

  await started;
  releaseStale();
  await Promise.all([stale, latest]);
  assert.deepEqual(writes, ["stale highlight", "latest group"]);
});

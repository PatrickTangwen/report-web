import assert from "node:assert/strict";
import test from "node:test";

import {
  patientHighlightOptions,
} from "./patient-embedding-explorer.js";


test("patient group highlighting keeps selected points at the normal overview size", () => {
  assert.deepEqual(patientHighlightOptions("#4a90d9"), {
    pointColor: ["#aeb7c2", "#4a90d9"],
    opacity: [0.16, 0.95],
    pointSize: [2, 2.5],
    select: false,
  });
});

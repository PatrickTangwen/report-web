import assert from "node:assert/strict";
import test from "node:test";

import {
  patientGroupAssignments,
  patientHighlightOptions,
} from "./patient-embedding-explorer.js";


test("patient groups map every configured index to its exact display group", () => {
  assert.deepEqual(
    patientGroupAssignments(5, [
      { indices: [0, 3] },
      { indices: [1, 2, 4] },
    ]),
    [0, 1, 1, 0, 1],
  );
});


test("patient group highlighting keeps selected points at the normal overview size", () => {
  assert.deepEqual(patientHighlightOptions("#4a90d9"), {
    pointColor: ["#aeb7c2", "#4a90d9"],
    opacity: [0.16, 0.95],
    pointSize: [2, 2.5],
    select: false,
  });
});

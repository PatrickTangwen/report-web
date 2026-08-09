import { describe, expect, it, vi } from "vitest";

import {
  REMOTE_API_URL,
  getResearchDataMetadata,
  requestJson,
  resolveApiUrl,
} from "./assistant-api";


describe("assistant API", () => {
  it("uses the local backend only for loopback previews", () => {
    expect(resolveApiUrl({ hostname: "localhost" })).toBe("http://127.0.0.1:7860");
    expect(resolveApiUrl({ hostname: "patricktangwen.github.io" })).toBe(REMOTE_API_URL);
    expect(resolveApiUrl({ hostname: "localhost" }, "https://example.test")).toBe("https://example.test");
  });

  it("fetches the typed research release metadata endpoint", async () => {
    const payload = {
      schema_version: "research-data-release-v1",
      dataset_version: "research-results-mock-v1",
      released_on: "2026-06-23",
      status: "mock",
      description: "Synthetic data",
      datasets: {},
    } as const;
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify(payload)));
    await expect(getResearchDataMetadata(fetchImpl, "https://api.test")).resolves.toEqual(payload);
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.test/research-data/metadata",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("turns non-success responses into explicit backend errors", async () => {
    const fetchImpl = vi.fn(async () => new Response("", { status: 503 }));
    await expect(requestJson(fetchImpl, "https://api.test/health")).rejects.toThrow(
      "Backend returned 503",
    );
  });
});

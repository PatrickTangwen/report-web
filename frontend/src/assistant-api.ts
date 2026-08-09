import type { ResearchDataMetadataResponse } from "../generated/client/types.gen";

export const LOCAL_API_URL = "http://127.0.0.1:7860";
export const REMOTE_API_URL = "https://aligatehr-gen-backend.onrender.com";

export interface LocationLike {
  hostname?: string;
}

export type ResearchDataMetadata = ResearchDataMetadataResponse;

export function resolveApiUrl(locationLike?: LocationLike, override?: string): string {
  if (override) return override;
  const hostname = locationLike?.hostname;
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1"
    ? LOCAL_API_URL
    : REMOTE_API_URL;
}

export async function requestJson<T>(
  fetchImpl: typeof fetch,
  url: string,
  options: RequestInit = {},
  timeoutMs = 30_000,
): Promise<T> {
  const requestOptions = { ...options };
  const externalSignal = requestOptions.signal;
  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort(new Error("Backend request timed out"));
  }, timeoutMs);
  const cancelFromExternal = () => {
    controller.abort(externalSignal?.reason || new Error("Request cancelled"));
  };
  if (externalSignal) {
    if (externalSignal.aborted) cancelFromExternal();
    else externalSignal.addEventListener("abort", cancelFromExternal, { once: true });
  }
  requestOptions.signal = controller.signal;

  try {
    const response = await fetchImpl(url, requestOptions);
    if (!response.ok) throw new Error(`Backend returned ${response.status}`);
    return (await response.json()) as T;
  } catch (error) {
    if (timedOut) throw new Error("Backend request timed out. Retry when ready.");
    throw error;
  } finally {
    clearTimeout(timeout);
    externalSignal?.removeEventListener("abort", cancelFromExternal);
  }
}

export function getResearchDataMetadata(
  fetchImpl: typeof fetch,
  apiUrl: string,
): Promise<ResearchDataMetadata> {
  return requestJson(fetchImpl, `${apiUrl}/research-data/metadata`);
}

// src/lib/api/tours/utils.ts
//
// Shared parsing for every tour endpoint. The Java service returns the same
// envelope for every route: { success, message, data, code? }. When a
// request fails we hand the payload to resolveApiError so the caller gets a
// sentence it can show, not a raw "Validation failed".

import { apiRequest } from "@/lib/apiRequest";
import { resolveApiError } from "@/lib/errors";

interface ApiEnvelope<TData> {
  success: boolean;
  message: string;
  data: TData;
  code?: string;
}

function isApiEnvelope(value: unknown): value is ApiEnvelope<unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    "success" in value &&
    "message" in value
  );
}

export async function parseEnvelope<TData>(
  response: Response,
): Promise<ApiEnvelope<TData>> {
  const data: unknown = await response.json().catch(() => null);

  if (!isApiEnvelope(data)) {
    throw new Error("Unexpected response from server");
  }

  if (!response.ok || !data.success) {
    throw new Error(resolveApiError(data, data.message || "Request failed"));
  }

  return data as ApiEnvelope<TData>;
}

/**
 * Tour endpoints go through the same-origin Next.js proxy, so auth travels
 * on the session cookie. This helper calls apiRequest and parses the
 * envelope, surfacing the server's own message on failure.
 */
export async function tourRequest<TData>(
  path: string,
  init?: RequestInit,
): Promise<TData> {
  const response = await apiRequest(path, init);
  const envelope = await parseEnvelope<TData>(response);
  return envelope.data;
}

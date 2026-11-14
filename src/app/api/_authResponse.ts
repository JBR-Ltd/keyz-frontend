import "server-only";

import { setSessionCookie } from "@/app/api/_session";
import { requestIdHeader } from "@/app/api/_requestId";

interface AuthData {
  accessToken?: unknown;
  expiresAt?: unknown;
  [key: string]: unknown;
}

interface AuthEnvelope {
  data?: AuthData | null;
  [key: string]: unknown;
}

function isAuthEnvelope(value: unknown): value is AuthEnvelope {
  return value !== null && typeof value === "object";
}

export async function browserAuthResponse(
  response: Response,
): Promise<Response> {
  const contentType = response.headers.get("Content-Type") ?? "application/json";
  const responseHeaders = {
    "Cache-Control": "no-store",
    "Content-Type": contentType,
    ...requestIdHeader(response),
  };
  const body = await response.text();

  if (!body || !contentType.includes("application/json")) {
    return new Response(body || null, {
      status: response.status,
      headers: responseHeaders,
    });
  }

  let payload: unknown;

  try {
    payload = JSON.parse(body);
  } catch {
    return new Response(body, {
      status: response.status,
      headers: responseHeaders,
    });
  }

  if (!response.ok || !isAuthEnvelope(payload) || !payload.data) {
    return Response.json(payload, {
      status: response.status,
      headers: responseHeaders,
    });
  }

  const { accessToken, expiresAt, ...safeData } = payload.data;

  if (typeof accessToken === "string" && accessToken) {
    await setSessionCookie(accessToken, {
      expiresAt: typeof expiresAt === "string" ? expiresAt : undefined,
    });
  }

  return Response.json(
    { ...payload, data: { ...safeData, expiresAt } },
    { status: response.status, headers: responseHeaders },
  );
}

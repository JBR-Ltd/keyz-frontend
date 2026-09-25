import { browserAuthResponse } from "@/app/api/_authResponse";
import { rejectCrossSiteMutation } from "@/app/api/_csrf";
import { getSessionToken } from "@/app/api/_session";
import { requestIdHeader } from "@/app/api/_requestId";

const API_BASE_URL = process.env.API_BASE_URL;
const REQUEST_TIMEOUT_MS = 60000;

/** Only these three exist upstream, so nothing else is forwarded. */
const ACTIONS = new Set(["verify", "start", "enable", "disable"]);

interface RouteContext {
  params: Promise<{ action: string }>;
}

export async function POST(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const rejected = rejectCrossSiteMutation(request);

  if (rejected) {
    return rejected;
  }

  const { action } = await context.params;

  if (!ACTIONS.has(action)) {
    return Response.json(
      { success: false, message: "Unknown request.", data: null },
      { status: 404 },
    );
  }

  if (!API_BASE_URL) {
    return Response.json(
      {
        success: false,
        message: "API_BASE_URL is not configured.",
        data: null,
      },
      { status: 500 },
    );
  }

  // Finishing a sign-in has no session yet; the other three are account settings
  const token = action === "verify" ? null : await getSessionToken();

  if (action !== "verify" && !token) {
    return Response.json(
      { success: false, message: "Authorization is required.", data: null },
      { status: 401 },
    );
  }

  const controller = new AbortController();
  const timeout = globalThis.setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS,
  );

  try {
    const response = await fetch(
      `${API_BASE_URL.replace(/\/$/, "")}/api/auth/2fa/${action}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          "X-Device-Fingerprint":
            request.headers.get("X-Device-Fingerprint") ?? "",
        },
        body: await request.text(),
        signal: controller.signal,
      },
    );
    const body = await response.text();

    const browserResponse = new Response(body || null, {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("Content-Type") ?? "application/json",
        ...requestIdHeader(response),
      },
    });

    return action === "verify"
      ? browserAuthResponse(browserResponse)
      : browserResponse;
  } catch {
    return Response.json(
      {
        success: false,
        message: "Unable to reach the authentication server right now.",
        data: null,
      },
      { status: 502 },
    );
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

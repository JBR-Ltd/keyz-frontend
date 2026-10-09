import { browserAuthResponse } from "@/app/api/_authResponse";
import { rejectCrossSiteMutation } from "@/app/api/_csrf";

const API_BASE_URL = process.env.API_BASE_URL;
const AUTH_REQUEST_TIMEOUT_MS = 90000;

interface TimeoutSignal {
  signal: AbortSignal;
  cancel: () => void;
}

function getBackendUrl(path: string): string | null {
  return API_BASE_URL ? `${API_BASE_URL.replace(/\/$/, "")}${path}` : null;
}

function createTimeoutSignal(): TimeoutSignal {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => {
    controller.abort();
  }, AUTH_REQUEST_TIMEOUT_MS);

  return {
    signal: controller.signal,
    cancel: () => globalThis.clearTimeout(timeout),
  };
}

async function proxyJsonResponse(response: Response): Promise<Response> {
  const body = await response.text();
  const contentType =
    response.headers.get("Content-Type") ?? "application/json";

  if (!response.ok) {
    console.error("Auth proxy request failed", {
      endpoint: "/api/auth/verify-email",
      status: response.status,
    });

    if (!body) {
      return Response.json(
        {
          success: false,
          message: "Authentication server returned an empty error response.",
          data: null,
        },
        { status: response.status },
      );
    }

    if (!contentType.includes("application/json")) {
      return Response.json(
        {
          success: false,
          message: body,
          data: null,
        },
        { status: response.status },
      );
    }
  }

  return browserAuthResponse(
    new Response(body || null, {
      status: response.status,
      headers: {
        "Content-Type": contentType,
      },
    }),
  );
}

export async function POST(request: Request): Promise<Response> {
  const rejected = rejectCrossSiteMutation(request);

  if (rejected) {
    return rejected;
  }

  const backendUrl = getBackendUrl("/api/auth/verify-email");

  if (!backendUrl) {
    return Response.json(
      {
        success: false,
        message: "API_BASE_URL is not configured.",
        data: null,
      },
      { status: 500 },
    );
  }

  const timeout = createTimeoutSignal();
  const body = await request.text();

  try {
    const response = await fetch(backendUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: timeout.signal,
      body,
    });

    return proxyJsonResponse(response);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return Response.json(
        {
          success: false,
          message: "Authentication server timed out. Please try again.",
          data: null,
        },
        { status: 504 },
      );
    }

    console.error("Auth proxy request could not reach backend", {
      endpoint: "/api/auth/verify-email",
      error,
    });

    return Response.json(
      {
        success: false,
        message: "Unable to reach the authentication server right now.",
        data: null,
      },
      { status: 502 },
    );
  } finally {
    timeout.cancel();
  }
}

const API_BASE_URL = process.env.API_BASE_URL;
const VERIFICATION_REQUEST_TIMEOUT_MS = 45000;

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
  }, VERIFICATION_REQUEST_TIMEOUT_MS);

  return {
    signal: controller.signal,
    cancel: () => globalThis.clearTimeout(timeout),
  };
}

async function proxyJsonResponse(
  response: Response,
  backendUrl: string,
): Promise<Response> {
  const body = await response.text();
  const contentType =
    response.headers.get("Content-Type") ?? "application/json";

  if (!response.ok) {
    console.error("Verification proxy request failed", {
      backendUrl,
      status: response.status,
      body: body || null,
    });

    if (!body) {
      return Response.json(
        {
          success: false,
          message: "Verification server returned an empty error response.",
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

  return new Response(body || null, {
    status: response.status,
    headers: {
      "Content-Type": contentType,
    },
  });
}

function getAuthorizationHeader(request: Request): string | null {
  const authorization = request.headers.get("Authorization");

  return authorization?.startsWith("Bearer ") ? authorization : null;
}

export async function POST(request: Request): Promise<Response> {
  const authorization = getAuthorizationHeader(request);

  if (!authorization) {
    return Response.json(
      { success: false, message: "Missing authorization token.", data: null },
      { status: 401 },
    );
  }

  const requestUrl = new URL(request.url);
  const backendUrl = getBackendUrl(
    `/api/verification/smileid/bvn${requestUrl.search}`,
  );

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

  try {
    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        Authorization: authorization,
      },
      signal: timeout.signal,
    });

    return proxyJsonResponse(response, backendUrl);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return Response.json(
        {
          success: false,
          message: "BVN verification timed out. Please try again.",
          data: null,
        },
        { status: 504 },
      );
    }

    console.error("Verification proxy request could not reach backend", {
      backendUrl,
      error,
    });

    return Response.json(
      {
        success: false,
        message: "Unable to reach the verification server right now.",
        data: null,
      },
      { status: 502 },
    );
  } finally {
    timeout.cancel();
  }
}

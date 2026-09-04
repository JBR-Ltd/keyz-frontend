const API_BASE_URL = process.env.API_BASE_URL;
const VERIFICATION_REQUEST_TIMEOUT_MS = 90000;

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

export async function POST(request: Request): Promise<Response> {
  const requestUrl = new URL(request.url);
  const backendUrl = getBackendUrl(
    `/api/verification/property/verify${requestUrl.search}`,
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

  const authorization = request.headers.get("Authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return Response.json(
      {
        success: false,
        message: "Your session has expired. Log in again.",
        data: null,
      },
      { status: 401 },
    );
  }

  const contentType = request.headers.get("Content-Type");
  const timeout = createTimeoutSignal();

  try {
    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        Authorization: authorization,
        ...(contentType ? { "Content-Type": contentType } : {}),
      },
      body: await request.arrayBuffer(),
      signal: timeout.signal,
    });

    const body = await response.text();

    return new Response(body || null, {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("Content-Type") ?? "application/json",
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return Response.json(
        {
          success: false,
          message: "Verification timed out. Please try again.",
          data: null,
        },
        { status: 504 },
      );
    }

    console.error("Property verification proxy could not reach backend", {
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

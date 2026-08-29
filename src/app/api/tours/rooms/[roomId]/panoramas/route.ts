const API_BASE_URL = process.env.API_BASE_URL;
const REQUEST_TIMEOUT_MS = 15000;

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
  }, REQUEST_TIMEOUT_MS);

  return {
    signal: controller.signal,
    cancel: () => globalThis.clearTimeout(timeout),
  };
}

async function proxyJsonResponse(response: Response, backendUrl: string): Promise<Response> {
  const body = await response.text();
  const contentType = response.headers.get("Content-Type") ?? "application/json";

  if (!response.ok && !body) {
    console.error("Tours proxy request failed", { backendUrl, status: response.status });

    return Response.json(
      { success: false, message: "Backend server returned an empty error response.", data: null },
      { status: response.status },
    );
  }

  return new Response(body || null, {
    status: response.status,
    headers: { "Content-Type": contentType },
  });
}

interface RouteParams {
  params: Promise<{ roomId: string }>;
}

export async function POST(request: Request, { params }: RouteParams): Promise<Response> {
  const { roomId } = await params;
  const backendUrl = getBackendUrl(`/api/tours/rooms/${roomId}/panoramas`);

  if (!backendUrl) {
    return Response.json(
      { success: false, message: "API_BASE_URL is not configured.", data: null },
      { status: 500 },
    );
  }

  const authorization = request.headers.get("Authorization") ?? "";
  const contentType = request.headers.get("Content-Type") ?? "";
  // Read as ArrayBuffer, not text, so the multipart boundary and binary
  // image bytes forward to the backend unmodified.
  const body = await request.arrayBuffer();
  const timeout = createTimeoutSignal();

  try {
    const response = await fetch(backendUrl, {
      method: "POST",
      headers: { "Content-Type": contentType, Authorization: authorization },
      signal: timeout.signal,
      body,
    });

    return proxyJsonResponse(response, backendUrl);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return Response.json(
        { success: false, message: "Backend request timed out. Please try again.", data: null },
        { status: 504 },
      );
    }

    return Response.json(
      { success: false, message: "Unable to reach the backend server right now.", data: null },
      { status: 502 },
    );
  } finally {
    timeout.cancel();
  }
}

export async function GET(request: Request, { params }: RouteParams): Promise<Response> {
  const { roomId } = await params;
  const backendUrl = getBackendUrl(`/api/tours/rooms/${roomId}/panoramas`);

  if (!backendUrl) {
    return Response.json(
      { success: false, message: "API_BASE_URL is not configured.", data: null },
      { status: 500 },
    );
  }

  const authorization = request.headers.get("Authorization") ?? "";
  const timeout = createTimeoutSignal();

  try {
    const response = await fetch(backendUrl, {
      method: "GET",
      headers: { Authorization: authorization },
      signal: timeout.signal,
    });

    return proxyJsonResponse(response, backendUrl);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return Response.json(
        { success: false, message: "Backend request timed out. Please try again.", data: null },
        { status: 504 },
      );
    }

    return Response.json(
      { success: false, message: "Unable to reach the backend server right now.", data: null },
      { status: 502 },
    );
  } finally {
    timeout.cancel();
  }
}
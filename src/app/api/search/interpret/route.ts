const API_BASE_URL = process.env.API_BASE_URL;
const SEARCH_REQUEST_TIMEOUT_MS = 30000;

/** Public proxy: the backend searches the same public catalogue, so no session is needed. */
export async function POST(request: Request): Promise<Response> {
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

  const search = new URL(request.url).search;
  const backendUrl = `${API_BASE_URL.replace(/\/$/, "")}/api/search/interpret${search}`;

  const controller = new AbortController();
  const timeout = globalThis.setTimeout(
    () => controller.abort(),
    SEARCH_REQUEST_TIMEOUT_MS,
  );

  try {
    const response = await fetch(backendUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: await request.text(),
      signal: controller.signal,
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
          message: "The search server timed out. Please try again.",
          data: null,
        },
        { status: 504 },
      );
    }

    return Response.json(
      {
        success: false,
        message: "Unable to reach the property server right now.",
        data: null,
      },
      { status: 502 },
    );
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

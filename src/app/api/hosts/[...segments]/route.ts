import { cacheHeaders, requestIdHeader } from "@/app/api/_requestId";

const API_BASE_URL = process.env.API_BASE_URL;
const HOST_REQUEST_TIMEOUT_MS = 30000;

interface RouteContext {
  params: Promise<{ segments: string[] }>;
}

/** Public proxy: host profiles must load for logged-out visitors. */
export async function GET(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  if (!API_BASE_URL) {
    return Response.json(
      { success: false, message: "API_BASE_URL is not configured.", data: null },
      { status: 500 },
    );
  }

  const { segments } = await context.params;
  const search = new URL(request.url).search;
  const backendUrl = `${API_BASE_URL.replace(/\/$/, "")}/api/hosts/${segments
    .map(encodeURIComponent)
    .join("/")}${search}`;

  const controller = new AbortController();
  const timeout = globalThis.setTimeout(
    () => controller.abort(),
    HOST_REQUEST_TIMEOUT_MS,
  );

  try {
    const ifNoneMatch = request.headers.get("If-None-Match");
    const response = await fetch(backendUrl, {
      headers: ifNoneMatch ? { "If-None-Match": ifNoneMatch } : undefined,
      signal: controller.signal,
    });

    // Unchanged since the browser's copy: pass the 304 on, with no body to read
    if (response.status === 304) {
      return new Response(null, {
        status: 304,
        headers: { ...requestIdHeader(response), ...cacheHeaders(response) },
      });
    }

    const body = await response.text();

    return new Response(body || null, {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("Content-Type") ?? "application/json",
        ...requestIdHeader(response),
        ...cacheHeaders(response),
      },
    });
  } catch {
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

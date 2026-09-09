const API_BASE_URL = process.env.API_BASE_URL;
const DRAFT_REQUEST_TIMEOUT_MS = 90000;

type DraftMethod = "DELETE" | "GET" | "PATCH" | "POST";

interface RouteContext {
  params: Promise<{ segments: string[] }>;
}

/**
 * Forwards the body as bytes rather than text.
 *
 * The shared authenticated proxy reads bodies with `request.text()`, which corrupts
 * a multipart upload. Draft photo uploads go through here, so this route handles
 * its own forwarding.
 */
async function handle(
  request: Request,
  context: RouteContext,
  method: DraftMethod,
): Promise<Response> {
  if (!API_BASE_URL) {
    return Response.json(
      { success: false, message: "API_BASE_URL is not configured.", data: null },
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

  const { segments } = await context.params;
  const search = new URL(request.url).search;
  const path = segments.map(encodeURIComponent).join("/");
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(
    () => controller.abort(),
    DRAFT_REQUEST_TIMEOUT_MS,
  );

  try {
    const contentType = request.headers.get("Content-Type");
    const response = await fetch(
      `${API_BASE_URL.replace(/\/$/, "")}/api/property-drafts/${path}${search}`,
      {
        method,
        headers: {
          Authorization: authorization,
          ...(contentType ? { "Content-Type": contentType } : {}),
        },
        body: method === "GET" ? undefined : await request.arrayBuffer(),
        signal: controller.signal,
      },
    );

    const body = await response.text();

    return new Response(body || null, {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("Content-Type") ?? "application/json",
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

export async function GET(request: Request, context: RouteContext) {
  return handle(request, context, "GET");
}

export async function POST(request: Request, context: RouteContext) {
  return handle(request, context, "POST");
}

export async function PATCH(request: Request, context: RouteContext) {
  return handle(request, context, "PATCH");
}

export async function DELETE(request: Request, context: RouteContext) {
  return handle(request, context, "DELETE");
}

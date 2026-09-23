import { rejectCrossSiteMutation } from "@/app/api/_csrf";
import { listHeaders } from "@/app/api/_requestId";
import { getSessionToken } from "@/app/api/_session";

const API_BASE_URL = process.env.API_BASE_URL;
const BOOKING_REQUEST_TIMEOUT_MS = 90000;

type BookingMethod = "DELETE" | "GET" | "PATCH" | "POST" | "PUT";

interface RouteContext {
  params: Promise<{ segments: string[] }>;
}

/**
 * Forwards the body as bytes rather than text.
 *
 * Tenancy document uploads are multipart, and the shared authenticated proxy reads
 * bodies with `request.text()`, which corrupts them. This route handles its own
 * forwarding so both JSON and multipart work.
 */
async function handle(
  request: Request,
  context: RouteContext,
  method: BookingMethod,
): Promise<Response> {
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

  const rejected = rejectCrossSiteMutation(request);
  const token = await getSessionToken();

  if (rejected) return rejected;
  if (!token) {
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
    BOOKING_REQUEST_TIMEOUT_MS,
  );

  try {
    const contentType = request.headers.get("Content-Type");
    const response = await fetch(
      `${API_BASE_URL.replace(/\/$/, "")}/api/bookings/${path}${search}`,
      {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
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
        ...listHeaders(response),
      },
    });
  } catch {
    return Response.json(
      {
        success: false,
        message: "Unable to reach the booking server right now.",
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

export async function PUT(request: Request, context: RouteContext) {
  return handle(request, context, "PUT");
}

export async function DELETE(request: Request, context: RouteContext) {
  return handle(request, context, "DELETE");
}

import { requestIdHeader } from "@/app/api/_requestId";

const API_BASE_URL = process.env.API_BASE_URL;
const QUOTE_TIMEOUT_MS = 30000;

/**
 * The shortlet price for a pair of dates.
 *
 * Public, unlike the rest of the booking routes: a guest has to see what a stay
 * costs before signing up, and the catch-all booking proxy refuses a request with
 * no session.
 */
export async function GET(request: Request): Promise<Response> {
  if (!API_BASE_URL) {
    return Response.json(
      { success: false, message: "API_BASE_URL is not configured.", data: null },
      { status: 500 },
    );
  }

  try {
    const response = await fetch(
      `${API_BASE_URL.replace(/\/$/, "")}/api/bookings/short-stays/quote${new URL(request.url).search}`,
      { signal: AbortSignal.timeout(QUOTE_TIMEOUT_MS) },
    );
    const body = await response.text();

    return new Response(body || null, {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("Content-Type") ?? "application/json",
        ...requestIdHeader(response),
      },
    });
  } catch {
    return Response.json(
      {
        success: false,
        message: "Unable to reach the booking server right now.",
        data: null,
      },
      { status: 503 },
    );
  }
}

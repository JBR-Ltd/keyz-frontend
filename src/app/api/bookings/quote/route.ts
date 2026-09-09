const API_BASE_URL = process.env.API_BASE_URL;

/**
 * Public: a guest sees what a stay costs before signing up.
 *
 * No Authorization is forwarded because none is needed, and the endpoint reveals
 * only pricing that is already on the listing page.
 */
export async function GET(request: Request): Promise<Response> {
  if (!API_BASE_URL) {
    return Response.json(
      { success: false, message: "API_BASE_URL is not configured.", data: null },
      { status: 500 },
    );
  }

  try {
    const search = new URL(request.url).search;
    const response = await fetch(
      `${API_BASE_URL.replace(/\/$/, "")}/api/bookings/quote${search}`,
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
  }
}

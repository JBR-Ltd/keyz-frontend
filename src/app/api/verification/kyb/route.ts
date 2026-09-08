const API_BASE_URL = process.env.API_BASE_URL;
const VERIFICATION_TIMEOUT_MS = 90000;

/** Multipart, so the body is forwarded as bytes rather than text. */
export async function POST(request: Request): Promise<Response> {
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

  const controller = new AbortController();
  const timeout = globalThis.setTimeout(
    () => controller.abort(),
    VERIFICATION_TIMEOUT_MS,
  );

  try {
    const contentType = request.headers.get("Content-Type");
    const response = await fetch(
      `${API_BASE_URL.replace(/\/$/, "")}/api/verification/kyb`,
      {
        method: "POST",
        headers: {
          Authorization: authorization,
          ...(contentType ? { "Content-Type": contentType } : {}),
        },
        body: await request.arrayBuffer(),
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
        message: "Unable to reach the verification server right now.",
        data: null,
      },
      { status: 502 },
    );
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

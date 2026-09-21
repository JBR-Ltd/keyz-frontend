import { rejectCrossSiteMutation } from "@/app/api/_csrf";
import { requestIdHeader } from "@/app/api/_requestId";
import { clearSessionIfUnauthorized, getSessionToken } from "@/app/api/_session";

const API_BASE_URL = process.env.API_BASE_URL;
const REQUEST_TIMEOUT_MS = 90000;

/** Multipart, so the body is forwarded as bytes rather than read as text. */
export async function POST(request: Request): Promise<Response> {
  const rejected = rejectCrossSiteMutation(request);

  if (rejected) return rejected;
  if (!API_BASE_URL) {
    return Response.json(
      { success: false, message: "API_BASE_URL is not configured.", data: null },
      { status: 500 },
    );
  }

  const token = await getSessionToken();

  if (!token) {
    return Response.json(
      { success: false, message: "Authorization is required.", data: null },
      { status: 401 },
    );
  }

  const contentType = request.headers.get("Content-Type");
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS,
  );

  try {
    const response = await fetch(
      `${API_BASE_URL.replace(/\/$/, "")}/api/users/me/avatar`,
      {
        method: "POST",
        headers: {
          ...(contentType ? { "Content-Type": contentType } : {}),
        },
        body: await request.arrayBuffer(),
        signal: controller.signal,
      },
    );
    await clearSessionIfUnauthorized(response);
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
      { success: false, message: "That photo could not be uploaded.", data: null },
      { status: 502 },
    );
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

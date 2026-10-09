import { requestIdHeader } from "@/app/api/_requestId";
import { rejectCrossSiteMutation } from "@/app/api/_csrf";

const API_BASE_URL = process.env.API_BASE_URL;
const AUTH_REQUEST_TIMEOUT_MS = 30000;

export async function POST(request: Request): Promise<Response> {
  const rejected = rejectCrossSiteMutation(request);
  if (rejected) return rejected;

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

  const backendUrl = `${API_BASE_URL.replace(/\/$/, "")}/api/auth/resend-verification`;
  const requestBody = await request.text();

  const controller = new AbortController();
  const timeout = globalThis.setTimeout(
    () => controller.abort(),
    AUTH_REQUEST_TIMEOUT_MS,
  );

  try {
    const response = await fetch(backendUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: requestBody,
    });
    const responseBody = await response.text();

    return new Response(responseBody || null, {
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
        message: "Unable to reach the authentication server right now.",
        data: null,
      },
      { status: 502 },
    );
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

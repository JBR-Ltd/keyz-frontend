import { rejectCrossSiteMutation } from "@/app/api/_csrf";
import { requestIdHeader } from "@/app/api/_requestId";
import { clearSessionIfUnauthorized, getSessionToken } from "@/app/api/_session";

const API_BASE_URL = process.env.API_BASE_URL;
// Reading a bill runs OCR at the provider, which is slower than an ordinary request
const VERIFICATION_REQUEST_TIMEOUT_MS = 90000;

/**
 * Forwards a utility bill for listing verification.
 *
 * The body is forwarded as bytes: the bill is multipart, and reading it as text
 * would corrupt a PDF or a photo on the way through.
 */
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
      {
        success: false,
        message: "Your session has expired. Log in again.",
        data: null,
      },
      { status: 401 },
    );
  }

  const contentType = request.headers.get("Content-Type");
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(
    () => controller.abort(),
    VERIFICATION_REQUEST_TIMEOUT_MS,
  );

  try {
    const response = await fetch(
      `${API_BASE_URL.replace(/\/$/, "")}/api/verification/property/verify-bill${new URL(request.url).search}`,
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
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return Response.json(
        {
          success: false,
          message: "Reading the bill took too long. Try again.",
          data: null,
        },
        { status: 504 },
      );
    }

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

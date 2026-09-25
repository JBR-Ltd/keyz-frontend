import { listHeaders, requestIdHeader } from "@/app/api/_requestId";
import { rejectCrossSiteMutation } from "@/app/api/_csrf";
import { getSessionToken } from "@/app/api/_session";

const API_BASE_URL = process.env.API_BASE_URL;
const REQUEST_TIMEOUT_MS = 90000;

interface AuthenticatedProxyOptions {
  /** Forward without a token when there is none, for reads the backend serves publicly. */
  allowAnonymous?: boolean;
  backendPath: string;
  method: "DELETE" | "GET" | "PATCH" | "POST" | "PUT";
  request: Request;
}

export async function proxyAuthenticatedRequest({
  allowAnonymous = false,
  backendPath,
  method,
  request,
}: AuthenticatedProxyOptions): Promise<Response> {
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

  if (rejected) {
    return rejected;
  }

  const token = await getSessionToken();

  if (!token && !allowAnonymous) {
    return Response.json(
      { success: false, message: "Authorization is required.", data: null },
      { status: 401 },
    );
  }

  const controller = new AbortController();
  const timeout = globalThis.setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS,
  );
  const backendUrl = `${API_BASE_URL.replace(/\/$/, "")}${backendPath}`;
  // Bytes, not text: reading a multipart upload as text corrupts every file in it
  const body =
    method === "POST" || method === "PATCH" || method === "PUT"
      ? await request.arrayBuffer()
      : undefined;
  const headers = new Headers(
    token ? { Authorization: `Bearer ${token}` } : {},
  );

  if (body && body.byteLength > 0) {
    headers.set(
      "Content-Type",
      request.headers.get("Content-Type") ?? "application/json",
    );
  }

  try {
    const response = await fetch(backendUrl, {
      method,
      headers,
      body: body && body.byteLength > 0 ? body : undefined,
      signal: controller.signal,
    });

    const contentDisposition = response.headers.get("Content-Disposition");

    // A download (a CSV export) passes through as bytes with its filename
    if (response.ok && contentDisposition) {
      return new Response(await response.arrayBuffer(), {
        status: response.status,
        headers: {
          "Content-Type":
            response.headers.get("Content-Type") ?? "application/octet-stream",
          "Content-Disposition": contentDisposition,
          "Cache-Control": response.headers.get("Cache-Control") ?? "no-store",
          ...requestIdHeader(response),
        },
      });
    }

    const responseBody = await response.text();
    const contentType =
      response.headers.get("Content-Type") ?? "application/json";

    if (!response.ok) {
      let message =
        response.status === 401 || response.status === 403
          ? "Your session has expired. Log in again."
          : "The account request failed.";
      // The client keys its copy off this, and drops back to a generic line without it
      let code: string | null = null;
      // A rejected field carries its reason here, and "Validation failed" alone does not
      let details: unknown = null;

      if (responseBody && contentType.includes("application/json")) {
        const errorBody: unknown = JSON.parse(responseBody);

        if (errorBody !== null && typeof errorBody === "object") {
          if (
            "message" in errorBody &&
            typeof errorBody.message === "string" &&
            errorBody.message
          ) {
            message = errorBody.message;
          }

          if (
            "code" in errorBody &&
            typeof errorBody.code === "string" &&
            errorBody.code
          ) {
            code = errorBody.code;
          }

          if ("data" in errorBody && errorBody.data) {
            details = errorBody.data;
          }
        }
      } else if (responseBody) {
        message = responseBody;
      }

      return Response.json(
        { success: false, message, data: details, ...(code ? { code } : {}) },
        {
          status: response.status,
          headers: {
            "Cache-Control": "no-store",
            ...requestIdHeader(response),
          },
        },
      );
    }

    return new Response(responseBody || null, {
      status: response.status,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": contentType,
        ...listHeaders(response),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return Response.json(
        {
          success: false,
          message: "The account server timed out. Please try again.",
          data: null,
        },
        { status: 504 },
      );
    }

    console.error("Authenticated proxy request could not reach backend", {
      backendUrl,
      error,
    });

    return Response.json(
      {
        success: false,
        message: "Unable to reach the account server right now.",
        data: null,
      },
      { status: 502 },
    );
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

const API_BASE_URL = process.env.API_BASE_URL;
const REQUEST_TIMEOUT_MS = 90000;

interface AuthenticatedProxyOptions {
  backendPath: string;
  method: "DELETE" | "GET" | "PATCH" | "POST" | "PUT";
  request: Request;
}

export async function proxyAuthenticatedRequest({
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

  const authorization = request.headers.get("Authorization");

  if (!authorization) {
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
  const body =
    method === "POST" || method === "PATCH" || method === "PUT"
      ? await request.text()
      : undefined;
  const headers = new Headers({ Authorization: authorization });

  if (body) {
    headers.set(
      "Content-Type",
      request.headers.get("Content-Type") ?? "application/json",
    );
  }

  try {
    const response = await fetch(backendUrl, {
      method,
      headers,
      body,
      signal: controller.signal,
    });
    const responseBody = await response.text();
    const contentType =
      response.headers.get("Content-Type") ?? "application/json";

    if (!response.ok) {
      let message =
        response.status === 401 || response.status === 403
          ? "Your session has expired. Log in again."
          : "The account request failed.";

      if (responseBody && contentType.includes("application/json")) {
        const errorBody: unknown = JSON.parse(responseBody);

        if (
          errorBody !== null &&
          typeof errorBody === "object" &&
          "message" in errorBody &&
          typeof errorBody.message === "string" &&
          errorBody.message
        ) {
          message = errorBody.message;
        }
      } else if (responseBody) {
        message = responseBody;
      }

      return Response.json(
        { success: false, message, data: null },
        { status: response.status },
      );
    }

    return new Response(responseBody || null, {
      status: response.status,
      headers: { "Content-Type": contentType },
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

const API_BASE_URL = process.env.API_BASE_URL;
const PROPERTY_REQUEST_TIMEOUT_MS = 90000;

type PropertyMethod = "DELETE" | "GET" | "PATCH" | "POST" | "PUT";

interface ApiEnvelope {
  data: unknown;
  message: string;
  success: boolean;
}

interface RouteContext {
  params: Promise<{
    segments: string[];
  }>;
}

interface TimeoutSignal {
  signal: AbortSignal;
  cancel: () => void;
}

function getBackendUrl(path: string): string | null {
  return API_BASE_URL ? `${API_BASE_URL.replace(/\/$/, "")}${path}` : null;
}

function createTimeoutSignal(): TimeoutSignal {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => {
    controller.abort();
  }, PROPERTY_REQUEST_TIMEOUT_MS);

  return {
    signal: controller.signal,
    cancel: () => globalThis.clearTimeout(timeout),
  };
}

function isNumericId(value: string): boolean {
  return /^\d+$/.test(value);
}

function isAllowedRequest(method: PropertyMethod, segments: string[]): boolean {
  if (method === "GET") {
    if (segments.length === 1) {
      return (
        segments[0] === "all" ||
        segments[0] === "sale" ||
        segments[0] === "rent" ||
        segments[0] === "portfolio" ||
        isNumericId(segments[0])
      );
    }

    // A guest needs the gallery and the calendar before they can pick dates
    return (
      segments.length === 2 &&
      isNumericId(segments[0]) &&
      (segments[1] === "images" || segments[1] === "availability")
    );
  }

  if (method === "POST") {
    return (
      (segments.length === 1 && segments[0] === "create") ||
      (segments.length === 2 &&
        isNumericId(segments[0]) &&
        (segments[1] === "upload-image" || segments[1] === "images")) ||
      (segments.length === 3 &&
        isNumericId(segments[0]) &&
        segments[1] === "availability" &&
        segments[2] === "blocks")
    );
  }

  if (method === "PATCH") {
    return (
      segments.length === 3 &&
      isNumericId(segments[0]) &&
      segments[1] === "images" &&
      segments[2] === "order"
    );
  }

  if (method === "DELETE") {
    return (
      (segments.length === 3 &&
        isNumericId(segments[0]) &&
        segments[1] === "images" &&
        isNumericId(segments[2])) ||
      (segments.length === 4 &&
        isNumericId(segments[0]) &&
        segments[1] === "availability" &&
        segments[2] === "blocks" &&
        isNumericId(segments[3]))
    );
  }

  return method === "PUT" && segments.length === 1 && isNumericId(segments[0]);
}

function isPublicRequest(method: PropertyMethod, segments: string[]): boolean {
  if (method !== "GET") {
    return false;
  }

  if (segments.length === 1) {
    return (
      segments[0] === "all" || segments[0] === "sale" || segments[0] === "rent"
    );
  }

  // The listing page has to work logged out, gallery and calendar included
  return (
    segments.length === 2 &&
    (segments[1] === "images" || segments[1] === "availability")
  );
}

function isApiEnvelope(value: unknown): value is ApiEnvelope {
  return (
    value !== null &&
    typeof value === "object" &&
    "success" in value &&
    typeof value.success === "boolean" &&
    "message" in value &&
    typeof value.message === "string" &&
    "data" in value
  );
}

function getAuthenticatedUserId(value: unknown): number | null {
  if (
    !isApiEnvelope(value) ||
    value.data === null ||
    typeof value.data !== "object"
  ) {
    return null;
  }

  if (!("id" in value.data) || typeof value.data.id !== "number") {
    return null;
  }

  return value.data.id;
}

async function proxyResponse(response: Response): Promise<Response> {
  const body = await response.text();
  const contentType =
    response.headers.get("Content-Type") ?? "application/json";

  return new Response(body || null, {
    status: response.status,
    headers: {
      "Content-Type": contentType,
    },
  });
}

async function buildCreateBody(
  request: Request,
  authorization: string,
  signal: AbortSignal,
): Promise<string | Response> {
  const profileUrl = getBackendUrl("/api/users/me");

  if (!profileUrl) {
    return Response.json(
      {
        success: false,
        message: "API_BASE_URL is not configured.",
        data: null,
      },
      { status: 500 },
    );
  }

  const profileResponse = await fetch(profileUrl, {
    headers: {
      Authorization: authorization,
    },
    signal,
  });

  if (!profileResponse.ok) {
    return proxyResponse(profileResponse);
  }

  const profileData: unknown = await profileResponse.json().catch(() => null);
  const userId = getAuthenticatedUserId(profileData);

  if (userId === null) {
    return Response.json(
      {
        success: false,
        message: "Unable to identify the authenticated property seller.",
        data: null,
      },
      { status: 502 },
    );
  }

  const propertyData: unknown = await request.json().catch(() => null);

  if (propertyData === null || typeof propertyData !== "object") {
    return Response.json(
      { success: false, message: "Invalid property request.", data: null },
      { status: 400 },
    );
  }

  return JSON.stringify({
    ...propertyData,
    seller: {
      id: userId,
    },
  });
}

async function handlePropertyRequest(
  request: Request,
  context: RouteContext,
  method: PropertyMethod,
): Promise<Response> {
  const { segments } = await context.params;

  if (!isAllowedRequest(method, segments)) {
    return Response.json(
      { success: false, message: "Unsupported property request.", data: null },
      { status: 404 },
    );
  }

  const backendUrl = getBackendUrl(`/api/properties/${segments.join("/")}`);

  if (!backendUrl) {
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

  if (
    !isPublicRequest(method, segments) &&
    !authorization?.startsWith("Bearer ")
  ) {
    return Response.json(
      {
        success: false,
        message: "Your session has expired. Log in again.",
        data: null,
      },
      { status: 401 },
    );
  }

  const timeout = createTimeoutSignal();

  try {
    let body: BodyInit | undefined;
    let contentType = request.headers.get("Content-Type");

    if (method === "POST" && segments[0] === "create") {
      const createBody = await buildCreateBody(
        request,
        authorization ?? "",
        timeout.signal,
      );

      if (createBody instanceof Response) {
        return createBody;
      }

      body = createBody;
      contentType = "application/json";
    } else if (method !== "GET") {
      body = await request.arrayBuffer();
    }

    const response = await fetch(backendUrl, {
      method,
      headers: {
        ...(authorization ? { Authorization: authorization } : {}),
        ...(contentType ? { "Content-Type": contentType } : {}),
      },
      body,
      signal: timeout.signal,
    });

    return proxyResponse(response);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return Response.json(
        {
          success: false,
          message: "The property server timed out. Please try again.",
          data: null,
        },
        { status: 504 },
      );
    }

    console.error("Property proxy could not reach backend", {
      backendUrl,
      error,
    });

    return Response.json(
      {
        success: false,
        message: "Unable to reach the property server right now.",
        data: null,
      },
      { status: 502 },
    );
  } finally {
    timeout.cancel();
  }
}

export async function GET(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  return handlePropertyRequest(request, context, "GET");
}

export async function POST(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  return handlePropertyRequest(request, context, "POST");
}

export async function PUT(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  return handlePropertyRequest(request, context, "PUT");
}

export async function PATCH(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  return handlePropertyRequest(request, context, "PATCH");
}

export async function DELETE(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  return handlePropertyRequest(request, context, "DELETE");
}

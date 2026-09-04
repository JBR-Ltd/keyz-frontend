const API_BASE_URL = process.env.API_BASE_URL;

function getBackendUrl(): string | null {
  return API_BASE_URL
    ? `${API_BASE_URL.replace(/\/$/, "")}/api/verification/status`
    : null;
}

export async function GET(request: Request): Promise<Response> {
  const backendUrl = getBackendUrl();

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

  try {
    const response = await fetch(backendUrl, {
      headers: { Authorization: authorization },
    });
    const body = await response.text();

    return new Response(body || null, {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("Content-Type") ?? "application/json",
      },
    });
  } catch (error) {
    console.error("Verification status proxy could not reach backend", {
      backendUrl,
      error,
    });

    return Response.json(
      {
        success: false,
        message: "Unable to reach the verification server right now.",
        data: null,
      },
      { status: 502 },
    );
  }
}

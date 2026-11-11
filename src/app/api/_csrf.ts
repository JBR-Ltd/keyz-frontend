import "server-only";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function rejectCrossSiteMutation(request: Request): Response | null {
  if (SAFE_METHODS.has(request.method.toUpperCase())) {
    return null;
  }

  const fetchSite = request.headers.get("Sec-Fetch-Site");

  if (fetchSite === "cross-site") {
    return Response.json(
      { success: false, message: "Cross-site requests are not allowed.", data: null },
      { status: 403 },
    );
  }

  const origin = request.headers.get("Origin");

  if (origin && origin !== new URL(request.url).origin) {
    return Response.json(
      { success: false, message: "Request origin is not allowed.", data: null },
      { status: 403 },
    );
  }

  return null;
}

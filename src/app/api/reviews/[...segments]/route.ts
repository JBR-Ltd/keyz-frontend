import { proxyAuthenticatedRequest } from "@/app/api/_authenticatedProxy";

interface RouteContext {
  params: Promise<{ segments: string[] }>;
}

function buildBackendPath(segments: string[]): string {
  return `/api/reviews/${segments.map(encodeURIComponent).join("/")}`;
}

/** A listing's reviews are public, so they load for someone who is not logged in. */
export async function GET(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const { segments } = await context.params;

  return proxyAuthenticatedRequest({
    allowAnonymous: segments[0] === "property",
    backendPath: buildBackendPath(segments),
    method: "GET",
    request,
  });
}

export async function POST(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const { segments } = await context.params;

  return proxyAuthenticatedRequest({
    backendPath: buildBackendPath(segments),
    method: "POST",
    request,
  });
}

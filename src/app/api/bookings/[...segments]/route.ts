import { proxyAuthenticatedRequest } from "@/app/api/_authenticatedProxy";

interface RouteContext {
  params: Promise<{ segments: string[] }>;
}

function buildBackendPath(segments: string[], search: string): string {
  return `/api/bookings/${segments.map(encodeURIComponent).join("/")}${search}`;
}

export async function GET(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const { segments } = await context.params;

  return proxyAuthenticatedRequest({
    backendPath: buildBackendPath(segments, new URL(request.url).search),
    method: "GET",
    request,
  });
}

export async function PATCH(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const { segments } = await context.params;

  return proxyAuthenticatedRequest({
    backendPath: buildBackendPath(segments, new URL(request.url).search),
    method: "PATCH",
    request,
  });
}

import { proxyAuthenticatedRequest } from "@/app/api/_authenticatedProxy";

interface RouteContext {
  params: Promise<{ segments: string[] }>;
}

function buildBackendPath(segments: string[], search: string): string {
  return `/api/support/${segments.map(encodeURIComponent).join("/")}${search}`;
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

/** Multipart, for messages with an attachment; the proxy forwards the body as bytes. */
export async function POST(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const { segments } = await context.params;

  return proxyAuthenticatedRequest({
    backendPath: buildBackendPath(segments, new URL(request.url).search),
    method: "POST",
    request,
  });
}

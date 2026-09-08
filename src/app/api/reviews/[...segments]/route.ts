import { proxyAuthenticatedRequest } from "@/app/api/_authenticatedProxy";

interface RouteContext {
  params: Promise<{ segments: string[] }>;
}

export async function GET(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const { segments } = await context.params;

  return proxyAuthenticatedRequest({
    backendPath: `/api/reviews/${segments.map(encodeURIComponent).join("/")}`,
    method: "GET",
    request,
  });
}

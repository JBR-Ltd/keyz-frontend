import { proxyAuthenticatedRequest } from "@/app/api/_authenticatedProxy";

interface RouteContext {
  params: Promise<{ propertyId: string }>;
}

export async function POST(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const { propertyId } = await context.params;

  return proxyAuthenticatedRequest({
    backendPath: `/api/saved-listings/${encodeURIComponent(propertyId)}`,
    method: "POST",
    request,
  });
}

export async function DELETE(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const { propertyId } = await context.params;

  return proxyAuthenticatedRequest({
    backendPath: `/api/saved-listings/${encodeURIComponent(propertyId)}`,
    method: "DELETE",
    request,
  });
}

import { proxyAuthenticatedRequest } from "@/app/api/_authenticatedProxy";

interface RouteContext {
  params: Promise<{ propertyId: string }>;
}

export async function GET(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const { propertyId } = await context.params;

  if (!/^\d+$/.test(propertyId)) {
    return Response.json(
      { success: false, message: "Invalid property id.", data: null },
      { status: 400 },
    );
  }

  return proxyAuthenticatedRequest({
    backendPath: `/api/verification/property/${propertyId}/status`,
    method: "GET",
    request,
  });
}

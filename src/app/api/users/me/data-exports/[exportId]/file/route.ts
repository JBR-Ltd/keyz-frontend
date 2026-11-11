import { proxyAuthenticatedRequest } from "@/app/api/_authenticatedProxy";

interface RouteContext {
  params: Promise<{ exportId: string }>;
}

/** The export file itself, streamed from private storage through the backend. */
export async function GET(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const { exportId } = await context.params;

  if (!/^\d+$/.test(exportId)) {
    return Response.json(
      { success: false, message: "Unknown export.", data: null },
      { status: 400 },
    );
  }

  return proxyAuthenticatedRequest({
    backendPath: `/api/users/me/data-exports/${exportId}/file`,
    method: "GET",
    request,
  });
}

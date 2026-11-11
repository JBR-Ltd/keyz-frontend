import { proxyAuthenticatedRequest } from "@/app/api/_authenticatedProxy";

interface RouteContext {
  params: Promise<{ sessionId: string }>;
}

export async function DELETE(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const { sessionId } = await context.params;

  if (!/^\d+$/.test(sessionId)) {
    return Response.json(
      { success: false, message: "Unknown session.", data: null },
      { status: 400 },
    );
  }

  return proxyAuthenticatedRequest({
    backendPath: `/api/auth/sessions/${sessionId}`,
    method: "DELETE",
    request,
  });
}

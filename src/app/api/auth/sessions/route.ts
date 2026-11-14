import { proxyAuthenticatedRequest } from "@/app/api/_authenticatedProxy";

export async function GET(request: Request): Promise<Response> {
  return proxyAuthenticatedRequest({
    backendPath: "/api/auth/sessions",
    method: "GET",
    request,
  });
}

export async function DELETE(request: Request): Promise<Response> {
  return proxyAuthenticatedRequest({
    backendPath: `/api/auth/sessions${new URL(request.url).search}`,
    method: "DELETE",
    request,
  });
}

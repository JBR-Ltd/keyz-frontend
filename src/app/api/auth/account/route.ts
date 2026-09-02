import { proxyAuthenticatedRequest } from "@/app/api/_authenticatedProxy";

export async function DELETE(request: Request): Promise<Response> {
  return proxyAuthenticatedRequest({
    backendPath: "/api/auth/account",
    method: "DELETE",
    request,
  });
}

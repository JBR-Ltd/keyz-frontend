import { proxyAuthenticatedRequest } from "@/app/api/_authenticatedProxy";
import { clearSessionCookie } from "@/app/api/_session";

export async function DELETE(request: Request): Promise<Response> {
  const response = await proxyAuthenticatedRequest({
    backendPath: "/api/auth/account",
    method: "DELETE",
    request,
  });

  if (response.ok) await clearSessionCookie();
  return response;
}

import { proxyAuthenticatedRequest } from "@/app/api/_authenticatedProxy";
import { clearSessionCookie } from "@/app/api/_session";

export async function POST(request: Request): Promise<Response> {
  const response = await proxyAuthenticatedRequest({
    backendPath: "/api/auth/deactivate",
    method: "POST",
    request,
  });

  if (response.ok) await clearSessionCookie();
  return response;
}

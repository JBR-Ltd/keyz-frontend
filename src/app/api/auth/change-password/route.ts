import { proxyAuthenticatedRequest } from "@/app/api/_authenticatedProxy";

export async function POST(request: Request): Promise<Response> {
  return proxyAuthenticatedRequest({
    backendPath: "/api/auth/change-password",
    method: "POST",
    request,
  });
}

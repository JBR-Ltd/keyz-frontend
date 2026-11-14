import { proxyAuthenticatedRequest } from "@/app/api/_authenticatedProxy";

export async function GET(request: Request): Promise<Response> {
  return proxyAuthenticatedRequest({
    backendPath: "/api/users/me/preferences",
    method: "GET",
    request,
  });
}

export async function PUT(request: Request): Promise<Response> {
  return proxyAuthenticatedRequest({
    backendPath: "/api/users/me/preferences",
    method: "PUT",
    request,
  });
}

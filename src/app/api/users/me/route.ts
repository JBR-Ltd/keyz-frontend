import { proxyAuthenticatedRequest } from "@/app/api/_authenticatedProxy";

export async function GET(request: Request): Promise<Response> {
  return proxyAuthenticatedRequest({
    backendPath: "/api/users/me",
    method: "GET",
    request,
  });
}

export async function PATCH(request: Request): Promise<Response> {
  return proxyAuthenticatedRequest({
    backendPath: "/api/users/me",
    method: "PATCH",
    request,
  });
}

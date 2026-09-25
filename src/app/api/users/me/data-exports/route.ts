import { proxyAuthenticatedRequest } from "@/app/api/_authenticatedProxy";

export async function GET(request: Request): Promise<Response> {
  return proxyAuthenticatedRequest({
    backendPath: "/api/users/me/data-exports",
    method: "GET",
    request,
  });
}

export async function POST(request: Request): Promise<Response> {
  return proxyAuthenticatedRequest({
    backendPath: "/api/users/me/data-exports",
    method: "POST",
    request,
  });
}

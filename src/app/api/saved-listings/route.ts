import { proxyAuthenticatedRequest } from "@/app/api/_authenticatedProxy";

export async function GET(request: Request): Promise<Response> {
  return proxyAuthenticatedRequest({
    backendPath: "/api/saved-listings",
    method: "GET",
    request,
  });
}

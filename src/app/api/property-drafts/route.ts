import { proxyAuthenticatedRequest } from "@/app/api/_authenticatedProxy";

export async function GET(request: Request): Promise<Response> {
  return proxyAuthenticatedRequest({
    backendPath: `/api/property-drafts${new URL(request.url).search}`,
    method: "GET",
    request,
  });
}

export async function POST(request: Request): Promise<Response> {
  return proxyAuthenticatedRequest({
    backendPath: "/api/property-drafts",
    method: "POST",
    request,
  });
}

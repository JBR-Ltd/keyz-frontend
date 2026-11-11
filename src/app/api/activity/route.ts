import { proxyAuthenticatedRequest } from "@/app/api/_authenticatedProxy";

export async function GET(request: Request): Promise<Response> {
  return proxyAuthenticatedRequest({
    backendPath: `/api/activity/mine${new URL(request.url).search}`,
    method: "GET",
    request,
  });
}

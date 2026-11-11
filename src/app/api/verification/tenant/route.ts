import { proxyAuthenticatedRequest } from "@/app/api/_authenticatedProxy";

export async function POST(request: Request): Promise<Response> {
  const search = new URL(request.url).search;

  return proxyAuthenticatedRequest({
    backendPath: `/api/verification/tenant${search}`,
    method: "POST",
    request,
  });
}

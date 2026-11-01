// src/app/api/tours/public/[publicId]/route.ts
//
// The one anonymous tour route. Resolves a listing by its opaque public id,
// and only answers when the property is live AND the tour is published.
// Anything else gets a 404 from the Java service, which the caller renders
// as "no tour".

import { proxyAuthenticatedRequest } from "@/app/api/_authenticatedProxy";

interface RouteContext {
  params: Promise<{ publicId: string }>;
}

export async function GET(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const { publicId } = await context.params;

  return proxyAuthenticatedRequest({
    allowAnonymous: true,
    backendPath: `/api/tours/public/${encodeURIComponent(publicId)}`,
    method: "GET",
    request,
  });
}

import { proxyAuthenticatedRequest } from "@/app/api/_authenticatedProxy";

// === Types

interface CatchAllContext {
  params: Promise<{ segments?: string[] }>;
}

type RouteHandler = (
  request: Request,
  context: CatchAllContext,
) => Promise<Response>;

export interface CatchAllHandlers {
  DELETE: RouteHandler;
  GET: RouteHandler;
  PATCH: RouteHandler;
  POST: RouteHandler;
  PUT: RouteHandler;
}

// === Handlers

/**
 * Every method for one backend prefix, for an optional catch-all route such as
 * `app/api/mandates/[[...segments]]`. The authenticated proxy forwards bodies as
 * bytes, so uploads and JSON both pass through intact.
 */
export function createCatchAllHandlers(backendPrefix: string): CatchAllHandlers {
  const handle =
    (method: "DELETE" | "GET" | "PATCH" | "POST" | "PUT"): RouteHandler =>
    async (request, context) => {
      const { segments } = await context.params;
      const path = (segments ?? []).map(encodeURIComponent).join("/");

      return proxyAuthenticatedRequest({
        backendPath: `${backendPrefix}${path ? `/${path}` : ""}${new URL(request.url).search}`,
        method,
        request,
      });
    };

  return {
    DELETE: handle("DELETE"),
    GET: handle("GET"),
    PATCH: handle("PATCH"),
    POST: handle("POST"),
    PUT: handle("PUT"),
  };
}

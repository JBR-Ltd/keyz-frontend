import { proxyAuthenticatedRequest } from "@/app/api/_authenticatedProxy";
import { clearSessionCookie } from "@/app/api/_session";

export async function POST(request: Request): Promise<Response> {
  try {
    return await proxyAuthenticatedRequest({
      backendPath: "/api/auth/logout",
      method: "POST",
      request,
    });
  } finally {
    await clearSessionCookie();
  }
}

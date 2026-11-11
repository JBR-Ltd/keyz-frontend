import { requestIdHeader } from "@/app/api/_requestId";

/**
 * A file the backend serves, passed through untouched: a CSV export, or a private
 * document such as a tenancy agreement or dispute evidence.
 *
 * Reading these as text corrupts every PDF and photo. A redirect is handed to the
 * browser rather than followed here, because the backend only redirects to a file
 * still waiting to move out of the public bucket. Returns null for anything else.
 * Callers fetch with `redirect: "manual"` so the redirect reaches this function.
 */
export async function passThroughFile(
  response: Response,
): Promise<Response | null> {
  const location = response.headers.get("Location");

  if (response.status >= 300 && response.status < 400 && location) {
    return new Response(null, {
      status: response.status,
      headers: { Location: location, "Cache-Control": "no-store" },
    });
  }

  const contentDisposition = response.headers.get("Content-Disposition");

  if (!response.ok || !contentDisposition) {
    return null;
  }

  return new Response(await response.arrayBuffer(), {
    status: response.status,
    headers: {
      "Content-Type":
        response.headers.get("Content-Type") ?? "application/octet-stream",
      "Content-Disposition": contentDisposition,
      "Cache-Control": response.headers.get("Cache-Control") ?? "no-store",
      "X-Content-Type-Options":
        response.headers.get("X-Content-Type-Options") ?? "nosniff",
      ...requestIdHeader(response),
    },
  });
}

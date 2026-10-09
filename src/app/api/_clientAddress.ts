const BACKEND_PROXY_SECRET = process.env.BACKEND_PROXY_SECRET;

/**
 * The backend sees this server's address rather than the browser's, which put every
 * visitor in one rate limit bucket and the server's IP in sign-in emails. Vercel sets
 * x-real-ip to the visitor's address; the secret is what lets the backend believe it.
 */
export function clientAddressHeaders(request: Request): Record<string, string> {
  if (!BACKEND_PROXY_SECRET) {
    return {};
  }

  const clientIp =
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();

  return clientIp
    ? { "X-Client-IP": clientIp, "X-Proxy-Secret": BACKEND_PROXY_SECRET }
    : {};
}

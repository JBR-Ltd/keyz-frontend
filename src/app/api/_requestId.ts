/**
 * The backend names every request in an X-Request-Id header.
 *
 * The proxies used to rebuild each response with only a content type, so that name
 * never reached the browser. Passing it through lets a slow or failed screen be
 * matched to the server log lines that explain it.
 */
export function requestIdHeader(response: Response): Record<string, string> {
  const requestId = response.headers.get("X-Request-Id");

  return requestId ? { "X-Request-Id": requestId } : {};
}

/**
 * The request id plus the full count a paged list reports, which the browser needs
 * to know whether it has every row.
 */
export function listHeaders(response: Response): Record<string, string> {
  const total = response.headers.get("X-Total-Count");

  return {
    ...requestIdHeader(response),
    ...(total ? { "X-Total-Count": total } : {}),
  };
}

/**
 * The validators a cacheable response carries. Without them the browser never has
 * a tag to send back, so the backend's 304 could never happen through a proxy.
 */
export function cacheHeaders(response: Response): Record<string, string> {
  const headers: Record<string, string> = {};

  for (const name of ["ETag", "Cache-Control", "Last-Modified"]) {
    const value = response.headers.get(name);

    if (value) {
      headers[name] = value;
    }
  }

  return headers;
}

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
 * The request id plus what a paged list reports about the rest of it: the full count
 * for page numbers, or the next cursor for a list that grows while it is read.
 */
export function listHeaders(response: Response): Record<string, string> {
  const total = response.headers.get("X-Total-Count");
  const nextCursor = response.headers.get("X-Next-Cursor");

  return {
    ...requestIdHeader(response),
    ...(total ? { "X-Total-Count": total } : {}),
    ...(nextCursor ? { "X-Next-Cursor": nextCursor } : {}),
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

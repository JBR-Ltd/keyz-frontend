import { NextResponse, type NextRequest } from "next/server";

export const config = {
  // Routes still in development. Remove a matcher here when that route goes public.
  matcher: [
    "/login/:path*",
    "/register/:path*",
    "/forgot-password/:path*",
    "/reset-password/:path*",
    "/verify-email/:path*",
  ],
};

const AUTH_SCHEME = "Basic ";

export function middleware(request: NextRequest) {
  const username = process.env.DEV_BASIC_AUTH_USER;
  const password = process.env.DEV_BASIC_AUTH_PASS;

  if (!username || !password) {
    return unauthorized();
  }

  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith(AUTH_SCHEME)) {
    return unauthorized();
  }

  const credentials = decodeCredentials(authorization.slice(AUTH_SCHEME.length));

  if (!credentials || credentials.username !== username || credentials.password !== password) {
    return unauthorized();
  }

  return NextResponse.next();
}

function decodeCredentials(encodedCredentials: string): { username: string; password: string } | null {
  try {
    const decodedCredentials = atob(encodedCredentials);
    const separatorIndex = decodedCredentials.indexOf(":");

    if (separatorIndex === -1) {
      return null;
    }

    return {
      username: decodedCredentials.slice(0, separatorIndex),
      password: decodedCredentials.slice(separatorIndex + 1),
    };
  } catch {
    return null;
  }
}

function unauthorized(): Response {
  return new Response("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Restricted"',
    },
  });
}

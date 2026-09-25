import "server-only";

import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "rello_session";
const DEFAULT_SESSION_SECONDS = 24 * 60 * 60;

interface SessionCookieOptions {
  expiresAt?: string;
}

function getExpiry(expiresAt?: string): Date {
  const parsed = expiresAt ? new Date(expiresAt) : null;

  return parsed && Number.isFinite(parsed.getTime())
    ? parsed
    : new Date(Date.now() + DEFAULT_SESSION_SECONDS * 1000);
}

export async function getSessionToken(): Promise<string | null> {
  return (await cookies()).get(SESSION_COOKIE_NAME)?.value ?? null;
}

export async function setSessionCookie(
  token: string,
  options: SessionCookieOptions = {},
): Promise<void> {
  const expires = getExpiry(options.expiresAt);

  (await cookies()).set(SESSION_COOKIE_NAME, token, {
    expires,
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearSessionCookie(): Promise<void> {
  (await cookies()).set(SESSION_COOKIE_NAME, "", {
    expires: new Date(0),
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

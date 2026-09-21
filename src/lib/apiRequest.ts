"use client";

import {
  clearAuthentication,
  getAuthenticationSnapshot,
  subscribeToAuthentication,
} from "@/lib/authSession";

// === Helpers

const pendingReads = new Map<string, Promise<Response>>();

function getSessionScope(): string {
  const authentication = getAuthenticationSnapshot();
  return JSON.stringify([
    authentication.generation,
    authentication.user?.id ?? null,
  ]);
}

subscribeToAuthentication(clearPendingApiReads);

function isAuthenticationEntryPoint(path: string): boolean {
  return (
    path.startsWith("/api/auth/login") ||
    path.startsWith("/api/auth/google") ||
    path.startsWith("/api/auth/verify-email") ||
    path.startsWith("/api/auth/register") ||
    path.startsWith("/api/auth/forgot-password") ||
    path.startsWith("/api/auth/reset-password") ||
    path.startsWith("/api/auth/resend-verification") ||
    path.startsWith("/api/auth/2fa/verify")
  );
}

function handleAuthenticationFailure(path: string, response: Response): void {
  if (response.status === 401 && !isAuthenticationEntryPoint(path)) {
    clearAuthentication();
  }
}

export function clearPendingApiReads(): void {
  pendingReads.clear();
}

// === Requests

export async function apiRequest(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  if (typeof window === "undefined" || !path.startsWith("/api/")) {
    return fetch(path, init);
  }

  const scope = getSessionScope();
  const method = (init.method ?? "GET").toUpperCase();
  const headers = new Headers(init.headers);

  if (headers.has("Authorization")) {
    headers.delete("Authorization");
  }

  const requestInit = { ...init, credentials: "same-origin" as const, headers };

  if (method !== "GET") {
    // A read begun before a write must not satisfy a refresh following it.
    clearPendingApiReads();

    try {
      const response = await fetch(path, requestInit);
      handleAuthenticationFailure(path, response);

      if (scope !== getSessionScope()) {
        throw new Error(
          "Your account changed. Reload to see your current data.",
        );
      }

      return response;
    } finally {
      clearPendingApiReads();
    }
  }

  let response: Response;

  if (requestInit.signal || requestInit.body || requestInit.cache === "reload") {
    // Independently cancellable requests cannot share another caller's signal.
    response = await fetch(path, requestInit);
  } else {
    const normalizedHeaders = [...headers.entries()].sort(([a], [b]) =>
      a.localeCompare(b),
    );
    const options = Object.fromEntries(
      Object.entries({ ...requestInit, method, headers: normalizedHeaders }).sort(([a], [b]) =>
        a.localeCompare(b),
      ),
    );
    const key = JSON.stringify([scope, path, options]);
    let request = pendingReads.get(key);

    if (!request) {
      request = fetch(path, requestInit);
      pendingReads.set(key, request);
    }

    try {
      response = (await request).clone();
    } finally {
      if (pendingReads.get(key) === request) {
        pendingReads.delete(key);
      }
    }
  }

  handleAuthenticationFailure(path, response);

  if (scope !== getSessionScope()) {
    throw new Error("Your account changed. Reload to see your current data.");
  }

  return response;
}

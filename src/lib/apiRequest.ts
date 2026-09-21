"use client";

// === Helpers

const pendingReads = new Map<string, Promise<Response>>();

function getSessionScope(): string {
  return JSON.stringify([
    localStorage.getItem("rello_token"),
    localStorage.getItem("rello_role"),
  ]);
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
  const authorization = new Headers(init.headers).get("Authorization");

  if (
    authorization &&
    authorization !== `Bearer ${localStorage.getItem("rello_token") ?? ""}`
  ) {
    throw new Error("Your account changed. Reload to see your current data.");
  }

  if (method !== "GET") {
    // A read begun before a write must not satisfy a refresh following it.
    clearPendingApiReads();

    try {
      const response = await fetch(path, init);

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

  if (init.signal || init.body || init.cache === "reload") {
    // Independently cancellable requests cannot share another caller's signal.
    response = await fetch(path, init);
  } else {
    const headers = [...new Headers(init.headers).entries()].sort(([a], [b]) =>
      a.localeCompare(b),
    );
    const options = Object.fromEntries(
      Object.entries({ ...init, method, headers }).sort(([a], [b]) =>
        a.localeCompare(b),
      ),
    );
    const key = JSON.stringify([scope, path, options]);
    let request = pendingReads.get(key);

    if (!request) {
      request = fetch(path, init);
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

  if (scope !== getSessionScope()) {
    throw new Error("Your account changed. Reload to see your current data.");
  }

  return response;
}

"use client";

import { clearInternalNavigationHistory } from "@/lib/internalNavigation";

export type AccountRole = "TENANT" | "LANDLORD" | "AGENT" | "ADMIN";
export type AuthenticationStatus =
  | "authenticated"
  | "checking"
  | "unauthenticated";

export interface AuthSessionUser {
  email: string;
  firstName: string;
  id: number;
  lastName: string;
  role: AccountRole;
}

export interface AuthenticationSnapshot {
  error: string | null;
  generation: number;
  status: AuthenticationStatus;
  user: AuthSessionUser | null;
}

type AuthenticationListener = () => void;

const AUTH_CHANNEL_NAME = "rello-auth";
const AUTH_STORAGE_EVENT_KEY = "rello_auth_event";
const INSTALLATION_ID_KEY = "rello_device_fingerprint";
const LEGACY_AUTH_KEYS = [
  "rello_token",
  "rello_role",
  "rello_tenant_verification",
  "rello_landlord_verification",
  "rello_agent_verification",
] as const;

const listeners = new Set<AuthenticationListener>();
let refreshRequest: Promise<AuthenticationSnapshot> | null = null;
let refreshVersion = 0;
let snapshot: AuthenticationSnapshot = {
  error: null,
  generation: 0,
  status: "checking",
  user: null,
};
const serverSnapshot: AuthenticationSnapshot = { ...snapshot };

export function isAccountRole(value: unknown): value is AccountRole {
  return (
    typeof value === "string" &&
    ["TENANT", "LANDLORD", "AGENT", "ADMIN"].includes(value.toUpperCase())
  );
}

function isSessionUser(value: unknown): value is AuthSessionUser {
  return (
    value !== null &&
    typeof value === "object" &&
    "id" in value &&
    typeof value.id === "number" &&
    "email" in value &&
    typeof value.email === "string" &&
    "firstName" in value &&
    typeof value.firstName === "string" &&
    "lastName" in value &&
    typeof value.lastName === "string" &&
    "role" in value &&
    isAccountRole(value.role)
  );
}

function emit(): void {
  listeners.forEach((listener) => listener());
}

function setSnapshot(
  next: Omit<AuthenticationSnapshot, "generation">,
): AuthenticationSnapshot {
  const identityChanged =
    snapshot.status !== next.status ||
    snapshot.user?.id !== next.user?.id ||
    snapshot.user?.role !== next.user?.role;
  const changed =
    identityChanged ||
    snapshot.error !== next.error ||
    snapshot.user?.email !== next.user?.email ||
    snapshot.user?.firstName !== next.user?.firstName ||
    snapshot.user?.lastName !== next.user?.lastName;

  if (!changed) return snapshot;

  snapshot = {
    ...next,
    generation: identityChanged ? snapshot.generation + 1 : snapshot.generation,
  };
  emit();
  return snapshot;
}

function broadcastAuthenticationChange(): void {
  if (typeof window === "undefined") return;

  if ("BroadcastChannel" in window) {
    const channel = new BroadcastChannel(AUTH_CHANNEL_NAME);
    channel.postMessage("refresh");
    channel.close();
  }

  localStorage.setItem(AUTH_STORAGE_EVENT_KEY, String(Date.now()));
  localStorage.removeItem(AUTH_STORAGE_EVENT_KEY);
}

export function clearLegacyAuthenticationStorage(): void {
  if (typeof window === "undefined") return;
  LEGACY_AUTH_KEYS.forEach((key) => localStorage.removeItem(key));
}

export function getAuthenticationSnapshot(): AuthenticationSnapshot {
  return snapshot;
}

export function getInstallationId(): string {
  const stored = localStorage.getItem(INSTALLATION_ID_KEY);

  if (stored) return stored;

  const generated = crypto.randomUUID();
  localStorage.setItem(INSTALLATION_ID_KEY, generated);
  return generated;
}

export function getBrowserSessionMarker(): string {
  if (snapshot.status === "unauthenticated") return "";

  return `${snapshot.generation}:${snapshot.user?.id ?? "checking"}`;
}

export function getAuthenticationServerSnapshot(): AuthenticationSnapshot {
  return serverSnapshot;
}

export function subscribeToAuthentication(
  listener: AuthenticationListener,
): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function refreshAuthentication(): Promise<AuthenticationSnapshot> {
  if (refreshRequest) return refreshRequest;

  const requestedGeneration = snapshot.generation;
  const requestedRefreshVersion = ++refreshVersion;
  const commit = (
    next: Omit<AuthenticationSnapshot, "generation">,
  ): AuthenticationSnapshot =>
    requestedGeneration === snapshot.generation ? setSnapshot(next) : snapshot;

  const currentRequest = (async () => {
    try {
      const response = await fetch("/api/auth/session", {
        cache: "no-store",
        credentials: "same-origin",
      });
      const payload: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        return commit({
          error: "Your session could not be checked. Try again.",
          status: "checking",
          user: snapshot.user,
        });
      }

      if (
        payload !== null &&
        typeof payload === "object" &&
        "authenticated" in payload &&
        payload.authenticated === true &&
        "user" in payload &&
        isSessionUser(payload.user)
      ) {
        return commit({
          error: null,
          status: "authenticated",
          user: payload.user,
        });
      }

      return commit({
        error: null,
        status: "unauthenticated",
        user: null,
      });
    } catch {
      return commit({
        error: "Your session could not be checked. Try again.",
        status: "checking",
        user: snapshot.user,
      });
    } finally {
      if (refreshVersion === requestedRefreshVersion) refreshRequest = null;
    }
  })();
  refreshRequest = currentRequest;

  return currentRequest;
}

export function establishAuthentication(value: unknown): boolean {
  if (
    value === null ||
    typeof value !== "object" ||
    !("userId" in value) ||
    typeof value.userId !== "number" ||
    !("email" in value) ||
    typeof value.email !== "string" ||
    !("firstName" in value) ||
    typeof value.firstName !== "string" ||
    !("lastName" in value) ||
    typeof value.lastName !== "string" ||
    !("role" in value) ||
    !isAccountRole(value.role)
  ) {
    return false;
  }

  setSnapshot({
    error: null,
    status: "authenticated",
    user: {
      email: value.email,
      firstName: value.firstName,
      id: value.userId,
      lastName: value.lastName,
      role: value.role.toUpperCase() as AccountRole,
    },
  });
  clearLegacyAuthenticationStorage();
  broadcastAuthenticationChange();
  return true;
}

export function clearAuthentication(options: { broadcast?: boolean } = {}): void {
  const sessionChanged =
    snapshot.status !== "unauthenticated" || snapshot.user !== null;

  clearLegacyAuthenticationStorage();
  clearInternalNavigationHistory();
  setSnapshot({
    error: null,
    status: "unauthenticated",
    user: null,
  });

  if (options.broadcast !== false && sessionChanged) {
    broadcastAuthenticationChange();
  }
}

export function invalidateAuthentication(): void {
  snapshot = {
    ...snapshot,
    error: null,
    generation: snapshot.generation + 1,
    status: "checking",
  };
  refreshRequest = null;
  refreshVersion += 1;
  emit();
}

export function listenForAuthenticationChanges(
  onChange: () => void,
): () => void {
  const channel =
    typeof BroadcastChannel === "undefined"
      ? null
      : new BroadcastChannel(AUTH_CHANNEL_NAME);
  const receive = (): void => onChange();
  const receiveStorage = (event: StorageEvent): void => {
    if (event.key === AUTH_STORAGE_EVENT_KEY) onChange();
  };

  channel?.addEventListener("message", receive);
  window.addEventListener("storage", receiveStorage);

  return () => {
    channel?.removeEventListener("message", receive);
    channel?.close();
    window.removeEventListener("storage", receiveStorage);
  };
}

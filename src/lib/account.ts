"use client";

import { useEffect, useState } from "react";
import { resolveApiError } from "@/lib/errors";
import { clearHostListingStorage } from "@/lib/hostListings";
import { clearInternalNavigationHistory } from "@/lib/internalNavigation";

export interface AuthenticatedUser {
  avatarUrl: string | null;
  city: string | null;
  email: string;
  firstName: string;
  id: number;
  emailVerified: boolean;
  identityVerified: boolean;
  lastName: string;
  phone: string | null;
  role: "ADMIN" | "AGENT" | "LANDLORD" | "TENANT";
  sellerRating: number;
  twoFactorEnabled: boolean;
  /** The part of a name a verified person can still change. */
  username: string | null;
}

export interface LoginSession {
  createdAt: string;
  /** The session making the request. It is the one you must not end by accident. */
  current: boolean;
  deviceName: string;
  expiresAt: string;
  id: number;
  ipAddress: string | null;
}

export type DataExportStatus =
  | "QUEUED"
  | "PROCESSING"
  | "READY"
  | "FAILED"
  | "EXPIRED";

export interface DataExport {
  downloadUrl: string | null;
  expiresAt: string | null;
  failureReason: string | null;
  id: number;
  requestedAt: string;
  status: DataExportStatus;
}

export interface ProfileEdit {
  city?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  username?: string;
}

/** Switches keyed by the name the screen uses, stored per account. */
export type AccountPreferences = Record<string, boolean>;

interface ApiEnvelope {
  data: unknown;
  message: string;
  success: boolean;
}

export interface AccountActionResult {
  message: string;
  success: boolean;
}

export interface AuthenticatedUserState {
  error: string | null;
  isLoading: boolean;
  user: AuthenticatedUser | null;
}

let cachedUser: AuthenticatedUser | null = null;
let userRequest: Promise<
  AccountActionResult & { user: AuthenticatedUser | null }
> | null = null;

function isApiEnvelope(value: unknown): value is ApiEnvelope {
  return (
    value !== null &&
    typeof value === "object" &&
    "success" in value &&
    typeof value.success === "boolean" &&
    "message" in value &&
    typeof value.message === "string" &&
    "data" in value
  );
}

function isAuthenticatedUser(value: unknown): value is AuthenticatedUser {
  return (
    value !== null &&
    typeof value === "object" &&
    "id" in value &&
    typeof value.id === "number" &&
    "firstName" in value &&
    typeof value.firstName === "string" &&
    "lastName" in value &&
    typeof value.lastName === "string" &&
    "email" in value &&
    typeof value.email === "string" &&
    "role" in value &&
    (value.role === "ADMIN" ||
      value.role === "AGENT" ||
      value.role === "LANDLORD" ||
      value.role === "TENANT") &&
    "sellerRating" in value &&
    typeof value.sellerRating === "number" &&
    "emailVerified" in value &&
    typeof value.emailVerified === "boolean" &&
    "identityVerified" in value &&
    typeof value.identityVerified === "boolean"
  );
}

async function parseApiResponse(response: Response): Promise<ApiEnvelope> {
  const value: unknown = await response.json().catch(() => null);

  if (!isApiEnvelope(value)) {
    throw new Error("The account server returned an invalid response.");
  }

  if (!response.ok || !value.success) {
    throw new Error(resolveApiError(value, "The account request failed."));
  }

  return value;
}

function getAccessToken(): string {
  return localStorage.getItem("rello_token") ?? "";
}

function clearAuthenticationState(): void {
  cachedUser = null;
  userRequest = null;
  localStorage.removeItem("rello_token");
  localStorage.removeItem("rello_role");
  localStorage.removeItem("rello_tenant_verification");
  localStorage.removeItem("rello_landlord_verification");
  localStorage.removeItem("rello_agent_verification");
  clearInternalNavigationHistory();
}

async function authenticatedRequest(
  path: string,
  init: RequestInit = {},
): Promise<ApiEnvelope> {
  const token = getAccessToken();

  if (!token) {
    throw new Error("Your session has expired. Log in again.");
  }

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(path, { ...init, headers });
  return parseApiResponse(response);
}

export async function getAuthenticatedUser(): Promise<
  AccountActionResult & { user: AuthenticatedUser | null }
> {
  if (cachedUser) {
    return { success: true, message: "", user: cachedUser };
  }

  userRequest ??= (async () => {
    try {
      const envelope = await authenticatedRequest("/api/users/me");

      if (!isAuthenticatedUser(envelope.data)) {
        throw new Error("The account server returned invalid user details.");
      }

      cachedUser = envelope.data;
      return { success: true, message: envelope.message, user: cachedUser };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Your account details could not be loaded.",
        user: null,
      };
    } finally {
      userRequest = null;
    }
  })();

  return userRequest;
}

export function useAuthenticatedUser(): AuthenticatedUserState {
  const [state, setState] = useState<AuthenticatedUserState>({
    error: null,
    isLoading: cachedUser === null,
    user: cachedUser,
  });

  useEffect(() => {
    let isActive = true;

    void getAuthenticatedUser().then((result) => {
      if (!isActive) {
        return;
      }

      setState({
        error: result.success ? null : result.message,
        isLoading: false,
        user: result.user,
      });
    });

    return () => {
      isActive = false;
    };
  }, []);

  return state;
}

function cacheUser(value: unknown): AuthenticatedUser {
  if (!isAuthenticatedUser(value)) {
    throw new Error("The account server returned invalid user details.");
  }

  cachedUser = value;
  return value;
}

export async function updateProfile(
  edit: ProfileEdit,
): Promise<AccountActionResult & { user: AuthenticatedUser | null }> {
  try {
    const envelope = await authenticatedRequest("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(edit),
    });

    return {
      success: true,
      message: envelope.message,
      user: cacheUser(envelope.data),
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Your profile was not saved.",
      user: null,
    };
  }
}

export async function uploadAvatar(
  file: File,
): Promise<AccountActionResult & { user: AuthenticatedUser | null }> {
  try {
    const body = new FormData();
    body.append("image", file, file.name);

    const envelope = await authenticatedRequest("/api/users/me/avatar", {
      method: "POST",
      body,
    });

    return {
      success: true,
      message: envelope.message,
      user: cacheUser(envelope.data),
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "That photo was not saved.",
      user: null,
    };
  }
}

export async function getPreferences(): Promise<AccountPreferences> {
  try {
    const envelope = await authenticatedRequest("/api/users/me/preferences");

    return envelope.data !== null && typeof envelope.data === "object"
      ? (envelope.data as AccountPreferences)
      : {};
  } catch {
    return {};
  }
}

export async function savePreferences(
  preferences: AccountPreferences,
): Promise<AccountActionResult> {
  try {
    const envelope = await authenticatedRequest("/api/users/me/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(preferences),
    });

    return { success: true, message: envelope.message };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Those preferences were not saved.",
    };
  }
}

// === Two step sign-in

/** Sends a code to the account email and returns the reference to send back. */
export async function startTwoFactorSetup(): Promise<
  AccountActionResult & { reference: string }
> {
  try {
    const envelope = await authenticatedRequest("/api/auth/2fa/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });

    return {
      success: true,
      message: envelope.message,
      reference: typeof envelope.data === "string" ? envelope.data : "",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "That code was not sent.",
      reference: "",
    };
  }
}

export async function enableTwoFactor(
  reference: string,
  code: string,
): Promise<AccountActionResult> {
  try {
    const envelope = await authenticatedRequest("/api/auth/2fa/enable", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reference, code }),
    });

    cachedUser = null;
    return { success: true, message: envelope.message };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "That code is not right.",
    };
  }
}

export async function disableTwoFactor(
  password: string,
): Promise<AccountActionResult> {
  try {
    const envelope = await authenticatedRequest("/api/auth/2fa/disable", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    cachedUser = null;
    return { success: true, message: envelope.message };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "That was not turned off.",
    };
  }
}

export async function changeAccountPassword(
  oldPassword: string,
  newPassword: string,
): Promise<AccountActionResult> {
  try {
    const envelope = await authenticatedRequest("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oldPassword, newPassword }),
    });

    return { success: true, message: envelope.message };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Password could not be changed.",
    };
  }
}

export async function logOutAccount(): Promise<AccountActionResult> {
  try {
    const envelope = await authenticatedRequest("/api/auth/logout", {
      method: "POST",
    });
    clearAuthenticationState();
    return { success: true, message: envelope.message };
  } catch (error) {
    clearAuthenticationState();
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "The server logout failed.",
    };
  }
}

export async function deleteAccount(): Promise<AccountActionResult> {
  try {
    const envelope = await authenticatedRequest("/api/auth/account", {
      method: "DELETE",
    });
    clearAuthenticationState();
    await clearHostListingStorage().catch(() => undefined);

    return { success: true, message: envelope.message };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Account could not be deleted.",
    };
  }
}

// === Devices and deactivation

export async function getSessions(): Promise<LoginSession[]> {
  try {
    const envelope = await authenticatedRequest("/api/auth/sessions");

    return Array.isArray(envelope.data)
      ? (envelope.data as LoginSession[])
      : [];
  } catch {
    return [];
  }
}

export async function endSession(
  sessionId: number,
): Promise<AccountActionResult> {
  try {
    const envelope = await authenticatedRequest(
      `/api/auth/sessions/${sessionId}`,
      {
        method: "DELETE",
      },
    );

    return { success: true, message: envelope.message };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "That device was not signed out.",
    };
  }
}

export async function endOtherSessions(): Promise<AccountActionResult> {
  try {
    const envelope = await authenticatedRequest(
      "/api/auth/sessions?exceptCurrent=true",
      { method: "DELETE" },
    );

    return { success: true, message: envelope.message };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Those devices were not signed out.",
    };
  }
}

/** Reversible. Signing in again brings the account and its listings back. */
export async function deactivateAccount(): Promise<AccountActionResult> {
  try {
    const envelope = await authenticatedRequest("/api/auth/deactivate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmation: "DEACTIVATE" }),
    });

    clearAuthenticationState();
    return { success: true, message: envelope.message };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "The account was not deactivated.",
    };
  }
}

// === Data export

export async function requestDataExport(): Promise<
  AccountActionResult & { export: DataExport | null }
> {
  try {
    const envelope = await authenticatedRequest("/api/users/me/data-exports", {
      method: "POST",
    });

    return {
      success: true,
      message: envelope.message,
      export: envelope.data as DataExport,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "That request was not accepted.",
      export: null,
    };
  }
}

export async function getDataExports(): Promise<DataExport[]> {
  try {
    const envelope = await authenticatedRequest("/api/users/me/data-exports");

    return Array.isArray(envelope.data) ? (envelope.data as DataExport[]) : [];
  } catch {
    return [];
  }
}

"use client";

import { resolveApiError } from "@/lib/errors";

// === Types

export type IdentityCheck = "NIN" | "BVN" | "SELFIE";

export interface VerificationStatus {
  bvnVerified: boolean;
  emailVerified: boolean;
  identityVerified: boolean;
  ninVerified: boolean;
  /** Checks still outstanding for this role. */
  outstanding: IdentityCheck[];
  /** Everything this role needs, done or not. */
  required: IdentityCheck[];
  role: "ADMIN" | "AGENT" | "LANDLORD" | "TENANT";
  selfieVerified: boolean;
}

export interface IdentityResult<TValue> {
  data: TValue;
  message?: string;
}

// === Helpers

function getAccessToken(): string {
  return localStorage.getItem("rello_token") ?? "";
}

function unwrap(payload: unknown): unknown {
  return payload !== null && typeof payload === "object" && "data" in payload
    ? payload.data
    : null;
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl);

  if (!response.ok) {
    throw new Error("The selfie could not be prepared for upload.");
  }

  return response.blob();
}

// === Requests

/** What this account still has to complete, straight from the server. */
export async function getVerificationStatus(): Promise<
  IdentityResult<VerificationStatus | null>
> {
  const token = getAccessToken();

  if (!token) {
    return { data: null, message: "Log in to see your verification status." };
  }

  try {
    const response = await fetch("/api/verification/status", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        data: null,
        message: resolveApiError(payload, "Status could not be loaded."),
      };
    }

    const data = unwrap(payload);

    return data !== null && typeof data === "object"
      ? { data: data as VerificationStatus }
      : { data: null, message: "Status could not be loaded." };
  } catch {
    return { data: null, message: "Status could not be loaded." };
  }
}

/** A single Dojah check. Used by landlords, who need NIN and selfie but not BVN. */
export async function verifyIdentityNumber(
  check: "nin" | "bvn",
  value: string,
): Promise<IdentityResult<boolean>> {
  const token = getAccessToken();

  if (!token) {
    return { data: false, message: "Your session has expired. Log in again." };
  }

  try {
    const query = new URLSearchParams({ [check]: value });
    const response = await fetch(
      `/api/verification/dojah/${check}?${query.toString()}`,
      { method: "POST", headers: { Authorization: `Bearer ${token}` } },
    );

    if (response.ok) {
      return { data: true };
    }

    const payload: unknown = await response.json().catch(() => null);

    return {
      data: false,
      message: resolveApiError(payload, "That check did not pass."),
    };
  } catch {
    return { data: false, message: "We could not reach the identity service." };
  }
}

export async function verifySelfie(
  selfieDataUrl: string,
): Promise<IdentityResult<boolean>> {
  const token = getAccessToken();

  if (!token) {
    return { data: false, message: "Your session has expired. Log in again." };
  }

  try {
    const formData = new FormData();
    formData.append("selfie", await dataUrlToBlob(selfieDataUrl), "selfie.jpg");

    const response = await fetch("/api/verification/dojah/selfie", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (response.ok) {
      return { data: true };
    }

    const payload: unknown = await response.json().catch(() => null);

    return {
      data: false,
      message: resolveApiError(payload, "That selfie did not pass."),
    };
  } catch {
    return { data: false, message: "We could not reach the identity service." };
  }
}

/**
 * The agent path: NIN, BVN and selfie in one request. The backend runs all three
 * and records nothing unless every one passes, so an agent cannot end up partly
 * verified across separate calls.
 */
export async function submitAgentVerification(
  nin: string,
  bvn: string,
  selfieDataUrl: string,
  position?: { latitude: number; longitude: number } | null,
): Promise<IdentityResult<boolean>> {
  const token = getAccessToken();

  if (!token) {
    return { data: false, message: "Your session has expired. Log in again." };
  }

  try {
    const formData = new FormData();
    formData.append("selfie", await dataUrlToBlob(selfieDataUrl), "selfie.jpg");
    formData.append("nin", nin);
    formData.append("bvn", bvn);

    if (position) {
      formData.append("latitude", String(position.latitude));
      formData.append("longitude", String(position.longitude));
    }

    const response = await fetch("/api/verification/agent", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (response.ok) {
      return { data: true };
    }

    const payload: unknown = await response.json().catch(() => null);

    return {
      data: false,
      message: resolveApiError(payload, "Verification did not pass."),
    };
  } catch {
    return { data: false, message: "We could not reach the identity service." };
  }
}

/**
 * The landlord path: NIN then selfie, in that order. Both go through Dojah.
 * Stops at the first failure so the caller can say which check failed.
 */
export async function submitLandlordVerification(
  nin: string,
  selfieDataUrl: string,
): Promise<IdentityResult<boolean>> {
  const ninResult = await verifyIdentityNumber("nin", nin);

  if (!ninResult.data) {
    return ninResult;
  }

  return verifySelfie(selfieDataUrl);
}

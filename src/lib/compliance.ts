"use client";

import { apiRequest } from "@/lib/apiRequest";
import { resolveApiError } from "@/lib/errors";

// === Types

/**
 * The details a property business has to hold before a large payment: where someone
 * lives, what they do, and where the money came from. Identity itself is covered by
 * the NIN and BVN checks elsewhere.
 */
export interface ComplianceProfile {
  complete: boolean;
  dateOfBirth?: string | null;
  occupation: string | null;
  /** Payments at or above this need the details first. */
  requiredAboveAmount: number | null;
  residentialAddress: string | null;
  sourceOfFunds: string | null;
  updatedAt: string | null;
}

export interface ComplianceInput {
  /** Optional, as yyyy-MM-dd. Makes sanctions screening far less likely to confuse two people. */
  dateOfBirth?: string;
  occupation: string;
  residentialAddress: string;
  sourceOfFunds: string;
}

export interface ComplianceResult {
  data: ComplianceProfile | null;
  message?: string;
}

// === Guards

function isProfile(value: unknown): value is ComplianceProfile {
  return value !== null && typeof value === "object" && "complete" in value;
}

function unwrap(payload: unknown): unknown {
  return payload !== null && typeof payload === "object" && "data" in payload
    ? payload.data
    : null;
}

function getAccessToken(): string {
  return localStorage.getItem("rello_token") ?? "";
}

// === Requests

export async function getComplianceProfile(): Promise<ComplianceResult> {
  const token = getAccessToken();

  if (!token) {
    return { data: null, message: "Log in to see your details." };
  }

  try {
    const response = await apiRequest("/api/compliance/profile", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        data: null,
        message: resolveApiError(payload, "Those details could not be loaded."),
      };
    }

    const data = unwrap(payload);

    return isProfile(data)
      ? { data }
      : { data: null, message: "Those details could not be loaded." };
  } catch {
    return { data: null, message: "Those details could not be loaded." };
  }
}

export async function saveComplianceProfile(
  input: ComplianceInput,
): Promise<ComplianceResult> {
  const token = getAccessToken();

  if (!token) {
    return { data: null, message: "Your session has expired. Log in again." };
  }

  try {
    const response = await apiRequest("/api/compliance/profile", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });
    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        data: null,
        message: resolveApiError(payload, "Those details could not be saved."),
      };
    }

    const data = unwrap(payload);

    return isProfile(data)
      ? { data }
      : { data: null, message: "Those details could not be saved." };
  } catch {
    return { data: null, message: "Those details could not be saved." };
  }
}

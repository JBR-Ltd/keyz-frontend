"use client";

import type { PartySummary } from "@/lib/bookings";
import { resolveApiError } from "@/lib/errors";

// === Types

export type EscrowStatus =
  | "AWAITING_PAYMENT"
  | "HELD"
  | "DISPUTED"
  /** Transfer sent to the bank, waiting on confirmation. */
  | "RELEASING"
  | "RELEASED"
  | "REFUNDED"
  | "FAILED";

export interface EscrowEntry {
  amount: number;
  bookingId: number;
  createdAt: string | null;
  heldAt: string | null;
  host: PartySummary | null;
  id: number;
  propertyTitle: string;
  releasedAt: string | null;
  status: EscrowStatus;
  tenant: PartySummary | null;
}

export interface EscrowResult<TValue> {
  data: TValue;
  message?: string;
}

// === Guards

function isEscrowEntry(value: unknown): value is EscrowEntry {
  return (
    value !== null &&
    typeof value === "object" &&
    "id" in value &&
    typeof value.id === "number" &&
    "amount" in value &&
    typeof value.amount === "number" &&
    "status" in value &&
    typeof value.status === "string"
  );
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

export async function getMyEscrow(): Promise<EscrowResult<EscrowEntry[]>> {
  const token = getAccessToken();

  if (!token) {
    return { data: [], message: "Log in to see your payments." };
  }

  try {
    const response = await fetch("/api/escrow/mine", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        data: [],
        message: resolveApiError(payload, "Payments could not be loaded."),
      };
    }

    const data = unwrap(payload);

    return Array.isArray(data) && data.every(isEscrowEntry)
      ? { data }
      : { data: [], message: "Payments could not be loaded." };
  } catch {
    return { data: [], message: "Payments could not be loaded." };
  }
}

/** Returns the Paystack page to send the tenant to. */
export async function startBookingPayment(
  bookingId: number,
): Promise<EscrowResult<string | null>> {
  const token = getAccessToken();

  if (!token) {
    return { data: null, message: "Your session has expired. Log in again." };
  }

  try {
    const response = await fetch(`/api/escrow/bookings/${bookingId}/pay`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        data: null,
        message: resolveApiError(payload, "Payment could not be started."),
      };
    }

    const data = unwrap(payload);
    const url =
      data !== null &&
      typeof data === "object" &&
      "authorizationUrl" in data &&
      typeof data.authorizationUrl === "string"
        ? data.authorizationUrl
        : null;

    return url
      ? { data: url }
      : { data: null, message: "Payment could not be started." };
  } catch {
    return { data: null, message: "Payment could not be started." };
  }
}

export async function releaseEscrow(
  escrowId: number,
): Promise<EscrowResult<EscrowEntry | null>> {
  const token = getAccessToken();

  if (!token) {
    return { data: null, message: "Your session has expired. Log in again." };
  }

  try {
    const response = await fetch(`/api/escrow/${escrowId}/release`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        data: null,
        message: resolveApiError(payload, "Funds could not be released."),
      };
    }

    const data = unwrap(payload);

    return isEscrowEntry(data)
      ? { data }
      : { data: null, message: "Funds could not be released." };
  } catch {
    return { data: null, message: "Funds could not be released." };
  }
}

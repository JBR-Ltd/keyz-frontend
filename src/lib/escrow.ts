"use client";

import { getBrowserSessionMarker } from "@/lib/authSession";

import { apiRequest } from "@/lib/apiRequest";
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
  /** Refund sent to the provider, waiting on confirmation. */
  | "REFUNDING"
  | "REFUNDED"
  | "FAILED";

/** Where a refundable deposit stands. It settles apart from the rent. */
export type DepositStatus =
  | "HELD"
  | "CLAIMED"
  | "RETURNING"
  | "RETURNED"
  | "SETTLED";

export interface EscrowEntry {
  amount: number;
  bookingId: number;
  /** Rello's fee, fixed when the money is paid out. */
  commissionAmount?: number | null;
  createdAt: string | null;
  /** Why the last attempt to pay, pay out or refund did not go through. */
  failureReason?: string | null;
  heldAt: string | null;
  host: PartySummary | null;
  /** What reached the host once paid out. */
  hostAmount?: number | null;
  id: number;
  /** When an accepted booking has to be paid by. */
  paymentDueAt?: string | null;
  propertyPublicId?: string | null;
  propertyTitle: string;
  /** The payment reference, for a receipt. */
  reference?: string | null;
  /** The refundable deposit inside `amount`, and where it stands. */
  depositAmount?: number | null;
  depositStatus?: DepositStatus | null;
  depositClaimAmount?: number | null;
  depositClaimNote?: string | null;
  depositReturnedAt?: string | null;
  refundedAt?: string | null;
  releasedAt: string | null;
  status: EscrowStatus;
  tenant: PartySummary | null;
}

export interface EscrowResult<TValue> {
  /** The server's error code, when there is one, so a screen can answer it. */
  code?: string;
  data: TValue;
  message?: string;
  /** Every matching row, when the list came back a page at a time. */
  total?: number;
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

function errorCode(payload: unknown): string | undefined {
  return payload !== null &&
    typeof payload === "object" &&
    "code" in payload &&
    typeof payload.code === "string"
    ? payload.code
    : undefined;
}

function unwrap(payload: unknown): unknown {
  return payload !== null && typeof payload === "object" && "data" in payload
    ? payload.data
    : null;
}

function getSessionMarker(): string {
  return getBrowserSessionMarker();
}

// === Requests

export async function getMyEscrow(
  page = 0,
  size = 100,
): Promise<EscrowResult<EscrowEntry[]>> {
  const token = getSessionMarker();

  if (!token) {
    return { data: [], message: "Log in to see your payments." };
  }

  try {
    const response = await apiRequest(
      `/api/escrow/mine?page=${page}&size=${size}`,
      {
        headers: {},
      },
    );
    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        data: [],
        message: resolveApiError(payload, "Payments could not be loaded."),
      };
    }

    const data = unwrap(payload);
    const total = Number(response.headers.get("X-Total-Count"));

    return Array.isArray(data) && data.every(isEscrowEntry)
      ? {
          data,
          total: Number.isFinite(total) && total > 0 ? total : data.length,
        }
      : { data: [], message: "Payments could not be loaded." };
  } catch {
    return { data: [], message: "Payments could not be loaded." };
  }
}

export async function getAllMyEscrow(): Promise<EscrowResult<EscrowEntry[]>> {
  const token = getSessionMarker();
  const entries = new Map<number, EscrowEntry>();
  let page = 0;
  let total = 0;
  do {
    const result = await getMyEscrow(page, 100);
    if (result.message) return { data: [], message: result.message };
    if (token !== getSessionMarker())
      return { data: [], message: "Your account changed. Reload this page." };
    for (const entry of result.data) entries.set(entry.id, entry);
    total = result.total ?? entries.size;
    page++;
    if (result.data.length === 0) break;
  } while (entries.size < total);
  return { data: Array.from(entries.values()), total: entries.size };
}

/** Returns the Paystack page to send the tenant to. */
export async function startBookingPayment(
  bookingId: number,
): Promise<EscrowResult<string | null>> {
  const token = getSessionMarker();

  if (!token) {
    return { data: null, message: "Your session has expired. Log in again." };
  }

  try {
    const response = await apiRequest(`/api/escrow/bookings/${bookingId}/pay`, {
      method: "POST",
      headers: {},
    });
    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        data: null,
        code: errorCode(payload),
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

/**
 * Checks the payment a tenant has just come back from Paystack with, rather than
 * waiting for the webhook, and returns it as it now stands.
 */
export async function verifyPaymentReturn(
  reference: string,
): Promise<EscrowResult<EscrowEntry | null>> {
  const token = getSessionMarker();

  if (!token) {
    return { data: null, message: "Your session has expired. Log in again." };
  }

  try {
    const response = await apiRequest(
      `/api/escrow/payments/${encodeURIComponent(reference)}/verify`,
      {
        method: "POST",
        headers: {},
      },
    );
    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        data: null,
        message: resolveApiError(payload, "We could not check that payment."),
      };
    }

    const data = unwrap(payload);

    return isEscrowEntry(data)
      ? { data }
      : { data: null, message: "We could not check that payment." };
  } catch {
    return { data: null, message: "We could not check that payment." };
  }
}

/**
 * A host saying the home was damaged and asking to keep part of the deposit.
 *
 * It does not move the money: Rello holds it and decides, because a host keeping a
 * deposit on their own word is the habit this replaces.
 */
export async function claimDeposit(
  bookingId: number,
  amount: number,
  note: string,
): Promise<EscrowResult<EscrowEntry | null>> {
  const token = getSessionMarker();

  if (!token) {
    return { data: null, message: "Your session has expired. Log in again." };
  }

  try {
    const response = await apiRequest(
      `/api/bookings/${bookingId}/deposit-claim`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount, note: note.trim() }),
      },
    );
    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        data: null,
        message: resolveApiError(payload, "That claim could not be recorded."),
      };
    }

    const data = unwrap(payload);

    return isEscrowEntry(data)
      ? { data }
      : { data: null, message: "That claim could not be recorded." };
  } catch {
    return { data: null, message: "That claim could not be recorded." };
  }
}

export async function releaseEscrow(
  escrowId: number,
): Promise<EscrowResult<EscrowEntry | null>> {
  const token = getSessionMarker();

  if (!token) {
    return { data: null, message: "Your session has expired. Log in again." };
  }

  try {
    const response = await apiRequest(`/api/escrow/${escrowId}/release`, {
      method: "POST",
      headers: {},
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

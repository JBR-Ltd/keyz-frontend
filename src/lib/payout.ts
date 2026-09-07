"use client";

import { resolveApiError } from "@/lib/errors";

// === Types

export interface ResolvedAccount {
  accountName: string;
  accountNumber: string;
  bankCode: string;
  /** Whether this account would pass the identity check on save. */
  matchesYou: boolean;
}

export interface PayoutResult<TValue> {
  data: TValue;
  message?: string;
}

// === Helpers

function unwrap(payload: unknown): unknown {
  return payload !== null && typeof payload === "object" && "data" in payload
    ? payload.data
    : null;
}

function getAccessToken(): string {
  return localStorage.getItem("rello_token") ?? "";
}

function isResolvedAccount(value: unknown): value is ResolvedAccount {
  return (
    value !== null &&
    typeof value === "object" &&
    "accountName" in value &&
    typeof value.accountName === "string"
  );
}

async function postPayout(
  action: "resolve" | "setup",
  bankCode: string,
  accountNumber: string,
): Promise<{ ok: boolean; payload: unknown }> {
  const token = getAccessToken();

  if (!token) {
    return { ok: false, payload: null };
  }

  const query = new URLSearchParams({ bankCode, accountNumber });
  const response = await fetch(
    `/api/verification/payout/${action}?${query.toString()}`,
    { method: "POST", headers: { Authorization: `Bearer ${token}` } },
  );

  return { ok: response.ok, payload: await response.json().catch(() => null) };
}

// === Requests

/**
 * Asks the bank who owns this account. Saves nothing, so the host can see the
 * name and catch a mistyped digit before committing to it.
 */
export async function resolvePayoutAccount(
  bankCode: string,
  accountNumber: string,
): Promise<PayoutResult<ResolvedAccount | null>> {
  try {
    const { ok, payload } = await postPayout("resolve", bankCode, accountNumber);

    if (!ok) {
      return {
        data: null,
        message: resolveApiError(payload, "We could not find that account."),
      };
    }

    const data = unwrap(payload);

    return isResolvedAccount(data)
      ? { data }
      : { data: null, message: "We could not find that account." };
  } catch {
    return { data: null, message: "We could not reach the bank right now." };
  }
}

/** Commits the account. The identity check runs server side, so this can still fail. */
export async function savePayoutAccount(
  bankCode: string,
  accountNumber: string,
): Promise<PayoutResult<boolean>> {
  try {
    const { ok, payload } = await postPayout("setup", bankCode, accountNumber);

    return ok
      ? { data: true }
      : {
          data: false,
          message: resolveApiError(
            payload,
            "That payout account could not be saved.",
          ),
        };
  } catch {
    return {
      data: false,
      message: "That payout account could not be saved.",
    };
  }
}

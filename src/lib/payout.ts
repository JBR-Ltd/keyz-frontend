"use client";

import { getBrowserSessionMarker } from "@/lib/authSession";

import { apiRequest } from "@/lib/apiRequest";
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

export interface BankOption {
  code: string;
  name: string;
}

// === Helpers

function unwrap(payload: unknown): unknown {
  return payload !== null && typeof payload === "object" && "data" in payload
    ? payload.data
    : null;
}

function getSessionMarker(): string {
  return getBrowserSessionMarker();
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
  const token = getSessionMarker();

  if (!token) {
    return { ok: false, payload: null };
  }

  const query = new URLSearchParams({ bankCode, accountNumber });
  const response = await apiRequest(
    `/api/verification/payout/${action}?${query.toString()}`,
    { method: "POST", headers: {} },
  );

  return { ok: response.ok, payload: await response.json().catch(() => null) };
}

// === Requests

function isBankOption(value: unknown): value is BankOption {
  return (
    value !== null &&
    typeof value === "object" &&
    "code" in value &&
    typeof value.code === "string" &&
    "name" in value &&
    typeof value.name === "string"
  );
}

/** Every institution a payout can reach. Served from the backend's cache. */
export async function getPayoutBanks(): Promise<PayoutResult<BankOption[]>> {
  const token = getSessionMarker();

  if (!token) {
    return { data: [], message: "Your session has expired. Log in again." };
  }

  try {
    const response = await apiRequest("/api/verification/payout/banks");
    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        data: [],
        message: resolveApiError(payload, "The bank list could not be loaded."),
      };
    }

    const data = unwrap(payload);

    return Array.isArray(data)
      ? { data: data.filter(isBankOption) }
      : { data: [], message: "The bank list could not be loaded." };
  } catch {
    return { data: [], message: "The bank list could not be loaded." };
  }
}

/**
 * Asks the bank who owns this account. Saves nothing, so the host can see the
 * name and catch a mistyped digit before committing to it.
 */
export async function resolvePayoutAccount(
  bankCode: string,
  accountNumber: string,
): Promise<PayoutResult<ResolvedAccount | null>> {
  try {
    const { ok, payload } = await postPayout(
      "resolve",
      bankCode,
      accountNumber,
    );

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

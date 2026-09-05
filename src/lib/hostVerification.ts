"use client";

import { useCallback, useEffect, useState } from "react";
import { resolveApiError } from "@/lib/errors";
import {
  getVerificationStatus,
  type IdentityCheck,
  type VerificationStatus,
} from "@/lib/identityVerification";

// === Types

export type HostVerificationRole = "landlord" | "agent";

export type HostCheckStatus =
  | "not_started"
  | "partial"
  | "pending"
  | "approved"
  | "rejected";

export interface HostIdentityState {
  /** Checks already passed, for showing progress on a part-finished flow. */
  completed: IdentityCheck[];
  outstanding: IdentityCheck[];
  required: IdentityCheck[];
  status: HostCheckStatus;
}

export interface HostKybState {
  rejectionReason: string | null;
  status: HostCheckStatus;
}

export interface HostPayoutState {
  accountLast4: string | null;
  accountName: string | null;
  bankCode: string | null;
  status: HostCheckStatus;
}

export interface HostVerificationSnapshot {
  identity: HostIdentityState;
  kyb: HostKybState;
  payout: HostPayoutState;
}

export interface HostVerificationResult {
  data: HostVerificationSnapshot | null;
  message?: string;
}

// === Helpers

const BANK_NAMES: Record<string, string> = {
  "011": "First Bank of Nigeria",
  "033": "United Bank for Africa",
  "044": "Access Bank",
  "057": "Zenith Bank",
  "058": "Guaranty Trust Bank",
  "070": "Fidelity Bank",
  "214": "First City Monument Bank",
  "221": "Stanbic IBTC Bank",
  "232": "Sterling Bank",
  "999992": "OPay",
  "999991": "PalmPay",
  "50211": "Kuda Bank",
  "090267": "Kuda Microfinance Bank",
  "100004": "OPay Digital Services",
};

export function getBankName(bankCode: string | null): string {
  if (!bankCode) {
    return "Bank";
  }

  return BANK_NAMES[bankCode] ?? "Your bank";
}

export function maskAccountNumber(accountLast4: string | null): string {
  if (!accountLast4) {
    return "Account ending unavailable";
  }

  return `•••• ${accountLast4}`;
}

function toCheckStatus(value: string | null | undefined): HostCheckStatus {
  switch (value) {
    case "APPROVED":
      return "approved";
    case "PENDING":
      return "pending";
    case "REJECTED":
      return "rejected";
    default:
      return "not_started";
  }
}

/**
 * Identity is decided by Dojah in the moment, so there is no pending state.
 * A host who passed some checks but not all is "partial", which the flow uses
 * to skip the steps they already cleared.
 */
function toIdentityState(status: VerificationStatus): HostIdentityState {
  const required = status.required ?? [];
  const outstanding = status.outstanding ?? [];
  const completed = required.filter((check) => !outstanding.includes(check));

  if (status.identityVerified) {
    return { completed, outstanding: [], required, status: "approved" };
  }

  return {
    completed,
    outstanding,
    required,
    status: completed.length > 0 ? "partial" : "not_started",
  };
}

function toSnapshot(status: VerificationStatus): HostVerificationSnapshot {
  return {
    identity: toIdentityState(status),
    kyb: {
      rejectionReason: status.kybRejectionReason ?? null,
      status: toCheckStatus(status.kybStatus),
    },
    payout: {
      accountLast4: status.payoutAccountLast4 ?? null,
      accountName: status.payoutAccountName ?? null,
      bankCode: status.payoutBankCode ?? null,
      status: toCheckStatus(status.payoutStatus),
    },
  };
}

function getAccessToken(): string {
  return localStorage.getItem("rello_token") ?? "";
}

// === Requests

/**
 * The host's verification state, read from the server every time.
 * Nothing about verification is cached in the browser: a stale local copy is
 * how a host ends up being told they are verified while the server refuses
 * their listings.
 */
export async function getHostVerification(): Promise<HostVerificationResult> {
  const result = await getVerificationStatus();

  if (!result.data) {
    return { data: null, message: result.message };
  }

  return { data: toSnapshot(result.data) };
}

/** Business registration and proof of address. Both are reviewed by a person. */
export async function submitKybDocuments(
  businessDocument: File,
  addressDocument: File,
): Promise<{ data: boolean; message?: string }> {
  const token = getAccessToken();

  if (!token) {
    return { data: false, message: "Your session has expired. Log in again." };
  }

  try {
    const formData = new FormData();
    formData.append("businessDocument", businessDocument);
    formData.append("addressDocument", addressDocument);

    const response = await fetch("/api/verification/kyb", {
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
      message: resolveApiError(payload, "Those documents could not be sent."),
    };
  } catch {
    return { data: false, message: "Those documents could not be sent." };
  }
}

// === Hooks

export interface UseHostVerification {
  isLoading: boolean;
  refresh: () => void;
  snapshot: HostVerificationSnapshot | null;
}

/** Reads the host's verification state once on mount. */
export function useHostVerification(): UseHostVerification {
  const [snapshot, setSnapshot] = useState<HostVerificationSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback((): void => {
    void getHostVerification().then((result) => {
      setSnapshot(result.data);
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { isLoading, refresh, snapshot };
}

/** How many of the three host checks are done. */
export function countVerifiedHostSteps(
  snapshot: HostVerificationSnapshot | null,
): number {
  if (!snapshot) {
    return 0;
  }

  return [snapshot.identity.status, snapshot.kyb.status, snapshot.payout.status]
    .filter((status) => status === "approved").length;
}

"use client";

import type { EscrowEntry } from "@/lib/escrow";
import { resolveApiError } from "@/lib/errors";

// === Types

export type RiskStatus = "CLEARED" | "ESCALATED" | "OPEN";

export type RiskSeverity = "HIGH" | "LOW" | "MEDIUM";

export interface RiskFlag {
  amount: number | null;
  bookingId: number | null;
  createdAt: string | null;
  detail: string | null;
  escrowId: number | null;
  id: number;
  propertyTitle: string | null;
  reviewNote: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  severity: RiskSeverity;
  status: RiskStatus;
  type: string;
  userEmail: string | null;
  userId: number | null;
  userName: string | null;
}

export interface AdminRiskResult<TValue> {
  data: TValue;
  message?: string;
  total?: number;
}

// === Guards

function isRiskFlag(value: unknown): value is RiskFlag {
  return (
    value !== null &&
    typeof value === "object" &&
    "id" in value &&
    typeof value.id === "number" &&
    "type" in value &&
    typeof value.type === "string"
  );
}

function isEscrowEntry(value: unknown): value is EscrowEntry {
  return (
    value !== null &&
    typeof value === "object" &&
    "id" in value &&
    typeof value.id === "number" &&
    "amount" in value
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

export async function getRiskFlags(
  status?: RiskStatus,
): Promise<AdminRiskResult<RiskFlag[]>> {
  const token = getAccessToken();

  if (!token) {
    return { data: [], message: "Log in as an admin to see this." };
  }

  try {
    const query = status ? `?status=${status}` : "";
    const response = await fetch(`/api/admin/risk-flags${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        data: [],
        message: resolveApiError(payload, "Risk flags could not be loaded."),
      };
    }

    const data = unwrap(payload);
    const total = Number(response.headers.get("X-Total-Count"));

    return Array.isArray(data) && data.every(isRiskFlag)
      ? { data, total: Number.isFinite(total) ? total : data.length }
      : { data: [], message: "Risk flags could not be loaded." };
  } catch {
    return { data: [], message: "Risk flags could not be loaded." };
  }
}

export async function reviewRiskFlag(
  id: number,
  status: Exclude<RiskStatus, "OPEN">,
  note: string,
): Promise<AdminRiskResult<RiskFlag | null>> {
  const token = getAccessToken();

  if (!token) {
    return { data: null, message: "Your session has expired. Log in again." };
  }

  try {
    const response = await fetch(`/api/admin/risk-flags/${id}/review`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status, note: note.trim() }),
    });
    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        data: null,
        message: resolveApiError(payload, "That could not be saved."),
      };
    }

    const data = unwrap(payload);

    return isRiskFlag(data)
      ? { data }
      : { data: null, message: "That could not be saved." };
  } catch {
    return { data: null, message: "That could not be saved." };
  }
}

/** Deposits a host has claimed against, waiting on a decision. */
export async function getDepositClaims(): Promise<
  AdminRiskResult<EscrowEntry[]>
> {
  const token = getAccessToken();

  if (!token) {
    return { data: [], message: "Log in as an admin to see this." };
  }

  try {
    const response = await fetch("/api/admin/deposits", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        data: [],
        message: resolveApiError(payload, "Deposit claims could not be loaded."),
      };
    }

    const data = unwrap(payload);

    return Array.isArray(data) && data.every(isEscrowEntry)
      ? { data }
      : { data: [], message: "Deposit claims could not be loaded." };
  } catch {
    return { data: [], message: "Deposit claims could not be loaded." };
  }
}

export async function settleDeposit(
  escrowId: number,
  amountToTenant: number,
  note: string,
): Promise<AdminRiskResult<EscrowEntry | null>> {
  const token = getAccessToken();

  if (!token) {
    return { data: null, message: "Your session has expired. Log in again." };
  }

  try {
    const response = await fetch(
      `/api/admin/escrow/${escrowId}/deposit-settlement`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amountToTenant, note: note.trim() }),
      },
    );
    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        data: null,
        message: resolveApiError(payload, "That deposit could not be settled."),
      };
    }

    const data = unwrap(payload);

    return isEscrowEntry(data)
      ? { data }
      : { data: null, message: "That deposit could not be settled." };
  } catch {
    return { data: null, message: "That deposit could not be settled." };
  }
}

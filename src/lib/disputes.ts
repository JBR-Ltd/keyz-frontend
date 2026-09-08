"use client";

import type { PartySummary } from "@/lib/bookings";
import { resolveApiError } from "@/lib/errors";

// === Types

export type DisputeStatus =
  | "OPEN"
  | "UNDER_REVIEW"
  | "RESOLVED_FOR_TENANT"
  | "RESOLVED_FOR_HOST"
  | "WITHDRAWN";

export interface Dispute {
  bookingId: number;
  createdAt: string | null;
  detail: string | null;
  evidenceUrls: string[];
  id: number;
  propertyTitle: string;
  raisedBy: PartySummary | null;
  reason: string;
  resolutionNote: string | null;
  resolvedAt: string | null;
  status: DisputeStatus;
}

export interface DisputeResult<TValue> {
  data: TValue;
  message?: string;
}

export interface NewDispute {
  bookingId: number;
  detail: string;
  reason: string;
}

// === Guards

function isDispute(value: unknown): value is Dispute {
  return (
    value !== null &&
    typeof value === "object" &&
    "id" in value &&
    typeof value.id === "number" &&
    "reason" in value &&
    typeof value.reason === "string" &&
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

export async function getMyDisputes(): Promise<DisputeResult<Dispute[]>> {
  const token = getAccessToken();

  if (!token) {
    return { data: [], message: "Log in to see your disputes." };
  }

  try {
    const response = await fetch("/api/disputes/mine", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        data: [],
        message: resolveApiError(payload, "Disputes could not be loaded."),
      };
    }

    const data = unwrap(payload);

    return Array.isArray(data) && data.every(isDispute)
      ? { data }
      : { data: [], message: "Disputes could not be loaded." };
  } catch {
    return { data: [], message: "Disputes could not be loaded." };
  }
}

export async function openDispute(
  dispute: NewDispute,
): Promise<DisputeResult<Dispute | null>> {
  const token = getAccessToken();

  if (!token) {
    return { data: null, message: "Your session has expired. Log in again." };
  }

  try {
    const response = await fetch("/api/disputes", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dispute),
    });
    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        data: null,
        message: resolveApiError(payload, "This dispute could not be opened."),
      };
    }

    const data = unwrap(payload);

    return isDispute(data)
      ? { data }
      : { data: null, message: "This dispute could not be opened." };
  } catch {
    return { data: null, message: "This dispute could not be opened." };
  }
}

async function actOnDispute(
  disputeId: number,
  action: "escalate" | "withdraw",
  failureMessage: string,
): Promise<DisputeResult<Dispute | null>> {
  const token = getAccessToken();

  if (!token) {
    return { data: null, message: "Your session has expired. Log in again." };
  }

  try {
    const response = await fetch(`/api/disputes/${disputeId}/${action}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      return { data: null, message: resolveApiError(payload, failureMessage) };
    }

    const data = unwrap(payload);

    return isDispute(data) ? { data } : { data: null, message: failureMessage };
  } catch {
    return { data: null, message: failureMessage };
  }
}

export function escalateDispute(
  disputeId: number,
): Promise<DisputeResult<Dispute | null>> {
  return actOnDispute(disputeId, "escalate", "This could not be sent to Rello.");
}

export function withdrawDispute(
  disputeId: number,
): Promise<DisputeResult<Dispute | null>> {
  return actOnDispute(disputeId, "withdraw", "This could not be withdrawn.");
}

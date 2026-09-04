"use client";

import type { PartySummary } from "@/lib/bookings";
import type { Dispute, DisputeStatus } from "@/lib/disputes";
import { resolveApiError } from "@/lib/errors";

// === Types

export interface AdminMetrics {
  agents: number;
  cancelledBookings: number;
  completedBookings: number;
  confirmedBookings: number;
  disputesUnderReview: number;
  duplicateFlaggedListings: number;
  escrowAwaitingPayment: number;
  escrowHeld: number;
  escrowReleased: number;
  identityVerifiedUsers: number;
  landlords: number;
  openDisputes: number;
  pendingBookings: number;
  pendingKybSubmissions: number;
  tenants: number;
  totalBookings: number;
  totalListings: number;
  totalUsers: number;
  unverifiedListings: number;
  verifiedListings: number;
}

export interface KybSubmission {
  documentUrl: string | null;
  id: number;
  status: string;
  user: PartySummary | null;
}

export interface AdminResult<TValue> {
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

async function adminRequest(
  path: string,
  init?: RequestInit,
): Promise<{ ok: boolean; payload: unknown }> {
  const token = getAccessToken();

  if (!token) {
    return { ok: false, payload: null };
  }

  const response = await fetch(path, {
    ...init,
    headers: { ...(init?.headers ?? {}), Authorization: `Bearer ${token}` },
  });

  return { ok: response.ok, payload: await response.json().catch(() => null) };
}

// === Requests

export async function getAdminMetrics(): Promise<
  AdminResult<AdminMetrics | null>
> {
  try {
    const { ok, payload } = await adminRequest("/api/admin/metrics");

    if (!ok) {
      return {
        data: null,
        message: resolveApiError(payload, "Metrics could not be loaded."),
      };
    }

    const data = unwrap(payload);

    return data !== null && typeof data === "object"
      ? { data: data as AdminMetrics }
      : { data: null, message: "Metrics could not be loaded." };
  } catch {
    return { data: null, message: "Metrics could not be loaded." };
  }
}

export async function getDisputeQueue(): Promise<AdminResult<Dispute[]>> {
  try {
    const { ok, payload } = await adminRequest("/api/admin/disputes");

    if (!ok) {
      return {
        data: [],
        message: resolveApiError(payload, "The queue could not be loaded."),
      };
    }

    const data = unwrap(payload);

    return Array.isArray(data)
      ? { data: data as Dispute[] }
      : { data: [], message: "The queue could not be loaded." };
  } catch {
    return { data: [], message: "The queue could not be loaded." };
  }
}

export async function resolveDispute(
  disputeId: number,
  outcome: Extract<
    DisputeStatus,
    "RESOLVED_FOR_TENANT" | "RESOLVED_FOR_HOST"
  >,
  note: string,
): Promise<AdminResult<Dispute | null>> {
  try {
    const query = new URLSearchParams({ outcome, note });
    const { ok, payload } = await adminRequest(
      `/api/admin/disputes/${disputeId}/resolve?${query.toString()}`,
      { method: "POST" },
    );

    if (!ok) {
      return {
        data: null,
        message: resolveApiError(payload, "This dispute could not be closed."),
      };
    }

    return { data: unwrap(payload) as Dispute };
  } catch {
    return { data: null, message: "This dispute could not be closed." };
  }
}

export async function getKybQueue(): Promise<AdminResult<KybSubmission[]>> {
  try {
    const { ok, payload } = await adminRequest("/api/admin/kyb");

    if (!ok) {
      return {
        data: [],
        message: resolveApiError(payload, "The queue could not be loaded."),
      };
    }

    const data = unwrap(payload);

    return Array.isArray(data)
      ? { data: data as KybSubmission[] }
      : { data: [], message: "The queue could not be loaded." };
  } catch {
    return { data: [], message: "The queue could not be loaded." };
  }
}

export async function decideKyb(
  kybId: number,
  approved: boolean,
): Promise<AdminResult<boolean>> {
  try {
    const { ok, payload } = await adminRequest(
      `/api/admin/kyb/${kybId}/decision?approved=${approved}`,
      { method: "POST" },
    );

    return ok
      ? { data: true }
      : {
          data: false,
          message: resolveApiError(payload, "That decision could not be saved."),
        };
  } catch {
    return { data: false, message: "That decision could not be saved." };
  }
}

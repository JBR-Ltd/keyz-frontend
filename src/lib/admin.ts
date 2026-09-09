"use client";

import type { Booking, PartySummary } from "@/lib/bookings";
import type { Dispute, DisputeStatus } from "@/lib/disputes";
import { resolveApiError } from "@/lib/errors";
import type { EscrowEntry } from "@/lib/escrow";
import type { Review } from "@/lib/reviews";

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
  addressDocumentUrl: string | null;
  documentUrl: string | null;
  id: number;
  rejectionReason: string | null;
  status: string;
  user: PartySummary | null;
}

export interface AdminResult<TValue> {
  data: TValue;
  message?: string;
}

export type ReviewModerationStatus =
  | "PUBLISHED"
  | "HIDDEN"
  | "FLAGGED"
  | "REMOVED";

/** A review as a moderator sees it: the note saying why is admin-only. */
export interface ModeratedReview extends Review {
  moderationReason: string | null;
  status: ReviewModerationStatus;
}

export interface AdminPage<TItem> {
  hasNext: boolean;
  items: TItem[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
}

export interface AdminSearch {
  page?: number;
  query?: string;
  status?: string;
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

function emptyPage<TItem>(): AdminPage<TItem> {
  return {
    hasNext: false,
    items: [],
    page: 0,
    size: 0,
    totalItems: 0,
    totalPages: 0,
  };
}

function isAdminPage(value: unknown): value is AdminPage<unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    "items" in value &&
    Array.isArray(value.items)
  );
}

/** A blank filter is left off the query string so the backend treats it as no filter. */
function searchParams(search: AdminSearch): string {
  const params = new URLSearchParams();

  if (search.query && search.query.trim()) {
    params.set("query", search.query.trim());
  }

  if (search.status) {
    params.set("status", search.status);
  }

  if (search.page) {
    params.set("page", String(search.page));
  }

  const query = params.toString();

  return query ? `?${query}` : "";
}

async function searchPage<TItem>(
  path: string,
  search: AdminSearch,
  failure: string,
): Promise<AdminResult<AdminPage<TItem>>> {
  try {
    const { ok, payload } = await adminRequest(`${path}${searchParams(search)}`);

    if (!ok) {
      return {
        data: emptyPage<TItem>(),
        message: resolveApiError(payload, failure),
      };
    }

    const data = unwrap(payload);

    return isAdminPage(data)
      ? { data: data as AdminPage<TItem> }
      : { data: emptyPage<TItem>(), message: failure };
  } catch {
    return { data: emptyPage<TItem>(), message: failure };
  }
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

/** A rejection must carry a reason: the host is shown it so they know what to fix. */
export async function decideKyb(
  kybId: number,
  approved: boolean,
  reason?: string,
): Promise<AdminResult<boolean>> {
  try {
    const query = new URLSearchParams({ approved: String(approved) });

    if (!approved && reason) {
      query.set("reason", reason);
    }

    const { ok, payload } = await adminRequest(
      `/api/admin/kyb/${kybId}/decision?${query.toString()}`,
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

export async function searchBookings(
  search: AdminSearch,
): Promise<AdminResult<AdminPage<Booking>>> {
  return searchPage<Booking>(
    "/api/admin/bookings",
    search,
    "Bookings could not be loaded.",
  );
}

export async function searchEscrow(
  search: AdminSearch,
): Promise<AdminResult<AdminPage<EscrowEntry>>> {
  return searchPage<EscrowEntry>(
    "/api/admin/escrow",
    search,
    "Escrow could not be loaded.",
  );
}

export async function searchReviews(
  search: AdminSearch,
): Promise<AdminResult<AdminPage<ModeratedReview>>> {
  return searchPage<ModeratedReview>(
    "/api/admin/reviews",
    search,
    "Reviews could not be loaded.",
  );
}

/** Anything other than publishing has to carry a reason: the decision is recorded. */
export async function moderateReview(
  reviewId: number,
  status: ReviewModerationStatus,
  reason?: string,
): Promise<AdminResult<ModeratedReview | null>> {
  try {
    const params = new URLSearchParams({ status });

    if (status !== "PUBLISHED" && reason) {
      params.set("reason", reason);
    }

    const { ok, payload } = await adminRequest(
      `/api/admin/reviews/${reviewId}/status?${params.toString()}`,
      { method: "PATCH" },
    );

    if (!ok) {
      return {
        data: null,
        message: resolveApiError(payload, "That decision could not be saved."),
      };
    }

    return { data: unwrap(payload) as ModeratedReview };
  } catch {
    return { data: null, message: "That decision could not be saved." };
  }
}

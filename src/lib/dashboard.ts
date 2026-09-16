"use client";

import { resolveApiError } from "@/lib/errors";

// === Types

export interface DashboardBookingCounts {
  active: number;
  /** Accepted, but the tenant has not paid yet. */
  awaitingPayment: number;
  past: number;
  requests: number;
  upcoming: number;
}

/** Naira. What each figure means depends on whose dashboard it is. */
export interface DashboardMoneyTotals {
  currency: string;
  held: number;
  onItsWay: number;
  settled: number;
}

export interface DashboardListingCounts {
  awaitingVerification: number;
  let: number;
  live: number;
  total: number;
}

export interface HostDashboardSummary {
  bookings: DashboardBookingCounts;
  listings: DashboardListingCounts;
  money: DashboardMoneyTotals;
  openDisputes: number;
  openRepairs: number;
  pendingViewings: number;
  unreadMessages: number;
  upcomingViewings: number;
}

export interface TenantDashboardSummary {
  bookings: DashboardBookingCounts;
  money: DashboardMoneyTotals;
  openRepairs: number;
  savedListings: number;
  unreadMessages: number;
  upcomingViewings: number;
}

export interface DashboardResult<TValue> {
  data: TValue | null;
  message?: string;
}

// === Guards

function hasCountsAndMoney(value: unknown): value is {
  bookings: DashboardBookingCounts;
  money: DashboardMoneyTotals;
} {
  return (
    value !== null &&
    typeof value === "object" &&
    "bookings" in value &&
    value.bookings !== null &&
    typeof value.bookings === "object" &&
    "money" in value &&
    value.money !== null &&
    typeof value.money === "object"
  );
}

function isHostSummary(value: unknown): value is HostDashboardSummary {
  return (
    hasCountsAndMoney(value) &&
    "listings" in value &&
    value.listings !== null &&
    typeof value.listings === "object"
  );
}

function isTenantSummary(value: unknown): value is TenantDashboardSummary {
  return hasCountsAndMoney(value) && "savedListings" in value;
}

// === Requests

async function requestSummary<TValue>(
  path: string,
  guard: (value: unknown) => value is TValue,
): Promise<DashboardResult<TValue>> {
  const token = localStorage.getItem("rello_token") ?? "";

  if (!token) {
    return { data: null, message: "Log in to see your dashboard." };
  }

  try {
    const response = await fetch(path, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        data: null,
        message: resolveApiError(payload, "Your figures could not be loaded."),
      };
    }

    const data =
      payload !== null && typeof payload === "object" && "data" in payload
        ? payload.data
        : null;

    return guard(data)
      ? { data }
      : { data: null, message: "Your figures could not be loaded." };
  } catch {
    return { data: null, message: "Your figures could not be loaded." };
  }
}

/** Counts and totals for a landlord or agent, worked out by the server. */
export function getHostDashboardSummary(): Promise<
  DashboardResult<HostDashboardSummary>
> {
  return requestSummary("/api/dashboard/host", isHostSummary);
}

export function getTenantDashboardSummary(): Promise<
  DashboardResult<TenantDashboardSummary>
> {
  return requestSummary("/api/dashboard/tenant", isTenantSummary);
}

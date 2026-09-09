"use client";

import { resolveApiError } from "@/lib/errors";

// === Types

/** Why a range cannot be booked. A guest is never told who holds it. */
export type UnavailableSource = "BLOCK" | "BOOKING";

export interface UnavailableRange {
  endDate: string;
  id: number;
  reason: string | null;
  source: UnavailableSource;
  startDate: string;
}

export interface AvailabilityResult<TValue> {
  data: TValue;
  message?: string;
}

// === Helpers

function unwrap(payload: unknown): unknown {
  return payload !== null && typeof payload === "object" && "data" in payload
    ? payload.data
    : null;
}

function isUnavailableRange(value: unknown): value is UnavailableRange {
  return (
    value !== null &&
    typeof value === "object" &&
    "startDate" in value &&
    typeof value.startDate === "string" &&
    "endDate" in value &&
    typeof value.endDate === "string"
  );
}

function toDate(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

// === Requests

/**
 * Dates already taken on a listing, so a guest is not offered a stay that will be
 * refused. Public, because the calendar has to work before anyone logs in.
 */
export async function getPropertyAvailability(
  propertyId: number,
): Promise<AvailabilityResult<UnavailableRange[]>> {
  try {
    const response = await fetch(`/api/properties/${propertyId}/availability`);
    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        data: [],
        message: resolveApiError(payload, "Availability could not be loaded."),
      };
    }

    const data = unwrap(payload);

    return Array.isArray(data) && data.every(isUnavailableRange)
      ? { data }
      : { data: [], message: "Availability could not be loaded." };
  } catch {
    return { data: [], message: "Availability could not be loaded." };
  }
}

/**
 * Whether a stay clashes with anything already taken.
 *
 * Ranges are half-open, matching the server: a stay starting the day another ends
 * is fine, which is what makes same-day turnover work for shortlets.
 */
export function overlapsUnavailable(
  ranges: UnavailableRange[],
  start: string,
  end: string,
): boolean {
  const from = toDate(start).getTime();
  const to = toDate(end).getTime();

  return ranges.some((range) => {
    const rangeFrom = toDate(range.startDate).getTime();
    const rangeTo = toDate(range.endDate).getTime();

    return from < rangeTo && to > rangeFrom;
  });
}

/** Every individual date inside a taken range, for shading a calendar. */
export function toBlockedDates(ranges: UnavailableRange[]): Set<string> {
  const blocked = new Set<string>();

  for (const range of ranges) {
    const cursor = toDate(range.startDate);
    const end = toDate(range.endDate);

    // End is exclusive, so the last night is the day before it
    while (cursor < end) {
      blocked.add(cursor.toISOString().slice(0, 10));
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  return blocked;
}

function getAccessToken(): string {
  return localStorage.getItem("rello_token") ?? "";
}

/** Dates the host is holding back: their own stay, repairs, a tenancy off-platform. */
export async function blockDates(
  propertyId: number,
  startDate: string,
  endDate: string,
  reason: string,
): Promise<AvailabilityResult<UnavailableRange | null>> {
  const token = getAccessToken();

  if (!token) {
    return { data: null, message: "Log in again to block dates." };
  }

  try {
    const response = await fetch(
      `/api/properties/${propertyId}/availability/blocks`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ startDate, endDate, reason: reason || null }),
      },
    );
    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        data: null,
        message: resolveApiError(payload, "Those dates were not blocked."),
      };
    }

    const data = unwrap(payload);

    return isUnavailableRange(data)
      ? { data }
      : { data: null, message: "Those dates were not blocked." };
  } catch {
    return { data: null, message: "Those dates were not blocked." };
  }
}

export async function unblockDates(
  propertyId: number,
  blockId: number,
): Promise<AvailabilityResult<boolean>> {
  const token = getAccessToken();

  if (!token) {
    return { data: false, message: "Log in again to open those dates." };
  }

  try {
    const response = await fetch(
      `/api/properties/${propertyId}/availability/blocks/${blockId}`,
      { method: "DELETE", headers: { Authorization: `Bearer ${token}` } },
    );

    if (!response.ok) {
      const payload: unknown = await response.json().catch(() => null);

      return {
        data: false,
        message: resolveApiError(payload, "Those dates were not reopened."),
      };
    }

    return { data: true };
  } catch {
    return { data: false, message: "Those dates were not reopened." };
  }
}

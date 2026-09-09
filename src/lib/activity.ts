"use client";

import { resolveApiError } from "@/lib/errors";

// === Types

/**
 * What happened, as a stable name.
 *
 * The backend never sends a sentence. The wording belongs here, so copy can change
 * without a deploy on both sides, and an unknown type still renders as something
 * rather than nothing.
 */
export interface ActivityEvent {
  id: string;
  metadata: Record<string, unknown> | null;
  occurredAt: string | null;
  propertyId: number | null;
  propertyTitle: string | null;
  resourceId: number;
  resourceType: "BOOKING" | "ESCROW" | "DISPUTE" | "VIEWING" | "MAINTENANCE";
  type: string;
}

export interface ActivityPage {
  items: ActivityEvent[];
  nextCursor: string | null;
}

export interface ActivityResult {
  data: ActivityPage;
  message?: string;
}

// === Wording

const HEADLINES: Record<string, string> = {
  BOOKING_REQUESTED: "Booking requested",
  BOOKING_CONFIRMED: "Booking confirmed",
  BOOKING_CANCELLED: "Booking cancelled",
  BOOKING_COMPLETED: "Tenancy completed",
  MOVE_IN_UPCOMING: "Move in coming up",
  ESCROW_AWAITING_PAYMENT: "Waiting on payment",
  ESCROW_HELD: "Rent held in escrow",
  ESCROW_REFUNDED: "Rent refunded",
  ESCROW_DISPUTED: "Payment disputed",
  ESCROW_FAILED: "Payment failed",
  PAYOUT_ON_ITS_WAY: "Payout on its way",
  PAYOUT_RELEASED: "Paid out",
  DISPUTE_OPENED: "Dispute opened",
  DISPUTE_RESOLVED: "Dispute resolved",
  VIEWING_REQUESTED: "Viewing requested",
  VIEWING_CONFIRMED: "Viewing confirmed",
  MAINTENANCE_OPEN: "Repair reported",
  MAINTENANCE_ACKNOWLEDGED: "Repair seen",
  MAINTENANCE_IN_PROGRESS: "Repair under way",
  MAINTENANCE_RESOLVED: "Repair fixed",
  MAINTENANCE_CLOSED: "Repair closed",
  MAINTENANCE_CANCELLED: "Repair withdrawn",
};

/** A type this build has never heard of still reads as words, not as a constant. */
export function activityHeadline(type: string): string {
  const known = HEADLINES[type];

  if (known) {
    return known;
  }

  const words = type.toLowerCase().replace(/_/g, " ");

  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** Where a person goes to act on this. */
export function activityHref(event: ActivityEvent, role: string): string {
  const base = `/${role}`;

  switch (event.resourceType) {
    case "ESCROW":
      return `${base}/escrow`;
    case "DISPUTE":
      return `${base}/disputes`;
    case "VIEWING":
      return role === "tenant" ? `${base}/bookings` : `${base}/viewings`;
    case "MAINTENANCE":
      return role === "tenant" ? `${base}/bookings` : `${base}/maintenance`;
    default:
      return `${base}/bookings`;
  }
}

// === Requests

function getAccessToken(): string {
  return localStorage.getItem("rello_token") ?? "";
}

function isActivityEvent(value: unknown): value is ActivityEvent {
  return (
    value !== null &&
    typeof value === "object" &&
    "type" in value &&
    typeof value.type === "string" &&
    "resourceType" in value &&
    typeof value.resourceType === "string"
  );
}

const EMPTY: ActivityPage = { items: [], nextCursor: null };

export async function getMyActivity(
  cursor?: string,
  size = 20,
): Promise<ActivityResult> {
  const token = getAccessToken();

  if (!token) {
    return { data: EMPTY, message: "Log in to see your activity." };
  }

  try {
    const params = new URLSearchParams({ size: String(size) });

    if (cursor) {
      params.set("cursor", cursor);
    }

    const response = await fetch(`/api/activity?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        data: EMPTY,
        message: resolveApiError(payload, "Your activity could not be loaded."),
      };
    }

    const data =
      payload !== null && typeof payload === "object" && "data" in payload
        ? payload.data
        : null;

    if (data === null || typeof data !== "object" || !("items" in data)) {
      return { data: EMPTY, message: "Your activity could not be loaded." };
    }

    const items = Array.isArray(data.items) ? data.items.filter(isActivityEvent) : [];
    const nextCursor =
      "nextCursor" in data && typeof data.nextCursor === "string"
        ? data.nextCursor
        : null;

    return { data: { items, nextCursor } };
  } catch {
    return { data: EMPTY, message: "Your activity could not be loaded." };
  }
}

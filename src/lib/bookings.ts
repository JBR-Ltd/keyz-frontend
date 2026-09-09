"use client";

import { resolveApiError } from "@/lib/errors";

// === Types

export type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";

export interface PartySummary {
  id: number;
  identityVerified: boolean;
  name: string;
  rating: number | null;
  role: "ADMIN" | "AGENT" | "LANDLORD" | "TENANT";
}

export interface Booking {
  createdAt: string | null;
  endDate: string;
  host: PartySummary | null;
  id: number;
  propertyAddress: string;
  propertyId: number;
  propertyImageUrl: string | null;
  propertyTitle: string;
  startDate: string;
  status: BookingStatus;
  tenant: PartySummary | null;
  totalPrice: number;
}

export interface BookingResult<TValue> {
  data: TValue;
  message?: string;
}

// === Guards

function isPartySummary(value: unknown): value is PartySummary {
  return (
    value !== null &&
    typeof value === "object" &&
    "id" in value &&
    typeof value.id === "number" &&
    "name" in value &&
    typeof value.name === "string"
  );
}

function isBooking(value: unknown): value is Booking {
  return (
    value !== null &&
    typeof value === "object" &&
    "id" in value &&
    typeof value.id === "number" &&
    "propertyId" in value &&
    typeof value.propertyId === "number" &&
    "startDate" in value &&
    typeof value.startDate === "string" &&
    "endDate" in value &&
    typeof value.endDate === "string" &&
    "status" in value &&
    typeof value.status === "string" &&
    (!("host" in value) || value.host === null || isPartySummary(value.host)) &&
    (!("tenant" in value) ||
      value.tenant === null ||
      isPartySummary(value.tenant))
  );
}

// === Requests

function getAccessToken(): string {
  return localStorage.getItem("rello_token") ?? "";
}

async function requestBookings(path: string): Promise<BookingResult<Booking[]>> {
  const token = getAccessToken();

  if (!token) {
    return { data: [], message: "Log in to see your bookings." };
  }

  try {
    const response = await fetch(path, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        data: [],
        message: resolveApiError(payload, "Bookings could not be loaded."),
      };
    }

    const data =
      payload !== null && typeof payload === "object" && "data" in payload
        ? payload.data
        : null;

    if (!Array.isArray(data) || !data.every(isBooking)) {
      return { data: [], message: "Bookings could not be loaded." };
    }

    return { data };
  } catch {
    return { data: [], message: "Bookings could not be loaded." };
  }
}

export function getMyBookings(): Promise<BookingResult<Booking[]>> {
  return requestBookings("/api/bookings/mine");
}

export function getHostBookings(): Promise<BookingResult<Booking[]>> {
  return requestBookings("/api/bookings/host");
}

/** What a stay would cost, worked out by the code that charges for it. */
export interface BookingQuote {
  cleaningFee: number | null;
  currency: string;
  periodUnit: "MONTH" | "NIGHT" | "YEAR";
  periods: number;
  propertyId: number;
  rentalMode: string;
  total: number;
  /** Set when the dates cannot be booked. A reason to show, not a price. */
  unavailableReason: string | null;
  unitPrice: number;
}

/**
 * Asks the server what a stay costs.
 *
 * Public, and deliberately not computed on the client: the figure a guest is shown
 * and the figure they are charged have to come from one place, or they drift.
 */
export async function getBookingQuote(
  propertyId: number,
  startDate: string,
  endDate: string,
): Promise<BookingResult<BookingQuote | null>> {
  try {
    const query = new URLSearchParams({
      propertyId: String(propertyId),
      startDate,
      endDate,
    });
    const response = await fetch(`/api/bookings/quote?${query.toString()}`);
    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        data: null,
        message: resolveApiError(payload, "That price could not be worked out."),
      };
    }

    const data =
      payload !== null && typeof payload === "object" && "data" in payload
        ? payload.data
        : null;

    return data !== null && typeof data === "object"
      ? { data: data as BookingQuote }
      : { data: null, message: "That price could not be worked out." };
  } catch {
    return { data: null, message: "That price could not be worked out." };
  }
}

/**
 * Requests a stay. The server works out the total from the listing mode, so no
 * price is sent: a client-supplied figure would be a way to underpay.
 */
export async function createBooking(
  propertyId: number,
  startDate: string,
  endDate: string,
): Promise<BookingResult<Booking | null>> {
  const token = getAccessToken();

  if (!token) {
    return { data: null, message: "Your session has expired. Log in again." };
  }

  try {
    const response = await fetch("/api/bookings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ propertyId, startDate, endDate }),
    });
    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        data: null,
        message: resolveApiError(payload, "That booking could not be made."),
      };
    }

    const data =
      payload !== null && typeof payload === "object" && "data" in payload
        ? payload.data
        : null;

    return isBooking(data)
      ? { data }
      : { data: null, message: "That booking could not be made." };
  } catch {
    return { data: null, message: "That booking could not be made." };
  }
}

export async function updateBookingStatus(
  bookingId: number,
  status: BookingStatus,
): Promise<BookingResult<Booking | null>> {
  const token = getAccessToken();

  if (!token) {
    return { data: null, message: "Your session has expired. Log in again." };
  }

  try {
    const response = await fetch(
      `/api/bookings/${bookingId}/status?status=${status}`,
      {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        data: null,
        message: resolveApiError(payload, "This booking could not be updated."),
      };
    }

    const data =
      payload !== null && typeof payload === "object" && "data" in payload
        ? payload.data
        : null;

    return { data: isBooking(data) ? data : null };
  } catch {
    return { data: null, message: "This booking could not be updated." };
  }
}

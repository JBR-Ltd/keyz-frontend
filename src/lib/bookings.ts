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

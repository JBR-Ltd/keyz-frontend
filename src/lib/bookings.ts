"use client";

import type { DepositStatus, EscrowStatus } from "@/lib/escrow";
import { resolveApiError } from "@/lib/errors";

// === Types

export type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
export type BookingKind = "RENTAL_REQUEST" | "SHORT_STAY";
export type MoveInPreference =
  | "ASAP"
  | "WITHIN_30_DAYS"
  | "EXACT_DATE"
  | "FLEXIBLE";

/** Worked out by the server, so every screen agrees on where a booking is. */
export type LifecycleStage = "REQUEST" | "UPCOMING" | "ACTIVE" | "PAST";

export interface PartySummary {
  id: number;
  identityVerified: boolean;
  name: string;
  rating: number | null;
  role: "ADMIN" | "AGENT" | "LANDLORD" | "TENANT";
}

export interface Booking {
  createdAt: string | null;
  bookingKind?: BookingKind;
  endDate: string | null;
  host: PartySummary | null;
  id: number;
  propertyAddress: string;
  propertyId: number;
  propertyImageUrl: string | null;
  /** For linking to the listing's canonical page. */
  propertyPublicId?: string | null;
  propertySlug?: string | null;
  propertyTitle: string;
  moveInPreference?: MoveInPreference | null;
  preferredMoveInDate?: string | null;
  rentalMode?: "ANNUAL" | "MONTHLY" | "SHORT_STAY";
  lifecycleStage?: LifecycleStage;
  startDate: string | null;
  status: BookingStatus;
  tenancyEndDate?: string | null;
  /** The move-in the host recorded when accepting a rental request. */
  tenancyStartDate?: string | null;
  tenant: PartySummary | null;
  tenantMessage?: string | null;
  totalPrice: number;
  /** Guests on a shortlet. */
  guestCount?: number | null;
  /** The refundable deposit inside totalPrice, and where it stands. */
  depositAmount?: number | null;
  depositStatus?: DepositStatus | null;
  /** When a long-term tenancy is due to end. */
  tenancyExpectedEndDate?: string | null;
  /** Why it was declined or cancelled, when a reason was given. */
  cancellationReason?: string | null;
  cancelledAt?: string | null;
  /** The escrow behind it, once a payment has been started. */
  escrowId?: number | null;
  /** When an accepted booking has to be paid by, before it is released. */
  paymentDueAt?: string | null;
  /** Null until a payment is started. */
  paymentStatus?: EscrowStatus | null;
}

export interface BookingResult<TValue> {
  data: TValue;
  message?: string;
  /** Every matching booking, when the list came back a page at a time. */
  total?: number;
}

export interface BookingPage {
  page?: number;
  size?: number;
}

export interface BookingStatusOptions {
  /** The move-in a host agrees to when accepting a rental request, as yyyy-MM-dd. */
  moveInDate?: string;
  /** Why it is being declined or cancelled. Shown to the other side. */
  reason?: string;
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
    (!("startDate" in value) ||
      value.startDate === null ||
      typeof value.startDate === "string") &&
    (!("endDate" in value) ||
      value.endDate === null ||
      typeof value.endDate === "string") &&
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

async function requestBookings(
  path: string,
): Promise<BookingResult<Booking[]>> {
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

    const total = Number(response.headers.get("X-Total-Count"));

    return {
      data,
      total: Number.isFinite(total) && total > 0 ? total : data.length,
    };
  } catch {
    return { data: [], message: "Bookings could not be loaded." };
  }
}

function withPage(path: string, page: BookingPage = {}): string {
  const query = new URLSearchParams();

  if (page.page !== undefined) {
    query.set("page", String(page.page));
  }

  if (page.size !== undefined) {
    query.set("size", String(page.size));
  }

  const search = query.toString();

  return search ? `${path}?${search}` : path;
}

export function getMyBookings(
  page?: BookingPage,
): Promise<BookingResult<Booking[]>> {
  return requestBookings(withPage("/api/bookings/mine", page));
}

export function getHostBookings(
  page?: BookingPage,
): Promise<BookingResult<Booking[]>> {
  return requestBookings(withPage("/api/bookings/host", page));
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
  guests?: number;
  /** The most guests the listing takes, or null for no limit. */
  maximumGuests?: number | null;
  /** Inside `total`, and refundable after the tenancy. */
  securityDeposit?: number | null;
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
  guests?: number,
): Promise<BookingResult<BookingQuote | null>> {
  try {
    // Shortlets only: a long-term listing shows its rent rather than a date quote
    const query = new URLSearchParams({
      propertyId: String(propertyId),
      checkInDate: startDate,
      checkOutDate: endDate,
    });

    if (guests) {
      query.set("guests", String(guests));
    }
    const response = await fetch(
      `/api/bookings/short-stays/quote?${query.toString()}`,
    );
    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        data: null,
        message: resolveApiError(
          payload,
          "That price could not be worked out.",
        ),
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

export interface RentalRequestInput {
  message?: string;
  moveInPreference: MoveInPreference;
  preferredMoveInDate?: string;
  propertyId: number;
}

export async function createRentalRequest(
  input: RentalRequestInput,
): Promise<BookingResult<Booking | null>> {
  const token = getAccessToken();

  if (!token) {
    return { data: null, message: "Your session has expired. Log in again." };
  }

  try {
    const response = await fetch("/api/bookings/rental-requests", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });
    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        data: null,
        message: resolveApiError(
          payload,
          "That rental request could not be sent.",
        ),
      };
    }

    const data =
      payload !== null && typeof payload === "object" && "data" in payload
        ? payload.data
        : null;

    return isBooking(data)
      ? { data }
      : { data: null, message: "That rental request could not be sent." };
  } catch {
    return { data: null, message: "That rental request could not be sent." };
  }
}

/**
 * Reserves exact dates on a shortlet. The server prices the stay from the listing,
 * so no total is sent.
 */
export async function createShortletBooking(
  propertyId: number,
  checkInDate: string,
  checkOutDate: string,
  message?: string,
  guests?: number,
): Promise<BookingResult<Booking | null>> {
  const token = getAccessToken();

  if (!token) {
    return { data: null, message: "Your session has expired. Log in again." };
  }

  try {
    const response = await fetch("/api/bookings/short-stays", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        propertyId,
        checkInDate,
        checkOutDate,
        message: message?.trim() || undefined,
        guests,
      }),
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
  options: BookingStatusOptions = {},
): Promise<BookingResult<Booking | null>> {
  const token = getAccessToken();

  if (!token) {
    return { data: null, message: "Your session has expired. Log in again." };
  }

  try {
    const query = new URLSearchParams({ status });

    if (options.moveInDate) {
      query.set("moveInDate", options.moveInDate);
    }

    if (options.reason?.trim()) {
      query.set("reason", options.reason.trim());
    }

    const response = await fetch(
      `/api/bookings/${bookingId}/status?${query.toString()}`,
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

/**
 * Records or changes the move-in on an accepted rental. Host only, and refused once
 * the payment has settled.
 */
export async function recordMoveInDate(
  bookingId: number,
  moveInDate: string,
): Promise<BookingResult<Booking | null>> {
  const token = getAccessToken();

  if (!token) {
    return { data: null, message: "Your session has expired. Log in again." };
  }

  try {
    const response = await fetch(
      `/api/bookings/${bookingId}/move-in?moveInDate=${encodeURIComponent(moveInDate)}`,
      {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        data: null,
        message: resolveApiError(payload, "The move-in date could not be saved."),
      };
    }

    const data =
      payload !== null && typeof payload === "object" && "data" in payload
        ? payload.data
        : null;

    return isBooking(data)
      ? { data }
      : { data: null, message: "The move-in date could not be saved." };
  } catch {
    return { data: null, message: "The move-in date could not be saved." };
  }
}

"use client";

import type { PartySummary } from "@/lib/bookings";
import { resolveApiError } from "@/lib/errors";

// === Types

export interface SavedProperty {
  address: string;
  bathrooms: number;
  bedrooms: number;
  host: PartySummary | null;
  id: number;
  imageUrl: string | null;
  latitude: number | null;
  listedByName: string | null;
  longitude: number | null;
  price: number;
  squareFootage: number;
  status: "FOR_RENT" | "FOR_SALE" | "RENTED" | "SOLD";
  title: string;
  verified: boolean;
}

export interface SavedListingResult<TValue> {
  data: TValue;
  message?: string;
}

// === Guards

function isSavedProperty(value: unknown): value is SavedProperty {
  return (
    value !== null &&
    typeof value === "object" &&
    "id" in value &&
    typeof value.id === "number" &&
    "title" in value &&
    typeof value.title === "string" &&
    "price" in value &&
    typeof value.price === "number" &&
    "status" in value &&
    typeof value.status === "string"
  );
}

// === Requests

function getAccessToken(): string {
  return localStorage.getItem("rello_token") ?? "";
}

export async function getSavedListings(): Promise<
  SavedListingResult<SavedProperty[]>
> {
  const token = getAccessToken();

  if (!token) {
    return { data: [], message: "Log in to see your saved listings." };
  }

  try {
    const response = await fetch("/api/saved-listings", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        data: [],
        message: resolveApiError(
          payload,
          "Saved listings could not be loaded.",
        ),
      };
    }

    const data =
      payload !== null && typeof payload === "object" && "data" in payload
        ? payload.data
        : null;

    if (!Array.isArray(data) || !data.every(isSavedProperty)) {
      return { data: [], message: "Saved listings could not be loaded." };
    }

    return { data };
  } catch {
    return { data: [], message: "Saved listings could not be loaded." };
  }
}

async function changeSavedListing(
  propertyId: number,
  method: "DELETE" | "POST",
  failureMessage: string,
): Promise<SavedListingResult<boolean>> {
  const token = getAccessToken();

  if (!token) {
    return { data: false, message: "Your session has expired. Log in again." };
  }

  try {
    const response = await fetch(`/api/saved-listings/${propertyId}`, {
      method,
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const payload: unknown = await response.json().catch(() => null);
      return { data: false, message: resolveApiError(payload, failureMessage) };
    }

    return { data: true };
  } catch {
    return { data: false, message: failureMessage };
  }
}

export function saveListing(
  propertyId: number,
): Promise<SavedListingResult<boolean>> {
  return changeSavedListing(
    propertyId,
    "POST",
    "This listing could not be saved.",
  );
}

export function removeSavedListing(
  propertyId: number,
): Promise<SavedListingResult<boolean>> {
  return changeSavedListing(
    propertyId,
    "DELETE",
    "This listing could not be removed.",
  );
}

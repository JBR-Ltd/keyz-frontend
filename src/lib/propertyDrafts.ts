"use client";

import { resolveApiError } from "@/lib/errors";
import type { PropertyListingStatus } from "@/lib/propertyDetails";
import type { RentalMode } from "@/lib/hostListings";

// === Types

export interface PropertyDraft {
  address: string | null;
  amenities: string[];
  area: string | null;
  bathrooms: number | null;
  bedrooms: number | null;
  city: string | null;
  cleaningFee: number | null;
  /** How close the draft is to publishable, for a progress hint. */
  completionPercent: number;
  createdAt: string;
  description: string | null;
  id: number;
  imageUrls: string[];
  listingType: PropertyListingStatus | null;
  minimumNights: number | null;
  price: number | null;
  rentalMode: RentalMode | null;
  squareFootage: number | null;
  title: string | null;
  updatedAt: string;
}

/** Every field optional. Absent means leave it as it is. */
export interface PropertyDraftInput {
  address?: string;
  amenities?: string[];
  area?: string;
  bathrooms?: number;
  bedrooms?: number;
  city?: string;
  cleaningFee?: number | null;
  description?: string;
  listingType?: PropertyListingStatus;
  minimumNights?: number | null;
  price?: number;
  rentalMode?: RentalMode;
  squareFootage?: number;
  title?: string;
}

export interface DraftResult<TValue> {
  data: TValue;
  message?: string;
}

// === Helpers

function getAccessToken(): string {
  return localStorage.getItem("rello_token") ?? "";
}

function unwrap(payload: unknown): unknown {
  return payload !== null && typeof payload === "object" && "data" in payload
    ? payload.data
    : null;
}

function isDraft(value: unknown): value is PropertyDraft {
  return (
    value !== null &&
    typeof value === "object" &&
    "id" in value &&
    typeof value.id === "number" &&
    "imageUrls" in value
  );
}

async function request(
  path: string,
  init?: RequestInit,
): Promise<{ ok: boolean; payload: unknown }> {
  const token = getAccessToken();

  if (!token) {
    return { ok: false, payload: null };
  }

  const response = await fetch(path, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${token}`,
    },
  });

  return { ok: response.ok, payload: await response.json().catch(() => null) };
}

async function draftRequest(
  path: string,
  init?: RequestInit,
  fallback = "That draft could not be saved.",
): Promise<DraftResult<PropertyDraft | null>> {
  try {
    const { ok, payload } = await request(path, init);

    if (!ok) {
      return { data: null, message: resolveApiError(payload, fallback) };
    }

    const data = unwrap(payload);

    return isDraft(data) ? { data } : { data: null, message: fallback };
  } catch {
    return { data: null, message: fallback };
  }
}

// === Requests

export function createDraft(
  input: PropertyDraftInput,
): Promise<DraftResult<PropertyDraft | null>> {
  return draftRequest("/api/property-drafts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function updateDraft(
  draftId: number,
  input: PropertyDraftInput,
): Promise<DraftResult<PropertyDraft | null>> {
  return draftRequest(`/api/property-drafts/${draftId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function getDraft(
  draftId: number,
): Promise<DraftResult<PropertyDraft | null>> {
  return draftRequest(
    `/api/property-drafts/${draftId}`,
    undefined,
    "That draft could not be opened.",
  );
}

export async function getDrafts(): Promise<DraftResult<PropertyDraft[]>> {
  try {
    const { ok, payload } = await request("/api/property-drafts?size=50");

    if (!ok) {
      return {
        data: [],
        message: resolveApiError(payload, "Drafts could not be loaded."),
      };
    }

    const data = unwrap(payload);
    const items =
      data !== null && typeof data === "object" && "items" in data
        ? data.items
        : null;

    return Array.isArray(items) && items.every(isDraft)
      ? { data: items }
      : { data: [], message: "Drafts could not be loaded." };
  } catch {
    return { data: [], message: "Drafts could not be loaded." };
  }
}

export async function deleteDraft(
  draftId: number,
): Promise<DraftResult<boolean>> {
  try {
    const { ok, payload } = await request(`/api/property-drafts/${draftId}`, {
      method: "DELETE",
    });

    return ok
      ? { data: true }
      : {
          data: false,
          message: resolveApiError(payload, "That draft could not be removed."),
        };
  } catch {
    return { data: false, message: "That draft could not be removed." };
  }
}

/**
 * Adds one photo to a draft.
 *
 * Uploaded now rather than at publish, so a draft opened on another device shows
 * the same pictures instead of an empty gallery.
 */
export async function addDraftImage(
  draftId: number,
  file: Blob,
  name: string,
): Promise<DraftResult<PropertyDraft | null>> {
  const formData = new FormData();
  formData.append("image", file, name);

  return draftRequest(
    `/api/property-drafts/${draftId}/images`,
    { method: "POST", body: formData },
    "That photo could not be uploaded.",
  );
}

export function removeDraftImage(
  draftId: number,
  position: number,
): Promise<DraftResult<PropertyDraft | null>> {
  return draftRequest(
    `/api/property-drafts/${draftId}/images/${position}`,
    { method: "DELETE" },
    "That photo could not be removed.",
  );
}

/** Turns the draft into an unverified listing. The rules are applied here. */
export async function publishDraft(
  draftId: number,
): Promise<DraftResult<number | null>> {
  try {
    const { ok, payload } = await request(
      `/api/property-drafts/${draftId}/publish`,
      { method: "POST" },
    );

    if (!ok) {
      return {
        data: null,
        message: resolveApiError(payload, "That listing could not be published."),
      };
    }

    const data = unwrap(payload);
    const id =
      data !== null && typeof data === "object" && "id" in data
        ? data.id
        : null;

    return typeof id === "number"
      ? { data: id }
      : { data: null, message: "That listing could not be published." };
  } catch {
    return { data: null, message: "That listing could not be published." };
  }
}

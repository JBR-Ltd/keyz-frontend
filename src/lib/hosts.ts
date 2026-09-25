"use client";

import { apiRequest } from "@/lib/apiRequest";
import { resolveApiError } from "@/lib/errors";
import type { BackendPage, BackendProperty } from "@/lib/hostListings";
import { hostPublicIdFrom } from "@/lib/publicIds";

// === Types

export interface HostProfile {
  id: number;
  publicId?: string;
  slug?: string;
  identityVerified: boolean;
  listingCount: number;
  name: string;
  rating: number | null;
  reviewCount: number;
  role: "AGENT" | "LANDLORD";
}

export interface HostResult<TValue> {
  data: TValue;
  message?: string;
}

// === Guards

function isHostProfile(value: unknown): value is HostProfile {
  return (
    value !== null &&
    typeof value === "object" &&
    "id" in value &&
    typeof value.id === "number" &&
    "name" in value &&
    typeof value.name === "string" &&
    "role" in value &&
    (value.role === "AGENT" || value.role === "LANDLORD")
  );
}

function unwrap(payload: unknown): unknown {
  return payload !== null && typeof payload === "object" && "data" in payload
    ? payload.data
    : null;
}

/**
 * The API path for a host. A route segment ending in a public identifier goes
 * through the public lookup; an older numeric link still works.
 */
function hostApiPath(hostId: string): string {
  const publicId = hostPublicIdFrom(hostId);

  return publicId ? `public/${publicId}` : encodeURIComponent(hostId);
}

// === Requests

/** Public: no token needed, so a shared link works for a logged-out visitor. */
export async function getHostProfile(
  hostId: string,
): Promise<HostResult<HostProfile | null>> {
  try {
    const response = await apiRequest(`/api/hosts/${hostApiPath(hostId)}`);
    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        data: null,
        message: resolveApiError(payload, "This host could not be found."),
      };
    }

    const data = unwrap(payload);

    return isHostProfile(data)
      ? { data }
      : { data: null, message: "This host could not be found." };
  } catch {
    return { data: null, message: "This host could not be loaded." };
  }
}

export async function getHostListings(
  hostId: string,
  page = 0,
  size = 12,
): Promise<HostResult<BackendPage<BackendProperty> | null>> {
  try {
    const response = await apiRequest(
      `/api/hosts/${hostApiPath(hostId)}/listings?page=${page}&size=${size}`,
    );
    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        data: null,
        message: resolveApiError(payload, "Listings could not be loaded."),
      };
    }

    const data = unwrap(payload);

    if (data === null || typeof data !== "object" || !("items" in data)) {
      return { data: null, message: "Listings could not be loaded." };
    }

    return { data: data as BackendPage<BackendProperty> };
  } catch {
    return { data: null, message: "Listings could not be loaded." };
  }
}

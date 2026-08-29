"use client";

import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { PropertyListingStatus } from "@/lib/propertyDetails";

export type HostListingRole = "landlord" | "agent";

export type HostListingReviewStatus =
  | "DRAFT"
  | "PENDING_VERIFICATION"
  | "VERIFIED"
  | "REJECTED";

export interface HostListingPhoto {
  id: string;
  dataUrl: string;
  name: string;
  type: string;
}

export interface HostListingInput {
  id?: string;
  ownerRole: HostListingRole;
  listingType: PropertyListingStatus;
  title: string;
  description: string;
  price: number;
  city: string;
  area: string;
  address: string;
  bedrooms: number;
  bathrooms: number;
  squareFootage?: number;
  amenities: string[];
  photos: HostListingPhoto[];
}

export interface HostListingRecord extends HostListingInput {
  id: string;
  reviewStatus: HostListingReviewStatus;
  createdAt: string;
  updatedAt: string;
}

interface HostListingsDatabase extends DBSchema {
  listings: {
    key: string;
    value: HostListingRecord;
  };
}

export interface HostListingStorageResult<TValue> {
  data: TValue;
  unavailable: boolean;
}

const DATABASE_NAME = "rello-host-listings";
const DATABASE_VERSION = 1;
const STORAGE_EVENT = "rello-host-listings-change";

let databasePromise: Promise<IDBPDatabase<HostListingsDatabase>> | null = null;

function getDatabase(): Promise<IDBPDatabase<HostListingsDatabase>> {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return Promise.reject(new Error("IndexedDB is unavailable"));
  }

  databasePromise ??= openDB<HostListingsDatabase>(
    DATABASE_NAME,
    DATABASE_VERSION,
    {
      upgrade(database) {
        if (!database.objectStoreNames.contains("listings")) {
          database.createObjectStore("listings", { keyPath: "id" });
        }
      },
    },
  );

  return databasePromise;
}

function createListingId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `listing-${crypto.randomUUID()}`;
  }

  return `listing-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function publishStorageChange(): void {
  window.dispatchEvent(new Event(STORAGE_EVENT));
}

async function persistListing(
  input: HostListingInput,
  reviewStatus: HostListingReviewStatus,
): Promise<HostListingStorageResult<HostListingRecord | null>> {
  try {
    const database = await getDatabase();
    const now = new Date().toISOString();
    const existing = input.id
      ? await database.get("listings", input.id)
      : undefined;
    const record: HostListingRecord = {
      ...input,
      id: input.id ?? createListingId(),
      reviewStatus,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    await database.put("listings", record);
    publishStorageChange();

    return { data: record, unavailable: false };
  } catch {
    return { data: null, unavailable: true };
  }
}

interface BackendApiEnvelope {
  success: boolean;
  message: string;
  data: unknown;
}

function isBackendApiEnvelope(value: unknown): value is BackendApiEnvelope {
  return (
    value !== null &&
    typeof value === "object" &&
    "success" in value &&
    "message" in value
  );
}

function extractBackendPropertyId(value: unknown): number | null {
  if (
    value !== null &&
    typeof value === "object" &&
    "id" in value &&
    typeof value.id === "number"
  ) {
    return value.id;
  }

  return null;
}

// Calls the real Java backend to create the property record. Returns the
// real numeric property ID on success, or null if the user isn't logged
// in, isn't verified, or the request otherwise fails - callers treat null
// the same as "storage unavailable".
async function createPropertyOnBackend(
  input: HostListingInput,
): Promise<string | null> {
  if (typeof window === "undefined") {
    return null;
  }

  const token = localStorage.getItem("rello_token");
  const userId = localStorage.getItem("rello_user_id");

  if (!token || !userId) {
    return null;
  }

  const address = [input.address, input.area, input.city]
    .filter(Boolean)
    .join(", ");

  try {
    const response = await fetch("/api/properties", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: input.title,
        description: input.description,
        address,
        price: input.price,
        bedrooms: input.bedrooms,
        bathrooms: input.bathrooms,
        squareFootage: input.squareFootage ?? 0,
        status: input.listingType,
        seller: { id: Number(userId) },
      }),
    });

    const data: unknown = await response.json().catch(() => null);

    if (!response.ok || !isBackendApiEnvelope(data) || !data.success) {
      return null;
    }

    const propertyId = extractBackendPropertyId(data.data);
    return propertyId !== null ? String(propertyId) : null;
  } catch {
    return null;
  }
}

export function subscribeToHostListings(callback: () => void): () => void {
  window.addEventListener(STORAGE_EVENT, callback);
  return () => window.removeEventListener(STORAGE_EVENT, callback);
}

export async function getHostListings(
  role: HostListingRole,
): Promise<HostListingStorageResult<HostListingRecord[]>> {
  try {
    const database = await getDatabase();
    const listings = await database.getAll("listings");

    return {
      data: listings
        .filter((listing) => listing.ownerRole === role)
        .sort(
          (left, right) =>
            new Date(right.updatedAt).getTime() -
            new Date(left.updatedAt).getTime(),
        ),
      unavailable: false,
    };
  } catch {
    return { data: [], unavailable: true };
  }
}

export async function getHostListingById(
  id: string,
): Promise<HostListingStorageResult<HostListingRecord | null>> {
  try {
    const database = await getDatabase();
    return {
      data: (await database.get("listings", id)) ?? null,
      unavailable: false,
    };
  } catch {
    return { data: null, unavailable: true };
  }
}

export async function saveHostListingDraft(
  input: HostListingInput,
): Promise<HostListingStorageResult<HostListingRecord | null>> {
  return persistListing(input, "DRAFT");
}

export async function submitHostListing(
  input: HostListingInput,
): Promise<HostListingStorageResult<HostListingRecord | null>> {
  const backendPropertyId = await createPropertyOnBackend(input);

  if (!backendPropertyId) {
    return { data: null, unavailable: true };
  }

  return persistListing(
    { ...input, id: backendPropertyId },
    "PENDING_VERIFICATION",
  );
}
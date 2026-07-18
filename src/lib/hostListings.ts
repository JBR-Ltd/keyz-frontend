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

async function simulateCreateListingRequest(
  input: HostListingInput,
): Promise<HostListingStorageResult<HostListingRecord | null>> {
  await new Promise((resolve) => window.setTimeout(resolve, 700));
  return persistListing(input, "PENDING_VERIFICATION");
}

const createListingRequest = simulateCreateListingRequest;

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
  return createListingRequest(input);
}

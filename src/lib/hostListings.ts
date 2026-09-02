"use client";

import { deleteDB, openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { PropertyListingStatus } from "@/lib/propertyDetails";

export type HostListingRole = "landlord" | "agent";

export type HostListingReviewStatus =
  | "DRAFT"
  | "PENDING_VERIFICATION"
  | "VERIFIED"
  | "REJECTED";

export interface BackendPropertySeller {
  firstName?: string;
  id: number;
  identityVerified?: boolean;
  isIdentityVerified?: boolean;
  lastName?: string;
  role: "LANDLORD" | "AGENT" | "TENANT";
  sellerRating?: number;
}

export interface BackendProperty {
  address: string;
  bathrooms: number;
  bedrooms: number;
  description?: string | null;
  flaggedAsDuplicate?: boolean;
  id: number;
  imageUrl?: string | null;
  isFlaggedAsDuplicate?: boolean;
  isVerified?: boolean;
  latitude?: number | null;
  longitude?: number | null;
  price: number;
  seller: BackendPropertySeller;
  squareFootage?: number;
  status: "FOR_RENT" | "FOR_SALE" | "RENTED" | "SOLD";
  title: string;
  verified?: boolean;
  videoWalkthroughUrl?: string | null;
  virtualTourUrl?: string | null;
}

export interface PropertyPortfolio {
  activeListingsCount: number;
  expectedMonthlyRentalIncome: number;
  pendingOffersCount: number;
  properties: BackendProperty[];
  totalPropertiesCount: number;
  totalValueForSale: number;
}

export interface HostListingPhoto {
  dataUrl: string;
  id: string;
  name: string;
  type: string;
}

export interface HostListingInput {
  address: string;
  amenities: string[];
  area: string;
  bathrooms: number;
  bedrooms: number;
  city: string;
  description: string;
  id?: string;
  listingType: PropertyListingStatus;
  ownerRole: HostListingRole;
  photos: HostListingPhoto[];
  price: number;
  squareFootage?: number;
  title: string;
}

export interface HostListingRecord extends HostListingInput {
  createdAt: string;
  id: string;
  reviewStatus: HostListingReviewStatus;
  updatedAt: string;
}

interface HostListingsDatabase extends DBSchema {
  listings: {
    key: string;
    value: HostListingRecord;
  };
}

interface ApiEnvelope {
  data: unknown;
  message: string;
  success: boolean;
}

export interface HostListingStorageResult<TValue> {
  data: TValue;
  message?: string;
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

function isApiEnvelope(value: unknown): value is ApiEnvelope {
  return (
    value !== null &&
    typeof value === "object" &&
    "success" in value &&
    typeof value.success === "boolean" &&
    "message" in value &&
    typeof value.message === "string" &&
    "data" in value
  );
}

function isBackendPropertySeller(
  value: unknown,
): value is BackendPropertySeller {
  return (
    value !== null &&
    typeof value === "object" &&
    "id" in value &&
    typeof value.id === "number" &&
    "role" in value &&
    (value.role === "LANDLORD" ||
      value.role === "AGENT" ||
      value.role === "TENANT")
  );
}

function isBackendProperty(value: unknown): value is BackendProperty {
  return (
    value !== null &&
    typeof value === "object" &&
    "id" in value &&
    typeof value.id === "number" &&
    "title" in value &&
    typeof value.title === "string" &&
    "address" in value &&
    typeof value.address === "string" &&
    "price" in value &&
    typeof value.price === "number" &&
    "bedrooms" in value &&
    typeof value.bedrooms === "number" &&
    "bathrooms" in value &&
    typeof value.bathrooms === "number" &&
    "status" in value &&
    (value.status === "FOR_RENT" ||
      value.status === "FOR_SALE" ||
      value.status === "RENTED" ||
      value.status === "SOLD") &&
    "seller" in value &&
    isBackendPropertySeller(value.seller)
  );
}

function isPropertyPortfolio(value: unknown): value is PropertyPortfolio {
  return (
    value !== null &&
    typeof value === "object" &&
    "totalPropertiesCount" in value &&
    typeof value.totalPropertiesCount === "number" &&
    "activeListingsCount" in value &&
    typeof value.activeListingsCount === "number" &&
    "totalValueForSale" in value &&
    typeof value.totalValueForSale === "number" &&
    "expectedMonthlyRentalIncome" in value &&
    typeof value.expectedMonthlyRentalIncome === "number" &&
    "pendingOffersCount" in value &&
    typeof value.pendingOffersCount === "number" &&
    "properties" in value &&
    Array.isArray(value.properties) &&
    value.properties.every(isBackendProperty)
  );
}

function getAccessToken(): string {
  return localStorage.getItem("rello_token") ?? "";
}

function isPropertyVerified(property: BackendProperty): boolean {
  return property.verified ?? property.isVerified ?? false;
}

function isPropertyFlagged(property: BackendProperty): boolean {
  return property.flaggedAsDuplicate ?? property.isFlaggedAsDuplicate ?? false;
}

function getListingRole(property: BackendProperty): HostListingRole {
  return property.seller.role === "AGENT" ? "agent" : "landlord";
}

function getListingStatus(property: BackendProperty): PropertyListingStatus {
  return property.status === "FOR_SALE" ? "FOR_SALE" : "FOR_RENT";
}

function getReviewStatus(property: BackendProperty): HostListingReviewStatus {
  if (isPropertyFlagged(property)) {
    return "REJECTED";
  }

  return isPropertyVerified(property) ? "VERIFIED" : "PENDING_VERIFICATION";
}

function getRemotePhoto(property: BackendProperty): HostListingPhoto[] {
  if (!property.imageUrl) {
    return [];
  }

  return [
    {
      id: `property-${property.id}-cover`,
      dataUrl: property.imageUrl,
      name: "Property cover",
      type: "image/jpeg",
    },
  ];
}

function mapBackendProperty(
  property: BackendProperty,
  localListing?: HostListingRecord,
): HostListingRecord {
  const now = new Date().toISOString();

  return {
    id: String(property.id),
    ownerRole: getListingRole(property),
    listingType: getListingStatus(property),
    title: property.title,
    description: property.description ?? "",
    price: property.price,
    city: localListing?.city ?? "",
    area: localListing?.area ?? property.address,
    address: localListing?.address ?? property.address,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    squareFootage: property.squareFootage,
    amenities: localListing?.amenities ?? [],
    photos: localListing?.photos.length
      ? localListing.photos
      : getRemotePhoto(property),
    reviewStatus: getReviewStatus(property),
    createdAt: localListing?.createdAt ?? now,
    updatedAt: now,
  };
}

async function parseApiResponse(response: Response): Promise<ApiEnvelope> {
  const data: unknown = await response.json().catch(() => null);

  if (!isApiEnvelope(data)) {
    if (response.status === 401 || response.status === 403) {
      throw new Error(
        "Your session has expired or your account is not eligible.",
      );
    }

    throw new Error("The property server returned an invalid response.");
  }

  if (!response.ok || !data.success) {
    throw new Error(data.message || "The property request failed.");
  }

  return data;
}

async function requestBackendProperty(
  path: string,
  init?: RequestInit,
): Promise<BackendProperty> {
  const response = await fetch(`/api/properties/${path}`, init);
  const envelope = await parseApiResponse(response);

  if (!isBackendProperty(envelope.data)) {
    throw new Error("The property server returned an invalid listing.");
  }

  return envelope.data;
}

async function getStoredListings(): Promise<HostListingRecord[]> {
  const database = await getDatabase();
  return database.getAll("listings");
}

async function persistRecord(
  record: HostListingRecord,
): Promise<HostListingStorageResult<HostListingRecord | null>> {
  try {
    const database = await getDatabase();
    await database.put("listings", record);
    publishStorageChange();

    return { data: record, unavailable: false };
  } catch {
    return {
      data: record,
      message:
        "The listing was saved remotely, but local metadata is unavailable.",
      unavailable: true,
    };
  }
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
    return {
      data: null,
      message: "Local listing storage is unavailable.",
      unavailable: true,
    };
  }
}

function buildPropertyRequest(input: HostListingInput): object {
  return {
    title: input.title,
    description: input.description,
    address: [input.address, input.area, input.city].filter(Boolean).join(", "),
    price: input.price,
    bedrooms: input.bedrooms,
    bathrooms: input.bathrooms,
    squareFootage: input.squareFootage ?? 0,
    status: input.listingType,
  };
}

async function uploadCoverPhoto(
  propertyId: number,
  photo: HostListingPhoto,
  token: string,
): Promise<BackendProperty> {
  const imageResponse = await fetch(photo.dataUrl);

  if (!imageResponse.ok) {
    throw new Error("The cover photo could not be prepared for upload.");
  }

  const image = await imageResponse.blob();
  const formData = new FormData();
  formData.append("image", image, photo.name);

  return requestBackendProperty(`${propertyId}/upload-image`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
}

export function subscribeToHostListings(callback: () => void): () => void {
  window.addEventListener(STORAGE_EVENT, callback);
  return () => window.removeEventListener(STORAGE_EVENT, callback);
}

export async function clearHostListingStorage(): Promise<void> {
  if (databasePromise) {
    const database = await databasePromise;
    database.close();
    databasePromise = null;
  }

  await deleteDB(DATABASE_NAME);
  publishStorageChange();
}

export async function getPublicProperties(
  filter: "all" | "rent" | "sale" = "all",
): Promise<HostListingStorageResult<BackendProperty[]>> {
  try {
    const response = await fetch(`/api/properties/${filter}`);
    const envelope = await parseApiResponse(response);

    if (
      !Array.isArray(envelope.data) ||
      !envelope.data.every(isBackendProperty)
    ) {
      throw new Error("The property server returned an invalid property list.");
    }

    return { data: envelope.data, unavailable: false };
  } catch (error) {
    return {
      data: [],
      message:
        error instanceof Error
          ? error.message
          : "Properties could not be loaded.",
      unavailable: false,
    };
  }
}

export async function getBackendPropertyById(
  id: string,
): Promise<HostListingStorageResult<BackendProperty | null>> {
  const token = getAccessToken();

  if (!token) {
    return {
      data: null,
      message: "Log in to view this property.",
      unavailable: false,
    };
  }

  try {
    const property = await requestBackendProperty(id, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return { data: property, unavailable: false };
  } catch (error) {
    return {
      data: null,
      message:
        error instanceof Error
          ? error.message
          : "Property could not be loaded.",
      unavailable: false,
    };
  }
}

export async function getPropertyPortfolio(): Promise<
  HostListingStorageResult<PropertyPortfolio | null>
> {
  const token = getAccessToken();

  if (!token) {
    return {
      data: null,
      message: "Log in to view your property portfolio.",
      unavailable: false,
    };
  }

  try {
    const response = await fetch("/api/properties/portfolio", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const envelope = await parseApiResponse(response);

    if (!isPropertyPortfolio(envelope.data)) {
      throw new Error("The property server returned an invalid portfolio.");
    }

    return { data: envelope.data, unavailable: false };
  } catch (error) {
    return {
      data: null,
      message:
        error instanceof Error
          ? error.message
          : "Portfolio could not be loaded.",
      unavailable: false,
    };
  }
}

export async function getHostListings(
  role: HostListingRole,
): Promise<HostListingStorageResult<HostListingRecord[]>> {
  let storedListings: HostListingRecord[] = [];
  let storageUnavailable = false;

  try {
    storedListings = (await getStoredListings()).filter(
      (listing) => listing.ownerRole === role,
    );
  } catch {
    storageUnavailable = true;
  }

  const portfolioResult = await getPropertyPortfolio();

  if (!portfolioResult.data) {
    return {
      data: storedListings.sort(
        (left, right) =>
          new Date(right.updatedAt).getTime() -
          new Date(left.updatedAt).getTime(),
      ),
      message: portfolioResult.message,
      unavailable: storageUnavailable,
    };
  }

  const remoteIds = new Set(
    portfolioResult.data.properties.map((property) => String(property.id)),
  );
  const remoteListings = portfolioResult.data.properties
    .filter((property) => getListingRole(property) === role)
    .map((property) =>
      mapBackendProperty(
        property,
        storedListings.find((listing) => listing.id === String(property.id)),
      ),
    );
  const localOnlyListings = storedListings.filter(
    (listing) => listing.reviewStatus === "DRAFT" || !remoteIds.has(listing.id),
  );

  return {
    data: [...localOnlyListings, ...remoteListings].sort(
      (left, right) =>
        new Date(right.updatedAt).getTime() -
        new Date(left.updatedAt).getTime(),
    ),
    unavailable: storageUnavailable,
  };
}

export async function getHostListingById(
  id: string,
): Promise<HostListingStorageResult<HostListingRecord | null>> {
  let storedListing: HostListingRecord | undefined;
  let storageUnavailable = false;

  try {
    storedListing = await (await getDatabase()).get("listings", id);
  } catch {
    storageUnavailable = true;
  }

  if (!/^\d+$/.test(id)) {
    return {
      data: storedListing ?? null,
      unavailable: storageUnavailable,
    };
  }

  const propertyResult = await getBackendPropertyById(id);

  if (!propertyResult.data) {
    return {
      data: storedListing ?? null,
      message: propertyResult.message,
      unavailable: storageUnavailable,
    };
  }

  return {
    data: mapBackendProperty(propertyResult.data, storedListing),
    unavailable: storageUnavailable,
  };
}

export async function saveHostListingDraft(
  input: HostListingInput,
): Promise<HostListingStorageResult<HostListingRecord | null>> {
  return persistListing(input, "DRAFT");
}

export async function submitHostListing(
  input: HostListingInput,
): Promise<HostListingStorageResult<HostListingRecord | null>> {
  const token = getAccessToken();

  if (!token) {
    return {
      data: null,
      message: "Your session has expired. Log in again.",
      unavailable: false,
    };
  }

  try {
    const isUpdate = Boolean(input.id && /^\d+$/.test(input.id));
    let property = await requestBackendProperty(
      isUpdate ? (input.id ?? "") : "create",
      {
        method: isUpdate ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buildPropertyRequest(input)),
      },
    );

    const coverPhoto = input.photos[0];
    let message = isUpdate
      ? "Listing updated successfully."
      : "Listing created successfully.";

    if (coverPhoto) {
      try {
        property = await uploadCoverPhoto(property.id, coverPhoto, token);
      } catch (error) {
        message =
          error instanceof Error
            ? `${message} ${error.message}`
            : `${message} The cover photo could not be uploaded.`;
      }
    }

    const existing = input.id
      ? await (await getDatabase()).get("listings", input.id)
      : undefined;
    const record = mapBackendProperty(property, {
      ...input,
      id: String(property.id),
      reviewStatus: getReviewStatus(property),
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    if (input.id && input.id !== record.id) {
      await (await getDatabase()).delete("listings", input.id);
    }

    const persisted = await persistRecord(record);

    return {
      ...persisted,
      message,
    };
  } catch (error) {
    return {
      data: null,
      message:
        error instanceof Error ? error.message : "Listing could not be saved.",
      unavailable: false,
    };
  }
}

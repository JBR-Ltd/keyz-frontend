"use client";

import { deleteDB, type DBSchema, type IDBPDatabase } from "idb";
import { resolveApiError } from "@/lib/errors";
import {
  addDraftImage,
  createDraft,
  getDraft,
  getDrafts,
  publishDraft,
  updateDraft,
  type PropertyDraft,
} from "@/lib/propertyDrafts";
import type { PropertyListingStatus } from "@/lib/propertyDetails";

export type HostListingRole = "landlord" | "agent";

export type HostListingReviewStatus =
  | "DRAFT"
  | "PENDING_VERIFICATION"
  | "VERIFIED"
  | "REJECTED";

/** Mirrors PartySummary on the backend: what a stranger may see about a person. */
export interface BackendPropertyHost {
  id: number;
  /** For linking to the host's public profile. */
  publicId?: string;
  identityVerified: boolean;
  name: string;
  rating?: number | null;
  role: "ADMIN" | "AGENT" | "LANDLORD" | "TENANT";
}

/** Mirrors PropertySummaryResponse. The Property entity is no longer returned to clients. */
/** How a listing is priced. Decides what `price` means and how a total is worked out. */
export type RentalMode = "ANNUAL" | "MONTHLY" | "SHORT_STAY";

export interface PropertyImage {
  caption: string | null;
  cover: boolean;
  id: number;
  position: number;
  url: string;
}

export interface BackendProperty {
  address: string;
  /** Immutable and opaque. What public links are built from. */
  publicId?: string;
  /** Readable only. Follows the title. */
  slug?: string;
  amenities?: string[];
  area?: string | null;
  city?: string | null;
  cleaningFee?: number | null;
  images?: PropertyImage[];
  minimumNights?: number | null;
  /** Shortlets only. Null when the host set no limit. */
  maximumGuests?: number | null;
  /** Refundable, and returned to the tenant after the tenancy. */
  securityDeposit?: number | null;
  rentalMode?: RentalMode | null;
  bathrooms: number;
  bedrooms: number;
  description?: string | null;
  host: BackendPropertyHost | null;
  id: number;
  imageUrl?: string | null;
  latitude?: number | null;
  listedByName?: string | null;
  longitude?: number | null;
  price: number;
  squareFootage?: number;
  status: "FOR_RENT" | "FOR_SALE" | "RENTED" | "SOLD";
  title: string;
  verified: boolean;
  videoWalkthroughUrl?: string | null;
  virtualTourUrl?: string | null;
}

/** Mirrors PageResponse. Public listing endpoints are paged. */
export interface BackendPage<TItem> {
  hasNext: boolean;
  items: TItem[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
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
  /** Shortlets only. Added once to the stay, not per night. */
  cleaningFee?: number;
  description: string;
  id?: string;
  listingType: PropertyListingStatus;
  /** Shortlets only. The shortest stay this host will take. */
  minimumNights?: number;
  /** Shortlets only. The most guests the home sleeps. */
  maximumGuests?: number;
  /** A refundable deposit against damage, returned when the tenancy ends. */
  securityDeposit?: number;
  rentalMode: RentalMode;
  ownerRole: HostListingRole;
  photos: HostListingPhoto[];
  price: number;
  squareFootage?: number;
  title: string;
}

/**
 * Drafts and published listings are both numbered by the server, and the two
 * sequences overlap, so a bare id is ambiguous. Drafts carry a prefix.
 */
export const DRAFT_ID_PREFIX = "draft-";

export function isDraftId(id: string): boolean {
  return id.startsWith(DRAFT_ID_PREFIX);
}

export function toDraftNumber(id: string): number {
  return Number(id.slice(DRAFT_ID_PREFIX.length));
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

export interface PublicPropertiesResult
  extends HostListingStorageResult<BackendProperty[]> {
  hasNext: boolean;
  totalItems: number;
}

const DATABASE_NAME = "rello-host-listings";
const STORAGE_EVENT = "rello-host-listings-change";

let databasePromise: Promise<IDBPDatabase<HostListingsDatabase>> | null = null;

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

function isBackendPropertyHost(value: unknown): value is BackendPropertyHost {
  return (
    value !== null &&
    typeof value === "object" &&
    "id" in value &&
    typeof value.id === "number" &&
    "name" in value &&
    typeof value.name === "string"
  );
}

function isBackendPage(value: unknown): value is BackendPage<unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    "items" in value &&
    Array.isArray(value.items)
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
    (!("host" in value) || value.host === null || isBackendPropertyHost(value.host))
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

function getListingRole(property: BackendProperty): HostListingRole {
  return property.host?.role === "AGENT" ? "agent" : "landlord";
}

function getListingStatus(property: BackendProperty): PropertyListingStatus {
  return property.status === "FOR_SALE" ? "FOR_SALE" : "FOR_RENT";
}

function getReviewStatus(property: BackendProperty): HostListingReviewStatus {
  return property.verified ? "VERIFIED" : "PENDING_VERIFICATION";
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
    city: property.city ?? localListing?.city ?? "",
    area: property.area ?? localListing?.area ?? property.address,
    address: localListing?.address ?? property.address,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    squareFootage: property.squareFootage,
    amenities: property.amenities ?? localListing?.amenities ?? [],
    // The server is authoritative for pricing; the local copy is only a fallback
    // for a draft that has never been published
    rentalMode: property.rentalMode ?? localListing?.rentalMode ?? "ANNUAL",
    minimumNights: property.minimumNights ?? localListing?.minimumNights ?? undefined,
    maximumGuests: property.maximumGuests ?? localListing?.maximumGuests ?? undefined,
    securityDeposit:
      property.securityDeposit ?? localListing?.securityDeposit ?? undefined,
    cleaningFee: property.cleaningFee ?? localListing?.cleaningFee ?? undefined,
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
    throw new Error(resolveApiError(data, "The property request failed."));
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

/**
 * A server draft in the shape the listing screens already read.
 *
 * Drafts used to live in IndexedDB, so they never left the device they were
 * started on. The local store is no longer read, but nothing deletes it either:
 * anything still in there stays recoverable.
 */
function draftToRecord(
  draft: PropertyDraft,
  role: HostListingRole,
): HostListingRecord {
  return {
    id: `${DRAFT_ID_PREFIX}${draft.id}`,
    ownerRole: role,
    listingType: draft.listingType ?? "FOR_RENT",
    title: draft.title ?? "",
    description: draft.description ?? "",
    price: draft.price ?? 0,
    city: draft.city ?? "",
    area: draft.area ?? "",
    address: draft.address ?? "",
    bedrooms: draft.bedrooms ?? 0,
    bathrooms: draft.bathrooms ?? 0,
    squareFootage: draft.squareFootage ?? undefined,
    amenities: draft.amenities,
    rentalMode: draft.rentalMode ?? "ANNUAL",
    minimumNights: draft.minimumNights ?? undefined,
    maximumGuests: draft.maximumGuests ?? undefined,
    securityDeposit: draft.securityDeposit ?? undefined,
    cleaningFee: draft.cleaningFee ?? undefined,
    photos: draft.imageUrls.map((url, index) => ({
      dataUrl: url,
      id: `${draft.id}-${index}`,
      name: `Photo ${index + 1}`,
      type: "image/jpeg",
    })),
    reviewStatus: "DRAFT",
    createdAt: draft.createdAt,
    updatedAt: draft.updatedAt,
  };
}

function buildPropertyRequest(input: HostListingInput): object {
  const isShortStay = input.rentalMode === "SHORT_STAY";

  return {
    title: input.title,
    description: input.description,
    // The joined address stays for display; city and area are sent separately so
    // they can be searched on rather than parsed back out of a string
    address: [input.address, input.area, input.city].filter(Boolean).join(", "),
    city: input.city,
    area: input.area,
    amenities: input.amenities,
    price: input.price,
    bedrooms: input.bedrooms,
    bathrooms: input.bathrooms,
    squareFootage: input.squareFootage ?? 0,
    status: input.listingType,
    rentalMode: input.rentalMode,
    // The server clears both for a listing that is not a shortlet, but sending
    // them only when they apply keeps the request honest
    minimumNights: isShortStay ? (input.minimumNights ?? 1) : null,
    maximumGuests: isShortStay ? (input.maximumGuests ?? null) : null,
    // Any letting can ask for a deposit, not just a shortlet
    securityDeposit: input.securityDeposit ?? null,
    cleaningFee: isShortStay ? (input.cleaningFee ?? 0) : null,
  };
}

/**
 * Sends every photo to the gallery, in order. The first becomes the cover.
 *
 * Only the first photo used to be uploaded and the rest were dropped on the floor.
 * Failures are collected rather than thrown, because a listing that saved with four
 * of its five photos is still worth keeping.
 */
async function uploadGallery(
  propertyId: number,
  photos: HostListingPhoto[],
  token: string,
): Promise<string[]> {
  const failures: string[] = [];

  for (const photo of photos) {
    try {
      const imageResponse = await fetch(photo.dataUrl);

      if (!imageResponse.ok) {
        throw new Error("could not be read");
      }

      const formData = new FormData();
      formData.append("image", await imageResponse.blob(), photo.name);

      const response = await fetch(`/api/properties/${propertyId}/images`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        const payload: unknown = await response.json().catch(() => null);
        throw new Error(resolveApiError(payload, "was rejected"));
      }
    } catch (error) {
      failures.push(
        `${photo.name}: ${error instanceof Error ? error.message : "could not be uploaded"}`,
      );
    }
  }

  return failures;
}

export function subscribeToHostListings(callback: () => void): () => void {
  window.addEventListener(STORAGE_EVENT, callback);
  return () => window.removeEventListener(STORAGE_EVENT, callback);
}

/**
 * Clears the old browser-side listing store.
 *
 * Drafts live on the server now and nothing reads this store any more, but logging
 * out should still leave nothing behind on a shared device.
 */
export async function clearHostListingStorage(): Promise<void> {
  if (databasePromise) {
    const database = await databasePromise;
    database.close();
    databasePromise = null;
  }

  await deleteDB(DATABASE_NAME);
  publishStorageChange();
}

export interface ListingSearch {
  city?: string;
  maxPrice?: number;
  minBedrooms?: number;
  minPrice?: number;
  query?: string;
  /** PRICE_ASC, PRICE_DESC, BEDROOMS, or nothing for newest first. */
  sort?: string;
}

/** Filters the whole catalogue, not the page that happens to be loaded. */
function searchParams(page: number, size: number, search?: ListingSearch): string {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  });

  if (search?.query?.trim()) {
    params.set("query", search.query.trim());
  }

  if (search?.city) {
    params.set("city", search.city);
  }

  if (search?.minPrice !== undefined) {
    params.set("minPrice", String(search.minPrice));
  }

  if (search?.maxPrice !== undefined) {
    params.set("maxPrice", String(search.maxPrice));
  }

  if (search?.minBedrooms !== undefined) {
    params.set("minBedrooms", String(search.minBedrooms));
  }

  if (search?.sort) {
    params.set("sort", search.sort);
  }

  return params.toString();
}

export async function getPublicProperties(
  filter: "all" | "rent" | "sale" = "all",
  page = 0,
  size = 12,
  search?: ListingSearch,
): Promise<PublicPropertiesResult> {
  try {
    const response = await fetch(
      `/api/properties/${filter}?${searchParams(page, size, search)}`,
    );
    const envelope = await parseApiResponse(response);

    // These endpoints are paged now, so the listings sit under `items`
    if (
      !isBackendPage(envelope.data) ||
      !envelope.data.items.every(isBackendProperty)
    ) {
      throw new Error("The property server returned an invalid property list.");
    }

    return {
      data: envelope.data.items,
      hasNext: envelope.data.hasNext,
      totalItems: envelope.data.totalItems,
      unavailable: false,
    };
  } catch (error) {
    return {
      data: [],
      hasNext: false,
      message:
        error instanceof Error
          ? error.message
          : "Properties could not be loaded.",
      totalItems: 0,
      unavailable: false,
    };
  }
}

/** Mirrors SearchFilters: what a plain-English search was read as. Null was not asked for. */
export interface SearchFilters {
  amenities: string[];
  area: string | null;
  city: string | null;
  keywords: string | null;
  maxPrice: number | null;
  minBathrooms: number | null;
  minBedrooms: number | null;
  minPrice: number | null;
  minSquareFootage: number | null;
  rentalMode: RentalMode;
}

export interface InterpretedPropertiesResult extends PublicPropertiesResult {
  /** True when the query could not be read and these are plain keyword matches. */
  fallback: boolean;
  filters: SearchFilters | null;
}

function isSearchFilters(value: unknown): value is SearchFilters {
  return (
    value !== null &&
    typeof value === "object" &&
    "rentalMode" in value &&
    typeof value.rentalMode === "string"
  );
}

export async function interpretPublicProperties(
  query: string,
  page = 0,
  size = 12,
): Promise<InterpretedPropertiesResult> {
  try {
    const response = await fetch(
      `/api/search/interpret?${searchParams(page, size)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      },
    );
    const envelope = await parseApiResponse(response);

    if (
      !isBackendPage(envelope.data) ||
      !envelope.data.items.every(isBackendProperty)
    ) {
      throw new Error("The search server returned an invalid property list.");
    }

    const fallback =
      "fallback" in envelope.data && envelope.data.fallback === true;
    const filters =
      "filters" in envelope.data && isSearchFilters(envelope.data.filters)
        ? {
            ...envelope.data.filters,
            amenities: envelope.data.filters.amenities ?? [],
          }
        : null;

    return {
      data: envelope.data.items,
      fallback,
      filters,
      hasNext: envelope.data.hasNext,
      totalItems: envelope.data.totalItems,
      unavailable: false,
    };
  } catch (error) {
    return {
      data: [],
      fallback: false,
      filters: null,
      hasNext: false,
      message:
        error instanceof Error ? error.message : "The search could not be run.",
      totalItems: 0,
      unavailable: false,
    };
  }
}

export async function getBackendPropertyById(
  id: string,
): Promise<HostListingStorageResult<BackendProperty | null>> {
  // A listing page is public, so this works logged out. The token only adds context.
  const token = getAccessToken();

  try {
    const property = await requestBackendProperty(id, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
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

/** A published listing by its public identifier. Works logged out. */
export async function getBackendPropertyByPublicId(
  publicId: string,
): Promise<HostListingStorageResult<BackendProperty | null>> {
  try {
    const property = await requestBackendProperty(`public/${publicId}`);

    return { data: property, unavailable: false };
  } catch (error) {
    return {
      data: null,
      message:
        error instanceof Error ? error.message : "Property could not be loaded.",
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
  const draftResult = await getDrafts();
  const storedListings = draftResult.data.map((draft) =>
    draftToRecord(draft, role),
  );
  const storageUnavailable = false;

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
  role: HostListingRole = "landlord",
): Promise<HostListingStorageResult<HostListingRecord | null>> {
  if (isDraftId(id)) {
    const draftResult = await getDraft(toDraftNumber(id));

    return {
      data: draftResult.data ? draftToRecord(draftResult.data, role) : null,
      message: draftResult.message,
      unavailable: false,
    };
  }

  if (!/^\d+$/.test(id)) {
    return { data: null, unavailable: false };
  }

  const propertyResult = await getBackendPropertyById(id);

  if (!propertyResult.data) {
    return {
      data: null,
      message: propertyResult.message,
      unavailable: false,
    };
  }

  return {
    data: mapBackendProperty(propertyResult.data),
    unavailable: false,
  };
}

/**
 * Saves a draft on the server so it follows the host between devices.
 *
 * Photos are uploaded as they are added rather than at publish, which is what
 * makes a draft opened elsewhere show its pictures instead of an empty gallery.
 */
export async function saveHostListingDraft(
  input: HostListingInput,
): Promise<HostListingStorageResult<HostListingRecord | null>> {
  const payload = {
    title: input.title,
    description: input.description,
    address: input.address,
    city: input.city,
    area: input.area,
    price: input.price,
    bedrooms: input.bedrooms,
    bathrooms: input.bathrooms,
    squareFootage: input.squareFootage,
    listingType: input.listingType,
    rentalMode: input.rentalMode,
    minimumNights: input.rentalMode === "SHORT_STAY" ? input.minimumNights : null,
    maximumGuests:
      input.rentalMode === "SHORT_STAY" ? (input.maximumGuests ?? null) : null,
    securityDeposit: input.securityDeposit ?? null,
    cleaningFee: input.rentalMode === "SHORT_STAY" ? input.cleaningFee : null,
    amenities: input.amenities,
  };

  const existingId =
    input.id && isDraftId(input.id) ? toDraftNumber(input.id) : null;
  const result = existingId
    ? await updateDraft(existingId, payload)
    : await createDraft(payload);

  if (!result.data) {
    return { data: null, message: result.message, unavailable: false };
  }

  const draftId = result.data.id;
  // Only photos not already on the server, so re-saving does not duplicate them
  const pending = input.photos.filter((photo) =>
    photo.dataUrl.startsWith("data:"),
  );
  let message: string | undefined;

  for (const photo of pending) {
    try {
      const response = await fetch(photo.dataUrl);
      const uploaded = await addDraftImage(
        draftId,
        await response.blob(),
        photo.name,
      );

      if (!uploaded.data) {
        message = uploaded.message;
      }
    } catch {
      message = "Some photos could not be uploaded.";
    }
  }

  const refreshed = pending.length > 0 ? await getDraft(draftId) : result;

  return {
    data: draftToRecord(refreshed.data ?? result.data, input.ownerRole),
    message,
    unavailable: false,
  };
}

/**
 * Saves any last edits to the draft, then publishes it.
 *
 * Publishing is where the listing rules apply, so a rejection here is the server
 * naming the field that is still missing.
 */
async function publishExistingDraft(
  input: HostListingInput,
): Promise<HostListingStorageResult<HostListingRecord | null>> {
  const saved = await saveHostListingDraft(input);

  if (!saved.data) {
    return saved;
  }

  const draftId = toDraftNumber(saved.data.id);
  const published = await publishDraft(draftId);

  if (published.data === null) {
    return { data: null, message: published.message, unavailable: false };
  }

  const property = await getBackendPropertyById(String(published.data));

  return {
    data: property.data ? mapBackendProperty(property.data) : null,
    message: "Listing published.",
    unavailable: false,
  };
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
    // A draft is published rather than recreated: publishing carries its photos
    // across by reference and stamps the draft so it cannot become a second listing
    if (input.id && isDraftId(input.id)) {
      return publishExistingDraft(input);
    }

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

    let message = isUpdate
      ? "Listing updated successfully."
      : "Listing created successfully.";

    if (input.photos.length > 0) {
      const failures = await uploadGallery(property.id, input.photos, token);

      if (failures.length > 0) {
        message = `${message} ${failures.length} of ${input.photos.length} photos did not upload. ${failures[0]}`;
      }

      // The cover is set server side from position zero, so re-read it
      try {
        property = await requestBackendProperty(String(property.id));
      } catch {
        // The listing saved; only the refreshed copy is missing
      }
    }

    return {
      data: mapBackendProperty(property),
      message,
      unavailable: false,
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

/** The cities that actually have something to rent, for the filter menu. */
export async function getRentalCities(): Promise<string[]> {
  try {
    const response = await fetch("/api/properties/cities");
    const envelope = await parseApiResponse(response);

    return Array.isArray(envelope.data)
      ? envelope.data.filter((value): value is string => typeof value === "string")
      : [];
  } catch {
    return [];
  }
}

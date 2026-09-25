import "server-only";

import type { BackendProperty } from "@/lib/hostListings";

/**
 * Server-side reads of the public listing data, for metadata, structured data,
 * the sitemap and the location pages.
 *
 * The client data layer cannot be reused here: `hostListings` is a client module and
 * calls `apiRequest` with a relative path, which has no origin to resolve against on
 * the server. These go straight to the backend instead.
 */

// === Types

export interface SeoPropertyImage {
  caption: string | null;
  url: string;
}

export interface SeoProperty {
  address: string;
  area: string | null;
  bathrooms: number;
  bedrooms: number;
  city: string | null;
  description: string | null;
  id: number;
  images: SeoPropertyImage[];
  price: number | null;
  publicId: string | null;
  rentalMode: string | null;
  slug: string | null;
  title: string;
}

// === Helpers

const API_BASE_URL = process.env.API_BASE_URL;

/** Every absolute link the crawler is given has to agree, so this is the one source. */
export function siteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;

  return (
    (configured && configured.replace(/\/$/, "")) || "https://rello.online"
  );
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function toSeoProperty(value: unknown): SeoProperty | null {
  if (value === null || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  const id = asNumber(record.id);
  const title = asText(record.title);

  if (id === null || !title) return null;

  const images = Array.isArray(record.images)
    ? record.images
        .map((image) => {
          const entry = image as Record<string, unknown>;
          const url = asText(entry?.url);

          return url ? { caption: asText(entry?.caption), url } : null;
        })
        .filter((image): image is SeoPropertyImage => image !== null)
    : [];
  const cover = asText(record.imageUrl);

  if (cover && !images.some((image) => image.url === cover)) {
    images.unshift({ caption: null, url: cover });
  }

  return {
    address: asText(record.address) ?? "",
    area: asText(record.area),
    bathrooms: asNumber(record.bathrooms) ?? 0,
    bedrooms: asNumber(record.bedrooms) ?? 0,
    city: asText(record.city),
    description: asText(record.description),
    id,
    images,
    price: asNumber(record.price),
    publicId: asText(record.publicId),
    rentalMode: asText(record.rentalMode),
    slug: asText(record.slug),
    title,
  };
}

function envelopeData(payload: unknown): unknown {
  return payload !== null && typeof payload === "object" && "data" in payload
    ? (payload as { data: unknown }).data
    : null;
}

async function backendJson(
  path: string,
  revalidateSeconds: number,
): Promise<unknown> {
  if (!API_BASE_URL) return null;

  try {
    const response = await fetch(`${API_BASE_URL.replace(/\/$/, "")}${path}`, {
      next: { revalidate: revalidateSeconds },
    });

    return response.ok ? await response.json() : null;
  } catch {
    // A crawler getting a page without structured data beats it getting a 500
    return null;
  }
}

// === Requests

/** The canonical path for a listing. The slug reads well; the public id is what resolves. */
export function propertyPath(property: SeoProperty): string {
  const identifier = property.publicId ?? String(property.id);

  return property.slug
    ? `/property/${property.slug}-${identifier}`
    : `/property/${identifier}`;
}

function propertyPathFor(idOrPublicId: string): string {
  return /^\d+$/.test(idOrPublicId)
    ? `/api/properties/${idOrPublicId}`
    : `/api/properties/public/${encodeURIComponent(idOrPublicId)}`;
}

export async function getSeoProperty(
  idOrPublicId: string,
): Promise<SeoProperty | null> {
  return toSeoProperty(
    envelopeData(await backendJson(propertyPathFor(idOrPublicId), 300)),
  );
}

/**
 * The full backend listing, for handing to the client component as initial state.
 *
 * `SeoProperty` is deliberately narrow, so it cannot feed the page itself. This returns
 * the record as the backend sent it, validated only far enough to know it is a listing:
 * the mapper defaults every optional field, and the source is our own API.
 */
export async function getBackendListing(
  idOrPublicId: string,
): Promise<BackendProperty | null> {
  const data = envelopeData(
    await backendJson(propertyPathFor(idOrPublicId), 300),
  );

  if (data === null || typeof data !== "object") return null;

  const record = data as Record<string, unknown>;

  if (typeof record.id !== "number" || typeof record.title !== "string") {
    return null;
  }

  return data as BackendProperty;
}

/** A city as it appears in a URL. "Port Harcourt" becomes "port-harcourt". */
export function citySlug(city: string): string {
  return city
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Only cities that actually have something to rent, so no page lands empty. */
export async function getRentalCities(): Promise<string[]> {
  const data = envelopeData(await backendJson("/api/properties/cities", 3600));

  return Array.isArray(data)
    ? data.filter(
        (city): city is string => typeof city === "string" && !!city.trim(),
      )
    : [];
}

export async function getPropertiesInCity(
  city: string,
  size = 48,
): Promise<SeoProperty[]> {
  const payload = await backendJson(
    `/api/properties/rent?city=${encodeURIComponent(city)}&page=0&size=${size}`,
    600,
  );
  const data = envelopeData(payload);
  const items =
    data !== null && typeof data === "object" && "items" in data
      ? (data as { items: unknown }).items
      : null;

  if (!Array.isArray(items)) return [];

  return items
    .map(toSeoProperty)
    .filter((property): property is SeoProperty => property !== null);
}

/**
 * Published listings, paged through so the sitemap is not capped at one page.
 * Bounded because a sitemap that never finishes building is worse than a short one.
 */
export async function getPublishedProperties(
  maxPages = 20,
  pageSize = 100,
): Promise<SeoProperty[]> {
  const collected: SeoProperty[] = [];

  for (let page = 0; page < maxPages; page++) {
    const payload = await backendJson(
      `/api/properties/all?page=${page}&size=${pageSize}`,
      3600,
    );
    const data = envelopeData(payload);
    const items =
      data !== null && typeof data === "object" && "items" in data
        ? (data as { items: unknown }).items
        : null;

    if (!Array.isArray(items) || items.length === 0) break;

    for (const item of items) {
      const property = toSeoProperty(item);

      if (property) collected.push(property);
    }

    if (items.length < pageSize) break;
  }

  return collected;
}

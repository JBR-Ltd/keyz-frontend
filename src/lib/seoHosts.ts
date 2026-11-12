import "server-only";

import type { BackendPage, BackendProperty } from "@/lib/hostListings";
import { hostPublicIdFrom } from "@/lib/publicIds";
import {
  backendJsonResult,
  getPublishedProperties,
  type SeoProperty,
} from "@/lib/seoProperties";
import type { HostProfile } from "@/lib/types/host";

function envelopeData(payload: unknown): unknown {
  return payload !== null && typeof payload === "object" && "data" in payload
    ? (payload as { data: unknown }).data
    : null;
}

function hostApiPath(hostId: string): string {
  const publicId = hostPublicIdFrom(hostId);

  return publicId ? `public/${publicId}` : encodeURIComponent(hostId);
}

function isHostProfile(value: unknown): value is HostProfile {
  return (
    value !== null &&
    typeof value === "object" &&
    "id" in value &&
    typeof value.id === "number" &&
    "name" in value &&
    typeof value.name === "string" &&
    "role" in value &&
    (value.role === "AGENT" || value.role === "LANDLORD") &&
    "listingCount" in value &&
    typeof value.listingCount === "number"
  );
}

export async function getSeoHostProfile(
  hostId: string,
): Promise<HostProfile | null> {
  const result = await backendJsonResult(
    `/api/hosts/${hostApiPath(hostId)}`,
    300,
  );

  if (result.status === 0 || result.status >= 500) {
    throw new Error("The public host service is unavailable.");
  }

  const data = envelopeData(result.data);

  return isHostProfile(data) ? data : null;
}

export async function getSeoHostListings(
  hostId: string,
  page = 0,
  size = 12,
): Promise<BackendPage<BackendProperty> | null> {
  const result = await backendJsonResult(
    `/api/hosts/${hostApiPath(hostId)}/listings?page=${page}&size=${size}`,
    300,
  );

  if (result.status === 0 || result.status >= 500) {
    throw new Error("The public host listing service is unavailable.");
  }

  const data = envelopeData(result.data);

  if (
    data === null ||
    typeof data !== "object" ||
    !("items" in data) ||
    !Array.isArray(data.items) ||
    !("hasNext" in data) ||
    typeof data.hasNext !== "boolean"
  ) {
    return null;
  }

  return data as BackendPage<BackendProperty>;
}

export async function getPublishedHostProfiles(
  publishedProperties?: SeoProperty[],
): Promise<HostProfile[]> {
  const properties = publishedProperties ?? (await getPublishedProperties());
  const identifiers = new Set<string>();

  for (const property of properties) {
    const identifier = property.host?.publicId ?? property.host?.id;

    if (identifier !== undefined) identifiers.add(String(identifier));
  }

  const profiles = await Promise.all(
    [...identifiers].slice(0, 500).map(async (identifier) => {
      try {
        return await getSeoHostProfile(identifier);
      } catch {
        return null;
      }
    }),
  );

  return profiles.filter((profile): profile is HostProfile => profile !== null);
}

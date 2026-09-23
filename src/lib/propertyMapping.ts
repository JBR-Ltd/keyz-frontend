/**
 * Turning a backend listing into the shape the listing page renders.
 *
 * This lives apart from `propertyDetails` on purpose. That module reaches the backend
 * through `hostListings`, which is a client module, so nothing in it can run during a
 * server render. The mapping itself is pure, and the server page needs it to hand the
 * listing to the client component as initial state. Keeping it here means one mapping
 * feeds both, rather than a second copy drifting out of step with the first.
 *
 * Every import below is type-only, so this module pulls no client code with it.
 */

import type { BackendProperty } from "@/lib/hostListings";
import type {
  PropertyDetail,
  PropertyDetailLocation,
  PropertyHostRole,
} from "@/lib/propertyDetails";

export const DRAFT_IMAGE_FALLBACK =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&h=800&fit=crop&auto=format&q=80";

export function getBackendPropertyLocation(
  address: string,
): PropertyDetailLocation {
  const segments = address
    .split(",")
    .map((segment) => segment.trim())
    .filter(Boolean);
  const city = segments.at(-1) ?? "Location unavailable";
  const area = segments.at(-2) ?? segments[0] ?? "Area unavailable";

  return {
    city,
    area,
    address,
  };
}

export function backendPropertyToPropertyDetail(
  property: BackendProperty,
): PropertyDetail {
  const hostRole: PropertyHostRole =
    property.host?.role === "AGENT" ? "AGENT" : "LANDLORD";
  const hostName = property.host?.name ?? "";
  const verified = property.verified;

  return {
    id: String(property.id),
    publicId: property.publicId,
    slug: property.slug,
    title: property.title,
    description: property.description ?? "",
    status: property.status === "FOR_SALE" ? "FOR_SALE" : "FOR_RENT",
    price: property.price,
    rentalMode: property.rentalMode ?? "ANNUAL",
    minimumNights: property.minimumNights ?? null,
    maximumGuests: property.maximumGuests ?? null,
    securityDeposit: property.securityDeposit ?? null,
    cleaningFee: property.cleaningFee ?? null,
    // City and area are real fields now. Parsing them back out of the joined
    // address only remains for listings saved before they were stored.
    location:
      property.city || property.area
        ? {
            city: property.city ?? "",
            area: property.area ?? "",
            address: property.address,
          }
        : getBackendPropertyLocation(property.address),
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    totalUnitCount: property.totalUnitCount ?? 1,
    availableUnitCount: property.availableUnitCount ?? 1,
    sqft: property.squareFootage,
    // The gallery, in the order the host set. The cover is only a fallback for a
    // listing uploaded before galleries existed.
    images:
      property.images && property.images.length > 0
        ? property.images.map((image) => image.url)
        : [property.imageUrl ?? DRAFT_IMAGE_FALLBACK],
    verified,
    host: {
      id: String(property.host?.id ?? 0),
      publicId: property.host?.publicId,
      name: hostName || "Property host",
      role: hostRole,
      verified: property.host?.identityVerified ?? false,
    },
    amenities: property.amenities ?? [],
    tour: {
      videoUrl: property.videoWalkthroughUrl ?? undefined,
      matterportUrl: property.virtualTourUrl ?? undefined,
    },
    reviews: {
      averageRating: property.host?.rating ?? 0,
      count: 0,
      items: [],
    },
  };
}

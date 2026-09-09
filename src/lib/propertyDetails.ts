import {
  getBackendPropertyById,
  getHostListingById,
  getPublicProperties,
  type BackendProperty,
  type HostListingRecord,
  type RentalMode,
} from "@/lib/hostListings";
export type PropertyListingStatus = "FOR_RENT" | "FOR_SALE";

export type PropertyHostRole = "LANDLORD" | "AGENT";

export interface PropertyDetailLocation {
  city: string;
  area: string;
  address?: string;
}

export interface PropertyDetailHost {
  id: string;
  name: string;
  role: PropertyHostRole;
  avatarUrl?: string;
  verified: boolean;
}

export interface PropertyDetailTour {
  videoUrl?: string;
  matterportUrl?: string;
}

export interface PropertyReviewItem {
  id: string;
  reviewerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface PropertyReviews {
  averageRating: number;
  count: number;
  items: PropertyReviewItem[];
}

export interface PropertyDetail {
  id: string;
  title: string;
  description: string;
  status: PropertyListingStatus;
  price: number;
  /** What the price is per. Decides how a stay total is worked out. */
  rentalMode: RentalMode;
  /** Shortlets only. */
  minimumNights?: number | null;
  cleaningFee?: number | null;
  location: PropertyDetailLocation;
  bedrooms: number;
  bathrooms: number;
  sqft?: number;
  images: string[];
  verified: boolean;
  host: PropertyDetailHost;
  amenities: string[];
  tour: PropertyDetailTour;
  reviews: PropertyReviews;
}


const DRAFT_IMAGE_FALLBACK =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&h=800&fit=crop&auto=format&q=80";

function hostListingToPropertyDetail(
  listing: HostListingRecord,
): PropertyDetail {
  const isLandlord = listing.ownerRole === "landlord";

  return {
    id: listing.id,
    title: listing.title || "Untitled listing",
    description:
      listing.description || "This listing is currently saved as a draft.",
    status: listing.listingType,
    price: listing.price,
    rentalMode: listing.rentalMode ?? "ANNUAL",
    minimumNights: listing.minimumNights ?? null,
    cleaningFee: listing.cleaningFee ?? null,
    location: {
      city: listing.city || "Location pending",
      area: listing.area || "Area pending",
      address: listing.address || undefined,
    },
    bedrooms: listing.bedrooms,
    bathrooms: listing.bathrooms,
    sqft: listing.squareFootage,
    images:
      listing.photos.length > 0
        ? listing.photos.map((photo) => photo.dataUrl)
        : [DRAFT_IMAGE_FALLBACK],
    verified: listing.reviewStatus === "VERIFIED",
    host: {
      id: isLandlord ? "host-current-landlord" : "host-current-agent",
      name: isLandlord ? "Chinedu Okafor" : "Tomi Adeyemi",
      role: isLandlord ? "LANDLORD" : "AGENT",
      verified: true,
    },
    amenities: listing.amenities,
    tour: {},
    reviews: {
      averageRating: 0,
      count: 0,
      items: [],
    },
  };
}

function getBackendPropertyLocation(address: string): PropertyDetailLocation {
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

function backendPropertyToPropertyDetail(
  property: BackendProperty,
): PropertyDetail {
  const hostRole: PropertyHostRole =
    property.host?.role === "AGENT" ? "AGENT" : "LANDLORD";
  const hostName = property.host?.name ?? "";
  const verified = property.verified;

  return {
    id: String(property.id),
    title: property.title,
    description: property.description ?? "",
    status: property.status === "FOR_SALE" ? "FOR_SALE" : "FOR_RENT",
    price: property.price,
    rentalMode: property.rentalMode ?? "ANNUAL",
    minimumNights: property.minimumNights ?? null,
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

export interface PropertyQueryResult {
  data: PropertyDetail[];
  hasNext: boolean;
  message?: string;
  totalItems: number;
}

export async function getProperties(
  filter: "all" | "rent" | "sale" = "all",
  page = 0,
  size = 12,
): Promise<PropertyQueryResult> {
  const result = await getPublicProperties(filter, page, size);

  return {
    data: result.data
      .filter(
        (property) =>
          property.status === "FOR_RENT" || property.status === "FOR_SALE",
      )
      .map(backendPropertyToPropertyDetail),
    hasNext: result.hasNext,
    message: result.message,
    totalItems: result.totalItems,
  };
}

export async function getPropertyById(
  id: string,
): Promise<PropertyDetail | null> {
  if (/^\d+$/.test(id)) {
    const backendProperty = await getBackendPropertyById(id);

    if (backendProperty.data) {
      return backendPropertyToPropertyDetail(backendProperty.data);
    }
  }

  const storedListing = await getHostListingById(id);
  return storedListing.data
    ? hostListingToPropertyDetail(storedListing.data)
    : null;
}

import { propertyPublicIdFrom } from "@/lib/publicIds";
import {
  DRAFT_IMAGE_FALLBACK,
  backendPropertyToPropertyDetail,
} from "@/lib/propertyMapping";
import type { ListingSearch } from "@/lib/hostListings";
import {
  getBackendPropertyById,
  getBackendPropertyByPublicId,
  getHostListingById,
  getPublicProperties,
  interpretPublicProperties,
  type HostListingRecord,
  type RentalMode,
  type SearchFilters,
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
  publicId?: string;
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
  reply?: string;
}

export interface PropertyReviews {
  averageRating: number;
  count: number;
  items: PropertyReviewItem[];
}

export interface PropertyDetail {
  id: string;
  publicId?: string;
  slug?: string;
  title: string;
  description: string;
  status: PropertyListingStatus;
  price: number;
  /** What the price is per. Decides how a stay total is worked out. */
  rentalMode: RentalMode;
  /** Shortlets only. */
  minimumNights?: number | null;
  /** Shortlets only. Null when the host set no limit. */
  maximumGuests?: number | null;
  /** Refundable, held by Rello, and returned after the tenancy. */
  securityDeposit?: number | null;
  cleaningFee?: number | null;
  location: PropertyDetailLocation;
  bedrooms: number;
  bathrooms: number;
  totalUnitCount: number;
  availableUnitCount: number;
  sqft?: number;
  images: string[];
  verified: boolean;
  host: PropertyDetailHost;
  amenities: string[];
  tour: PropertyDetailTour;
  reviews: PropertyReviews;
}

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
    maximumGuests: listing.maximumGuests ?? null,
    securityDeposit: listing.securityDeposit ?? null,
    cleaningFee: listing.cleaningFee ?? null,
    location: {
      city: listing.city || "Location pending",
      area: listing.area || "Area pending",
      address: listing.address || undefined,
    },
    bedrooms: listing.bedrooms,
    bathrooms: listing.bathrooms,
    totalUnitCount: listing.unitCount,
    availableUnitCount: listing.unitCount,
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
  search?: ListingSearch,
): Promise<PropertyQueryResult> {
  const result = await getPublicProperties(filter, page, size, search);

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

export interface InterpretedPropertyQueryResult extends PropertyQueryResult {
  fallback: boolean;
  filters: SearchFilters | null;
}

export async function interpretProperties(
  query: string,
  page = 0,
  size = 12,
): Promise<InterpretedPropertyQueryResult> {
  const result = await interpretPublicProperties(query, page, size);

  return {
    data: result.data
      .filter((property) => property.status === "FOR_RENT")
      .map(backendPropertyToPropertyDetail),
    fallback: result.fallback,
    filters: result.filters,
    hasNext: result.hasNext,
    message: result.message,
    totalItems: result.totalItems,
  };
}

export async function getPropertyById(
  id: string,
): Promise<PropertyDetail | null> {
  // A canonical link ends in the public identifier; the slug before it is ignored
  const publicId = propertyPublicIdFrom(id);

  if (publicId) {
    const publicProperty = await getBackendPropertyByPublicId(publicId);

    return publicProperty.data
      ? backendPropertyToPropertyDetail(publicProperty.data)
      : null;
  }

  if (/^\d+$/.test(id)) {
    const backendProperty = await getBackendPropertyById(id);

    return backendProperty.data
      ? backendPropertyToPropertyDetail(backendProperty.data)
      : null;
  }

  const storedListing = await getHostListingById(id);
  return storedListing.data
    ? hostListingToPropertyDetail(storedListing.data)
    : null;
}

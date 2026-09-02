import {
  getBackendPropertyById,
  getHostListingById,
  getPublicProperties,
  type BackendProperty,
  type HostListingRecord,
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

export const MOCK_PROPERTY_DETAILS: PropertyDetail[] = [
  {
    id: "ikoyi-garden-residence",
    title: "Ikoyi Garden Residence",
    description:
      "A calm, light-filled apartment minutes from Ikoyi's commercial core. The home pairs generous living areas with reliable power, secure parking, and a responsive verified landlord for tenants who need comfort without slowing down their week.",
    status: "FOR_RENT",
    price: 150000,
    location: {
      city: "Lagos",
      area: "Ikoyi",
      address: "Bourdillon Road, Ikoyi",
    },
    bedrooms: 3,
    bathrooms: 3,
    sqft: 1850,
    images: [
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&h=800&fit=crop&auto=format&q=80",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&h=800&fit=crop&auto=format&q=80",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&h=800&fit=crop&auto=format&q=80",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&h=800&fit=crop&auto=format&q=80",
    ],
    verified: true,
    host: {
      id: "host-ikoyi-01",
      name: "Chinedu Okafor",
      role: "LANDLORD",
      verified: true,
    },
    amenities: [
      "Wifi",
      "Parking",
      "Air Conditioning",
      "Kitchen",
      "Security",
      "Generator",
    ],
    tour: {
      videoUrl:
        "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    },
    reviews: {
      averageRating: 4.8,
      count: 2,
      items: [
        {
          id: "review-ikoyi-1",
          reviewerName: "Amara Okafor",
          rating: 5,
          comment:
            "The apartment looked exactly like the photos and the handoff was clear. Power backup was reliable throughout my stay.",
          createdAt: "2026-06-18T10:00:00.000Z",
        },
        {
          id: "review-ikoyi-2",
          reviewerName: "Tunde Adebayo",
          rating: 4.5,
          comment:
            "Great location for work around Ikoyi. The host responded quickly when I had questions about access.",
          createdAt: "2026-05-29T12:00:00.000Z",
        },
      ],
    },
  },
  {
    id: "maitama-city-apartment",
    title: "Maitama City Apartment",
    description:
      "A polished four-bedroom apartment in a quiet Maitama pocket with wide rooms, secure access, and city views. Ideal for buyers who want a ready home close to Abuja's civic and business districts.",
    status: "FOR_SALE",
    price: 85000000,
    location: {
      city: "Abuja",
      area: "Maitama",
      address: "Gana Street, Maitama",
    },
    bedrooms: 4,
    bathrooms: 4,
    sqft: 2600,
    images: [
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&h=800&fit=crop&auto=format&q=80",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&h=800&fit=crop&auto=format&q=80",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&h=800&fit=crop&auto=format&q=80",
    ],
    verified: true,
    host: {
      id: "host-maitama-01",
      name: "Tomi Adeyemi",
      role: "AGENT",
      avatarUrl:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&h=160&fit=crop&auto=format&q=80",
      verified: true,
    },
    amenities: [
      "Parking",
      "Elevator",
      "Security",
      "Generator",
      "Balcony",
      "Water Supply",
    ],
    tour: {
      matterportUrl: "https://my.matterport.com/show/?m=NUoB8bimH9B",
    },
    reviews: {
      averageRating: 0,
      count: 0,
      items: [],
    },
  },
  {
    id: "lekki-contemporary-home",
    title: "Lekki Contemporary Home",
    description:
      "A compact, modern two-bedroom home with clean finishes and quick access to Lekki Phase 1 restaurants, offices, and waterfront roads. A strong fit for renters who want a managed home base.",
    status: "FOR_RENT",
    price: 95000,
    location: {
      city: "Lagos",
      area: "Lekki Phase 1",
    },
    bedrooms: 2,
    bathrooms: 2,
    images: [
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&h=800&fit=crop&auto=format&q=80",
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&h=800&fit=crop&auto=format&q=80",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&h=800&fit=crop&auto=format&q=80",
    ],
    verified: true,
    host: {
      id: "host-lekki-01",
      name: "Kemi Balogun",
      role: "LANDLORD",
      verified: true,
    },
    amenities: ["Wifi", "Air Conditioning", "Kitchen", "Security"],
    tour: {},
    reviews: {
      averageRating: 4.6,
      count: 1,
      items: [
        {
          id: "review-lekki-1",
          reviewerName: "Jemimah Cole",
          rating: 4.6,
          comment:
            "Easy viewing process and a clean apartment. The neighborhood was convenient for commuting around Lekki.",
          createdAt: "2026-04-11T09:30:00.000Z",
        },
      ],
    },
  },
  {
    id: "gra-family-duplex",
    title: "GRA Family Duplex",
    description:
      "A family-ready duplex with generous bedrooms, a private compound, and a quiet GRA address. The listing is verified for buyers comparing secure Port Harcourt homes.",
    status: "FOR_SALE",
    price: 64000000,
    location: {
      city: "Port Harcourt",
      area: "GRA",
    },
    bedrooms: 4,
    bathrooms: 3,
    sqft: 3100,
    images: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&h=800&fit=crop&auto=format&q=80",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&h=800&fit=crop&auto=format&q=80",
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&h=800&fit=crop&auto=format&q=80",
    ],
    verified: true,
    host: {
      id: "host-gra-01",
      name: "Nnamdi Briggs",
      role: "AGENT",
      verified: false,
    },
    amenities: ["Parking", "Security", "Garden", "Generator", "Water Supply"],
    tour: {},
    reviews: {
      averageRating: 0,
      count: 0,
      items: [],
    },
  },
  {
    id: "wuse-studio-loft",
    title: "Wuse Studio Loft",
    description:
      "A neat studio loft with efficient storage, managed access, and a central Wuse location for tenants who want a lower-maintenance Abuja base.",
    status: "FOR_RENT",
    price: 420000,
    location: {
      city: "Abuja",
      area: "Wuse 2",
    },
    bedrooms: 1,
    bathrooms: 1,
    sqft: 760,
    images: [
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&h=800&fit=crop&auto=format&q=80",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&h=800&fit=crop&auto=format&q=80",
    ],
    verified: true,
    host: {
      id: "host-wuse-01",
      name: "Hadiza Musa",
      role: "LANDLORD",
      verified: true,
    },
    amenities: ["Wifi", "Kitchen", "Security", "Air Conditioning"],
    tour: {},
    reviews: {
      averageRating: 4.3,
      count: 1,
      items: [
        {
          id: "review-wuse-1",
          reviewerName: "Seyi Martins",
          rating: 4.3,
          comment:
            "Compact but practical. The location made errands and meetings simple.",
          createdAt: "2026-03-05T13:00:00.000Z",
        },
      ],
    },
  },
  {
    id: "banana-island-terrace",
    title: "Banana Island Terrace",
    description:
      "A premium terrace home with expansive rooms, private outdoor space, and a verified sale listing in one of Lagos' most established residential enclaves.",
    status: "FOR_SALE",
    price: 125000000,
    location: {
      city: "Lagos",
      area: "Banana Island",
    },
    bedrooms: 5,
    bathrooms: 5,
    sqft: 4200,
    images: [
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&h=800&fit=crop&auto=format&q=80",
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&h=800&fit=crop&auto=format&q=80",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&h=800&fit=crop&auto=format&q=80",
    ],
    verified: true,
    host: {
      id: "host-banana-01",
      name: "Adaora Eze",
      role: "AGENT",
      verified: true,
    },
    amenities: [
      "Parking",
      "Pool",
      "Security",
      "Generator",
      "Garden",
      "Balcony",
    ],
    tour: {},
    reviews: {
      averageRating: 0,
      count: 0,
      items: [],
    },
  },
];

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
    property.seller.role === "AGENT" ? "AGENT" : "LANDLORD";
  const hostName = [property.seller.firstName, property.seller.lastName]
    .filter(Boolean)
    .join(" ");
  const verified = property.verified ?? property.isVerified ?? false;

  return {
    id: String(property.id),
    title: property.title,
    description: property.description ?? "",
    status: property.status === "FOR_SALE" ? "FOR_SALE" : "FOR_RENT",
    price: property.price,
    location: getBackendPropertyLocation(property.address),
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    sqft: property.squareFootage,
    images: [property.imageUrl ?? DRAFT_IMAGE_FALLBACK],
    verified,
    host: {
      id: String(property.seller.id),
      name: hostName || "Property host",
      role: hostRole,
      verified:
        property.seller.identityVerified ??
        property.seller.isIdentityVerified ??
        false,
    },
    amenities: [],
    tour: {
      videoUrl: property.videoWalkthroughUrl ?? undefined,
      matterportUrl: property.virtualTourUrl ?? undefined,
    },
    reviews: {
      averageRating: property.seller.sellerRating ?? 0,
      count: 0,
      items: [],
    },
  };
}

export interface PropertyQueryResult {
  data: PropertyDetail[];
  message?: string;
}

export async function getProperties(
  filter: "all" | "rent" | "sale" = "all",
): Promise<PropertyQueryResult> {
  const result = await getPublicProperties(filter);

  return {
    data: result.data
      .filter(
        (property) =>
          property.status === "FOR_RENT" || property.status === "FOR_SALE",
      )
      .map(backendPropertyToPropertyDetail),
    message: result.message,
  };
}

export async function getPropertyById(
  id: string,
): Promise<PropertyDetail | null> {
  const mockProperty = MOCK_PROPERTY_DETAILS.find(
    (property) => property.id === id,
  );

  if (mockProperty) {
    return mockProperty;
  }

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

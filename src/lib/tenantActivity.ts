import {
  Bookmark,
  CalendarCheck,
  Landmark,
  MessageSquareText,
  WalletCards,
} from "lucide-react";
import type { IconTileProps } from "@/components/ui/icon-tile";
import type { StatusBadgeProps } from "@/components/ui/status-badge";
import type { UtilityCardProps } from "@/components/ui/utility-card";

export type TenantActivityStatus =
  | "Escrow Held"
  | "Upcoming"
  | "Pending"
  | "Accepted"
  | "Rejected";

export type TenantActivityType = "Rental" | "Purchase";

interface TenantPortfolio {
  totalPropertiesCount: number;
  activeListingsCount: number;
  totalValueForSale: number;
  pendingOffersCount: number;
}

interface TenantStat {
  label: string;
  value: number | string;
  trend: string;
  direction: "up" | "down";
  icon: typeof CalendarCheck;
  tone: NonNullable<UtilityCardProps["tone"]>;
  tile: NonNullable<IconTileProps["tone"]>;
}

export interface TenantActivity {
  activityType: TenantActivityType;
  propertyId: string;
  title: string;
  location: string;
  status: TenantActivityStatus;
  image: string;
  host: {
    id: string;
    name: string;
    role: "Landlord" | "Agent";
  };
  dates?: string;
  price?: string;
  offerAmount?: string;
}

export interface TenantTimelineActivity {
  title: string;
  description: string;
  time: string;
  icon: typeof WalletCards;
  tone: NonNullable<IconTileProps["tone"]>;
}

export interface BrowseProperty {
  id: string;
  name: string;
  location: string;
  price: number;
  listingType: "FOR_RENT" | "FOR_SALE";
  bedrooms: number;
  bathrooms: number;
  imageUrl: string;
  verified: boolean;
}

const tenantPortfolio: TenantPortfolio = {
  totalPropertiesCount: 3,
  activeListingsCount: 3,
  totalValueForSale: 63000000,
  pendingOffersCount: 1,
};

const savedListingsCount = 12;

export const TENANT_ACTIVITY_IMAGES = [
  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400&h=300&fit=crop&auto=format&q=80",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop&auto=format&q=80",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop&auto=format&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop&auto=format&q=80",
];

export const TENANT_STATS: TenantStat[] = [
  {
    label: "Properties",
    value: tenantPortfolio.totalPropertiesCount.toString().padStart(2, "0"),
    trend: `${tenantPortfolio.activeListingsCount} active`,
    direction: "up",
    icon: CalendarCheck,
    tone: "soft",
    tile: "primary",
  },
  {
    label: "Pending Offers",
    value: tenantPortfolio.pendingOffersCount.toString().padStart(2, "0"),
    trend: "Awaiting response",
    direction: "up",
    icon: MessageSquareText,
    tone: "soft",
    tile: "primary",
  },
  {
    label: "Total Invested",
    value: tenantPortfolio.totalValueForSale,
    trend: "Across purchases",
    direction: "down",
    icon: Landmark,
    tone: "soft",
    tile: "primary",
  },
  {
    label: "Saved Listings",
    value: savedListingsCount.toString().padStart(2, "0"),
    trend: "Placeholder data",
    direction: "up",
    icon: Bookmark,
    tone: "default",
    tile: "primary",
  },
];

export const TENANT_ACTIVITIES: TenantActivity[] = [
  {
    activityType: "Rental",
    propertyId: "glass-house-lekki",
    title: "The Glass House, Lekki",
    location: "Lekki Phase 1, Lagos",
    status: "Escrow Held",
    host: {
      id: "host-glass-01",
      name: "Kemi Balogun",
      role: "Landlord",
    },
    dates: "Jul 04 to Jul 18",
    price: "₦480,000/mo",
    image: TENANT_ACTIVITY_IMAGES[0],
  },
  {
    activityType: "Rental",
    propertyId: "maitama-courtyard",
    title: "Maitama Courtyard",
    location: "Maitama, Abuja",
    status: "Upcoming",
    host: {
      id: "agent-maitama-01",
      name: "Tomi Adeyemi",
      role: "Agent",
    },
    dates: "Jul 22 to Aug 05",
    price: "₦620,000/mo",
    image: TENANT_ACTIVITY_IMAGES[1],
  },
  {
    activityType: "Purchase",
    propertyId: "harbour-view-residence",
    title: "Harbour View Residence",
    location: "Victoria Island, Lagos",
    status: "Pending",
    host: {
      id: "agent-harbour-01",
      name: "Ada Williams",
      role: "Agent",
    },
    offerAmount: "₦63,000,000",
    image: TENANT_ACTIVITY_IMAGES[2],
  },
  {
    activityType: "Purchase",
    propertyId: "ikoyi-garden-residence",
    title: "Ikoyi Garden Residence",
    location: "Ikoyi, Lagos",
    status: "Accepted",
    host: {
      id: "host-ikoyi-01",
      name: "Chinedu Okafor",
      role: "Landlord",
    },
    offerAmount: "₦85,000,000",
    image: TENANT_ACTIVITY_IMAGES[3],
  },
  {
    activityType: "Rental",
    propertyId: "gra-family-duplex",
    title: "GRA Family Duplex",
    location: "GRA, Port Harcourt",
    status: "Upcoming",
    host: {
      id: "agent-gra-01",
      name: "Nnamdi Briggs",
      role: "Agent",
    },
    dates: "Aug 14 to Aug 28",
    price: "₦720,000/mo",
    image: TENANT_ACTIVITY_IMAGES[0],
  },
];

export const TENANT_TIMELINE_ACTIVITIES: TenantTimelineActivity[] = [
  {
    title: "Escrow funded",
    description: "Payment secured for The Glass House.",
    time: "18 minutes ago",
    icon: WalletCards,
    tone: "primary",
  },
  {
    title: "Offer submitted",
    description: "Your Harbour View Residence purchase offer is pending.",
    time: "2 hours ago",
    icon: CalendarCheck,
    tone: "primary",
  },
  {
    title: "Host replied",
    description: "A new message is waiting in your booking.",
    time: "Yesterday",
    icon: MessageSquareText,
    tone: "neutral",
  },
];

export const TENANT_STATUS_TONES: Record<
  TenantActivityStatus,
  NonNullable<StatusBadgeProps["tone"]>
> = {
  "Escrow Held": "primary",
  Upcoming: "primary",
  Pending: "primary",
  Accepted: "accent",
  Rejected: "danger",
};

export const TENANT_ACTIVITY_TYPE_TONES: Record<
  TenantActivityType,
  NonNullable<StatusBadgeProps["tone"]>
> = {
  Rental: "primary",
  Purchase: "accent",
};

export const BROWSE_PROPERTIES: BrowseProperty[] = [
  {
    id: "ikoyi-garden-residence",
    name: "Ikoyi Garden Residence",
    location: "Ikoyi, Lagos",
    price: 150000,
    listingType: "FOR_RENT",
    bedrooms: 3,
    bathrooms: 3,
    imageUrl:
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=600&fit=crop&auto=format&q=80",
    verified: true,
  },
  {
    id: "maitama-city-apartment",
    name: "Maitama City Apartment",
    location: "Maitama, Abuja",
    price: 85000000,
    listingType: "FOR_SALE",
    bedrooms: 4,
    bathrooms: 4,
    imageUrl:
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop&auto=format&q=80",
    verified: true,
  },
  {
    id: "lekki-contemporary-home",
    name: "Lekki Contemporary Home",
    location: "Lekki Phase 1, Lagos",
    price: 95000,
    listingType: "FOR_RENT",
    bedrooms: 2,
    bathrooms: 2,
    imageUrl:
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop&auto=format&q=80",
    verified: true,
  },
  {
    id: "gra-family-duplex",
    name: "GRA Family Duplex",
    location: "GRA, Port Harcourt",
    price: 64000000,
    listingType: "FOR_SALE",
    bedrooms: 4,
    bathrooms: 3,
    imageUrl:
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop&auto=format&q=80",
    verified: true,
  },
  {
    id: "wuse-studio-loft",
    name: "Wuse Studio Loft",
    location: "Wuse 2, Abuja",
    price: 420000,
    listingType: "FOR_RENT",
    bedrooms: 1,
    bathrooms: 1,
    imageUrl:
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800&h=600&fit=crop&auto=format&q=80",
    verified: true,
  },
  {
    id: "banana-island-terrace",
    name: "Banana Island Terrace",
    location: "Banana Island, Lagos",
    price: 125000000,
    listingType: "FOR_SALE",
    bedrooms: 5,
    bathrooms: 5,
    imageUrl:
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop&auto=format&q=80",
    verified: true,
  },
];

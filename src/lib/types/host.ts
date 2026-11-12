export interface HostProfile {
  id: number;
  publicId?: string;
  slug?: string;
  avatarUrl?: string | null;
  identityVerified: boolean;
  listingCount: number;
  name: string;
  rating: number | null;
  reviewCount: number;
  role: "AGENT" | "LANDLORD";
}

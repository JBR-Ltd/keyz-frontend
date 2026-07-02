import type { ReactElement } from "react";
import Image from "next/image";
import { Bath, BedDouble, MapPin } from "lucide-react";
import VerifiedBadge from "@/components/ui/VerifiedBadge";

type ListingType = "FOR_RENT" | "FOR_SALE";

interface PropertyCardProps {
  name: string;
  location: string;
  price: number;
  listingType: ListingType;
  bedrooms: number;
  bathrooms: number;
  imageUrl: string;
  verified: boolean;
  featured: boolean;
}

function formatNaira(value: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPrice(value: number, listingType: ListingType): string {
  const formatted = formatNaira(value);

  return listingType === "FOR_RENT" ? `${formatted}/mo` : formatted;
}

function formatListingType(listingType: ListingType): string {
  return listingType === "FOR_RENT" ? "For Rent" : "For Sale";
}

export default function PropertyCard({
  name,
  location,
  price,
  listingType,
  bedrooms,
  bathrooms,
  imageUrl,
  verified,
  featured,
}: PropertyCardProps): ReactElement {
  return (
    <article
      className={`group overflow-hidden rounded-2xl bg-[var(--color-bg)] shadow-[0_18px_45px_color-mix(in_srgb,var(--color-primary)_10%,transparent)] transition-all duration-200 ease-in-out hover:-translate-y-1 hover:shadow-[0_28px_70px_color-mix(in_srgb,var(--color-primary)_15%,transparent)] ${
        featured ? "lg:row-span-2" : ""
      }`}
    >
      <div
        className={`relative overflow-hidden ${featured ? "aspect-[4/3]" : "aspect-video"}`}
      >
        <Image
          src={imageUrl}
          alt={name}
          fill
          sizes={
            featured
              ? "(min-width: 1024px) 50vw, 100vw"
              : "(min-width: 1024px) 33vw, 100vw"
          }
          className="transition-all duration-300 ease-in-out group-hover:scale-[1.03]"
          style={{ objectFit: "cover" }}
        />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          {verified ? <VerifiedBadge /> : null}
          <span className="inline-flex rounded-full bg-white/90 px-3 py-1.5 font-body text-xs font-medium text-primary shadow-sm">
            {formatListingType(listingType)}
          </span>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <h3 className="font-display text-2xl font-bold leading-tight text-primary">
          {name}
        </h3>
        <p className="mt-3 flex items-center gap-2 font-body text-sm text-muted">
          <MapPin size={16} className="text-accent" aria-hidden="true" />
          {location}
        </p>
        <p className="mt-4 font-body text-xl font-bold text-primary">
          {formatPrice(price, listingType)}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-4 font-body text-sm text-muted">
          <span className="inline-flex items-center gap-1.5">
            <BedDouble size={16} className="text-accent" aria-hidden="true" />
            {bedrooms} bedrooms
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Bath size={16} className="text-accent" aria-hidden="true" />
            {bathrooms} bathrooms
          </span>
        </div>
        <a
          href="#waitlist-cta"
          className="mt-5 inline-flex font-body text-sm font-bold text-accent transition-all duration-200 ease-in-out hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          View property
        </a>
      </div>
    </article>
  );
}

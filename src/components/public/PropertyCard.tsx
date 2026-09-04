import type { ReactElement } from "react";
import Image from "next/image";
import Link from "next/link";
import { Bath, BedDouble, Heart, Loader2, MapPin } from "lucide-react";
import PropertyPrice from "@/components/property/PropertyPrice";
import VerifiedBadge from "@/components/ui/VerifiedBadge";

type ListingType = "FOR_RENT" | "FOR_SALE";

interface PropertyCardProps {
  id: string;
  name: string;
  location: string;
  price: number;
  listingType: ListingType;
  bedrooms: number;
  bathrooms: number;
  imageUrl: string;
  featured: boolean;
  isSaved?: boolean;
  isSaving?: boolean;
  onSaveToggle?: () => void;
  verified?: boolean;
}

export default function PropertyCard({
  id,
  name,
  location,
  price,
  listingType,
  bedrooms,
  bathrooms,
  imageUrl,
  featured,
  isSaved = false,
  isSaving = false,
  onSaveToggle,
  verified = false,
}: PropertyCardProps): ReactElement {
  const propertyHref = `/property/${id}`;

  return (
    <article
      className={`group overflow-hidden rounded-xl bg-[var(--color-bg)] shadow-sm transition-all duration-200 ease-in-out hover:-translate-y-1 hover:shadow-md ${
        featured ? "lg:row-span-2" : ""
      }`}
    >
      <div
        className={`relative overflow-hidden ${featured ? "aspect-[4/3]" : "aspect-video"}`}
      >
        <Link
          href={propertyHref}
          aria-label={`View ${name}`}
          className="relative block h-full w-full"
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
        </Link>
        {verified ? (
          <span className="absolute left-3 top-3">
            <VerifiedBadge size="sm" />
          </span>
        ) : null}
        {onSaveToggle ? (
          <button
            type="button"
            onClick={onSaveToggle}
            disabled={isSaving}
            aria-label={isSaved ? `Remove ${name} from saved homes` : `Save ${name}`}
            aria-pressed={isSaved}
            className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-bg/95 text-primary shadow-sm transition-all duration-200 ease-in-out hover:scale-105 hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-70"
          >
            {isSaving ? (
              <Loader2 size={18} className="animate-spin" aria-hidden="true" />
            ) : (
              <Heart
                size={18}
                fill={isSaved ? "currentColor" : "none"}
                aria-hidden="true"
              />
            )}
          </button>
        ) : null}
      </div>

      <div className="p-5 sm:p-6">
        <h3 className="font-display text-2xl font-bold leading-tight text-primary">
          <Link
            href={propertyHref}
            className="transition-colors duration-200 hover:text-accent-alt focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {name}
          </Link>
        </h3>
        <p className="mt-3 flex items-center gap-2 font-body text-sm text-muted">
          <MapPin size={16} className="text-accent-alt" aria-hidden="true" />
          {location}
        </p>
        <p className="mt-4 font-body text-xl font-bold text-primary">
          <PropertyPrice value={price} listingType={listingType} />
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-4 font-body text-sm text-muted">
          <span className="inline-flex items-center gap-1.5">
            <BedDouble
              size={16}
              className="text-accent-alt"
              aria-hidden="true"
            />
            {bedrooms} bedrooms
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Bath size={16} className="text-accent-alt" aria-hidden="true" />
            {bathrooms} bathrooms
          </span>
        </div>
        <Link
          href={propertyHref}
          className="mt-5 inline-flex font-body text-sm font-bold text-primary transition-all duration-200 ease-in-out hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          View property
        </Link>
      </div>
    </article>
  );
}

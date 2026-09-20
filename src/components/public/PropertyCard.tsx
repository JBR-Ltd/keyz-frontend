import type { ReactElement } from "react";
import Image from "next/image";
import Link from "next/link";
import { Bath, BedDouble, Heart, Loader2, MapPin } from "lucide-react";
import PropertyPrice from "@/components/property/PropertyPrice";
import VerifiedBadge from "@/components/ui/VerifiedBadge";
import { propertyPath } from "@/lib/publicIds";

type ListingType = "FOR_RENT" | "FOR_SALE";

interface PropertyCardProps {
  id: string;
  /** When present the card links to the canonical address, not the numeric id. */
  publicId?: string;
  slug?: string;
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
  availableUnitCount?: number;
}

export default function PropertyCard({
  id,
  publicId,
  slug,
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
  availableUnitCount,
}: PropertyCardProps): ReactElement {
  const propertyHref = propertyPath({ id, publicId, slug });

  return (
    <article className={`relative h-full ${featured ? "lg:row-span-2" : ""}`}>
      <Link
        href={propertyHref}
        aria-label={`View ${name}`}
        className="group flex h-full flex-col overflow-hidden rounded-xl bg-[var(--color-bg)] shadow-sm transition-all duration-200 ease-in-out hover:-translate-y-1 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      >
        <div className="relative aspect-video shrink-0 overflow-hidden">
          <Image
            src={imageUrl}
            alt={name}
            fill
            sizes={
              featured
                ? "(min-width: 1024px) 50vw, 100vw"
                : "(min-width: 1024px) 33vw, 100vw"
            }
            className="object-cover transition-transform duration-300 ease-in-out group-hover:scale-[1.04]"
          />
          {verified ? (
            <span className="absolute left-3 top-3">
              <VerifiedBadge size="sm" />
            </span>
          ) : null}
        </div>

        <div className="flex min-h-56 flex-1 flex-col p-5 sm:p-6">
          <h3 className="line-clamp-2 min-h-[3.75rem] font-display text-2xl font-bold leading-tight text-primary transition-colors duration-200 group-hover:text-accent-alt">
            {name}
          </h3>
          <p className="mt-3 flex items-center gap-2 font-body text-sm text-muted">
            <MapPin
              size={16}
              className="shrink-0 text-accent-alt"
              aria-hidden="true"
            />
            <span className="truncate">{location}</span>
          </p>
          <p className="mt-4 font-body text-xl font-bold text-primary">
            <PropertyPrice value={price} listingType={listingType} />
          </p>
          <div className="mt-auto flex flex-wrap items-center gap-4 pt-4 font-body text-sm text-muted">
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
            {availableUnitCount !== undefined && availableUnitCount > 1 ? (
              <span className="rounded-full bg-accent/10 px-2.5 py-1 font-body text-xs font-bold text-primary">
                {availableUnitCount} units available
              </span>
            ) : null}
          </div>
        </div>
      </Link>

      {onSaveToggle ? (
        <button
          type="button"
          onClick={onSaveToggle}
          disabled={isSaving}
          aria-label={
            isSaved ? `Remove ${name} from saved homes` : `Save ${name}`
          }
          aria-pressed={isSaved}
          className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-bg/95 text-primary shadow-sm transition-all duration-200 ease-in-out hover:scale-105 hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-70"
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
    </article>
  );
}

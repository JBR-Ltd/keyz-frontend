import type { ReactElement } from "react";
import Image from "next/image";
import Link from "next/link";
import { Bath, BedDouble, MapPin } from "lucide-react";
import PropertyPrice from "@/components/property/PropertyPrice";

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
}

function formatListingType(listingType: ListingType): string {
  return listingType === "FOR_RENT" ? "For Rent" : "For Sale";
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
}: PropertyCardProps): ReactElement {
  return (
    <article
      className={`group overflow-hidden rounded-xl bg-[var(--color-bg)] shadow-sm transition-all duration-200 ease-in-out hover:-translate-y-1 hover:shadow-md ${
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
          <span className="inline-flex rounded-full bg-bg px-3 py-1.5 font-body text-xs font-medium text-primary shadow-sm">
            {formatListingType(listingType)}
          </span>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <h3 className="font-display text-2xl font-bold leading-tight text-primary">
          {name}
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
          href={"/property/" + id}
          className="mt-5 inline-flex font-body text-sm font-bold text-primary transition-all duration-200 ease-in-out hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          View property
        </Link>
      </div>
    </article>
  );
}

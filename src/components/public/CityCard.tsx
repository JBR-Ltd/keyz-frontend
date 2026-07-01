import type { ReactElement } from "react";
import Image from "next/image";

interface CityCardProps {
  city: string;
  listingCount: string;
  imageUrl: string;
}

export default function CityCard({
  city,
  listingCount,
  imageUrl,
}: CityCardProps): ReactElement {
  return (
    <article className="group relative h-80 min-w-[18rem] overflow-hidden rounded-2xl shadow-[0_18px_45px_color-mix(in_srgb,var(--color-primary)_10%,transparent)] transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-[0_28px_70px_color-mix(in_srgb,var(--color-primary)_20%,transparent)] sm:min-w-[22rem] lg:min-w-0">
      <Image
        src={imageUrl}
        alt={`${city} cityscape`}
        fill
        className="transition-all duration-300 ease-in-out group-hover:scale-105"
        style={{ objectFit: "cover" }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(to_top,color-mix(in_srgb,var(--color-primary)_86%,transparent),transparent_68%)]" />
      <div className="absolute inset-x-0 bottom-0 p-6">
        <h3 className="font-display text-4xl font-bold leading-none text-[var(--color-bg)]">
          {city}
        </h3>
        <p className="mt-2 font-body text-sm font-semibold text-[color-mix(in_srgb,var(--color-bg)_80%,transparent)]">
          {listingCount}
        </p>
      </div>
    </article>
  );
}

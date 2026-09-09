import type { ReactElement } from "react";
import type { RentalMode } from "@/lib/hostListings";
import type { PropertyListingStatus } from "@/lib/propertyDetails";

interface PropertyPriceProps {
  value: number | string;
  listingType?: PropertyListingStatus;
  /** Decides the suffix. Without it a rental is assumed to be let by the year. */
  rentalMode?: RentalMode;
}

const RENTAL_SUFFIXES: Record<RentalMode, string> = {
  ANNUAL: "/yr",
  MONTHLY: "/mo",
  SHORT_STAY: "/night",
};

function formatNaira(value: number | string): string {
  if (typeof value === "string") {
    return value;
  }

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function PropertyPrice({
  value,
  listingType,
  rentalMode,
}: PropertyPriceProps): ReactElement {
  const formatted = formatNaira(value);
  // A rental used to always read as monthly, which is wrong for a shortlet and
  // for the annual tenancies most Nigerian listings actually are
  const suffix =
    typeof value === "number" && listingType === "FOR_RENT"
      ? RENTAL_SUFFIXES[rentalMode ?? "ANNUAL"]
      : "";

  return (
    <>
      <span className="font-body no-underline">{formatted.slice(0, 1)}</span>
      {formatted.slice(1)}
      {suffix}
    </>
  );
}

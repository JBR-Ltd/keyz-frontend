import type { ReactElement } from "react";
import type { PropertyListingStatus } from "@/lib/propertyDetails";

interface PropertyPriceProps {
  value: number | string;
  listingType?: PropertyListingStatus;
}

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
}: PropertyPriceProps): ReactElement {
  const formatted = formatNaira(value);
  const suffix =
    typeof value === "number" && listingType === "FOR_RENT" ? "/mo" : "";

  return (
    <>
      <span className="font-body no-underline">{formatted.slice(0, 1)}</span>
      {formatted.slice(1)}
      {suffix}
    </>
  );
}

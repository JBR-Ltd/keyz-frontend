import type { Metadata } from "next";
import type { ReactElement } from "react";
import PublicBrowseRoute from "@/components/browse/PublicBrowseRoute";
import { siteUrl } from "@/lib/seoProperties";

export const metadata: Metadata = {
  title: "Browse Verified Homes",
  description:
    "Search verified homes and shortlets across Nigeria by location, budget, rooms, and amenities.",
  alternates: { canonical: `${siteUrl()}/browse` },
  openGraph: {
    title: "Browse Verified Homes on Rello",
    description: "Search verified homes and shortlets across Nigeria.",
    url: `${siteUrl()}/browse`,
    type: "website",
  },
};

export default function BrowsePage(): ReactElement {
  return <PublicBrowseRoute />;
}

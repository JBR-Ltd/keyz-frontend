import type { Metadata } from "next";
import type { ReactElement } from "react";
import { siteUrl } from "@/lib/seoProperties";
import MarketingLandingPage from "./marketing/page";

const title = "Find Verified Homes to Rent in Nigeria";
const socialTitle = `${title} | Rello`;
const description =
  "Search verified rentals and shortlets across Nigeria, compare clear rental terms, and manage your move with Rello.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: siteUrl() },
  openGraph: {
    title: socialTitle,
    description,
    type: "website",
    url: siteUrl(),
  },
  twitter: {
    card: "summary_large_image",
    title: socialTitle,
    description,
  },
};

export default function Page(): ReactElement {
  return <MarketingLandingPage />;
}

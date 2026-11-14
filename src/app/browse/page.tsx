import type { Metadata } from "next";
import type { ReactElement } from "react";
import PublicBrowseRoute from "@/components/browse/PublicBrowseRoute";
import { backendPropertyToPropertyDetail } from "@/lib/propertyMapping";
import { propertyPath } from "@/lib/publicIds";
import {
  getInitialBrowseProperties,
  siteUrl,
  structuredDataJson,
} from "@/lib/seoProperties";

interface BrowsePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const title = "Browse Homes for Rent in Nigeria";
const description =
  "Search rentals and shortlets across Nigeria by location, budget, rooms, and amenities.";

export async function generateMetadata({
  searchParams,
}: BrowsePageProps): Promise<Metadata> {
  const parameters = await searchParams;
  const isParameterized = Object.values(parameters).some(
    (value) => value !== undefined,
  );

  return {
    title,
    description,
    alternates: isParameterized
      ? undefined
      : { canonical: `${siteUrl()}/browse` },
    robots: isParameterized ? { follow: true, index: false } : undefined,
    openGraph: {
      title: `${title} | Rello`,
      description,
      url: `${siteUrl()}/browse`,
      type: "website",
    },
  };
}

export default async function BrowsePage({
  searchParams,
}: BrowsePageProps): Promise<ReactElement> {
  const parameters = await searchParams;
  const isParameterized = Object.values(parameters).some(
    (value) => value !== undefined,
  );
  const initialPage = isParameterized
    ? null
    : await getInitialBrowseProperties();
  const initialListings = initialPage
    ? {
        data: initialPage.items.map(backendPropertyToPropertyDetail),
        hasNext: initialPage.hasNext,
        totalItems: initialPage.totalItems,
      }
    : null;
  const structuredData = initialPage
    ? {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "Homes available on Rello",
        numberOfItems: initialPage.totalItems,
        itemListElement: initialPage.items.map((property, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: property.title,
          url: `${siteUrl()}${propertyPath({
            id: property.id,
            publicId: property.publicId,
            slug: property.slug,
          })}`,
        })),
      }
    : null;

  return (
    <>
      {structuredData ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: structuredDataJson(structuredData),
          }}
        />
      ) : null}
      <PublicBrowseRoute initialListings={initialListings} />
    </>
  );
}

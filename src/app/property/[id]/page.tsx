import type { Metadata } from "next";
import type { ReactElement } from "react";
import { notFound, permanentRedirect } from "next/navigation";
import PropertyPageClient from "@/app/property/[id]/PropertyPageClient";
import {
  getBackendListingResult,
  getSeoProperty,
  propertyPath,
  siteUrl,
  structuredDataJson,
  type SeoProperty,
} from "@/lib/seoProperties";
import { backendPropertyToPropertyDetail } from "@/lib/propertyMapping";
import { propertyPublicIdFrom } from "@/lib/publicIds";

interface PropertyPageProps {
  params: Promise<{ id: string }>;
}

// === Helpers

/** A canonical link carries the slug before the id, so the lookup key is the id part. */
function lookupKey(routeId: string): string {
  return propertyPublicIdFrom(routeId) ?? routeId;
}

function priceLabel(property: SeoProperty): string {
  if (property.price === null) return "";

  const amount = new Intl.NumberFormat("en-NG", {
    currency: "NGN",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(property.price);

  switch (property.rentalMode) {
    case "ANNUAL":
      return `${amount} per year`;
    case "MONTHLY":
      return `${amount} per month`;
    case "SHORT_STAY":
      return `${amount} per night`;
    default:
      return amount;
  }
}

function describe(property: SeoProperty): string {
  const where = [property.area, property.city].filter(Boolean).join(", ");
  const facts = [
    `${property.bedrooms} bed`,
    `${property.bathrooms} bath`,
    where && `in ${where}`,
    priceLabel(property),
  ]
    .filter(Boolean)
    .join(" · ");

  // The host's own words win; the facts are the floor when there are none
  const summary = property.description?.replace(/\s+/g, " ").trim();

  return summary && summary.length > 60
    ? `${facts}. ${summary}`.slice(0, 300)
    : `${facts}. Verified listing on Rello.`;
}

// === Metadata

export async function generateMetadata({
  params,
}: PropertyPageProps): Promise<Metadata> {
  const { id } = await params;
  const property = await getSeoProperty(lookupKey(id));

  if (!property) {
    return {
      title: "Listing not found",
      robots: { follow: false, index: false },
    };
  }

  const where = [property.area, property.city].filter(Boolean).join(", ");
  const title = where ? `${property.title} in ${where}` : property.title;
  const description = describe(property);
  const canonical = `${siteUrl()}${propertyPath(property)}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      images: property.images.slice(0, 4).map((image) => ({ url: image.url })),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: property.images[0]?.url ? [property.images[0].url] : undefined,
    },
  };
}

// === Page

export default async function PropertyPage({
  params,
}: PropertyPageProps): Promise<ReactElement> {
  const { id } = await params;
  const key = lookupKey(id);
  const [property, listingResult] = await Promise.all([
    getSeoProperty(key),
    getBackendListingResult(key),
  ]);
  const listing = listingResult.data;
  const initialProperty = listing
    ? backendPropertyToPropertyDetail(listing)
    : null;

  if (listingResult.status === 404) notFound();

  if (listingResult.status === 0 || listingResult.status >= 500) {
    throw new Error("The public listing service is unavailable.");
  }

  if (!property || !initialProperty) notFound();

  const canonicalPath = propertyPath(property);
  const canonicalId = canonicalPath.slice("/property/".length);

  if (id !== canonicalId) permanentRedirect(canonicalPath);

  /**
   * Structured data alongside the rendered listing, not instead of it.
   *
   * The page body is server rendered from `initialProperty` below, so the facts are
   * in the markup a person reads. This repeats them in the form a crawler and an
   * answer engine can lift without executing anything.
   */
  const canonical = `${siteUrl()}${canonicalPath}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "RealEstateListing",
        name: property.title,
        description: property.description ?? describe(property),
        url: canonical,
        image: property.images.map((image) => image.url),
        numberOfBedrooms: property.bedrooms,
        numberOfBathroomsTotal: property.bathrooms,
        address: {
          "@type": "PostalAddress",
          streetAddress: property.address,
          addressLocality: property.area ?? property.city ?? undefined,
          addressRegion: property.city ?? undefined,
          addressCountry: "NG",
        },
        ...(property.host
          ? {
              seller: {
                "@type": "Person",
                name: property.host.name,
              },
            }
          : {}),
        ...(property.price === null
          ? {}
          : {
              offers: {
                "@type": "Offer",
                price: property.price,
                priceCurrency: "NGN",
                availability: "https://schema.org/InStock",
              },
            }),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            item: siteUrl(),
            name: "Home",
            position: 1,
          },
          {
            "@type": "ListItem",
            item: `${siteUrl()}/browse`,
            name: "Browse homes",
            position: 2,
          },
          ...(property.city
            ? [
                {
                  "@type": "ListItem",
                  item: `${siteUrl()}/rent/${property.city
                    .trim()
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/^-|-$/g, "")}`,
                  name: `Homes in ${property.city}`,
                  position: 3,
                },
              ]
            : []),
          {
            "@type": "ListItem",
            item: canonical,
            name: property.title,
            position: property.city ? 4 : 3,
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: structuredDataJson(structuredData) }}
      />
      <PropertyPageClient id={id} initialProperty={initialProperty} />
    </>
  );
}

import type { Metadata } from "next";
import type { ReactElement } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  citySlug,
  getPropertiesInCity,
  getRentalCities,
  propertyPath,
  siteUrl,
  type SeoProperty,
} from "@/lib/seoProperties";

interface CityPageProps {
  params: Promise<{ city: string }>;
}

/** Rebuilt hourly so a newly published listing shows up without a deploy. */
export const revalidate = 3600;

// === Helpers

async function resolveCity(slug: string): Promise<string | null> {
  const cities = await getRentalCities();

  return cities.find((city) => citySlug(city) === slug) ?? null;
}

function formatPrice(property: SeoProperty): string {
  if (property.price === null) return "Price on request";

  const amount = new Intl.NumberFormat("en-NG", {
    currency: "NGN",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(property.price);

  switch (property.rentalMode) {
    case "ANNUAL":
      return `${amount} / year`;
    case "MONTHLY":
      return `${amount} / month`;
    case "SHORT_STAY":
      return `${amount} / night`;
    default:
      return amount;
  }
}

// === Static generation

export async function generateStaticParams(): Promise<{ city: string }[]> {
  const cities = await getRentalCities();

  return cities.map((city) => ({ city: citySlug(city) }));
}

export async function generateMetadata({
  params,
}: CityPageProps): Promise<Metadata> {
  const { city: slug } = await params;
  const city = await resolveCity(slug);

  if (!city) {
    return { title: "Area not found" };
  }

  const title = `Property for Rent in ${city}`;
  const description = `Verified apartments, flats and short lets for rent in ${city}. Every listing on Rello is checked against the property itself before it goes live.`;

  return {
    title,
    description,
    alternates: { canonical: `${siteUrl()}/rent/${slug}` },
    openGraph: {
      title,
      description,
      url: `${siteUrl()}/rent/${slug}`,
      type: "website",
    },
  };
}

// === Page

/**
 * A location page, server rendered on purpose.
 *
 * Nobody searches "real estate" and lands on a booking. They search "3 bedroom flat
 * for rent in Lekki", and this is the page that can answer that. It has to be real
 * HTML for that to work at all.
 */
export default async function CityRentalsPage({
  params,
}: CityPageProps): Promise<ReactElement> {
  const { city: slug } = await params;
  const city = await resolveCity(slug);

  if (!city) {
    notFound();
  }

  const properties = await getPropertiesInCity(city);
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Property for rent in ${city}`,
    numberOfItems: properties.length,
    itemListElement: properties.map((property, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${siteUrl()}${propertyPath(property)}`,
      name: property.title,
    })),
  };

  return (
    <main className="min-h-screen bg-[var(--color-bg)] px-5 py-16 sm:px-8 lg:px-10 lg:py-20 xl:px-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <header className="mx-auto max-w-5xl">
        <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-primary">
          Rentals
        </p>
        <h1 className="mt-4 font-display text-4xl font-bold leading-[0.92] text-primary sm:text-5xl">
          Property for rent in {city}
        </h1>
        <p className="mt-4 max-w-2xl font-body text-base leading-7 text-muted">
          {properties.length === 0
            ? `No listings in ${city} right now. New homes are added as hosts publish them.`
            : `${properties.length} verified ${properties.length === 1 ? "home" : "homes"} available in ${city}. Every listing is checked against the property itself, so what you see is what you rent.`}
        </p>
      </header>

      {properties.length > 0 ? (
        <ul className="mx-auto mt-12 grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <li key={property.id}>
              <Link
                href={propertyPath(property)}
                className="flex h-full flex-col rounded-lg bg-surface-soft p-5 shadow-sm transition-all duration-200 ease-in-out hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <h2 className="font-body text-lg font-bold text-primary">
                  {property.title}
                </h2>
                <p className="mt-1 font-body text-sm text-muted">
                  {[property.area, property.city].filter(Boolean).join(", ") ||
                    property.address}
                </p>
                <p className="mt-3 font-body text-sm text-primary">
                  {property.bedrooms} bed · {property.bathrooms} bath
                </p>
                <p className="mt-auto pt-3 font-body text-base font-bold text-primary">
                  {formatPrice(property)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </main>
  );
}

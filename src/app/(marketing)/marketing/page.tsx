import type { ReactElement } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import HowItWorks from "@/components/HowItWorks";
import Navbar from "@/components/Navbar";
import PropertyPrice from "@/components/property/PropertyPrice";
import ResilientPropertyImage from "@/components/property/ResilientPropertyImage";
import {
  citySlug,
  getFeaturedRentals,
  getRentalCities,
  propertyPath,
  siteUrl,
  type SeoProperty,
} from "@/lib/seoProperties";

interface EditorialListingProps {
  property: SeoProperty;
}

function rentalPeriodLabel(property: SeoProperty): string {
  switch (property.rentalMode) {
    case "MONTHLY":
      return "Monthly rental";
    case "SHORT_STAY":
      return "Shortlet";
    default:
      return "Annual rental";
  }
}

function EditorialListing({ property }: EditorialListingProps): ReactElement {
  const location =
    [property.area, property.city].filter(Boolean).join(", ") ||
    property.address;

  return (
    <article className="w-[84vw] shrink-0 snap-start sm:w-[23rem] md:w-[calc(50%_-_0.625rem)] lg:w-[calc(33.333%_-_1.167rem)]">
      <Link
        href={propertyPath(property)}
        aria-label={`View ${property.title}`}
        className="group block rounded-[1.5rem] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4"
      >
        <div className="relative aspect-[16/11] overflow-hidden rounded-[1.25rem] bg-surface-soft">
          <ResilientPropertyImage
            src={property.images[0]?.url}
            alt={property.title}
            fill
            sizes="(min-width: 1024px) 27rem, (min-width: 768px) 50vw, 84vw"
            className="object-cover transition-transform duration-700 ease-out motion-reduce:transition-none group-hover:scale-[1.025]"
          />
        </div>

        <div className="pt-4">
          <p className="font-body text-lg font-bold text-primary">
            <PropertyPrice
              value={property.price ?? 0}
              listingType="FOR_RENT"
              rentalMode={property.rentalMode ?? undefined}
            />
          </p>
          <h3 className="mt-1 truncate font-display text-xl font-bold leading-tight text-primary transition-colors group-hover:text-accent-alt">
            {property.title}
          </h3>
          <p className="mt-1 truncate font-body text-sm text-muted">
            {location}
          </p>
          <p className="mt-2 font-body text-sm text-muted">
            {rentalPeriodLabel(property)} · {property.bedrooms} bedrooms ·{" "}
            {property.bathrooms} bathrooms
          </p>
        </div>
      </Link>
    </article>
  );
}

export default async function MarketingLandingPage(): Promise<ReactElement> {
  const [properties, cities] = await Promise.all([
    getFeaturedRentals(6),
    getRentalCities(),
  ]);
  const cityLinks = cities
    .filter((city) => city.toLowerCase() !== "other")
    .slice(0, 4)
    .map((city) => ({
      href: `/rent/${citySlug(city)}`,
      label: `Homes in ${city}`,
    }));
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Rello",
    url: siteUrl(),
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl()}/browse?query={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
  return (
    <main className="min-h-screen bg-bg text-primary">
      <Navbar />
      <HeroSection />

      <section
        className="px-5 pb-16 pt-8 sm:px-8 sm:pb-20 sm:pt-10 lg:px-10 lg:pb-24"
        aria-labelledby="available-homes-heading"
      >
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2
                id="available-homes-heading"
                className="font-display text-3xl font-bold leading-tight text-primary sm:text-4xl"
              >
                Homes available now
              </h2>
              <p className="mt-2 font-body text-sm text-muted">
                Explore verified rentals and shortlets ready for your search.
              </p>
            </div>
            <Link
              href="/browse"
              className="inline-flex min-h-11 w-fit items-center gap-2 border-b border-primary font-body text-sm font-bold text-primary transition-colors hover:border-accent hover:text-accent-alt focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Explore every home
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>

          {properties.length > 0 ? (
            <div className="-mx-5 mt-7 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-5 sm:-mx-8 sm:px-8 md:mx-0 md:flex-wrap md:justify-center md:overflow-visible md:px-0 md:pb-0 lg:gap-7">
              {properties.map((property) => (
                <EditorialListing key={property.id} property={property} />
              ))}
            </div>
          ) : (
            <div className="mt-12 flex flex-col gap-6 border-y border-border py-10 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-display text-2xl font-bold text-primary">
                  The live preview is resting for a moment.
                </h3>
                <p className="mt-2 max-w-xl font-body text-sm leading-6 text-muted">
                  Open the full catalogue to continue looking for your next
                  home.
                </p>
              </div>
              <Link
                href="/browse"
                className="inline-flex min-h-11 w-fit items-center gap-2 border-b border-primary font-body text-sm font-bold text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Open Browse
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </div>
          )}
        </div>
      </section>

      <HowItWorks />

      <section
        id="for-hosts"
        className="scroll-mt-16 px-5 py-14 sm:px-8 sm:py-16 lg:px-10 lg:py-20"
      >
        <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[1.5rem] bg-primary lg:grid-cols-[1.1fr_0.9fr]">
          <div className="relative min-h-[18rem] sm:min-h-[24rem] lg:min-h-[26rem]">
            <Image
              src="/images/newsletter-house.jpg"
              alt="A modern home illuminated in the evening"
              fill
              sizes="(min-width: 1024px) 58vw, 100vw"
              className="object-cover object-center"
            />
            <div
              className="absolute inset-0 bg-[linear-gradient(180deg,transparent_60%,rgba(3,29,43,0.24))]"
              aria-hidden="true"
            />
          </div>
          <div className="flex flex-col justify-center p-7 text-white sm:p-10 lg:p-12">
            <p className="font-accent text-xs font-bold uppercase tracking-[0.24em] text-accent">
              For landlords and agents
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold leading-tight sm:text-4xl">
              Put your property in front of renters ready to move.
            </h2>
            <p className="mt-4 font-body text-sm leading-6 text-white/70 sm:text-base sm:leading-7">
              Publish listings, review requests, manage tenancies, and follow
              payments from one workspace.
            </p>
            <Link
              href="/register?role=LANDLORD"
              className="mt-6 inline-flex min-h-12 w-fit items-center gap-2 rounded-full bg-accent px-6 font-body text-sm font-bold text-primary transition-colors hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
            >
              List a property
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <Footer cityLinks={cityLinks} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </main>
  );
}

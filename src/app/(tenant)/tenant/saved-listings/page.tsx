import type { ReactElement } from "react";
import type { StaticImageData } from "next/image";
import {
  ArrowUpRight,
  CalendarDays,
  Heart,
  MapPin,
  SlidersHorizontal,
  Sparkles,
  Star,
} from "lucide-react";
import Image from "next/image";
import propertyOne from "../../../../../public/images/about-interior.jpg";
import propertyTwo from "../../../../../public/images/cta-house.jpg";
import propertyThree from "../../../../../public/images/newsletter-house.jpg";

interface Listing {
  title: string;
  location: string;
  price: string;
  score: string;
  image: StaticImageData;
}

const LISTINGS: Listing[] = [
  {
    title: "Maitama Courtyard",
    location: "Maitama, Abuja",
    price: "₦620,000/mo",
    score: "92%",
    image: propertyTwo,
  },
  {
    title: "Harbour View Residence",
    location: "Victoria Island, Lagos",
    price: "₦710,000/mo",
    score: "89%",
    image: propertyThree,
  },
];

export default function TenantSavedListingsPage(): ReactElement {
  return (
    <main className="min-h-screen overflow-x-hidden px-5 py-10 sm:px-8 lg:px-10 lg:py-14 xl:px-14">
      <header className="flex flex-col gap-5 pb-8 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-accent-alt">
            Discovery board
          </p>
          <h1 className="mt-4 font-display text-4xl font-bold leading-[0.92] text-primary sm:text-5xl">
            Saved Listings
          </h1>
          <p className="mt-4 max-w-2xl font-body text-base leading-7 text-muted">
            A shortlist built for comparison, not just storage. Spot the best
            match and turn it into a viewing.
          </p>
        </div>
        <button
          type="button"
          className="flex w-fit items-center gap-3 rounded-lg border border-primary bg-primary px-5 py-4 font-accent text-xs font-bold uppercase tracking-[0.16em] text-white transition-all duration-200 ease-in-out hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <SlidersHorizontal size={17} />
          Refine shortlist
        </button>
      </header>

      <section className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <article className="overflow-hidden rounded-lg bg-primary text-white shadow-sm">
            <div className="relative h-[28rem]">
              <Image
                src={propertyOne}
                alt="The Glass House"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 45vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/30 to-transparent" />
              <button
                type="button"
                aria-label="Remove The Glass House from saved listings"
                className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-accent shadow-sm"
              >
                <Heart size={19} fill="currentColor" />
              </button>
              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                <span className="rounded-full bg-accent px-3 py-2 font-accent text-xs font-bold uppercase tracking-[0.14em] text-primary">
                  Best match
                </span>
                <h2 className="mt-4 font-display text-5xl font-bold leading-[0.92]">
                  The Glass House
                </h2>
                <p className="mt-3 flex items-center gap-2 font-body text-sm text-white/70">
                  <MapPin size={15} />
                  Lekki Phase 1, Lagos
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                  <p className="font-display text-3xl font-bold text-accent">₦480,000/mo</p>
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded bg-accent px-5 py-3 font-accent text-xs font-bold uppercase tracking-[0.14em] text-primary transition-all duration-200 ease-in-out hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    Book viewing
                    <CalendarDays size={16} />
                  </button>
                </div>
              </div>
            </div>
          </article>

          <div className="grid gap-6">
            {LISTINGS.map((listing) => (
              <article key={listing.title} className="grid overflow-hidden rounded-lg border border-primary/15 bg-[var(--color-bg)] shadow-sm sm:grid-cols-[11rem_1fr]">
                <div className="relative min-h-48">
                  <Image
                    src={listing.image}
                    alt={listing.title}
                    fill
                    sizes="(max-width: 640px) 100vw, 176px"
                    className="object-cover"
                  />
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-body text-lg font-bold text-primary">{listing.title}</h3>
                      <p className="mt-2 flex items-center gap-2 font-body text-sm text-muted">
                        <MapPin size={15} className="text-accent-alt" />
                        {listing.location}
                      </p>
                    </div>
                    <span className="rounded-full bg-surface-soft px-3 py-2 font-accent text-xs font-bold uppercase tracking-[0.14em] text-primary">
                      {listing.score}
                    </span>
                  </div>
                  <div className="mt-8 flex items-center justify-between border-t border-primary/10 pt-4">
                    <p className="font-display text-2xl font-bold text-primary">{listing.price}</p>
                    <ArrowUpRight size={18} className="text-primary" />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside className="rounded-lg border border-primary/15 bg-surface-soft p-6 shadow-sm xl:self-start">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-accent">
            <Sparkles size={22} />
          </div>
          <p className="mt-5 font-accent text-xs font-bold uppercase tracking-[0.25em] text-accent-alt">
            Compare shelf
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold text-primary">
            The Glass House leads on commute and budget.
          </h2>
          <div className="mt-7 space-y-4">
            {[
              ["Match score", "96%"],
              ["Commute", "18 min"],
              ["Viewing", "Tomorrow"],
              ["Host rating", "4.9"],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between border-b border-primary/10 pb-4 last:border-b-0 last:pb-0">
                <span className="font-body text-sm text-muted">{label}</span>
                <span className="flex items-center gap-2 font-body text-sm font-bold text-primary">
                  {label === "Host rating" ? <Star size={15} className="text-accent-alt" fill="currentColor" /> : null}
                  {value}
                </span>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}

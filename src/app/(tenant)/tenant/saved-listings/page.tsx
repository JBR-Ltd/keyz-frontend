"use client";

import { useEffect, useState, type ReactElement } from "react";
import {
  ArrowUpRight,
  BedDouble,
  CalendarDays,
  Heart,
  Loader2,
  MapPin,
  Sparkles,
  Star,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import PropertyPrice from "@/components/property/PropertyPrice";
import TenantVerificationGate from "@/components/tenant/TenantVerificationGate";
import { useToast } from "@/components/ui/toast";
import {
  getSavedListings,
  removeSavedListing,
  type SavedProperty,
} from "@/lib/savedListings";
import propertyOne from "../../../../../public/images/about-interior.jpg";
import propertyTwo from "../../../../../public/images/cta-house.jpg";
import propertyThree from "../../../../../public/images/newsletter-house.jpg";

const FALLBACK_IMAGES = [propertyOne, propertyTwo, propertyThree];

function coverImage(listing: SavedProperty, index: number) {
  return listing.imageUrl ?? FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
}

export default function TenantSavedListingsPage(): ReactElement {
  const { notify } = useToast();
  const [listings, setListings] = useState<SavedProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [removingId, setRemovingId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;

    void getSavedListings().then((result) => {
      if (!active) {
        return;
      }

      setListings(result.data);
      setLoadError(result.message ?? "");
      setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const openBookingFlow = () => {
    notify({
      title: "Booking ready",
      description: "Identity verified. Booking flow can continue.",
      variant: "success",
    });
  };

  const handleRemove = async (listing: SavedProperty): Promise<void> => {
    setRemovingId(listing.id);
    const result = await removeSavedListing(listing.id);
    setRemovingId(null);

    if (!result.data) {
      notify({
        title: "Not removed",
        description: result.message ?? "Try again in a moment.",
        variant: "error",
      });
      return;
    }

    setListings((current) =>
      current.filter((item) => item.id !== listing.id),
    );
    notify({ title: "Removed from your shortlist", variant: "success" });
  };

  const [featured, ...rest] = listings;

  return (
    <main className="min-h-screen overflow-x-hidden px-5 py-10 sm:px-8 lg:px-10 lg:py-14 xl:px-14">
      <header className="flex flex-col gap-5 pb-8 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-primary">
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
        <Link
          href="/tenant/browse"
          className="flex w-fit items-center gap-3 rounded-lg bg-primary px-5 py-4 font-accent text-xs font-bold uppercase tracking-[0.16em] text-white transition-all duration-200 ease-in-out hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <Sparkles size={17} />
          Browse homes
        </Link>
      </header>

      {loadError ? (
        <p className="mb-6 font-body text-sm text-red-700">{loadError}</p>
      ) : null}

      {isLoading ? (
        <p className="py-16 text-center font-body text-sm text-muted">
          Loading your shortlist...
        </p>
      ) : listings.length === 0 ? (
        <div className="rounded-lg bg-surface-soft p-10 text-center shadow-sm">
          <Heart size={26} className="mx-auto text-primary" />
          <h2 className="mt-4 font-display text-3xl font-bold text-primary">
            Nothing saved yet
          </h2>
          <p className="mx-auto mt-3 max-w-md font-body text-base leading-7 text-muted">
            Save homes while you browse and they collect here so you can compare
            them side by side.
          </p>
          <Link
            href="/tenant/browse"
            className="mt-6 inline-flex items-center gap-2 rounded bg-primary px-5 py-3 font-accent text-xs font-bold uppercase tracking-[0.16em] text-white transition-all duration-200 ease-in-out hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Browse verified homes
            <ArrowUpRight size={16} />
          </Link>
        </div>
      ) : (
        <section className="grid gap-6 xl:grid-cols-[1fr_22rem]">
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <article className="overflow-hidden rounded-lg bg-primary text-white shadow-sm">
              <div className="relative h-[28rem]">
                <Image
                  src={coverImage(featured, 0)}
                  alt={featured.title}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 45vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/30 to-transparent" />
                <button
                  type="button"
                  onClick={() => void handleRemove(featured)}
                  disabled={removingId === featured.id}
                  aria-label={`Remove ${featured.title} from saved listings`}
                  className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-accent shadow-sm disabled:cursor-wait disabled:opacity-70"
                >
                  {removingId === featured.id ? (
                    <Loader2 size={19} className="animate-spin" />
                  ) : (
                    <Heart size={19} fill="currentColor" />
                  )}
                </button>
                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                  <span className="rounded-full bg-bg px-3 py-2 shadow-sm font-accent text-xs font-bold uppercase tracking-[0.14em] text-primary">
                    Most recent
                  </span>
                  <h2 className="mt-4 font-display text-5xl font-bold leading-[0.92]">
                    {featured.title}
                  </h2>
                  <p className="mt-3 flex items-center gap-2 font-body text-sm text-white/70">
                    <MapPin size={15} />
                    {featured.address}
                  </p>
                  <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                    <p className="font-display text-3xl font-bold text-primary">
                      <PropertyPrice value={featured.price} />
                    </p>
                    <TenantVerificationGate
                      intent="booking"
                      onVerifiedAction={openBookingFlow}
                    >
                      {(requestAction) => (
                        <button
                          type="button"
                          onClick={requestAction}
                          className="flex items-center gap-2 rounded bg-accent px-5 py-3 font-accent text-xs font-bold uppercase tracking-[0.14em] text-primary transition-all duration-200 ease-in-out hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                        >
                          Book viewing
                          <CalendarDays size={16} />
                        </button>
                      )}
                    </TenantVerificationGate>
                  </div>
                </div>
              </div>
            </article>

            <div className="grid gap-6">
              {rest.map((listing, index) => (
                <article
                  key={listing.id}
                  className="grid overflow-hidden rounded-lg bg-[var(--color-bg)] shadow-sm sm:grid-cols-[11rem_1fr]"
                >
                  <div className="relative min-h-48">
                    <Image
                      src={coverImage(listing, index + 1)}
                      alt={listing.title}
                      fill
                      sizes="(max-width: 640px) 100vw, 176px"
                      className="object-cover"
                    />
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-body text-lg font-bold text-primary">
                          {listing.title}
                        </h3>
                        <p className="mt-2 flex items-center gap-2 font-body text-sm text-muted">
                          <MapPin size={15} className="text-primary" />
                          {listing.address}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleRemove(listing)}
                        disabled={removingId === listing.id}
                        aria-label={`Remove ${listing.title} from saved listings`}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-primary transition-all duration-200 ease-in-out hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-70"
                      >
                        {removingId === listing.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Heart size={16} fill="currentColor" />
                        )}
                      </button>
                    </div>
                    <div className="mt-8 flex items-center justify-between border-t border-primary/10 pt-4">
                      <p className="font-display text-2xl font-bold text-primary">
                        <PropertyPrice value={listing.price} />
                      </p>
                      <span className="flex items-center gap-2 font-body text-sm text-muted">
                        <BedDouble size={15} className="text-primary" />
                        {listing.bedrooms}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <aside className="rounded-lg bg-surface-soft p-6 shadow-sm xl:self-start">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/5 text-accent-alt shadow-sm">
              <Sparkles size={22} />
            </div>
            <p className="mt-5 font-accent text-xs font-bold uppercase tracking-[0.25em] text-primary">
              Compare shelf
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold text-primary">
              {featured.title}
            </h2>
            <div className="mt-7 space-y-4">
              {[
                ["Bedrooms", String(featured.bedrooms)],
                ["Bathrooms", String(featured.bathrooms)],
                ["Verified", featured.verified ? "Yes" : "Not yet"],
                [
                  "Host rating",
                  featured.host?.rating
                    ? featured.host.rating.toFixed(1)
                    : "New host",
                ],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between border-b border-primary/10 pb-4 last:border-b-0 last:pb-0"
                >
                  <span className="font-body text-sm text-muted">{label}</span>
                  <span className="flex items-center gap-2 font-body text-sm font-bold text-primary">
                    {label === "Host rating" ? (
                      <Star
                        size={15}
                        className="text-primary"
                        fill="currentColor"
                      />
                    ) : null}
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </aside>
        </section>
      )}
    </main>
  );
}

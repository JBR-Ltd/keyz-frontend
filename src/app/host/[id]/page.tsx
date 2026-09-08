"use client";

import { use, useEffect, useState, type ReactElement } from "react";
import { Building2, ChevronLeft, Loader2, Star } from "lucide-react";
import Link from "next/link";
import PropertyCard from "@/components/public/PropertyCard";
import VerifiedBadge from "@/components/ui/VerifiedBadge";
import { getHostListings, getHostProfile, type HostProfile } from "@/lib/hosts";
import type { BackendProperty } from "@/lib/hostListings";

interface HostPageProps {
  params: Promise<{ id: string }>;
}

const LISTING_FALLBACK_IMAGE = "/images/cta-house.jpg";
const PAGE_SIZE = 12;

export default function HostProfilePage({
  params,
}: HostPageProps): ReactElement {
  const { id } = use(params);
  const [profile, setProfile] = useState<HostProfile | null>(null);
  const [listings, setListings] = useState<BackendProperty[]>([]);
  const [hasNext, setHasNext] = useState(false);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;

    const load = async (): Promise<void> => {
      const [profileResult, listingResult] = await Promise.all([
        getHostProfile(id),
        getHostListings(id, 0, PAGE_SIZE),
      ]);

      if (!active) {
        return;
      }

      setProfile(profileResult.data);
      setListings(listingResult.data?.items ?? []);
      setHasNext(listingResult.data?.hasNext ?? false);
      setLoadError(profileResult.message ?? "");
      setIsLoading(false);
    };

    void load();

    return () => {
      active = false;
    };
  }, [id]);

  const loadMore = async (): Promise<void> => {
    const nextPage = page + 1;
    setIsLoadingMore(true);
    const result = await getHostListings(id, nextPage, PAGE_SIZE);
    setIsLoadingMore(false);

    if (!result.data) {
      return;
    }

    setListings((current) => [...current, ...result.data!.items]);
    setHasNext(result.data.hasNext);
    setPage(nextPage);
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center px-5">
        <div className="flex items-center gap-3 font-body text-sm text-muted">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          Loading host...
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-5 text-center">
        <h1 className="font-display text-4xl font-bold text-primary">
          Host not found
        </h1>
        <p className="max-w-md font-body text-base leading-7 text-muted">
          {loadError || "This host is no longer listing on Rello."}
        </p>
        <Link
          href="/"
          className="mt-2 inline-flex items-center gap-2 rounded bg-primary px-5 py-3 font-accent text-xs font-bold uppercase tracking-[0.16em] text-white transition-all duration-200 ease-in-out hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <ChevronLeft size={16} />
          Back to Rello
        </Link>
      </main>
    );
  }

  const roleLabel = profile.role === "AGENT" ? "Agent" : "Landlord";

  return (
    <main className="min-h-screen overflow-x-hidden px-5 py-10 sm:px-8 lg:px-10 lg:py-14 xl:px-14">
      <Link
        href="/"
        className="inline-flex items-center gap-2 font-body text-sm font-medium text-muted transition-all duration-200 ease-in-out hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <ChevronLeft size={16} />
        Back to homes
      </Link>

      <header className="mt-6 rounded-lg bg-[var(--color-bg)] p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex min-w-0 items-center gap-5">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-primary font-body text-xl font-bold text-white">
              {profile.name
                .split(" ")
                .slice(0, 2)
                .map((part) => part.charAt(0))
                .join("")
                .toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="font-accent text-xs font-bold uppercase tracking-[0.25em] text-primary">
                {roleLabel}
              </p>
              <h1 className="mt-2 font-display text-4xl font-bold leading-[0.95] text-primary sm:text-5xl">
                {profile.name}
              </h1>
              {profile.identityVerified ? (
                <div className="mt-3">
                  <VerifiedBadge size="sm" />
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="rounded-lg bg-surface-soft px-5 py-4 shadow-sm">
              <p className="font-body text-xs font-medium uppercase tracking-[0.14em] text-muted">
                Listings
              </p>
              <p className="mt-2 flex items-center gap-2 font-display text-3xl font-bold text-primary">
                <Building2 size={20} className="text-accent-alt" />
                {profile.listingCount}
              </p>
            </div>
            <div className="rounded-lg bg-surface-soft px-5 py-4 shadow-sm">
              <p className="font-body text-xs font-medium uppercase tracking-[0.14em] text-muted">
                Rating
              </p>
              <p className="mt-2 flex items-center gap-2 font-display text-3xl font-bold text-primary">
                <Star size={20} className="text-accent" fill="currentColor" />
                {profile.rating && profile.reviewCount > 0
                  ? profile.rating.toFixed(1)
                  : "New"}
              </p>
            </div>
          </div>
        </div>
      </header>

      <section className="mt-10">
        <h2 className="font-display text-3xl font-bold text-primary">
          Verified homes from {profile.name.split(" ")[0]}
        </h2>
        <p className="mt-3 max-w-2xl font-body text-base leading-7 text-muted">
          Every listing here passed an on-site photo check at its address.
        </p>

        {listings.length === 0 ? (
          <p className="mt-8 rounded-lg bg-surface-soft p-8 text-center font-body text-sm text-muted shadow-sm">
            No verified listings yet.
          </p>
        ) : (
          <>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((listing) => (
                <PropertyCard
                  key={listing.id}
                  id={String(listing.id)}
                  name={listing.title}
                  location={listing.address}
                  price={listing.price}
                  listingType={
                    listing.status === "FOR_SALE" ? "FOR_SALE" : "FOR_RENT"
                  }
                  bedrooms={listing.bedrooms}
                  bathrooms={listing.bathrooms}
                  imageUrl={listing.imageUrl ?? LISTING_FALLBACK_IMAGE}
                  featured={false}
                />
              ))}
            </div>

            {hasNext ? (
              <button
                type="button"
                onClick={() => void loadMore()}
                disabled={isLoadingMore}
                className="mx-auto mt-10 flex items-center gap-2 rounded bg-primary px-6 py-4 font-accent text-xs font-bold uppercase tracking-[0.16em] text-white transition-all duration-200 ease-in-out hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-70"
              >
                {isLoadingMore ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : null}
                Show more homes
              </button>
            ) : null}
          </>
        )}
      </section>
    </main>
  );
}

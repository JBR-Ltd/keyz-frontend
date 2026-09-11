"use client";

import { use, useEffect, useState, type ReactElement } from "react";
import {
  Building2,
  ChevronLeft,
  CircleAlert,
  Loader2,
  SearchX,
  ShieldCheck,
  Star,
} from "lucide-react";
import BackButton from "@/components/navigation/BackButton";
import PropertyCard from "@/components/public/PropertyCard";
import VerifiedBadge from "@/components/ui/VerifiedBadge";
import { getHostListings, getHostProfile, type HostProfile } from "@/lib/hosts";
import type { BackendProperty } from "@/lib/hostListings";

interface HostPageProps {
  params: Promise<{ id: string }>;
}

const LISTING_FALLBACK_IMAGE = "/images/cta-house.jpg";
const PAGE_SIZE = 12;

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

function HostProfileSkeleton(): ReactElement {
  return (
    <main className="min-h-screen bg-surface-soft/40 px-5 py-8 sm:px-8 lg:px-10 lg:py-12 xl:px-14">
      <div
        className="mx-auto max-w-7xl animate-pulse"
        role="status"
        aria-label="Loading profile"
      >
        <div className="h-5 w-32 rounded-full bg-border" />
        <div className="mt-8 rounded-3xl border border-border bg-[var(--color-bg)] p-6 sm:p-8 lg:p-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="h-24 w-24 shrink-0 rounded-full bg-border sm:h-28 sm:w-28" />
            <div className="flex-1">
              <div className="h-3 w-24 rounded-full bg-border" />
              <div className="mt-4 h-10 w-56 max-w-full rounded-lg bg-border" />
              <div className="mt-4 h-7 w-56 rounded-md bg-border" />
            </div>
          </div>
          <div className="mt-8 grid grid-cols-3 gap-4 border-t border-border pt-7">
            {[0, 1, 2].map((item) => (
              <div key={item}>
                <div className="h-8 w-16 rounded-md bg-border" />
                <div className="mt-2 h-3 w-20 max-w-full rounded-full bg-border" />
              </div>
            ))}
          </div>
        </div>
        <div className="mt-10 h-9 w-48 rounded-lg bg-border" />
        <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="overflow-hidden rounded-xl border border-border"
            >
              <div className="aspect-video bg-border" />
              <div className="space-y-3 p-5">
                <div className="h-6 w-3/4 rounded bg-border" />
                <div className="h-4 w-1/2 rounded bg-border" />
                <div className="h-5 w-1/3 rounded bg-border" />
              </div>
            </div>
          ))}
        </div>
        <span className="sr-only">Loading profile</span>
      </div>
    </main>
  );
}

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
  const [listingError, setListingError] = useState("");

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
      setListingError(listingResult.data ? "" : (listingResult.message ?? ""));
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
    setListingError("");
    const result = await getHostListings(id, nextPage, PAGE_SIZE);
    setIsLoadingMore(false);

    if (!result.data) {
      setListingError(result.message ?? "More homes could not be loaded.");
      return;
    }

    setListings((current) => [...current, ...result.data!.items]);
    setHasNext(result.data.hasNext);
    setPage(nextPage);
  };

  const retryListings = async (): Promise<void> => {
    setIsLoadingMore(true);
    setListingError("");
    const result = await getHostListings(id, 0, PAGE_SIZE);
    setIsLoadingMore(false);

    if (!result.data) {
      setListingError(result.message ?? "Homes could not be loaded.");
      return;
    }

    setListings(result.data.items);
    setHasNext(result.data.hasNext);
    setPage(0);
  };

  if (isLoading) {
    return <HostProfileSkeleton />;
  }

  if (!profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-surface-soft/40 px-5 py-16 text-center">
        <div className="w-full max-w-lg rounded-3xl border border-border bg-[var(--color-bg)] px-6 py-12 shadow-sm sm:px-10">
          <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-surface-soft text-primary">
            <SearchX size={36} aria-hidden="true" />
          </span>
          <h1 className="mt-7 font-display text-4xl font-bold text-primary">
            Profile not found
          </h1>
          <p className="mx-auto mt-4 max-w-md font-body text-base leading-7 text-muted">
            {loadError || "This profile is no longer available on Rello."}
          </p>
          <BackButton
            fallbackHref="/tenant/browse"
            roleFallbacks={{
              AGENT: "/agent/dashboard",
              LANDLORD: "/landlord/dashboard",
            }}
            className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 font-body text-sm font-bold text-white transition-all duration-200 ease-in-out hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <ChevronLeft size={17} aria-hidden="true" />
            Back to homes
          </BackButton>
        </div>
      </main>
    );
  }

  const roleLabel = profile.role === "AGENT" ? "Property agent" : "Landlord";
  const firstName = profile.name.split(" ")[0] || profile.name;
  const hasRating = profile.rating !== null && profile.reviewCount > 0;
  const listingLabel =
    profile.listingCount === 1 ? "Verified home" : "Verified homes";
  const reviewLabel = profile.reviewCount === 1 ? "Review" : "Reviews";

  return (
    <main className="min-h-screen bg-surface-soft/40 px-5 py-8 sm:px-8 lg:px-10 lg:py-12 xl:px-14">
      <div className="mx-auto max-w-7xl">
        <BackButton
          fallbackHref="/tenant/browse"
          roleFallbacks={{
            AGENT: "/agent/dashboard",
            LANDLORD: "/landlord/dashboard",
          }}
          className="inline-flex min-h-11 items-center gap-2 rounded-full px-1 font-body text-sm font-semibold text-muted transition-colors duration-200 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <ChevronLeft size={17} aria-hidden="true" />
          Back to homes
        </BackButton>

        <header className="mt-6 rounded-3xl border border-border bg-[var(--color-bg)] p-6 shadow-sm sm:p-8 lg:p-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="relative w-fit shrink-0">
              <span className="flex h-24 w-24 items-center justify-center rounded-full bg-primary font-display text-3xl font-bold text-white ring-4 ring-accent/25 ring-offset-4 ring-offset-[var(--color-bg)] sm:h-28 sm:w-28 sm:text-4xl">
                {getInitials(profile.name)}
              </span>
              {profile.identityVerified ? (
                <span className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border-4 border-[var(--color-bg)] bg-accent text-primary">
                  <ShieldCheck size={18} strokeWidth={2.5} aria-hidden="true" />
                  <span className="sr-only">Identity verified</span>
                </span>
              ) : null}
            </div>

            <div className="min-w-0 flex-1">
              <p className="font-accent text-xs font-bold uppercase tracking-[0.22em] text-accent-alt">
                {roleLabel}
              </p>
              <h1 className="mt-2 break-words font-display text-4xl font-bold leading-tight text-primary sm:text-5xl">
                {profile.name}
              </h1>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                {profile.identityVerified ? (
                  <>
                    <VerifiedBadge size="md" />
                    <span className="font-body text-sm text-muted">
                      Identity verified by Rello
                    </span>
                  </>
                ) : (
                  <span className="inline-flex items-center gap-2 rounded-full bg-surface-soft px-3 py-1.5 font-body text-xs font-semibold text-muted">
                    Verification not completed
                  </span>
                )}
              </div>
            </div>
          </div>

          <p className="mt-8 max-w-2xl border-t border-border pt-7 font-body text-base leading-7 text-muted">
            {firstName} is a {roleLabel.toLowerCase()} with{" "}
            {profile.listingCount}{" "}
            {profile.listingCount === 1 ? "home" : "homes"} currently verified
            and available to explore on Rello.
          </p>

          <dl className="mt-8 grid grid-cols-3 divide-x divide-border rounded-2xl bg-surface-soft px-2 py-5 sm:px-4">
            <div className="px-2 text-center sm:px-4">
              <dt className="mt-2 font-body text-xs font-medium text-muted">
                Rating
              </dt>
              <dd className="flex items-center justify-center gap-1.5 font-display text-2xl font-bold text-primary sm:text-3xl">
                {hasRating ? (
                  <>
                    <Star
                      size={18}
                      className="fill-accent text-accent"
                      aria-hidden="true"
                    />
                    {profile.rating!.toFixed(1)}
                  </>
                ) : (
                  "New"
                )}
              </dd>
            </div>
            <div className="px-2 text-center sm:px-4">
              <dt className="mt-2 font-body text-xs font-medium text-muted">
                {reviewLabel}
              </dt>
              <dd className="font-display text-2xl font-bold text-primary sm:text-3xl">
                {profile.reviewCount}
              </dd>
            </div>
            <div className="px-2 text-center sm:px-4">
              <dt className="mt-2 font-body text-xs font-medium text-muted">
                {listingLabel}
              </dt>
              <dd className="font-display text-2xl font-bold text-primary sm:text-3xl">
                {profile.listingCount}
              </dd>
            </div>
          </dl>
        </header>

        <section className="mt-10" aria-labelledby="host-listings-heading">
          <div className="flex flex-col gap-3 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-accent text-xs font-bold uppercase tracking-[0.22em] text-accent-alt">
                Portfolio
              </p>
              <h2
                id="host-listings-heading"
                className="mt-2 font-display text-3xl font-bold text-primary sm:text-4xl"
              >
                Homes from {firstName}
              </h2>
            </div>
            {listings.length > 0 ? (
              <p className="font-body text-sm font-medium text-muted">
                {profile.listingCount} verified{" "}
                {profile.listingCount === 1 ? "listing" : "listings"}
              </p>
            ) : null}
          </div>

          {listingError && listings.length === 0 ? (
            <div className="mt-8 flex flex-col items-center rounded-3xl border border-border bg-[var(--color-bg)] px-6 py-12 text-center shadow-sm">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-soft text-primary">
                <CircleAlert size={30} aria-hidden="true" />
              </span>
              <h3 className="mt-5 font-display text-2xl font-bold text-primary">
                Homes could not be loaded
              </h3>
              <p className="mt-2 max-w-md font-body text-sm leading-6 text-muted">
                {listingError}
              </p>
              <button
                type="button"
                onClick={() => void retryListings()}
                disabled={isLoadingMore}
                className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-primary px-5 py-2.5 font-body text-sm font-bold text-primary transition-all duration-200 ease-in-out hover:bg-primary hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-70"
              >
                {isLoadingMore ? (
                  <Loader2
                    size={16}
                    className="animate-spin"
                    aria-hidden="true"
                  />
                ) : null}
                Try again
              </button>
            </div>
          ) : listings.length === 0 ? (
            <div className="mt-8 flex flex-col items-center rounded-3xl border border-dashed border-border px-6 py-14 text-center">
              <Building2
                size={64}
                strokeWidth={1.35}
                className="text-accent-alt"
                aria-hidden="true"
              />
              <h3 className="mt-5 font-display text-2xl font-bold text-primary">
                No verified homes yet
              </h3>
              <p className="mt-2 max-w-md font-body text-sm leading-6 text-muted">
                Verified homes from this {roleLabel.toLowerCase()} will appear
                here when they become available.
              </p>
            </div>
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
                    verified
                  />
                ))}
              </div>

              {listingError ? (
                <p
                  className="mt-6 text-center font-body text-sm text-accent-alt"
                  role="alert"
                >
                  {listingError}
                </p>
              ) : null}

              {hasNext ? (
                <button
                  type="button"
                  onClick={() => void loadMore()}
                  disabled={isLoadingMore}
                  className="mx-auto mt-10 flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 font-body text-sm font-bold text-white transition-all duration-200 ease-in-out hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-70"
                >
                  {isLoadingMore ? (
                    <Loader2
                      size={16}
                      className="animate-spin"
                      aria-hidden="true"
                    />
                  ) : null}
                  {isLoadingMore ? "Loading homes" : "Show more homes"}
                </button>
              ) : null}
            </>
          )}
        </section>
      </div>
    </main>
  );
}

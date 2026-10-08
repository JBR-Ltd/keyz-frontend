"use client";

import { use, useEffect, useRef, useState, type ReactElement } from "react";
import {
  Building2,
  ChevronLeft,
  CircleAlert,
  Loader2,
  SearchX,
  Star,
} from "lucide-react";
import BackButton from "@/components/navigation/BackButton";
import PropertyCard from "@/components/public/PropertyCard";
import { useRouter } from "next/navigation";
import { canonicalSegment } from "@/lib/publicIds";
import VerifiedBadge from "@/components/ui/VerifiedBadge";
import UserAvatar from "@/components/ui/user-avatar";
import ReportDialog from "@/components/reports/ReportDialog";
import { getHostListings, getHostProfile, type HostProfile } from "@/lib/hosts";
import type { BackendProperty } from "@/lib/hostListings";
import { Skeleton } from "@/components/ui/skeleton";

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

function getPublicLocation(listing: BackendProperty): string {
  const location = [listing.area, listing.city]
    .filter((part): part is string => Boolean(part?.trim()))
    .join(", ");

  return location || "Location available on request";
}

function getListingGridClass(listingCount: number): string {
  if (listingCount === 1) return "max-w-xl grid-cols-1";
  if (listingCount === 2) return "max-w-5xl sm:grid-cols-2";
  return "sm:grid-cols-2 lg:grid-cols-3";
}

function ListingGridSkeleton(): ReactElement {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="overflow-hidden rounded-xl border border-border"
        >
          <Skeleton className="aspect-video rounded-none" />
          <div className="space-y-3 p-5">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-5 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

function HostProfileSkeleton(): ReactElement {
  return (
    <main className="min-h-screen bg-bg px-5 pb-7 pt-4 sm:px-8 sm:pt-5 lg:px-10 lg:pb-9 lg:pt-5 xl:px-14">
      <div
        className="mx-auto max-w-7xl"
        role="status"
        aria-label="Loading profile"
      >
        <Skeleton className="h-5 w-32" />
        <div className="mt-5 flex flex-col gap-6 border-b border-border pb-10 sm:flex-row sm:items-center">
          <Skeleton className="h-24 w-24 shrink-0 rounded-full sm:h-28 sm:w-28" />
          <div className="flex-1">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-4 h-10 w-64 max-w-full" />
            <Skeleton className="mt-4 h-6 w-32" />
            <div className="mt-7 flex gap-8">
              <div>
                <Skeleton className="h-7 w-20" />
                <Skeleton className="mt-2 h-3 w-24" />
              </div>
              <div>
                <Skeleton className="h-7 w-20" />
                <Skeleton className="mt-2 h-3 w-24" />
              </div>
            </div>
          </div>
        </div>
        <Skeleton className="mt-10 h-9 w-48" />
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
  const router = useRouter();
  const [profile, setProfile] = useState<HostProfile | null>(null);
  const [isReporting, setIsReporting] = useState(false);
  const [listings, setListings] = useState<BackendProperty[]>([]);
  const [hasNext, setHasNext] = useState(false);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isListingsLoading, setIsListingsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [listingError, setListingError] = useState("");
  const requestGeneration = useRef(0);
  const paginationGeneration = useRef<number | null>(null);

  useEffect(() => {
    let active = true;
    const generation = ++requestGeneration.current;
    paginationGeneration.current = null;

    const load = async (): Promise<void> => {
      setIsLoading(true);
      const profileResult = await getHostProfile(id);

      if (!active) {
        return;
      }

      setProfile(profileResult.data);

      // A numeric link or an outdated name moves to the canonical profile address
      const loaded = profileResult.data;

      if (loaded?.publicId) {
        const canonical = canonicalSegment(loaded);

        if (canonical !== id) {
          router.replace(`/host/${canonical}`, { scroll: false });
        }
      }
      setLoadError(profileResult.message ?? "");
      setIsLoading(false);
    };

    const loadListings = async (): Promise<void> => {
      setIsListingsLoading(true);
      setIsLoadingMore(false);
      const result = await getHostListings(id, 0, PAGE_SIZE);

      if (!active) return;

      setListings(result.data?.items ?? []);
      setHasNext(result.data?.hasNext ?? false);
      setPage(0);
      setListingError(result.data ? "" : (result.message ?? ""));
      setIsListingsLoading(false);
    };

    void load();
    void loadListings();

    return () => {
      active = false;
      requestGeneration.current = generation + 1;
    };
  }, [id, router]);

  const loadMore = async (): Promise<void> => {
    if (isListingsLoading || !hasNext || paginationGeneration.current !== null)
      return;
    const generation = requestGeneration.current;
    paginationGeneration.current = generation;
    const nextPage = page + 1;
    setIsLoadingMore(true);
    setListingError("");
    const result = await getHostListings(id, nextPage, PAGE_SIZE);
    if (requestGeneration.current !== generation) return;
    paginationGeneration.current = null;
    setIsLoadingMore(false);

    if (!result.data) {
      setListingError(result.message ?? "More homes could not be loaded.");
      return;
    }

    const { items } = result.data;
    setListings((current) => [...current, ...items]);
    setHasNext(result.data.hasNext);
    setPage(nextPage);
  };

  const retryListings = async (): Promise<void> => {
    if (isListingsLoading || paginationGeneration.current !== null) return;
    const generation = requestGeneration.current;
    paginationGeneration.current = generation;
    setIsLoadingMore(true);
    setListingError("");
    const result = await getHostListings(id, 0, PAGE_SIZE);
    if (requestGeneration.current !== generation) return;
    paginationGeneration.current = null;
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
      <main className="flex min-h-screen items-center justify-center bg-bg px-5 py-12 text-center">
        <div className="w-full max-w-lg">
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
              ADMIN: "/admin/dashboard",
              AGENT: "/agent/dashboard",
              LANDLORD: "/landlord/dashboard",
              TENANT: "/tenant/browse",
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
  const profileSummary =
    profile.role === "AGENT"
      ? `Explore verified homes represented by ${firstName} on Rello.`
      : `Explore ${firstName}'s verified homes available on Rello.`;

  return (
    <main className="min-h-screen bg-bg px-5 pb-7 pt-4 sm:px-8 sm:pt-5 lg:px-10 lg:pb-9 lg:pt-5 xl:px-14">
      <div className="mx-auto max-w-7xl">
        <BackButton
          fallbackHref="/tenant/browse"
          roleFallbacks={{
            ADMIN: "/admin/dashboard",
            AGENT: "/agent/dashboard",
            LANDLORD: "/landlord/dashboard",
            TENANT: "/tenant/browse",
          }}
          className="inline-flex min-h-11 items-center gap-2 rounded-full px-1 font-body text-sm font-semibold text-muted transition-colors duration-200 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <ChevronLeft size={17} aria-hidden="true" />
          Back to homes
        </BackButton>

        <header className="mt-4 border-b border-border pb-10 sm:mt-5">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
            <UserAvatar
              avatarUrl={profile.avatarUrl}
              initials={getInitials(profile.name)}
              className="h-24 w-24 font-display text-3xl sm:h-28 sm:w-28 sm:text-4xl"
              sizes="112px"
            />

            <div className="min-w-0 flex-1">
              <p className="font-accent text-xs font-bold uppercase tracking-[0.22em] text-accent-alt">
                {roleLabel}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <h1 className="break-words font-display text-4xl font-bold leading-tight text-primary sm:text-5xl">
                  {profile.name}
                </h1>
                {profile.identityVerified ? (
                  <VerifiedBadge size="md" />
                ) : (
                  <span className="inline-flex items-center gap-2 rounded-full bg-surface-soft px-3 py-1.5 font-body text-xs font-semibold text-muted">
                    Verification not completed
                  </span>
                )}
              </div>

              <p className="mt-4 max-w-2xl font-body text-base leading-7 text-muted">
                {profileSummary}
              </p>

              <dl className="mt-7 flex flex-wrap items-center gap-x-8 gap-y-4">
                <div>
                  <dt className="font-body text-xs font-medium text-muted">
                    Reputation
                  </dt>
                  <dd className="mt-1 flex items-center gap-2 font-body text-sm font-bold text-primary">
                    {hasRating && profile.rating !== null ? (
                      <>
                        <Star
                          size={16}
                          className="fill-accent text-accent"
                          aria-hidden="true"
                        />
                        <span>{profile.rating.toFixed(1)}</span>
                        <span className="font-medium text-muted">
                          {profile.reviewCount}{" "}
                          {profile.reviewCount === 1 ? "review" : "reviews"}
                        </span>
                      </>
                    ) : (
                      "No reviews yet"
                    )}
                  </dd>
                </div>
                <div className="h-10 w-px bg-border" aria-hidden="true" />
                <div>
                  <dt className="font-body text-xs font-medium text-muted">
                    Portfolio
                  </dt>
                  <dd className="mt-1 font-body text-sm font-bold text-primary">
                    {profile.listingCount} verified{" "}
                    {profile.listingCount === 1 ? "home" : "homes"}
                  </dd>
                </div>
              </dl>

              <button
                type="button"
                onClick={() => setIsReporting(true)}
                className="mt-7 inline-flex min-h-11 items-center rounded-lg px-1 font-body text-xs font-semibold text-muted underline-offset-4 hover:text-red-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Report this host
              </button>
              <ReportDialog
                open={isReporting}
                onClose={() => setIsReporting(false)}
                target={{
                  type: "USER",
                  userId: profile.publicId ?? String(profile.id),
                }}
              />
            </div>
          </div>
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
                Available homes
              </h2>
            </div>
            {listings.length > 0 ? (
              <p className="font-body text-sm font-medium text-muted">
                {profile.listingCount} verified{" "}
                {profile.listingCount === 1 ? "listing" : "listings"}
              </p>
            ) : null}
          </div>

          {isListingsLoading ? (
            <div className="mt-8" role="status" aria-label="Loading host homes">
              <ListingGridSkeleton />
            </div>
          ) : listingError && listings.length === 0 ? (
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
              <div
                className={`mt-8 grid gap-6 ${getListingGridClass(listings.length)}`}
              >
                {listings.map((listing) => (
                  <PropertyCard
                    key={listing.id}
                    id={String(listing.id)}
                    publicId={listing.publicId}
                    slug={listing.slug}
                    name={listing.title}
                    location={getPublicLocation(listing)}
                    price={listing.price}
                    rentalMode={listing.rentalMode}
                    listingType={
                      listing.status === "FOR_SALE" ? "FOR_SALE" : "FOR_RENT"
                    }
                    bedrooms={listing.bedrooms}
                    bathrooms={listing.bathrooms}
                    imageUrl={listing.imageUrl ?? LISTING_FALLBACK_IMAGE}
                    featured={false}
                    verified
                    availableUnitCount={listing.availableUnitCount}
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

"use client";

import type { ReactElement } from "react";
import { Clock3, Home, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import PropertyPrice from "@/components/property/PropertyPrice";
import {
  getHostListings,
  type HostListingRecord,
  type HostListingReviewStatus,
  type HostListingRole,
  subscribeToHostListings,
} from "@/lib/hostListings";

interface HostListingsViewProps {
  role: HostListingRole;
}

interface ListingStatusStyle {
  label: string;
  className: string;
}

const STATUS_STYLES: Record<HostListingReviewStatus, ListingStatusStyle> = {
  DRAFT: {
    label: "Draft",
    className: "border border-primary/20 bg-surface-soft text-primary",
  },
  PENDING_VERIFICATION: {
    label: "Pending Verification",
    className: "border border-accent bg-surface-soft text-primary",
  },
  VERIFIED: {
    label: "Verified",
    className: "bg-primary text-white",
  },
  REJECTED: {
    label: "Rejected",
    className: "border border-red-700 bg-bg text-red-700",
  },
};

function getListingCompletion(listing: HostListingRecord): number {
  const requirements = [
    Boolean(listing.title.trim()),
    Boolean(listing.description.trim()),
    listing.price > 0,
    Boolean(listing.city),
    Boolean(listing.area.trim()),
    listing.bedrooms > 0,
    listing.bathrooms > 0,
    listing.photos.length > 0,
  ];
  const completed = requirements.filter(Boolean).length;

  return Math.round((completed / requirements.length) * 100);
}

function formatUpdatedAt(value: string): string {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function HostListingsView({
  role,
}: HostListingsViewProps): ReactElement {
  const [listings, setListings] = useState<HostListingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [storageUnavailable, setStorageUnavailable] = useState(false);
  const [loadError, setLoadError] = useState("");
  const createHref = `/${role}/listings/create`;

  useEffect(() => {
    let active = true;

    const loadListings = async (): Promise<void> => {
      const result = await getHostListings(role);

      if (!active) {
        return;
      }

      setListings(result.data);
      setStorageUnavailable(result.unavailable);
      setLoadError(result.message ?? "");
      setLoading(false);
    };

    void loadListings();
    const unsubscribe = subscribeToHostListings(() => void loadListings());

    return () => {
      active = false;
      unsubscribe();
    };
  }, [role]);

  return (
    <main className="min-h-screen overflow-x-hidden px-5 py-12 sm:px-8 lg:px-10 lg:py-16 xl:px-14">
      <header
        className={`flex gap-6 pb-10 ${
          role === "agent"
            ? "justify-end"
            : "flex-col sm:flex-row sm:items-end sm:justify-between"
        }`}
      >
        {role === "landlord" ? (
          <div>
            <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-primary">
              Property workspace
            </p>
            <h1 className="mt-4 font-display text-4xl font-bold leading-[0.92] text-primary sm:text-5xl">
              My Listings
            </h1>
            <p className="mt-4 max-w-2xl font-body text-base leading-7 text-muted">
              Create listings and track their verification status from one
              place.
            </p>
          </div>
        ) : null}
        <Link
          href={createHref}
          className="inline-flex min-h-12 w-fit items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 font-body text-sm font-bold text-primary transition-all duration-200 ease-in-out hover:bg-primary hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <Plus size={18} aria-hidden="true" />
          Create Listing
        </Link>
      </header>

      {storageUnavailable || loadError ? (
        <p className="mb-6 rounded-lg border border-red-500/40 bg-bg px-4 py-3 font-body text-sm font-bold text-red-700">
          {loadError ||
            "Local listing storage is unavailable in this browser session."}
        </p>
      ) : null}

      {loading ? (
        <section
          className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
          aria-label="Loading listings"
        >
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="h-80 animate-pulse rounded-lg border border-border bg-surface-soft"
            />
          ))}
        </section>
      ) : listings.length === 0 ? (
        <section className="flex min-h-[28rem] flex-col items-center justify-center rounded-xl border border-border bg-bg px-6 py-16 text-center shadow-sm">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-soft text-muted">
            <Home size={28} aria-hidden="true" />
          </span>
          <h2 className="mt-5 font-display text-3xl font-bold text-primary">
            No listings yet
          </h2>
          <p className="mt-3 max-w-md font-body text-sm leading-6 text-muted">
            Add your first property to start the verification process.
          </p>
          <Link
            href={createHref}
            className="mt-8 inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-accent px-8 py-4 font-body text-base font-bold text-primary transition-all duration-200 ease-in-out hover:bg-primary hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <Plus size={20} aria-hidden="true" />
            Create Your First Listing
          </Link>
        </section>
      ) : (
        <section
          className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
          aria-label="Your listings"
        >
          {listings.map((listing) => {
            const status = STATUS_STYLES[listing.reviewStatus];
            const coverPhoto = listing.photos[0];

            if (listing.reviewStatus === "DRAFT") {
              const completion = getListingCompletion(listing);

              return (
                <article
                  key={listing.id}
                  className="overflow-hidden rounded-lg border border-dashed border-primary/30 bg-surface-soft shadow-sm"
                >
                  <div className="relative aspect-[16/7] overflow-hidden border-b border-dashed border-primary/20">
                    {coverPhoto ? (
                      <Image
                        src={coverPhoto.dataUrl}
                        alt={listing.title || "Draft property"}
                        fill
                        unoptimized
                        sizes="(min-width: 1280px) 30vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover opacity-70"
                      />
                    ) : (
                      <span className="flex h-full items-center justify-center text-muted">
                        <Home size={28} aria-hidden="true" />
                      </span>
                    )}
                    <span className="absolute left-3 top-3 rounded-full border border-primary/20 bg-bg px-3 py-1.5 font-body text-xs font-bold text-primary shadow-sm">
                      Draft
                    </span>
                  </div>

                  <div className="p-5">
                    <p className="font-body text-xs font-medium uppercase tracking-wide text-muted">
                      Private workspace
                    </p>
                    <h2 className="mt-2 truncate font-body text-lg font-bold text-primary">
                      {listing.title || "Untitled listing"}
                    </h2>
                    <p className="mt-1 truncate font-body text-sm text-muted">
                      {[listing.area, listing.city]
                        .filter(Boolean)
                        .join(", ") || "Location not added"}
                    </p>

                    <div className="mt-5">
                      <div className="flex items-center justify-between gap-4">
                        <p className="font-body text-xs font-medium text-primary">
                          {completion}% complete
                        </p>
                        <p className="font-body text-xs text-muted">
                          Not visible to renters
                        </p>
                      </div>
                      <div
                        className="mt-2 h-2 overflow-hidden rounded-full border border-primary/15 bg-bg"
                        role="progressbar"
                        aria-label={`Draft listing ${completion}% complete`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={completion}
                      >
                        <span
                          className="block h-full rounded-full bg-accent transition-[width] duration-300 ease-in-out"
                          style={{ width: `${completion}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-5 flex flex-col gap-4 border-t border-primary/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <p className="flex items-center gap-2 font-body text-xs text-muted">
                        <Clock3 size={14} aria-hidden="true" />
                        Updated {formatUpdatedAt(listing.updatedAt)}
                      </p>
                      <Link
                        href={`${createHref}?draft=${listing.id}`}
                        className="inline-flex min-h-10 items-center justify-center rounded-full border border-primary/20 bg-bg px-4 py-2 font-body text-xs font-bold text-primary shadow-sm transition-colors hover:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      >
                        Continue editing
                      </Link>
                    </div>
                  </div>
                </article>
              );
            }

            return (
              <article
                key={listing.id}
                className="group overflow-hidden rounded-lg border border-border bg-bg shadow-sm transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:shadow-md"
              >
                <Link
                  href={`/property/${listing.id}`}
                  className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <div className="relative aspect-video overflow-hidden bg-surface-soft">
                    {coverPhoto ? (
                      <Image
                        src={coverPhoto.dataUrl}
                        alt={listing.title}
                        fill
                        unoptimized
                        sizes="(min-width: 1280px) 30vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover transition-all duration-200 ease-in-out group-hover:scale-[1.02]"
                      />
                    ) : (
                      <span className="flex h-full items-center justify-center text-muted">
                        <Home size={28} aria-hidden="true" />
                      </span>
                    )}
                    <span
                      className={`absolute left-3 top-3 rounded-full px-3 py-1.5 font-body text-xs font-bold ${status.className}`}
                    >
                      {status.label}
                    </span>
                  </div>
                  <div className="p-5">
                    <h2 className="truncate font-body text-lg font-bold text-primary">
                      {listing.title}
                    </h2>
                    <p className="mt-2 truncate font-body text-sm text-muted">
                      {listing.area}, {listing.city}
                    </p>
                    <p className="mt-4 font-display text-2xl font-bold text-primary">
                      <PropertyPrice
                        value={listing.price}
                        listingType={listing.listingType}
                      />
                    </p>
                  </div>
                </Link>
                <div className="border-t border-border px-5 py-4">
                  <Link
                    href={`${createHref}?draft=${listing.id}`}
                    className="inline-flex min-h-10 items-center justify-center rounded-full border border-primary/20 px-4 py-2 font-body text-xs font-bold text-primary transition-colors hover:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    Edit listing
                  </Link>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}

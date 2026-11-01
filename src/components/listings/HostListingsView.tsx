"use client";

import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Ellipsis,
  Eye,
  Home,
  Plus,
  Search,
  ShieldQuestion,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import PropertyPrice from "@/components/property/PropertyPrice";
import {
  StatusBadge,
  type StatusBadgeProps,
} from "@/components/ui/status-badge";
import {
  getHostListings,
  type HostListingRecord,
  type HostListingRole,
  type HostListingWorkflowStatus,
  subscribeToHostListings,
} from "@/lib/hostListings";
import { propertyPath } from "@/lib/publicIds";

interface HostListingsViewProps {
  role: HostListingRole;
}

interface ListingStatusStyle {
  description: string;
  icon: LucideIcon;
  label: string;
  tone: NonNullable<StatusBadgeProps["tone"]>;
}

type ListingFilter = "ALL" | "DRAFT" | "NEEDS_ACTION" | "UNDER_REVIEW" | "LIVE";

interface FilterOption {
  id: ListingFilter;
  label: string;
}

const FILTERS: FilterOption[] = [
  { id: "ALL", label: "All" },
  { id: "DRAFT", label: "Drafts" },
  { id: "NEEDS_ACTION", label: "Needs action" },
  { id: "UNDER_REVIEW", label: "Under review" },
  { id: "LIVE", label: "Live" },
];

const STATUS_STYLES: Record<HostListingWorkflowStatus, ListingStatusStyle> = {
  DRAFT: {
    description: "Private until you publish it.",
    icon: Clock3,
    label: "Draft",
    tone: "neutral",
  },
  READY_TO_VERIFY: {
    description: "Verify the property to make it visible to renters.",
    icon: ShieldQuestion,
    label: "Ready to verify",
    tone: "accent",
  },
  UNDER_REVIEW: {
    description: "The property evidence is being reviewed.",
    icon: Clock3,
    label: "Under review",
    tone: "primary",
  },
  NEEDS_CHANGES: {
    description: "Review the feedback and submit new evidence.",
    icon: CircleAlert,
    label: "Needs changes",
    tone: "danger",
  },
  LIVE: {
    description: "Visible to renters on Rello.",
    icon: CheckCircle2,
    label: "Live",
    tone: "primary",
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

  return Math.round(
    (requirements.filter(Boolean).length / requirements.length) * 100,
  );
}

function formatUpdatedAt(value: string): string {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function matchesFilter(
  status: HostListingWorkflowStatus,
  filter: ListingFilter,
): boolean {
  if (filter === "ALL") return true;
  if (filter === "DRAFT") return status === "DRAFT";
  if (filter === "UNDER_REVIEW") return status === "UNDER_REVIEW";
  if (filter === "LIVE") return status === "LIVE";

  return status === "READY_TO_VERIFY" || status === "NEEDS_CHANGES";
}

function availableUnitsLabel(listing: HostListingRecord): string {
  const available = listing.availableUnitCount ?? listing.unitCount;

  if (available === 0) return "No units available";
  if (listing.unitCount === 1) return "1 unit available";

  return `${available} of ${listing.unitCount} units available`;
}

function listingHref(
  listing: HostListingRecord,
  role: HostListingRole,
): string {
  return listing.reviewStatus === "DRAFT"
    ? `/${role}/listings/create?draft=${listing.id}`
    : `/${role}/listings/${listing.id}`;
}

function actionDetails(
  listing: HostListingRecord,
  role: HostListingRole,
): { href: string; label: string } {
  const manageHref = `/${role}/listings/${listing.id}`;
  const verifyHref = `${manageHref}/verify`;

  switch (listing.reviewStatus) {
    case "DRAFT":
      return {
        href: `/${role}/listings/create?draft=${listing.id}`,
        label: "Continue listing",
      };
    case "READY_TO_VERIFY":
      return { href: verifyHref, label: "Verify property" };
    case "UNDER_REVIEW":
      return { href: verifyHref, label: "View verification status" };
    case "NEEDS_CHANGES":
      return { href: verifyHref, label: "Review and resubmit" };
    case "LIVE":
      return { href: manageHref, label: "Manage listing" };
  }
}

function ListingActionsMenu({
  listing,
  role,
}: {
  listing: HostListingRecord;
  role: HostListingRole;
}): ReactElement {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = `listing-actions-${listing.id.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  useEffect(() => {
    if (!open) return;

    const closeOutside = (event: PointerEvent): void => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const closeWithEscape = (event: KeyboardEvent): void => {
      if (event.key !== "Escape") return;

      setOpen(false);
      buttonRef.current?.focus();
    };

    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeWithEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeWithEscape);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-controls={menuId}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`More actions for ${listing.title}`}
        onClick={() => setOpen((current) => !current)}
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-soft hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <Ellipsis size={20} aria-hidden="true" />
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute bottom-full right-0 z-20 mb-2 min-w-56 overflow-hidden rounded-lg border border-border bg-bg py-2 shadow-lg"
        >
          <Link
            role="menuitem"
            href={`/${role}/listings/create?draft=${listing.id}`}
            onClick={() => setOpen(false)}
            className="flex min-h-11 items-center px-4 font-body text-sm font-medium text-primary hover:bg-surface-soft focus:bg-surface-soft focus:outline-none"
          >
            Edit listing details
          </Link>
          <Link
            role="menuitem"
            href={`/${role}/listings/${listing.id}`}
            onClick={() => setOpen(false)}
            className="flex min-h-11 items-center px-4 font-body text-sm font-medium text-primary hover:bg-surface-soft focus:bg-surface-soft focus:outline-none"
          >
            Manage photos and availability
          </Link>
        </div>
      ) : null}
    </div>
  );
}

export default function HostListingsView({
  role,
}: HostListingsViewProps): ReactElement {
  const [listings, setListings] = useState<HostListingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [activeFilter, setActiveFilter] = useState<ListingFilter>("ALL");
  const [query, setQuery] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const createHref = `/${role}/listings/create`;

  useEffect(() => {
    let active = true;
    let generation = 0;

    const loadListings = async (): Promise<void> => {
      const requestGeneration = ++generation;
      setLoading(true);
      const result = await getHostListings(role);

      if (!active || generation !== requestGeneration) return;

      setListings(result.data);
      setLoadError(result.message ?? "");
      setLoading(false);
    };

    void loadListings();
    const unsubscribe = subscribeToHostListings(() => void loadListings());

    return () => {
      active = false;
      unsubscribe();
    };
  }, [reloadKey, role]);

  const filterCounts = useMemo(
    () =>
      Object.fromEntries(
        FILTERS.map((filter) => [
          filter.id,
          listings.filter((listing) =>
            matchesFilter(listing.reviewStatus, filter.id),
          ).length,
        ]),
      ) as Record<ListingFilter, number>,
    [listings],
  );

  const visibleListings = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return listings.filter((listing) => {
      if (!matchesFilter(listing.reviewStatus, activeFilter)) return false;
      if (!normalizedQuery) return true;

      return [listing.title, listing.area, listing.city, listing.address]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [activeFilter, listings, query]);

  const clearFilters = (): void => {
    setActiveFilter("ALL");
    setQuery("");
  };

  return (
    <main className="min-h-screen overflow-x-hidden px-5 py-8 sm:px-8 lg:px-10 lg:py-10 xl:px-14">
      <div className="mx-auto max-w-[1440px]">
        <header className="flex flex-col gap-5 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-4xl font-bold leading-none text-primary">
                My Listings
              </h1>
              {!loading ? (
                <span className="inline-flex min-h-7 items-center rounded-full bg-surface-soft px-3 font-body text-xs font-bold text-muted">
                  {listings.length}{" "}
                  {listings.length === 1 ? "listing" : "listings"}
                </span>
              ) : null}
            </div>
            <p className="mt-2 font-body text-sm leading-6 text-muted sm:text-base">
              Manage your properties, verification, and availability.
            </p>
          </div>
          <Link
            href={createHref}
            className="inline-flex min-h-12 w-fit items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 font-body text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <Plus size={18} aria-hidden="true" />
            Create listing
          </Link>
        </header>

        {!loading && listings.length > 0 ? (
          <section
            aria-label="Filter listings"
            className="mb-7 flex flex-col gap-4 border-y border-border py-4 lg:flex-row lg:items-center lg:justify-between"
          >
            <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 lg:pb-0">
              {FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  aria-pressed={activeFilter === filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 font-body text-sm font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                    activeFilter === filter.id
                      ? "bg-primary text-white"
                      : "text-muted hover:bg-surface-soft hover:text-primary"
                  }`}
                >
                  {filter.label}
                  <span
                    className={`text-xs ${
                      activeFilter === filter.id
                        ? "text-white/75"
                        : "text-muted"
                    }`}
                  >
                    {filterCounts[filter.id]}
                  </span>
                </button>
              ))}
            </div>

            <div className="relative w-full lg:w-80">
              <label htmlFor="listing-search" className="sr-only">
                Search listings by title or location
              </label>
              <Search
                size={17}
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                id="listing-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search title or location"
                className="min-h-12 w-full rounded-full border border-border bg-bg py-3 pl-11 pr-11 font-body text-sm text-primary outline-none transition-colors placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-accent/40 [&::-webkit-search-cancel-button]:appearance-none"
              />
              {query ? (
                <button
                  type="button"
                  aria-label="Clear listing search"
                  onClick={() => setQuery("")}
                  className="absolute right-1 top-1/2 inline-flex min-h-10 min-w-10 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <X size={17} aria-hidden="true" />
                </button>
              ) : null}
            </div>
          </section>
        ) : null}

        {loadError ? (
          <div
            role="alert"
            className="mb-6 flex flex-col gap-3 border-l-2 border-red-700 pl-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <p className="font-body text-sm text-red-700">{loadError}</p>
            <button
              type="button"
              onClick={() => setReloadKey((current) => current + 1)}
              className="inline-flex min-h-11 w-fit items-center justify-center rounded-full border border-primary/20 px-5 font-body text-sm font-bold text-primary hover:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Try again
            </button>
          </div>
        ) : null}

        {loading ? (
          <section
            className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3"
            aria-label="Loading listings"
            aria-busy="true"
          >
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="overflow-hidden rounded-xl border border-primary/10 bg-bg shadow-sm motion-safe:animate-pulse motion-reduce:animate-none"
                aria-hidden="true"
              >
                <div className="relative aspect-video bg-skeleton-strong">
                  <div className="absolute left-3 top-3 h-7 w-20 rounded-full bg-bg/70" />
                </div>
                <div className="p-5">
                  <div className="h-5 w-2/3 rounded-full bg-skeleton-strong" />
                  <div className="mt-3 h-4 w-1/2 rounded-full bg-skeleton" />
                  <div className="mt-5 flex items-end justify-between gap-4">
                    <div className="h-8 w-2/5 rounded-lg bg-skeleton-strong" />
                    <div className="h-4 w-1/4 rounded-full bg-skeleton" />
                  </div>
                  <div className="mt-5 border-t border-border pt-4">
                    <div className="h-4 w-24 rounded-full bg-skeleton-strong" />
                    <div className="mt-3 h-3 w-full rounded-full bg-skeleton" />
                    <div className="mt-2 h-3 w-3/4 rounded-full bg-skeleton" />
                  </div>
                </div>
                <div className="flex min-h-16 items-center gap-2 border-t border-border px-4 py-2.5">
                  <div className="h-11 flex-1 rounded-full bg-skeleton-strong" />
                  <div className="h-11 w-11 rounded-full bg-skeleton" />
                </div>
              </div>
            ))}
          </section>
        ) : listings.length === 0 && loadError ? null : listings.length ===
          0 ? (
          <section className="flex min-h-[24rem] flex-col items-center justify-center px-6 py-14 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-soft text-primary">
              <Home size={28} aria-hidden="true" />
            </span>
            <h2 className="mt-5 font-display text-3xl font-bold text-primary">
              Create your first listing
            </h2>
            <p className="mt-3 max-w-md font-body text-sm leading-6 text-muted">
              Add a home, publish its details, and complete property
              verification when you are ready.
            </p>
            <Link
              href={createHref}
              className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-accent px-7 py-3 font-body text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <Plus size={18} aria-hidden="true" />
              Create listing
            </Link>
          </section>
        ) : visibleListings.length === 0 ? (
          <section className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
            <Search size={32} aria-hidden="true" className="text-primary" />
            <h2 className="mt-4 font-display text-2xl font-bold text-primary">
              No listings found
            </h2>
            <p className="mt-2 font-body text-sm text-muted">
              Try another title or location, or view all listing states.
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full border border-primary/20 px-5 font-body text-sm font-bold text-primary hover:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Clear filters
            </button>
          </section>
        ) : (
          <section
            className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3"
            aria-label="Your listings"
          >
            {visibleListings.map((listing) => {
              const status = STATUS_STYLES[listing.reviewStatus];
              const StatusIcon = status.icon;
              const coverPhoto = listing.photos[0];
              const primaryAction = actionDetails(listing, role);
              const manageHref = listingHref(listing, role);
              const isDraft = listing.reviewStatus === "DRAFT";
              const completion = isDraft ? getListingCompletion(listing) : null;
              const statusDescription =
                listing.reviewStatus === "NEEDS_CHANGES" &&
                listing.verificationRejectionReason
                  ? listing.verificationRejectionReason
                  : status.description;

              return (
                <article
                  key={listing.id}
                  className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-bg shadow-sm transition-[border-color,box-shadow,transform] duration-200 motion-reduce:transition-none sm:hover:-translate-y-0.5 sm:hover:border-primary/25 sm:hover:shadow-md"
                >
                  <Link
                    href={manageHref}
                    aria-label={`Manage ${listing.title || "untitled listing"}`}
                    className="flex flex-1 flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
                  >
                    <div className="relative aspect-video overflow-hidden bg-surface-soft">
                      {coverPhoto ? (
                        <Image
                          src={coverPhoto.dataUrl}
                          alt={listing.title || "Property listing"}
                          fill
                          unoptimized
                          sizes="(min-width: 1280px) 30vw, (min-width: 640px) 50vw, 100vw"
                          className={`object-cover transition-transform duration-200 motion-reduce:transition-none sm:group-hover:scale-[1.02] ${
                            isDraft ? "opacity-80" : ""
                          }`}
                        />
                      ) : (
                        <span className="flex h-full items-center justify-center text-muted">
                          <Home size={30} aria-hidden="true" />
                        </span>
                      )}
                      <StatusBadge
                        tone={status.tone}
                        icon={<StatusIcon size={14} aria-hidden="true" />}
                        className="absolute left-3 top-3 bg-bg/95 backdrop-blur-sm"
                      >
                        {status.label}
                      </StatusBadge>
                    </div>

                    <div className="flex flex-1 flex-col p-5">
                      <h2 className="truncate font-body text-lg font-bold text-primary">
                        {listing.title || "Untitled listing"}
                      </h2>
                      <p className="mt-1 truncate font-body text-sm text-muted">
                        {[listing.area, listing.city]
                          .filter(Boolean)
                          .join(", ") || "Location not added"}
                      </p>

                      <div className="mt-4 flex items-end justify-between gap-4">
                        <p className="font-display text-2xl font-bold leading-none text-primary">
                          {listing.price > 0 ? (
                            <PropertyPrice
                              value={listing.price}
                              listingType={listing.listingType}
                              rentalMode={listing.rentalMode}
                            />
                          ) : (
                            <span className="font-body text-base">
                              Price not set
                            </span>
                          )}
                        </p>
                        {!isDraft ? (
                          <p className="text-right font-body text-xs font-medium text-muted">
                            {availableUnitsLabel(listing)}
                          </p>
                        ) : null}
                      </div>

                      {isDraft && completion !== null ? (
                        <div className="mt-5">
                          <div className="flex items-center justify-between gap-4">
                            <p className="font-body text-xs font-bold text-primary">
                              {completion}% complete
                            </p>
                            {listing.updatedAt ? (
                              <p className="font-body text-xs text-muted">
                                Updated {formatUpdatedAt(listing.updatedAt)}
                              </p>
                            ) : null}
                          </div>
                          <div
                            className="mt-2 h-1.5 overflow-hidden rounded-full bg-primary/10"
                            role="progressbar"
                            aria-label={`Draft listing ${completion}% complete`}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={completion}
                          >
                            <span
                              className="block h-full rounded-full bg-accent"
                              style={{ width: `${completion}%` }}
                            />
                          </div>
                        </div>
                      ) : null}

                      <div className="mt-5 border-t border-border pt-4">
                        <p className="font-body text-xs font-bold text-primary">
                          {status.label}
                        </p>
                        <p className="mt-1 line-clamp-2 font-body text-xs leading-5 text-muted">
                          {statusDescription}
                        </p>
                      </div>
                    </div>
                  </Link>

                  <div className="flex min-h-16 flex-wrap items-center gap-2 border-t border-border px-4 py-2.5">
                    <Link
                      href={primaryAction.href}
                      className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-primary px-4 font-body text-xs font-bold text-white transition-colors hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      {primaryAction.label}
                      <ArrowRight size={15} aria-hidden="true" />
                    </Link>

                    {listing.reviewStatus === "LIVE" ? (
                      <Link
                        href={propertyPath(listing)}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-primary/15 px-4 font-body text-xs font-bold text-primary transition-colors hover:border-accent hover:bg-surface-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      >
                        <Eye size={18} aria-hidden="true" />
                        View live listing
                      </Link>
                    ) : null}

                    {!isDraft ? (
                      <ListingActionsMenu listing={listing} role={role} />
                    ) : null}
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}

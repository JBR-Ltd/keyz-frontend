"use client";

import { useEffect, useState, type ReactElement } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { MapPin, Search, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import PropertyCard from "@/components/public/PropertyCard";
import OverlayPortal from "@/components/ui/OverlayPortal";
import { Select, type SelectOption } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { TENANT_ACTIVITIES, TENANT_STATUS_TONES } from "@/lib/tenantActivity";
import { getProperties, type PropertyDetail } from "@/lib/propertyDetails";
import { useDialogFocus } from "@/lib/useDialogFocus";

const PROPERTY_TYPE_OPTIONS: SelectOption[] = [
  { label: "Apartment", value: "apartment" },
  { label: "Duplex", value: "duplex" },
  { label: "Studio", value: "studio" },
  { label: "Shortlet", value: "shortlet" },
];

const activeActivities = TENANT_ACTIVITIES.filter(
  (activity) =>
    activity.status === "Escrow Held" ||
    activity.status === "Upcoming" ||
    activity.status === "Pending",
);
const visibleActivities = activeActivities.slice(0, 3);
const remainingActivityCount =
  activeActivities.length - visibleActivities.length;

const filterChips = [
  { label: "Price Range", active: true },
  { label: "Bedrooms", active: false },
  { label: "City", active: false },
];

function getMobileSearchSummary(): string {
  return "Where are you looking?";
}

export default function TenantBrowsePage(): ReactElement {
  const reduceMotion = useReducedMotion();
  const [isSearchSheetOpen, setIsSearchSheetOpen] = useState(false);
  const [properties, setProperties] = useState<PropertyDetail[]>([]);
  const [propertiesLoading, setPropertiesLoading] = useState(true);
  const [propertyError, setPropertyError] = useState("");
  const dialogRef = useDialogFocus<HTMLDivElement>(isSearchSheetOpen);
  const [activeSheetChips, setActiveSheetChips] = useState<string[]>([
    "Price Range",
  ]);
  const mobileSearchSummary = getMobileSearchSummary();

  useEffect(() => {
    let active = true;

    const loadProperties = async (): Promise<void> => {
      setPropertiesLoading(true);
      setPropertyError("");

      const result = await getProperties("rent");

      if (!active) {
        return;
      }

      setProperties(result.data);
      setPropertyError(result.message ?? "");
      setPropertiesLoading(false);
    };

    void loadProperties();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isSearchSheetOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setIsSearchSheetOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSearchSheetOpen]);

  const toggleSheetChip = (label: string): void => {
    setActiveSheetChips((current) =>
      current.includes(label)
        ? current.filter((activeLabel) => activeLabel !== label)
        : [...current, label],
    );
  };

  return (
    <main className="min-h-screen overflow-x-hidden px-5 py-12 sm:px-8 lg:px-10 lg:py-16 xl:px-14">
      <header className="pb-10">
        <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-primary">
          Find your next home
        </p>
        <h1 className="mt-4 font-display text-4xl font-bold leading-[0.92] text-primary sm:text-5xl">
          Browse Listings
        </h1>
      </header>

      <section aria-label="Search listings">
        <div className="hidden md:block">
          <div className="flex h-16 w-full items-center overflow-hidden rounded-full bg-bg shadow-sm">
            <label className="flex min-w-0 flex-1 items-center gap-3 px-6 transition-all duration-200 ease-in-out focus-within:text-primary">
              <MapPin
                className="shrink-0 text-muted"
                size={19}
                aria-hidden="true"
              />
              <span className="sr-only">Location</span>
              <input
                type="text"
                placeholder="Where are you looking?"
                className="min-w-0 flex-1 bg-transparent font-body text-sm text-primary outline-none placeholder:text-muted"
              />
            </label>

            <span className="h-8 w-px self-center bg-border" />

            <label className="flex h-full items-center gap-3 px-6">
              <span className="sr-only">Property type</span>
              <Select
                ariaLabel="Property type"
                placeholder="Any type"
                className="min-w-32 bg-transparent font-body text-sm font-bold text-primary outline-none"
                options={PROPERTY_TYPE_OPTIONS}
              />
            </label>

            <span className="h-8 w-px self-center bg-border" />

            <button
              type="button"
              className="mr-2 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-primary transition-all duration-200 ease-in-out hover:scale-[1.05] hover:bg-primary hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-label="Search listings"
            >
              <Search size={19} aria-hidden="true" />
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {filterChips.map((chip) => (
              <button
                key={chip.label}
                type="button"
                className={`rounded-full px-4 py-1.5 font-body text-sm font-medium transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  chip.active
                    ? "bg-accent/10 text-primary shadow-sm"
                    : "bg-bg text-muted shadow-sm hover:text-primary"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        <div className="md:hidden">
          <div className="flex h-14 w-full items-center justify-between rounded-full bg-bg px-5 shadow-sm">
            <button
              type="button"
              onClick={() => setIsSearchSheetOpen(true)}
              className="flex min-w-0 flex-1 items-center gap-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-label="Open search filters"
            >
              <MapPin
                size={18}
                className="shrink-0 text-muted"
                aria-hidden="true"
              />
              <span className="truncate font-body text-sm font-bold text-primary">
                {mobileSearchSummary}
              </span>
            </button>
            <button
              type="button"
              className="ml-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-primary transition-all duration-200 ease-in-out hover:bg-primary hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-label="Search listings"
            >
              <Search size={17} aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      {activeActivities.length > 0 ? (
        <section className="mt-8" aria-labelledby="tenant-activity-heading">
          <div className="mb-3 flex items-center justify-between gap-4">
            <h2
              id="tenant-activity-heading"
              className="font-body text-xs font-bold uppercase tracking-[0.18em] text-muted"
            >
              Your Activity
            </h2>
            {remainingActivityCount > 0 ? (
              <Link
                href="/tenant/bookings"
                className="font-body text-xs font-bold text-primary transition-all duration-200 ease-in-out hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                +{remainingActivityCount} more
              </Link>
            ) : null}
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            {visibleActivities.map((activity) => (
              <Link
                key={`${activity.activityType}-${activity.title}`}
                href="/tenant/bookings"
                className="group grid min-w-0 grid-cols-[4.5rem_1fr_auto] items-center gap-3 rounded-lg bg-[var(--color-bg)] p-3 shadow-sm transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:bg-surface-soft hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <span className="relative h-16 overflow-hidden rounded-lg bg-surface-soft">
                  <Image
                    src={activity.image}
                    alt={activity.title}
                    fill
                    sizes="72px"
                    className="object-cover transition-all duration-200 ease-in-out group-hover:scale-[1.03]"
                  />
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-body text-sm font-bold text-primary">
                    {activity.title}
                  </span>
                  <StatusBadge
                    tone={TENANT_STATUS_TONES[activity.status]}
                    size="sm"
                    className="mt-2"
                  >
                    {activity.status}
                  </StatusBadge>
                </span>
                <span className="font-body text-sm font-bold text-primary transition-all duration-200 ease-in-out group-hover:text-primary">
                  View
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-10" aria-labelledby="property-feed-heading">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-accent text-xs font-bold uppercase tracking-[0.25em] text-primary">
              Verified homes
            </p>
            <h2
              id="property-feed-heading"
              className="mt-2 font-display text-3xl font-bold text-primary"
            >
              Available Listings
            </h2>
          </div>
          <p className="font-body text-sm text-muted">
            {propertiesLoading
              ? "Loading homes..."
              : `${properties.length} homes shown`}
          </p>
        </div>

        {propertyError ? (
          <p className="mb-5 rounded-lg border border-red-500/30 bg-bg px-4 py-3 font-body text-sm font-bold text-red-700">
            {propertyError}
          </p>
        ) : null}

        {propertiesLoading ? (
          <div
            className="grid gap-6 md:grid-cols-2 xl:grid-cols-3"
            aria-label="Loading properties"
          >
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="h-80 animate-pulse rounded-xl bg-surface-soft"
              />
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {properties.map((property) => (
              <PropertyCard
                key={property.id}
                id={property.id}
                name={property.title}
                location={[property.location.area, property.location.city]
                  .filter(Boolean)
                  .join(", ")}
                price={property.price}
                listingType={property.status}
                bedrooms={property.bedrooms}
                bathrooms={property.bathrooms}
                imageUrl={property.images[0]}
                featured={false}
              />
            ))}
          </div>
        )}
      </section>
      <OverlayPortal>
        <AnimatePresence>
          {isSearchSheetOpen ? (
            <>
              <motion.div
                className="fixed inset-0 z-[100] bg-black/40 md:hidden"
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={reduceMotion ? undefined : { opacity: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                onClick={() => setIsSearchSheetOpen(false)}
              />
              <motion.div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-label="Search listings"
                className="fixed inset-x-0 bottom-0 z-[110] flex max-h-[90vh] flex-col rounded-t-xl bg-bg shadow-xl md:hidden"
                initial={reduceMotion ? false : { y: "100%" }}
                animate={reduceMotion ? undefined : { y: 0 }}
                exit={reduceMotion ? undefined : { y: "100%" }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                onClick={(event) => event.stopPropagation()}
              >
                <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-border" />
                <div className="flex items-center justify-between border-b border-border px-5 py-4">
                  <h2 className="font-display text-xl font-bold text-primary">
                    Search
                  </h2>
                  <button
                    type="button"
                    onClick={() => setIsSearchSheetOpen(false)}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition-all duration-200 ease-in-out hover:bg-primary/10 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    aria-label="Close search"
                  >
                    <X size={18} aria-hidden="true" />
                  </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
                  <div className="space-y-5">
                    <label className="block">
                      <span className="mb-2 block font-body text-xs font-bold uppercase tracking-[0.14em] text-muted">
                        Location
                      </span>
                      <div className="flex items-center gap-3 rounded bg-bg px-4 py-4 shadow-sm focus-within:ring-2 focus-within:ring-accent">
                        <MapPin
                          size={18}
                          className="text-muted"
                          aria-hidden="true"
                        />
                        <input
                          type="text"
                          placeholder="Where are you looking?"
                          className="min-w-0 flex-1 bg-transparent font-body text-base text-primary outline-none placeholder:text-muted"
                        />
                      </div>
                    </label>

                    <label className="block">
                      <span className="mb-2 block font-body text-xs font-bold uppercase tracking-[0.14em] text-muted">
                        Type
                      </span>
                      <div className="flex items-center gap-3 rounded bg-bg px-4 py-4 shadow-sm focus-within:ring-2 focus-within:ring-accent">
                        <Select
                          ariaLabel="Property type"
                          placeholder="Any type"
                          className="min-w-0 flex-1 bg-transparent font-body text-base font-bold text-primary outline-none"
                          options={PROPERTY_TYPE_OPTIONS}
                        />
                      </div>
                    </label>

                    <div>
                      <p className="mb-2 font-body text-xs font-bold uppercase tracking-[0.14em] text-muted">
                        Refine
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {filterChips.map((chip) => {
                          const isActive = activeSheetChips.includes(
                            chip.label,
                          );

                          return (
                            <button
                              key={chip.label}
                              type="button"
                              onClick={() => toggleSheetChip(chip.label)}
                              className={`rounded-full px-4 py-1.5 font-body text-sm font-medium transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                                isActive
                                  ? "bg-accent/10 text-primary shadow-sm"
                                  : "bg-bg text-muted shadow-sm hover:text-primary"
                              }`}
                            >
                              {chip.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="sticky bottom-0 border-t border-border bg-bg px-5 py-4">
                  <button
                    type="button"
                    onClick={() => setIsSearchSheetOpen(false)}
                    className="flex w-full items-center justify-center rounded-full bg-accent px-6 py-4 font-body text-sm font-bold text-primary transition-all duration-200 ease-in-out hover:bg-primary hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    Search
                  </button>
                </div>
              </motion.div>
            </>
          ) : null}
        </AnimatePresence>
      </OverlayPortal>
    </main>
  );
}

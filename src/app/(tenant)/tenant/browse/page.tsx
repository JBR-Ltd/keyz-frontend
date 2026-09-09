"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactElement,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Loader2, MapPin, RotateCcw, Search, SearchX, X } from "lucide-react";
import PropertyCard from "@/components/public/PropertyCard";
import OverlayPortal from "@/components/ui/OverlayPortal";
import { Select, type SelectOption } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import { getRentalCities, type ListingSearch } from "@/lib/hostListings";
import { getProperties, type PropertyDetail } from "@/lib/propertyDetails";
import {
  getSavedListings,
  removeSavedListing,
  saveListing,
} from "@/lib/savedListings";
import { publishTenantHeaderSearch } from "@/lib/tenantHeaderSearch";
import { useDialogFocus } from "@/lib/useDialogFocus";

// === Types

type BedroomFilter = "all" | "1" | "2" | "3" | "4";
type PriceFilter =
  | "all"
  | "under-100000"
  | "100000-250000"
  | "250000-500000"
  | "over-500000";
type SortOption = "recommended" | "price-low" | "price-high" | "bedrooms";

/**
 * Which kind of stay the searcher is after.
 *
 * Someone looking for a home and someone looking for a weekend want different
 * results from the same supply, so this filters rather than merely relabels.
 */
type StayMode = "all" | "long" | "short";

interface AppliedFilter {
  id: string;
  label: string;
  remove: () => void;
}

// === Constants

const PAGE_SIZE = 12;

const STAY_MODES: { hint: string; id: StayMode; label: string }[] = [
  { hint: "Everything available", id: "all", label: "All stays" },
  { hint: "Rented by the month or year", id: "long", label: "Homes to rent" },
  { hint: "Booked by the night", id: "short", label: "Shortlets" },
];

const BEDROOM_OPTIONS: SelectOption[] = [
  { label: "Any bedrooms", value: "all" },
  { label: "1+ bedrooms", value: "1" },
  { label: "2+ bedrooms", value: "2" },
  { label: "3+ bedrooms", value: "3" },
  { label: "4+ bedrooms", value: "4" },
];

const PRICE_OPTIONS: SelectOption[] = [
  { label: "Any monthly price", value: "all" },
  { label: "Under ₦100,000", value: "under-100000" },
  { label: "₦100,000 to ₦250,000", value: "100000-250000" },
  { label: "₦250,000 to ₦500,000", value: "250000-500000" },
  { label: "Above ₦500,000", value: "over-500000" },
];

const SORT_OPTIONS: SelectOption[] = [
  { label: "Recommended", value: "recommended" },
  { label: "Lowest price", value: "price-low" },
  { label: "Highest price", value: "price-high" },
  { label: "Most bedrooms", value: "bedrooms" },
];

// === Helpers

/** The price bands the menu offers, as the bounds the query takes. */
const PRICE_BOUNDS: Record<PriceFilter, [number | undefined, number | undefined]> = {
  all: [undefined, undefined],
  "under-100000": [undefined, 100000],
  "100000-250000": [100000, 250000],
  "250000-500000": [250000, 500000],
  "over-500000": [500000, undefined],
};

/** What the server calls each ordering. Recommended is its default, so it sends none. */
const SORT_PARAMS: Record<SortOption, string | undefined> = {
  recommended: undefined,
  "price-low": "PRICE_ASC",
  "price-high": "PRICE_DESC",
  bedrooms: "BEDROOMS",
};

function getOptionLabel(options: SelectOption[], value: string): string {
  return options.find((option) => option.value === value)?.label ?? value;
}

// === Component

export default function TenantBrowsePage(): ReactElement {
  const reduceMotion = useReducedMotion();
  const { notify } = useToast();
  const [isSearchSheetOpen, setIsSearchSheetOpen] = useState(false);
  const [properties, setProperties] = useState<PropertyDetail[]>([]);
  const [propertiesLoading, setPropertiesLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [propertyError, setPropertyError] = useState("");
  const [hasNext, setHasNext] = useState(false);
  const [page, setPage] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [retryKey, setRetryKey] = useState(0);
  const [queryInput, setQueryInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [city, setCity] = useState("all");
  const [priceFilter, setPriceFilter] = useState<PriceFilter>("all");
  const [bedroomFilter, setBedroomFilter] = useState<BedroomFilter>("all");
  const [sort, setSort] = useState<SortOption>("recommended");
  const [stayMode, setStayMode] = useState<StayMode>("all");
  const [savedIds, setSavedIds] = useState<Set<string>>(() => new Set());
  const [savingIds, setSavingIds] = useState<Set<string>>(() => new Set());
  const [isHeaderSearchVisible, setIsHeaderSearchVisible] = useState(false);
  const desktopSearchRef = useRef<HTMLFormElement>(null);
  const dialogRef = useDialogFocus<HTMLDivElement>(isSearchSheetOpen);
  const [serverCities, setServerCities] = useState<string[]>([]);

  /**
     The filters as the server takes them. Everything except the shortlet toggle is
     applied in the query now, so a match on page nine is still a match.
   */
  const search = useMemo<ListingSearch>(() => {
    const [minPrice, maxPrice] = PRICE_BOUNDS[priceFilter];

    return {
      query: searchQuery.trim() || undefined,
      city: city === "all" ? undefined : city,
      minPrice,
      maxPrice,
      minBedrooms: bedroomFilter === "all" ? undefined : Number(bedroomFilter),
      sort: SORT_PARAMS[sort],
    };
  }, [bedroomFilter, city, priceFilter, searchQuery, sort]);

  useEffect(() => {
    let active = true;

    void getRentalCities().then((cities) => {
      if (active) {
        setServerCities(cities);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadProperties = async (): Promise<void> => {
      setPropertiesLoading(true);
      setPropertyError("");

      const [propertyResult, savedResult] = await Promise.all([
        getProperties("rent", 0, PAGE_SIZE, search),
        getSavedListings(),
      ]);

      if (!active) return;

      setProperties(propertyResult.data);
      setHasNext(propertyResult.hasNext);
      setTotalItems(propertyResult.totalItems);
      setPropertyError(propertyResult.message ?? "");
      setSavedIds(new Set(savedResult.data.map((listing) => String(listing.id))));
      setPage(0);
      setPropertiesLoading(false);
    };

    void loadProperties();

    return () => {
      active = false;
    };
  }, [retryKey, search]);

  useEffect(() => {
    if (!isSearchSheetOpen) return;

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") setIsSearchSheetOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSearchSheetOpen]);

  useEffect(() => {
    const search = desktopSearchRef.current;

    if (!search) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const shouldShow =
          !entry.isIntersecting && entry.boundingClientRect.bottom <= 80;

        setIsHeaderSearchVisible(shouldShow);
        publishTenantHeaderSearch(shouldShow);
      },
      { rootMargin: "-80px 0px 0px", threshold: 0 },
    );

    observer.observe(search);

    return () => {
      observer.disconnect();
      publishTenantHeaderSearch(false);
    };
  }, []);

  const cityOptions = useMemo<SelectOption[]>(() => {
    // From the catalogue rather than the loaded page, or filtering by a city would
    // only ever offer the cities already on screen
    const cities =
      serverCities.length > 0
        ? [...serverCities]
        : Array.from(
            new Set(properties.map((property) => property.location.city).filter(Boolean)),
          ).sort((left, right) => left.localeCompare(right));

    return [
      { label: "Any city", value: "all" },
      ...cities.map((value) => ({ label: value, value })),
    ];
  }, [properties, serverCities]);

  /**
     Searching, filtering and ordering all happen in the query now. What is left
     here is the stay length toggle: a shortlet price is per night and a tenancy
     price is per year, so the two cannot be filtered by the same number.
   */
  const visibleProperties = useMemo(
    () =>
      properties.filter((property) => {
        const isShortlet = property.rentalMode === "SHORT_STAY";

        if (stayMode === "short") {
          return isShortlet;
        }

        if (stayMode === "long") {
          return !isShortlet;
        }

        return true;
      }),
    [properties, stayMode],
  );

  const appliedFilters = useMemo<AppliedFilter[]>(() => {
    const filters: AppliedFilter[] = [];

    if (searchQuery) {
      filters.push({
        id: "location",
        label: searchQuery,
        remove: () => {
          setQueryInput("");
          setSearchQuery("");
        },
      });
    }

    if (city !== "all") {
      filters.push({ id: "city", label: city, remove: () => setCity("all") });
    }

    if (priceFilter !== "all") {
      filters.push({
        id: "price",
        label: getOptionLabel(PRICE_OPTIONS, priceFilter),
        remove: () => setPriceFilter("all"),
      });
    }

    if (bedroomFilter !== "all") {
      filters.push({
        id: "bedrooms",
        label: getOptionLabel(BEDROOM_OPTIONS, bedroomFilter),
        remove: () => setBedroomFilter("all"),
      });
    }

    return filters;
  }, [bedroomFilter, city, priceFilter, searchQuery]);

  const clearFilters = (): void => {
    setQueryInput("");
    setSearchQuery("");
    setCity("all");
    setPriceFilter("all");
    setBedroomFilter("all");
    setSort("recommended");
  };

  const submitSearch = (event?: FormEvent): void => {
    event?.preventDefault();
    setSearchQuery(queryInput.trim());
    setIsSearchSheetOpen(false);
  };

  const loadMore = async (): Promise<void> => {
    const nextPage = page + 1;
    setIsLoadingMore(true);
    setPropertyError("");
    const result = await getProperties("rent", nextPage, PAGE_SIZE, search);
    setIsLoadingMore(false);

    if (result.message) {
      setPropertyError(result.message);
      return;
    }

    setProperties((current) => {
      const knownIds = new Set(current.map((property) => property.id));
      return [
        ...current,
        ...result.data.filter((property) => !knownIds.has(property.id)),
      ];
    });
    setHasNext(result.hasNext);
    setTotalItems(result.totalItems);
    setPage(nextPage);
  };

  const toggleSavedListing = async (property: PropertyDetail): Promise<void> => {
    const propertyId = Number(property.id);

    if (!Number.isInteger(propertyId)) {
      notify({
        title: "Unable to save this home",
        description: "This listing does not have a server ID yet.",
        variant: "error",
      });
      return;
    }

    const isSaved = savedIds.has(property.id);
    setSavingIds((current) => new Set(current).add(property.id));
    const result = isSaved
      ? await removeSavedListing(propertyId)
      : await saveListing(propertyId);
    setSavingIds((current) => {
      const next = new Set(current);
      next.delete(property.id);
      return next;
    });

    if (!result.data) {
      notify({
        title: isSaved ? "Home not removed" : "Home not saved",
        description: result.message ?? "Try again in a moment.",
        variant: "error",
      });
      return;
    }

    setSavedIds((current) => {
      const next = new Set(current);
      if (isSaved) next.delete(property.id);
      else next.add(property.id);
      return next;
    });
    notify({
      title: isSaved ? "Removed from saved homes" : "Added to saved homes",
      variant: "success",
    });
  };

  const mobileSearchSummary =
    appliedFilters.length > 0
      ? `${appliedFilters.length} filter${appliedFilters.length === 1 ? "" : "s"} applied`
      : "Where are you looking?";
  const resultLabel = propertiesLoading
    ? "Loading homes..."
    : appliedFilters.length > 0
      ? `${visibleProperties.length} matching homes`
      : `${totalItems || properties.length} homes available`;

  return (
    <main className="min-h-screen overflow-x-hidden px-5 pb-12 pt-8 sm:px-8 lg:px-10 lg:pb-16 lg:pt-10 xl:px-14">
      <section aria-label="Search and filter listings">
        <div className="mx-auto hidden max-w-5xl md:block">
          <form
            ref={desktopSearchRef}
            onSubmit={submitSearch}
            className="flex h-16 w-full items-center overflow-hidden rounded-full bg-bg shadow-sm"
          >
            <label className="flex min-w-0 flex-1 items-center gap-3 px-6 focus-within:text-primary">
              <MapPin className="shrink-0 text-muted" size={19} aria-hidden="true" />
              <span className="sr-only">Search by location or property name</span>
              <input
                type="search"
                value={queryInput}
                onChange={(event) => setQueryInput(event.target.value)}
                placeholder="Search by city, area, or property"
                className="min-w-0 flex-1 bg-transparent font-body text-sm text-primary outline-none placeholder:text-muted"
              />
            </label>
            <span className="h-8 w-px bg-border" />
            <div className="w-48 px-5">
              <Select
                ariaLabel="Sort listings"
                value={sort}
                onValueChange={(value) => setSort(value as SortOption)}
                options={SORT_OPTIONS}
                className="font-body text-sm font-bold"
              />
            </div>
            <span className="h-8 w-px bg-border" />
            <button
              type="submit"
              className="mr-2 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-primary transition-all duration-200 ease-in-out hover:scale-105 hover:bg-primary hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-label="Search listings"
            >
              <Search size={19} aria-hidden="true" />
            </button>
          </form>

          <div
            className="mt-4 flex flex-wrap gap-1 rounded-full bg-bg p-1 shadow-sm sm:w-fit"
            role="tablist"
            aria-label="Kind of stay"
          >
            {STAY_MODES.map((mode) => {
              const active = stayMode === mode.id;

              return (
                <button
                  key={mode.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  title={mode.hint}
                  onClick={() => {
                    setStayMode(mode.id);
                    setPage(0);
                  }}
                  className={`min-h-10 rounded-full px-4 font-body text-sm font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                    active
                      ? "bg-primary text-white"
                      : "text-muted hover:bg-primary/5 hover:text-primary"
                  }`}
                >
                  {mode.label}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <div className="min-w-40 rounded-full bg-bg px-4 py-2 shadow-sm">
              <Select
                ariaLabel="Filter by city"
                value={city}
                onValueChange={setCity}
                options={cityOptions}
                className="text-sm"
              />
            </div>
            <div className="min-w-52 rounded-full bg-bg px-4 py-2 shadow-sm">
              <Select
                ariaLabel="Filter by price"
                value={priceFilter}
                onValueChange={(value) => setPriceFilter(value as PriceFilter)}
                options={PRICE_OPTIONS}
                className="text-sm"
              />
            </div>
            <div className="min-w-44 rounded-full bg-bg px-4 py-2 shadow-sm">
              <Select
                ariaLabel="Filter by bedrooms"
                value={bedroomFilter}
                onValueChange={(value) => setBedroomFilter(value as BedroomFilter)}
                options={BEDROOM_OPTIONS}
                className="text-sm"
              />
            </div>
          </div>
        </div>

        <div className="md:hidden">
          <button
            type="button"
            onClick={() => setIsSearchSheetOpen(true)}
            className="flex h-14 w-full items-center justify-between rounded-full bg-bg px-5 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label="Open search filters"
          >
            <span className="flex min-w-0 items-center gap-3">
              <MapPin size={18} className="shrink-0 text-muted" aria-hidden="true" />
              <span className="truncate font-body text-sm font-bold text-primary">
                {mobileSearchSummary}
              </span>
            </span>
            <Search size={17} className="shrink-0 text-primary" aria-hidden="true" />
          </button>
        </div>

        {appliedFilters.length > 0 ? (
          <div className="mt-4 flex flex-wrap items-center gap-2" aria-label="Applied filters">
            {appliedFilters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={filter.remove}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-2 font-body text-xs font-bold text-white transition-colors hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {filter.label}
                <X size={13} aria-hidden="true" />
              </button>
            ))}
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 px-2 py-2 font-body text-xs font-bold text-muted hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <RotateCcw size={13} aria-hidden="true" />
              Clear all
            </button>
          </div>
        ) : null}
      </section>

      <AnimatePresence initial={false}>
        {isHeaderSearchVisible ? (
          <motion.div
            key="tenant-header-search"
            className="pointer-events-none fixed inset-x-0 top-4 z-[60] hidden justify-center lg:flex"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.94 }}
            animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <form
                  onSubmit={submitSearch}
              className="pointer-events-auto flex h-12 w-[min(36rem,42vw)] items-center overflow-hidden rounded-full border border-border bg-bg shadow-sm"
            >
              <label className="flex min-w-0 flex-1 items-center gap-2.5 px-5 focus-within:text-primary">
                <MapPin
                  className="shrink-0 text-muted"
                  size={17}
                  aria-hidden="true"
                />
                <span className="sr-only">
                  Search by location or property name
                </span>
                <input
                  type="search"
                  value={queryInput}
                  onChange={(event) => setQueryInput(event.target.value)}
                  placeholder="City, area, or property"
                  className="min-w-0 flex-1 bg-transparent font-body text-sm text-primary outline-none placeholder:text-muted"
                />
              </label>
              <button
                type="submit"
                className="mr-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-primary transition-colors duration-200 ease-in-out hover:bg-primary hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                aria-label="Search listings"
              >
                <Search size={17} aria-hidden="true" />
              </button>
            </form>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <ActivityFeed role="tenant" title="Your activity" limit={3} />

      <section className="mt-10" aria-labelledby="property-feed-heading">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-accent text-xs font-bold uppercase tracking-[0.25em] text-primary">
              Verified rental homes
            </p>
            <h2 id="property-feed-heading" className="mt-2 font-display text-3xl font-bold text-primary">
              Homes available now
            </h2>
          </div>
          <p className="font-body text-sm text-muted" aria-live="polite">
            {resultLabel}
          </p>
        </div>

        {propertyError ? (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-500/30 bg-bg px-4 py-3">
            <p className="font-body text-sm font-bold text-red-700">{propertyError}</p>
            <button
              type="button"
              onClick={() => setRetryKey((current) => current + 1)}
              className="inline-flex items-center gap-2 font-body text-sm font-bold text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <RotateCcw size={15} aria-hidden="true" />
              Try again
            </button>
          </div>
        ) : null}

        {propertiesLoading ? (
          <div
            className="grid animate-pulse gap-6 md:grid-cols-2 xl:grid-cols-3"
            aria-label="Loading properties"
            aria-busy="true"
          >
            {[0, 1, 2, 3, 4, 5].map((item) => (
              <article
                key={item}
                className="overflow-hidden rounded-xl bg-bg shadow-sm"
                aria-hidden="true"
              >
                <div className="relative aspect-video bg-primary/10">
                  <span className="absolute left-3 top-3 h-7 w-20 rounded-full bg-bg/80" />
                  <span className="absolute right-3 top-3 h-10 w-10 rounded-full bg-bg/80" />
                </div>
                <div className="p-5 sm:p-6">
                  <div className="h-7 w-3/4 rounded-full bg-surface-soft" />
                  <div className="mt-4 h-4 w-1/2 rounded-full bg-surface-soft" />
                  <div className="mt-5 h-6 w-2/5 rounded-full bg-primary/10" />
                  <div className="mt-5 flex gap-3">
                    <div className="h-5 w-28 rounded-full bg-surface-soft" />
                    <div className="h-5 w-28 rounded-full bg-surface-soft" />
                  </div>
                  <div className="mt-6 h-4 w-24 rounded-full bg-primary/10" />
                </div>
              </article>
            ))}
          </div>
        ) : visibleProperties.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center rounded-xl bg-bg px-6 py-12 text-center shadow-sm">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-soft text-primary">
              <SearchX size={24} aria-hidden="true" />
            </span>
            <h3 className="mt-5 font-display text-2xl font-bold text-primary">No matching homes</h3>
            <p className="mt-2 max-w-md font-body text-sm leading-6 text-muted">
              Try a nearby area or remove a filter to see more available rentals.
            </p>
            {appliedFilters.length > 0 ? (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-5 rounded-full bg-primary px-5 py-3 font-body text-sm font-bold text-white hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Clear filters
              </button>
            ) : null}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {visibleProperties.map((property) => (
              <PropertyCard
                key={property.id}
                id={property.id}
                name={property.title}
                location={[property.location.area, property.location.city].filter(Boolean).join(", ")}
                price={property.price}
                listingType={property.status}
                bedrooms={property.bedrooms}
                bathrooms={property.bathrooms}
                imageUrl={property.images[0]}
                featured={false}
                verified={property.verified}
                isSaved={savedIds.has(property.id)}
                isSaving={savingIds.has(property.id)}
                onSaveToggle={() => void toggleSavedListing(property)}
              />
            ))}
          </div>
        )}

        {!propertiesLoading && hasNext ? (
          <button
            type="button"
            onClick={() => void loadMore()}
            disabled={isLoadingMore}
            className="mx-auto mt-10 flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 font-body text-sm font-bold text-white transition-colors hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-70"
          >
            {isLoadingMore ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : null}
            {isLoadingMore ? "Loading homes" : "Load more homes"}
          </button>
        ) : null}
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
              >
                <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-border" />
                <div className="flex items-center justify-between border-b border-border px-5 py-4">
                  <h2 className="font-display text-xl font-bold text-primary">Search and filter</h2>
                  <button
                    type="button"
                    onClick={() => setIsSearchSheetOpen(false)}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-primary/10 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    aria-label="Close search"
                  >
                    <X size={18} aria-hidden="true" />
                  </button>
                </div>

                <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5">
                  <label className="block">
                    <span className="mb-2 block font-body text-xs font-bold uppercase tracking-[0.14em] text-muted">Location</span>
                    <div className="flex items-center gap-3 rounded-lg bg-surface-soft px-4 py-4 focus-within:ring-2 focus-within:ring-accent">
                      <MapPin size={18} className="text-muted" aria-hidden="true" />
                      <input
                        type="search"
                        value={queryInput}
                        onChange={(event) => setQueryInput(event.target.value)}
                        placeholder="City, area, or property"
                        className="min-w-0 flex-1 bg-transparent font-body text-base text-primary outline-none placeholder:text-muted"
                      />
                    </div>
                  </label>

                  {[
                    { label: "City", value: city, options: cityOptions, change: setCity },
                    { label: "Price", value: priceFilter, options: PRICE_OPTIONS, change: (value: string) => setPriceFilter(value as PriceFilter) },
                    { label: "Bedrooms", value: bedroomFilter, options: BEDROOM_OPTIONS, change: (value: string) => setBedroomFilter(value as BedroomFilter) },
                    { label: "Sort by", value: sort, options: SORT_OPTIONS, change: (value: string) => setSort(value as SortOption) },
                  ].map((field) => (
                    <label key={field.label} className="block">
                      <span className="mb-2 block font-body text-xs font-bold uppercase tracking-[0.14em] text-muted">{field.label}</span>
                      <div className="rounded-lg bg-surface-soft px-4 py-4">
                        <Select
                          ariaLabel={field.label}
                          value={field.value}
                          onValueChange={field.change}
                          options={field.options}
                        />
                      </div>
                    </label>
                  ))}
                </div>

                <div className="grid grid-cols-[auto_1fr] gap-3 border-t border-border bg-bg px-5 py-4">
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="rounded-full px-4 py-3 font-body text-sm font-bold text-muted hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => submitSearch()}
                    className="flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 font-body text-sm font-bold text-primary hover:bg-primary hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <Search size={16} aria-hidden="true" />
                    Show {visibleProperties.length} homes
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

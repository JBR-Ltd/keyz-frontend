"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactElement,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Popover as PopoverPrimitive } from "radix-ui";
import {
  Loader2,
  RotateCcw,
  Search,
  SearchX,
  SlidersHorizontal,
  X,
} from "lucide-react";
import PropertyCard from "@/components/public/PropertyCard";
import OverlayPortal from "@/components/ui/OverlayPortal";
import { Select, type SelectOption } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import type {
  ListingSearch,
  RentalMode,
  SearchFilters,
} from "@/lib/hostListings";
import {
  getProperties,
  interpretProperties,
  type InterpretedPropertyQueryResult,
  type PropertyDetail,
} from "@/lib/propertyDetails";
import {
  getSavedListings,
  removeSavedListing,
  saveListing,
} from "@/lib/savedListings";
import { publishTenantHeaderSearch } from "@/lib/tenantHeaderSearch";
import { useDialogFocus } from "@/lib/useDialogFocus";
import { createSavedSearch, getSavedSearches } from "@/lib/marketplace";

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
type LongTermPeriod = "all" | "ANNUAL" | "MONTHLY";

/** Keywords filter the catalogue directly; describe sends plain English to be read into filters. */
interface AppliedFilter {
  id: string;
  label: string;
  remove: () => void;
}

// === Constants

const PAGE_SIZE = 12;

/** The backend refuses longer descriptions. */
const DESCRIBE_QUERY_MAX_LENGTH = 300;

const STAY_MODES: { hint: string; id: StayMode; label: string }[] = [
  { hint: "Everything available", id: "all", label: "All stays" },
  { hint: "Rented by the month or year", id: "long", label: "Homes to rent" },
  { hint: "Booked by the night", id: "short", label: "Shortlets" },
];

const STICKY_STAY_MODE_OPTIONS: SelectOption[] = [
  { label: "All stays", value: "all" },
  { label: "Rent", value: "long" },
  { label: "Shortlets", value: "short" },
];

const DESKTOP_STAY_MODE_OPTIONS: SelectOption[] = STAY_MODES.map((mode) => ({
  label: mode.label,
  value: mode.id,
}));

const LONG_TERM_PERIOD_OPTIONS: SelectOption[] = [
  { label: "Any period", value: "all" },
  { label: "Annual rent", value: "ANNUAL" },
  { label: "Monthly rent", value: "MONTHLY" },
];

const BEDROOM_OPTIONS: SelectOption[] = [
  { label: "Any bedrooms", value: "all" },
  { label: "1+ bedrooms", value: "1" },
  { label: "2+ bedrooms", value: "2" },
  { label: "3+ bedrooms", value: "3" },
  { label: "4+ bedrooms", value: "4" },
];

const STICKY_BEDROOM_OPTIONS: SelectOption[] = [
  { label: "Any beds", value: "all" },
  { label: "1+ beds", value: "1" },
  { label: "2+ beds", value: "2" },
  { label: "3+ beds", value: "3" },
  { label: "4+ beds", value: "4" },
];

const SORT_OPTIONS: SelectOption[] = [
  { label: "Recommended", value: "recommended" },
  { label: "Lowest price", value: "price-low" },
  { label: "Highest price", value: "price-high" },
  { label: "Most bedrooms", value: "bedrooms" },
];

const PRICE_PERIOD_LABELS: Record<RentalMode, string> = {
  ANNUAL: "annual budget",
  MONTHLY: "monthly budget",
  SHORT_STAY: "nightly budget",
};

const PRICE_PERIOD_SUFFIXES: Record<RentalMode, string> = {
  ANNUAL: "/yr",
  MONTHLY: "/mo",
  SHORT_STAY: "/night",
};

const PRICE_CONTROL_LABELS: Record<RentalMode, string> = {
  ANNUAL: "Annual budget",
  MONTHLY: "Monthly budget",
  SHORT_STAY: "Nightly budget",
};

// === Helpers

/** The price bands the menu offers, as the bounds the query takes. */
const PRICE_BOUNDS: Record<
  PriceFilter,
  [number | undefined, number | undefined]
> = {
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

function priceOptionsFor(
  rentalMode: RentalMode | undefined,
  compact = false,
): SelectOption[] {
  const period = rentalMode ? PRICE_PERIOD_LABELS[rentalMode] : "price";
  const suffix = rentalMode ? PRICE_PERIOD_SUFFIXES[rentalMode] : "";

  return [
    { label: `Any ${period}`, value: "all" },
    {
      label: `Under ₦${compact ? "100k" : "100,000"}${suffix}`,
      value: "under-100000",
    },
    {
      label: `₦${compact ? "100k–250k" : "100,000–250,000"}${suffix}`,
      value: "100000-250000",
    },
    {
      label: `₦${compact ? "250k–500k" : "250,000–500,000"}${suffix}`,
      value: "250000-500000",
    },
    {
      label: `Above ₦${compact ? "500k" : "500,000"}${suffix}`,
      value: "over-500000",
    },
  ];
}

function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString("en-NG")}`;
}

/** Shows the reading back, so a bad reading is visible rather than just a surprising list. */
function getInterpretationLabels(filters: SearchFilters): string[] {
  const labels: string[] = [];
  const place = [filters.area, filters.city].filter(Boolean).join(", ");
  const { maxPrice, minPrice } = filters;

  if (place) {
    labels.push(place);
  }

  if (typeof minPrice === "number" && typeof maxPrice === "number") {
    labels.push(`${formatNaira(minPrice)} to ${formatNaira(maxPrice)}`);
  } else if (typeof maxPrice === "number") {
    labels.push(`Under ${formatNaira(maxPrice)}`);
  } else if (typeof minPrice === "number") {
    labels.push(`Above ${formatNaira(minPrice)}`);
  }

  if (typeof filters.minBedrooms === "number") {
    labels.push(`${filters.minBedrooms}+ bedrooms`);
  }

  if (typeof filters.minBathrooms === "number") {
    labels.push(`${filters.minBathrooms}+ bathrooms`);
  }

  if (typeof filters.minSquareFootage === "number") {
    labels.push(`${filters.minSquareFootage.toLocaleString("en-NG")}+ sqft`);
  }

  if (filters.rentalMode === "SHORT_STAY") {
    labels.push("Shortlets");
  } else if (filters.rentalMode === "ANNUAL") {
    labels.push("Annual rent");
  } else if (filters.rentalMode === "MONTHLY") {
    labels.push("Monthly rent");
  } else if (filters.stayType === "SHORT_STAY") {
    labels.push("Shortlets");
  } else if (filters.stayType === "LONG_TERM") {
    labels.push("Homes to rent");
  }
  labels.push(...filters.amenities);

  if (filters.keywords) {
    labels.push(filters.keywords);
  }

  return labels;
}

async function requestListings(
  query: string,
  search: ListingSearch,
  page: number,
): Promise<InterpretedPropertyQueryResult> {
  if (query) {
    return interpretProperties(query, page, PAGE_SIZE, search);
  }

  const result = await getProperties("rent", page, PAGE_SIZE, search);

  return {
    ...result,
    fallback: false,
    filters: null,
    strategy: "KEYWORD",
  };
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
  const [priceFilter, setPriceFilter] = useState<PriceFilter>("all");
  const [bedroomFilter, setBedroomFilter] = useState<BedroomFilter>("all");
  const [sort, setSort] = useState<SortOption>("recommended");
  const [stayMode, setStayMode] = useState<StayMode>("all");
  const [longTermPeriod, setLongTermPeriod] = useState<LongTermPeriod>("all");
  const [savedIds, setSavedIds] = useState<Set<string>>(() => new Set());
  const [isSavedLoading, setIsSavedLoading] = useState(true);
  const [savingIds, setSavingIds] = useState<Set<string>>(() => new Set());
  const [isSavingSearch, setIsSavingSearch] = useState(false);
  const [isSubmittingSearch, setIsSubmittingSearch] = useState(false);
  const searchGeneration = useRef(0);
  const paginationGeneration = useRef<number | null>(null);
  const shouldFocusResults = useRef(false);
  const [isHeaderSearchVisible, setIsHeaderSearchVisible] = useState(false);
  const [interpretation, setInterpretation] = useState<SearchFilters | null>(
    null,
  );
  const [isFallback, setIsFallback] = useState(false);
  const [searchStrategy, setSearchStrategy] = useState<
    "KEYWORD" | "INTERPRETED"
  >("KEYWORD");
  const desktopSearchRef = useRef<HTMLFormElement>(null);
  const resultsHeadingRef = useRef<HTMLHeadingElement>(null);
  const dialogRef = useDialogFocus<HTMLDivElement>(isSearchSheetOpen);

  /** Every filter is sent before pagination, so later-page matches remain visible. */
  // An alert email links to /tenant/browse?search={id}; open that search's filters
  useEffect(() => {
    const savedSearchId = Number(
      new URLSearchParams(window.location.search).get("search"),
    );

    if (!savedSearchId) {
      return;
    }

    let active = true;

    void getSavedSearches().then((result) => {
      const saved = result.data.find((item) => item.id === savedSearchId);

      if (!active || !saved) {
        return;
      }

      const bucket = (Object.keys(PRICE_BOUNDS) as PriceFilter[]).find(
        (key) =>
          PRICE_BOUNDS[key][0] === (saved.minPrice ?? undefined) &&
          PRICE_BOUNDS[key][1] === (saved.maxPrice ?? undefined),
      );

      setQueryInput(saved.query ?? "");
      setSearchQuery(saved.query ?? "");
      if (saved.rentalMode === "SHORT_STAY") {
        setStayMode("short");
        setLongTermPeriod("all");
      } else if (
        saved.rentalMode === "ANNUAL" ||
        saved.rentalMode === "MONTHLY"
      ) {
        setStayMode("long");
        setLongTermPeriod(saved.rentalMode);
      } else if (saved.stayType === "SHORT_STAY") {
        setStayMode("short");
        setLongTermPeriod("all");
      } else if (saved.stayType === "LONG_TERM") {
        setStayMode("long");
        setLongTermPeriod("all");
      } else {
        setStayMode("all");
        setLongTermPeriod("all");
      }
      setPriceFilter(bucket ?? "all");
      setBedroomFilter(
        saved.minBedrooms && saved.minBedrooms >= 1 && saved.minBedrooms <= 4
          ? (String(saved.minBedrooms) as BedroomFilter)
          : "all",
      );
    });

    return () => {
      active = false;
    };
  }, []);

  const exactRentalMode: RentalMode | undefined =
    stayMode === "short"
      ? "SHORT_STAY"
      : stayMode === "long" && longTermPeriod !== "all"
        ? longTermPeriod
        : undefined;
  const priceControlsEnabled = Boolean(exactRentalMode);
  const priceOptions = useMemo(
    () => priceOptionsFor(exactRentalMode),
    [exactRentalMode],
  );
  const stickyPriceOptions = useMemo(
    () => priceOptionsFor(exactRentalMode, true),
    [exactRentalMode],
  );
  const sortOptions = useMemo(
    () =>
      SORT_OPTIONS.map((option) => ({
        ...option,
        disabled:
          !priceControlsEnabled &&
          (option.value === "price-low" || option.value === "price-high"),
      })),
    [priceControlsEnabled],
  );

  const search = useMemo<ListingSearch>(() => {
    const [minPrice, maxPrice] = PRICE_BOUNDS[priceFilter];

    return {
      query: searchQuery.trim() || undefined,
      minPrice,
      maxPrice,
      minBedrooms: bedroomFilter === "all" ? undefined : Number(bedroomFilter),
      rentalMode: exactRentalMode,
      sort: SORT_PARAMS[sort],
      stayType:
        stayMode === "long"
          ? "LONG_TERM"
          : stayMode === "short"
            ? "SHORT_STAY"
            : undefined,
    };
  }, [
    bedroomFilter,
    exactRentalMode,
    priceFilter,
    searchQuery,
    sort,
    stayMode,
  ]);

  useEffect(() => {
    let active = true;
    const generation = ++searchGeneration.current;
    paginationGeneration.current = null;

    const loadProperties = async (): Promise<void> => {
      setPropertiesLoading(true);
      setIsLoadingMore(false);
      setPropertyError("");

      const propertyResult = await requestListings(searchQuery, search, 0);

      if (!active || searchGeneration.current !== generation) return;

      setProperties(propertyResult.data);
      setHasNext(propertyResult.hasNext);
      setTotalItems(propertyResult.totalItems);
      setPropertyError(propertyResult.message ?? "");
      setInterpretation(propertyResult.filters);
      setIsFallback(propertyResult.fallback);
      setSearchStrategy(propertyResult.strategy);
      setPage(0);
      setPropertiesLoading(false);

      if (shouldFocusResults.current) {
        shouldFocusResults.current = false;
        setIsSubmittingSearch(false);
        window.requestAnimationFrame(() => resultsHeadingRef.current?.focus());
      }
    };

    void loadProperties();

    return () => {
      active = false;
      searchGeneration.current = generation + 1;
    };
  }, [retryKey, search, searchQuery]);

  useEffect(() => {
    let active = true;

    void getSavedListings().then((result) => {
      if (!active) return;

      setSavedIds(new Set(result.data.map((listing) => String(listing.id))));
      setIsSavedLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

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

  const changeStayMode = useCallback(
    (mode: StayMode): void => {
      if (mode === stayMode) return;

      setStayMode(mode);
      setLongTermPeriod("all");
      setPriceFilter("all");
      if (sort === "price-low" || sort === "price-high") {
        setSort("recommended");
      }
      setPage(0);
    },
    [sort, stayMode],
  );

  const changeLongTermPeriod = useCallback(
    (period: LongTermPeriod): void => {
      if (period === longTermPeriod) return;

      setLongTermPeriod(period);
      setPriceFilter("all");
      if (sort === "price-low" || sort === "price-high") {
        setSort("recommended");
      }
      setPage(0);
    },
    [longTermPeriod, sort],
  );

  const appliedFilters = useMemo<AppliedFilter[]>(() => {
    const filters: AppliedFilter[] = [];

    if (searchQuery) {
      filters.push({
        id: "query",
        label: searchQuery,
        remove: () => {
          setQueryInput("");
          setSearchQuery("");
        },
      });
    }

    if (stayMode !== "all") {
      filters.push({
        id: "stay",
        label:
          STAY_MODES.find((mode) => mode.id === stayMode)?.label ?? stayMode,
        remove: () => changeStayMode("all"),
      });
    }

    if (stayMode === "long" && longTermPeriod !== "all") {
      filters.push({
        id: "period",
        label: getOptionLabel(LONG_TERM_PERIOD_OPTIONS, longTermPeriod),
        remove: () => changeLongTermPeriod("all"),
      });
    }

    if (priceFilter !== "all") {
      filters.push({
        id: "price",
        label: getOptionLabel(priceOptions, priceFilter),
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
  }, [
    bedroomFilter,
    changeLongTermPeriod,
    changeStayMode,
    longTermPeriod,
    priceFilter,
    priceOptions,
    searchQuery,
    stayMode,
  ]);

  const clearFilters = (): void => {
    setQueryInput("");
    setSearchQuery("");
    setPriceFilter("all");
    setBedroomFilter("all");
    setSort("recommended");
    setStayMode("all");
    setLongTermPeriod("all");
  };

  const submitSearch = (event?: FormEvent): void => {
    event?.preventDefault();
    const nextQuery = queryInput.trim();

    setIsSearchSheetOpen(false);

    if (nextQuery === searchQuery) {
      setIsSubmittingSearch(false);
      window.requestAnimationFrame(() => resultsHeadingRef.current?.focus());
      return;
    }

    shouldFocusResults.current = true;
    setIsSubmittingSearch(true);
    setSearchQuery(nextQuery);
  };

  const loadMore = async (): Promise<void> => {
    const generation = searchGeneration.current;

    if (
      propertiesLoading ||
      !hasNext ||
      paginationGeneration.current === generation
    ) {
      return;
    }

    paginationGeneration.current = generation;
    const nextPage = page + 1;
    setIsLoadingMore(true);
    setPropertyError("");
    const result = await requestListings(searchQuery, search, nextPage);

    // A page from the previous search must not append to the new results.
    if (searchGeneration.current !== generation) return;

    paginationGeneration.current = null;
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

  const toggleSavedListing = async (
    property: PropertyDetail,
  ): Promise<void> => {
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

  const interpretationLabels = useMemo(
    () => (interpretation ? getInterpretationLabels(interpretation) : []),
    [interpretation],
  );

  const mobileFilterCount = appliedFilters.filter(
    (filter) => filter.id !== "query",
  ).length;
  const disclosedFilters = appliedFilters.filter(
    (filter) => filter.id !== "query" && filter.id !== "stay",
  );
  const desktopFilterCount = disclosedFilters.length;
  const mobileSearchSummary =
    searchQuery || "Where or what are you looking for?";
  const searchPlaceholder =
    "Search by city, area, property, or describe what you need";
  const saveSearch = async (): Promise<void> => {
    setIsSavingSearch(true);
    const result = await createSavedSearch({
      alerts: true,
      query: search.query,
      minPrice: search.minPrice,
      maxPrice: search.maxPrice,
      minBedrooms: search.minBedrooms,
      rentalMode: search.rentalMode,
      stayType: search.stayType,
    });
    setIsSavingSearch(false);

    notify(
      result.data
        ? {
            title: "Search saved",
            description: "We will email you when a new home matches it.",
            variant: "success",
          }
        : {
            title: "Search not saved",
            description: result.message ?? "Try again in a moment.",
            variant: "error",
          },
    );
  };

  const resultLabel = propertiesLoading
    ? "Loading homes..."
    : appliedFilters.length > 0
      ? `${totalItems} matching homes`
      : `${totalItems || properties.length} homes available`;
  const priceControlLabel = exactRentalMode
    ? PRICE_CONTROL_LABELS[exactRentalMode]
    : "Price";
  const onlyQueryApplied =
    appliedFilters.length === 1 && appliedFilters[0]?.id === "query";

  return (
    <main className="min-h-screen overflow-x-hidden px-5 pb-12 pt-8 sm:px-8 lg:px-10 lg:pb-16 lg:pt-10 xl:px-14">
      <section aria-label="Search and filter listings">
        <div className="mx-auto hidden max-w-7xl md:block">
          <div className="overflow-visible rounded-2xl bg-bg p-2 shadow-sm ring-1 ring-border">
            <form
              ref={desktopSearchRef}
              onSubmit={submitSearch}
              className="flex min-h-14 w-full items-stretch overflow-hidden rounded-xl border border-primary/25 bg-bg transition-shadow focus-within:border-primary focus-within:ring-2 focus-within:ring-accent/40"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3 px-5 focus-within:text-primary">
                <Search
                  className="shrink-0 text-muted"
                  size={19}
                  aria-hidden="true"
                />
                <input
                  type="search"
                  aria-label="Search homes"
                  value={queryInput}
                  onChange={(event) => setQueryInput(event.target.value)}
                  placeholder={searchPlaceholder}
                  maxLength={DESCRIBE_QUERY_MAX_LENGTH}
                  className="min-w-0 flex-1 bg-transparent font-body text-base text-primary outline-none placeholder:text-muted [&::-webkit-search-cancel-button]:appearance-none"
                />
              </div>
              {queryInput ? (
                <button
                  type="button"
                  onClick={() => setQueryInput("")}
                  className="flex min-h-11 w-11 shrink-0 items-center justify-center text-muted transition-colors hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
                  aria-label="Clear search text"
                >
                  <X size={17} aria-hidden="true" />
                </button>
              ) : null}
              <div className="flex w-36 shrink-0 items-center border-l border-border px-3 lg:w-44 lg:px-4">
                <Select
                  ariaLabel="Filter by stay type"
                  value={stayMode}
                  onValueChange={(value) => changeStayMode(value as StayMode)}
                  options={DESKTOP_STAY_MODE_OPTIONS}
                  className="text-sm font-bold"
                  contentClassName="min-w-44"
                />
              </div>
              <PopoverPrimitive.Root>
                <PopoverPrimitive.Trigger asChild>
                  <button
                    type="button"
                    className="relative inline-flex min-h-11 shrink-0 items-center justify-center gap-2 border-l border-border px-3 font-body text-sm font-bold text-primary transition-colors hover:bg-surface-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent lg:px-4"
                    aria-label={
                      desktopFilterCount > 0
                        ? `Open filters, ${desktopFilterCount} applied`
                        : "Open filters"
                    }
                  >
                    <SlidersHorizontal size={17} aria-hidden="true" />
                    <span className="hidden lg:inline">Filters</span>
                    {desktopFilterCount > 0 ? (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] text-white">
                        {desktopFilterCount}
                      </span>
                    ) : null}
                  </button>
                </PopoverPrimitive.Trigger>
                <PopoverPrimitive.Portal>
                  <PopoverPrimitive.Content
                    align="end"
                    sideOffset={10}
                    className="z-[110] w-[min(26rem,calc(100vw-2rem))] rounded-2xl border border-border bg-bg p-5 shadow-xl outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 motion-reduce:data-[state=open]:animate-none motion-reduce:data-[state=closed]:animate-none"
                    aria-label="Listing filters"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="font-display text-xl font-bold text-primary">
                          Refine your search
                        </h2>
                        <p className="mt-1 font-body text-sm text-muted">
                          Results update as you choose.
                        </p>
                      </div>
                      {desktopFilterCount > 0 ? (
                        <button
                          type="button"
                          onClick={clearFilters}
                          className="min-h-11 shrink-0 px-2 font-body text-sm font-bold text-muted hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                        >
                          Clear all
                        </button>
                      ) : null}
                    </div>

                    <div className="mt-5 space-y-5">
                      {stayMode === "long" ? (
                        <fieldset>
                          <legend className="mb-2 font-body text-xs font-bold uppercase tracking-[0.14em] text-muted">
                            Rental period
                          </legend>
                          <div
                            className="grid grid-cols-2 gap-1 rounded-xl bg-surface-soft p-1"
                            role="group"
                          >
                            {LONG_TERM_PERIOD_OPTIONS.filter(
                              (option) => option.value !== "all",
                            ).map((option) => {
                              const active = longTermPeriod === option.value;

                              return (
                                <button
                                  key={option.value}
                                  type="button"
                                  aria-pressed={active}
                                  onClick={() =>
                                    changeLongTermPeriod(
                                      option.value as LongTermPeriod,
                                    )
                                  }
                                  className={`min-h-11 rounded-lg px-3 font-body text-sm font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                                    active
                                      ? "bg-bg text-primary shadow-sm"
                                      : "text-muted hover:text-primary"
                                  }`}
                                >
                                  {option.value === "ANNUAL"
                                    ? "Annual"
                                    : "Monthly"}
                                </button>
                              );
                            })}
                          </div>
                        </fieldset>
                      ) : null}

                      <label className="block">
                        <span className="mb-2 block font-body text-xs font-bold uppercase tracking-[0.14em] text-muted">
                          {priceControlLabel}
                        </span>
                        <span className="block rounded-xl border border-border px-4 py-3.5">
                          <Select
                            ariaLabel={priceControlLabel}
                            disabled={!priceControlsEnabled}
                            value={priceFilter}
                            onValueChange={(value) =>
                              setPriceFilter(value as PriceFilter)
                            }
                            options={priceOptions}
                            className="text-sm"
                          />
                        </span>
                      </label>

                      {!priceControlsEnabled ? (
                        <p
                          className="font-body text-xs leading-5 text-muted"
                          role="status"
                        >
                          {stayMode === "long"
                            ? "Choose Annual or Monthly to set a budget."
                            : "Choose a stay type and rental period to set a budget."}
                        </p>
                      ) : null}

                      <label className="block">
                        <span className="mb-2 block font-body text-xs font-bold uppercase tracking-[0.14em] text-muted">
                          Bedrooms
                        </span>
                        <span className="block rounded-xl border border-border px-4 py-3.5">
                          <Select
                            ariaLabel="Filter by bedrooms"
                            value={bedroomFilter}
                            onValueChange={(value) =>
                              setBedroomFilter(value as BedroomFilter)
                            }
                            options={BEDROOM_OPTIONS}
                            className="text-sm"
                          />
                        </span>
                      </label>
                    </div>
                  </PopoverPrimitive.Content>
                </PopoverPrimitive.Portal>
              </PopoverPrimitive.Root>
              <button
                type="submit"
                disabled={isSubmittingSearch}
                className="inline-flex min-w-14 shrink-0 items-center justify-center gap-2 bg-accent px-4 font-body text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary disabled:cursor-wait disabled:opacity-70 lg:min-w-32 lg:px-6"
              >
                {isSubmittingSearch ? (
                  <Loader2
                    size={18}
                    className="animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <Search size={18} aria-hidden="true" />
                )}
                <span className="hidden lg:inline">
                  {isSubmittingSearch ? "Searching..." : "Search"}
                </span>
              </button>
            </form>
          </div>
        </div>

        <div className="md:hidden">
          <button
            type="button"
            onClick={() => setIsSearchSheetOpen(true)}
            className="flex min-h-14 w-full items-center justify-between gap-4 rounded-2xl bg-bg px-4 py-3 shadow-sm ring-1 ring-border focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label="Open search filters"
          >
            <span className="flex min-w-0 items-center gap-3">
              <Search
                size={18}
                className="shrink-0 text-muted"
                aria-hidden="true"
              />
              <span className="min-w-0 text-left">
                <span className="block truncate font-body text-sm font-bold text-primary">
                  {mobileSearchSummary}
                </span>
                <span className="mt-0.5 block font-body text-xs text-muted">
                  {mobileFilterCount > 0
                    ? `${mobileFilterCount} filter${mobileFilterCount === 1 ? "" : "s"} applied`
                    : "Search and filter homes"}
                </span>
              </span>
            </span>
            <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
              <Search size={17} aria-hidden="true" />
              {mobileFilterCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 font-body text-[10px] font-bold text-white">
                  {mobileFilterCount}
                </span>
              ) : null}
            </span>
          </button>
        </div>

        {disclosedFilters.length > 0 ? (
          <div
            className="mt-4 flex flex-wrap items-center gap-2"
            aria-label="Applied filters"
          >
            {disclosedFilters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={filter.remove}
                className="inline-flex min-h-9 items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-2 font-body text-xs font-bold text-primary transition-colors hover:border-primary/30 hover:bg-primary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {filter.label}
                <X size={13} aria-hidden="true" />
              </button>
            ))}
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex min-h-9 items-center gap-1.5 px-2 py-2 font-body text-xs font-bold text-muted hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <RotateCcw size={13} aria-hidden="true" />
              Clear all
            </button>
          </div>
        ) : null}

        {searchQuery && !propertiesLoading && !propertyError ? (
          isFallback ? (
            <p
              className="mt-3 rounded-lg bg-bg px-4 py-3 font-body text-sm text-muted shadow-sm"
              role="status"
            >
              That description could not be read, so these are keyword matches.
              Try naming the area, your budget, or the number of bedrooms.
            </p>
          ) : searchStrategy === "INTERPRETED" &&
            interpretationLabels.length > 0 ? (
            <div
              className="mt-3 flex flex-wrap items-center gap-2"
              aria-label="How your search was read"
            >
              <span className="font-accent text-xs font-bold uppercase tracking-[0.14em] text-muted">
                Read as
              </span>
              {interpretationLabels.map((label) => (
                <span
                  key={label}
                  className="rounded-full bg-primary/5 px-3 py-1.5 font-body text-xs font-bold text-primary"
                >
                  {label}
                </span>
              ))}
            </div>
          ) : null
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
              className="pointer-events-auto flex h-12 w-[min(56rem,calc(100vw-28rem))] min-w-[32rem] items-center overflow-hidden rounded-full border border-primary/10 bg-bg"
            >
              <div className="flex min-w-0 flex-1 items-center gap-2.5 px-5 focus-within:text-primary">
                <Search
                  className="shrink-0 text-muted"
                  size={17}
                  aria-hidden="true"
                />
                <input
                  type="search"
                  aria-label="Search homes"
                  value={queryInput}
                  onChange={(event) => setQueryInput(event.target.value)}
                  placeholder={searchPlaceholder}
                  maxLength={DESCRIBE_QUERY_MAX_LENGTH}
                  className="min-w-0 flex-1 bg-transparent font-body text-sm text-primary outline-none placeholder:text-muted [&::-webkit-search-cancel-button]:appearance-none"
                />
              </div>
              {queryInput ? (
                <button
                  type="button"
                  onClick={() => setQueryInput("")}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface-soft hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  aria-label="Clear search text"
                >
                  <X size={15} aria-hidden="true" />
                </button>
              ) : null}
              <>
                <div className="hidden h-8 w-px shrink-0 bg-border xl:block" />
                <div className="hidden w-28 shrink-0 px-3 xl:block">
                  <Select
                    ariaLabel="Filter by stay type"
                    value={stayMode}
                    onValueChange={(value) => changeStayMode(value as StayMode)}
                    options={STICKY_STAY_MODE_OPTIONS}
                    className="font-body text-xs font-bold"
                  />
                </div>
                {stayMode === "long" ? (
                  <>
                    <div className="hidden h-8 w-px shrink-0 bg-border xl:block" />
                    <div className="hidden w-28 shrink-0 px-3 xl:block">
                      <Select
                        ariaLabel="Choose annual or monthly rent"
                        value={longTermPeriod}
                        onValueChange={(value) =>
                          changeLongTermPeriod(value as LongTermPeriod)
                        }
                        options={LONG_TERM_PERIOD_OPTIONS}
                        className="font-body text-xs font-bold"
                      />
                    </div>
                  </>
                ) : null}
                <div className="hidden h-8 w-px shrink-0 bg-border xl:block" />
                <div className="hidden w-36 shrink-0 px-3 xl:block">
                  <Select
                    ariaLabel={priceControlLabel}
                    disabled={!priceControlsEnabled}
                    value={priceFilter}
                    onValueChange={(value) =>
                      setPriceFilter(value as PriceFilter)
                    }
                    options={stickyPriceOptions}
                    className="font-body text-xs font-bold"
                  />
                </div>
                <div className="hidden h-8 w-px shrink-0 bg-border xl:block" />
                <div className="hidden w-32 shrink-0 px-3 xl:block">
                  <Select
                    ariaLabel="Filter by bedrooms"
                    value={bedroomFilter}
                    onValueChange={(value) =>
                      setBedroomFilter(value as BedroomFilter)
                    }
                    options={STICKY_BEDROOM_OPTIONS}
                    className="font-body text-xs font-bold"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setIsSearchSheetOpen(true)}
                  className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-primary transition-colors hover:bg-surface-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  aria-label="Open listing filters"
                >
                  <SlidersHorizontal size={17} aria-hidden="true" />
                  {desktopFilterCount > 0 ? (
                    <span className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-accent" />
                  ) : null}
                </button>
              </>
              <button
                type="submit"
                disabled={isSubmittingSearch}
                className="mr-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-primary transition-colors duration-200 ease-in-out hover:bg-primary hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                aria-label={
                  isSubmittingSearch ? "Searching for homes" : "Search listings"
                }
              >
                {isSubmittingSearch ? (
                  <Loader2
                    size={17}
                    className="animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <Search size={17} aria-hidden="true" />
                )}
              </button>
            </form>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <section
        className="mx-auto mt-8 max-w-7xl"
        aria-labelledby="property-feed-heading"
      >
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2
              ref={resultsHeadingRef}
              id="property-feed-heading"
              tabIndex={-1}
              className="font-display text-2xl font-bold text-primary outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Homes available now
            </h2>
            <p className="mt-1 font-body text-sm text-muted" aria-live="polite">
              {resultLabel}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            {!propertiesLoading &&
            searchStrategy !== "INTERPRETED" &&
            !isFallback &&
            appliedFilters.length > 0 ? (
              <button
                type="button"
                onClick={() => void saveSearch()}
                disabled={isSavingSearch}
                className="inline-flex min-h-10 items-center gap-2 rounded-full border border-primary/20 px-4 font-body text-sm font-bold text-primary hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
              >
                {isSavingSearch ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : null}
                Save search and get alerts
              </button>
            ) : null}
            {!propertiesLoading && properties.length > 0 ? (
              <div className="min-w-44 rounded-xl border border-border bg-bg px-3 py-2 shadow-sm">
                <Select
                  ariaLabel="Sort listings"
                  value={sort}
                  onValueChange={(value) => setSort(value as SortOption)}
                  options={sortOptions}
                  className="font-body text-sm font-bold"
                />
              </div>
            ) : null}
          </div>
        </div>

        {propertyError ? (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-500/30 bg-bg px-4 py-3">
            <p className="font-body text-sm font-bold text-red-700">
              {propertyError}
            </p>
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
                className="overflow-hidden rounded-xl border border-border bg-bg shadow-sm"
                aria-hidden="true"
              >
                <div className="relative aspect-video bg-skeleton-strong">
                  <span className="absolute left-3 top-3 h-7 w-20 rounded-full bg-bg/80" />
                  <span className="absolute right-3 top-3 h-10 w-10 rounded-full bg-bg/80" />
                </div>
                <div className="p-5 sm:p-6">
                  <div className="h-7 w-3/4 rounded-full bg-skeleton" />
                  <div className="mt-4 h-4 w-1/2 rounded-full bg-skeleton" />
                  <div className="mt-5 h-6 w-2/5 rounded-full bg-skeleton" />
                  <div className="mt-5 flex gap-3">
                    <div className="h-5 w-28 rounded-full bg-skeleton" />
                    <div className="h-5 w-28 rounded-full bg-skeleton" />
                  </div>
                  <div className="mt-6 h-4 w-24 rounded-full bg-skeleton" />
                </div>
              </article>
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center rounded-xl bg-bg px-6 py-12 text-center shadow-sm">
            <span className="flex h-[6.5rem] w-[6.5rem] items-center justify-center rounded-full bg-surface-soft text-primary">
              <SearchX size={48} aria-hidden="true" />
            </span>
            <h3 className="mt-5 font-display text-2xl font-bold text-primary">
              No matching homes
            </h3>
            <p className="mt-2 max-w-md font-body text-sm leading-6 text-muted">
              Try a nearby area or remove a filter to see more available
              rentals.
            </p>
            {appliedFilters.length > 0 ? (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-5 rounded-full bg-primary px-5 py-3 font-body text-sm font-bold text-white hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {onlyQueryApplied ? "View all homes" : "Clear filters"}
              </button>
            ) : null}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {properties.map((property) => (
              <PropertyCard
                key={property.id}
                id={property.id}
                publicId={property.publicId}
                slug={property.slug}
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
                verified={property.verified}
                availableUnitCount={property.availableUnitCount}
                isSaved={savedIds.has(property.id)}
                isSaving={isSavedLoading || savingIds.has(property.id)}
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
            {isLoadingMore ? (
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            ) : null}
            {isLoadingMore ? "Loading homes" : "Load more homes"}
          </button>
        ) : null}
      </section>

      <div className="mx-auto max-w-7xl">
        <ActivityFeed role="tenant" title="Your activity" limit={3} />
      </div>

      <OverlayPortal>
        <AnimatePresence>
          {isSearchSheetOpen ? (
            <>
              <motion.div
                className="modal-backdrop fixed inset-0 z-[100]"
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={reduceMotion ? undefined : { opacity: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                onClick={() => setIsSearchSheetOpen(false)}
              />
              <div className="pointer-events-none fixed inset-0 z-[110] flex items-end md:items-center md:justify-center md:p-6">
                <motion.div
                  ref={dialogRef}
                  role="dialog"
                  aria-modal="true"
                  aria-label="Search listings"
                  className="pointer-events-auto flex max-h-[90vh] w-full flex-col rounded-t-xl bg-bg shadow-xl md:max-w-xl md:rounded-xl"
                  initial={reduceMotion ? false : { opacity: 0, y: 32 }}
                  animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, y: 32 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-border md:hidden" />
                  <div className="flex items-center justify-between border-b border-border px-5 py-4">
                    <h2 className="font-display text-xl font-bold text-primary">
                      Search and filter
                    </h2>
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
                    <div>
                      <label
                        htmlFor="mobile-browse-query"
                        className="mb-2 block font-body text-xs font-bold uppercase tracking-[0.14em] text-muted"
                      >
                        Search homes
                      </label>
                      <div className="flex items-center gap-3 rounded-lg bg-surface-soft px-4 py-4 focus-within:ring-2 focus-within:ring-accent">
                        <Search
                          size={18}
                          className="text-muted"
                          aria-hidden="true"
                        />
                        <input
                          id="mobile-browse-query"
                          type="search"
                          value={queryInput}
                          onChange={(event) =>
                            setQueryInput(event.target.value)
                          }
                          placeholder={searchPlaceholder}
                          maxLength={DESCRIBE_QUERY_MAX_LENGTH}
                          className="min-w-0 flex-1 bg-transparent font-body text-base text-primary outline-none placeholder:text-muted [&::-webkit-search-cancel-button]:appearance-none"
                        />
                        {queryInput ? (
                          <button
                            type="button"
                            onClick={() => setQueryInput("")}
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted hover:bg-bg hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                            aria-label="Clear search text"
                          >
                            <X size={17} aria-hidden="true" />
                          </button>
                        ) : null}
                      </div>
                    </div>

                    <>
                      <div>
                        <span className="mb-2 block font-body text-xs font-bold uppercase tracking-[0.14em] text-muted">
                          Kind of stay
                        </span>
                        <div
                          className="grid grid-cols-3 gap-1 rounded-xl bg-surface-soft p-1"
                          role="group"
                          aria-label="Kind of stay"
                        >
                          {STAY_MODES.map((mode) => {
                            const active = stayMode === mode.id;

                            return (
                              <button
                                key={mode.id}
                                type="button"
                                aria-pressed={active}
                                onClick={() => changeStayMode(mode.id)}
                                className={`min-h-11 rounded-lg px-2 font-body text-sm font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                                  active
                                    ? "bg-bg text-primary shadow-sm"
                                    : "text-muted hover:text-primary"
                                }`}
                              >
                                {mode.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {stayMode === "long" ? (
                        <div>
                          <span className="mb-2 block font-body text-xs font-bold uppercase tracking-[0.14em] text-muted">
                            Rental period
                          </span>
                          <div
                            className="grid grid-cols-2 gap-1 rounded-xl bg-surface-soft p-1"
                            role="group"
                            aria-label="Rental period"
                          >
                            {LONG_TERM_PERIOD_OPTIONS.filter(
                              (option) => option.value !== "all",
                            ).map((option) => {
                              const active = longTermPeriod === option.value;

                              return (
                                <button
                                  key={option.value}
                                  type="button"
                                  aria-pressed={active}
                                  onClick={() =>
                                    changeLongTermPeriod(
                                      option.value as LongTermPeriod,
                                    )
                                  }
                                  className={`min-h-11 rounded-lg px-3 font-body text-sm font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                                    active
                                      ? "bg-bg text-primary shadow-sm"
                                      : "text-muted hover:text-primary"
                                  }`}
                                >
                                  {option.value === "ANNUAL"
                                    ? "Annual"
                                    : "Monthly"}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}

                      {[
                        {
                          label: priceControlLabel,
                          value: priceFilter,
                          options: priceOptions,
                          disabled: !priceControlsEnabled,
                          change: (value: string) =>
                            setPriceFilter(value as PriceFilter),
                        },
                        {
                          label: "Bedrooms",
                          value: bedroomFilter,
                          options: BEDROOM_OPTIONS,
                          disabled: false,
                          change: (value: string) =>
                            setBedroomFilter(value as BedroomFilter),
                        },
                        {
                          label: "Sort by",
                          value: sort,
                          options: sortOptions,
                          disabled: false,
                          change: (value: string) =>
                            setSort(value as SortOption),
                        },
                      ].map((field) => (
                        <label key={field.label} className="block">
                          <span className="mb-2 block font-body text-xs font-bold uppercase tracking-[0.14em] text-muted">
                            {field.label}
                          </span>
                          <div className="rounded-lg bg-surface-soft px-4 py-4">
                            <Select
                              ariaLabel={field.label}
                              value={field.value}
                              onValueChange={field.change}
                              options={field.options}
                              disabled={field.disabled}
                            />
                          </div>
                        </label>
                      ))}
                      {!priceControlsEnabled ? (
                        <p className="font-body text-xs leading-5 text-muted">
                          {stayMode === "long"
                            ? "Choose Annual or Monthly to set a budget and sort by price."
                            : "Choose a stay type and rental period to set a budget."}
                        </p>
                      ) : null}
                    </>
                  </div>

                  <div className="grid grid-cols-[auto_1fr] gap-3 border-t border-border bg-bg px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
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
                      disabled={isSubmittingSearch}
                      className="flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 font-body text-sm font-bold text-primary hover:bg-primary hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      {isSubmittingSearch ? (
                        <Loader2
                          size={16}
                          className="animate-spin"
                          aria-hidden="true"
                        />
                      ) : (
                        <Search size={16} aria-hidden="true" />
                      )}
                      {isSubmittingSearch
                        ? "Searching..."
                        : `Show ${totalItems} homes`}
                    </button>
                  </div>
                </motion.div>
              </div>
            </>
          ) : null}
        </AnimatePresence>
      </OverlayPortal>
    </main>
  );
}

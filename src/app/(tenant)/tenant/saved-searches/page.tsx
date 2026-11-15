"use client";

import { Bell, BellOff, Loader2, Trash2, BellRing } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type ReactElement } from "react";
import PropertyPrice from "@/components/property/PropertyPrice";
import { useToast } from "@/components/ui/toast";
import { AsyncButtonContent } from "@/components/ui/async-button-content";
import {
  deleteSavedSearch,
  getSavedSearches,
  updateSavedSearch,
  type SavedSearch,
} from "@/lib/marketplace";
import { EmptyState } from "@/components/ui/empty-state";

const MODE_LABELS: Record<NonNullable<SavedSearch["rentalMode"]>, string> = {
  ANNUAL: "Annual rent",
  MONTHLY: "Monthly rent",
  SHORT_STAY: "Shortlet",
};

function describe(search: SavedSearch): string[] {
  const parts: string[] = [];

  if (search.query) {
    parts.push(`“${search.query}”`);
  }

  if (search.city) {
    parts.push(search.city);
  }

  if (search.minBedrooms) {
    parts.push(`${search.minBedrooms}+ bedrooms`);
  }

  if (search.rentalMode) {
    parts.push(MODE_LABELS[search.rentalMode]);
  } else if (search.stayType === "LONG_TERM") {
    parts.push("Long-term homes");
  } else if (search.stayType === "SHORT_STAY") {
    parts.push("Shortlets");
  }

  return parts;
}

export default function SavedSearchesPage(): ReactElement {
  const { notify } = useToast();
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyKey, setBusyKey] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void getSavedSearches().then((result) => {
      if (!active) {
        return;
      }

      setSearches(result.data);
      setError(result.message ?? "");
      setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const toggleAlerts = async (search: SavedSearch): Promise<void> => {
    setBusyKey(`${search.id}:alerts`);
    const result = await updateSavedSearch(search.id, {
      alerts: !search.alerts,
    }).finally(() => setBusyKey(null));

    if (!result.data) {
      notify({
        title: "Not changed",
        description: result.message ?? "Try again in a moment.",
        variant: "error",
      });
      return;
    }

    const updated = result.data;
    setSearches((current) =>
      current.map((item) => (item.id === updated.id ? updated : item)),
    );
  };

  const remove = async (search: SavedSearch): Promise<void> => {
    setBusyKey(`${search.id}:delete`);
    const result = await deleteSavedSearch(search.id).finally(() =>
      setBusyKey(null),
    );

    if (!result.data) {
      notify({
        title: "Not deleted",
        description: result.message ?? "Try again in a moment.",
        variant: "error",
      });
      return;
    }

    setSearches((current) => current.filter((item) => item.id !== search.id));
    notify({ title: "Search deleted", variant: "success" });
  };

  return (
    <main className="min-h-screen overflow-x-hidden px-5 py-10 sm:px-8 lg:px-10 lg:py-14 xl:px-14">
      <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-accent-alt">
        Alerts
      </p>
      <h1 className="mt-4 font-display text-4xl font-bold text-primary sm:text-5xl">
        Saved searches
      </h1>
      <p className="mt-3 max-w-2xl font-body text-sm leading-6 text-muted">
        We check each search once a day and email you when a new home matches.
        Save one from Browse after setting your filters. You can keep up to 20.
      </p>

      {isLoading ? (
        <div className="mt-10 flex justify-center" role="status">
          <Loader2 size={22} className="animate-spin text-muted" />
          <span className="sr-only">Loading saved searches</span>
        </div>
      ) : error ? (
        <p className="mt-8 font-body text-sm text-red-700">{error}</p>
      ) : searches.length === 0 ? (
        <EmptyState
          icon={BellRing}
          title="No saved searches yet"
          description="Save a search on the browse page and we tell you when a new home matches it."
          action={{ label: "Browse homes", href: "/browse" }}
          className="mt-8"
        />
      ) : (
        <ul className="mt-8 grid gap-4 md:grid-cols-2">
          {searches.map((search) => (
            <li
              key={search.id}
              className="relative flex flex-col rounded-lg bg-bg p-5 shadow-sm"
            >
              {/* Top right rather than stranded on its own line under the
                  actions, where it wrapped on a phone */}
              <button
                type="button"
                onClick={() => void remove(search)}
                disabled={busyKey?.startsWith(`${search.id}:`) ?? false}
                aria-busy={busyKey === `${search.id}:delete`}
                aria-label={
                  busyKey === `${search.id}:delete`
                    ? `Deleting ${search.name}`
                    : `Delete ${search.name}`
                }
                className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full text-muted transition-colors hover:bg-red-700/5 hover:text-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
              >
                {busyKey === `${search.id}:delete` ? (
                  <Loader2
                    size={16}
                    className="animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <Trash2 size={16} aria-hidden="true" />
                )}
              </button>
              <p className="pr-12 font-body text-lg font-bold text-primary">
                {search.name}
              </p>
              <p className="mt-1 font-body text-sm text-muted">
                {describe(search).join(" · ") || "Any home"}
                {search.minPrice || search.maxPrice ? (
                  <>
                    {" · "}
                    {search.minPrice ? (
                      <PropertyPrice
                        value={search.minPrice}
                        rentalMode={search.rentalMode ?? undefined}
                      />
                    ) : (
                      "Any"
                    )}
                    {" to "}
                    {search.maxPrice ? (
                      <PropertyPrice
                        value={search.maxPrice}
                        rentalMode={search.rentalMode ?? undefined}
                      />
                    ) : (
                      "any"
                    )}
                  </>
                ) : null}
              </p>
              <p className="mt-2 font-body text-xs text-muted">
                {search.lastAlertedAt
                  ? `Last alert ${new Date(search.lastAlertedAt).toLocaleDateString("en-NG", { dateStyle: "medium" })}`
                  : "No alerts sent yet"}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:flex">
                <Link
                  href={`/browse?search=${search.id}`}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 whitespace-nowrap rounded-full bg-primary px-3 font-body text-sm font-bold text-white hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:w-auto sm:px-4"
                >
                  See homes
                </Link>
                <button
                  type="button"
                  onClick={() => void toggleAlerts(search)}
                  disabled={busyKey?.startsWith(`${search.id}:`) ?? false}
                  aria-busy={busyKey === `${search.id}:alerts`}
                  aria-pressed={search.alerts}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 whitespace-nowrap rounded-full border border-primary/20 px-3 font-body text-sm font-bold text-primary hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60 sm:w-auto sm:px-4"
                >
                  <AsyncButtonContent
                    isPending={busyKey === `${search.id}:alerts`}
                    pendingLabel="Updating..."
                  >
                    {search.alerts ? (
                      <Bell size={14} aria-hidden="true" />
                    ) : (
                      <BellOff size={14} aria-hidden="true" />
                    )}
                    {search.alerts ? "Alerts on" : "Alerts off"}
                  </AsyncButtonContent>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

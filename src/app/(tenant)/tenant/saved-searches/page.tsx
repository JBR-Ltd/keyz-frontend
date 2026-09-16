"use client";

import { Bell, BellOff, Loader2, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type ReactElement } from "react";
import PropertyPrice from "@/components/property/PropertyPrice";
import { useToast } from "@/components/ui/toast";
import {
  deleteSavedSearch,
  getSavedSearches,
  updateSavedSearch,
  type SavedSearch,
} from "@/lib/marketplace";

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

  return parts;
}

export default function SavedSearchesPage(): ReactElement {
  const { notify } = useToast();
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

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
    setBusyId(search.id);
    const result = await updateSavedSearch(search.id, { alerts: !search.alerts });
    setBusyId(null);

    if (!result.data) {
      notify({ title: "Not changed", description: result.message ?? "Try again in a moment.", variant: "error" });
      return;
    }

    const updated = result.data;
    setSearches((current) => current.map((item) => (item.id === updated.id ? updated : item)));
  };

  const remove = async (search: SavedSearch): Promise<void> => {
    setBusyId(search.id);
    const result = await deleteSavedSearch(search.id);
    setBusyId(null);

    if (!result.data) {
      notify({ title: "Not deleted", description: result.message ?? "Try again in a moment.", variant: "error" });
      return;
    }

    setSearches((current) => current.filter((item) => item.id !== search.id));
    notify({ title: "Search deleted", variant: "success" });
  };

  return (
    <main className="min-h-screen overflow-x-hidden px-5 py-10 sm:px-8 lg:px-10 lg:py-14 xl:px-14">
      <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-accent-alt">Alerts</p>
      <h1 className="mt-4 font-display text-4xl font-bold text-primary sm:text-5xl">Saved searches</h1>
      <p className="mt-3 max-w-2xl font-body text-sm leading-6 text-muted">
        We check each search once a day and email you when a new home matches. Save one from Browse after setting
        your filters. You can keep up to 20.
      </p>

      {isLoading ? (
        <div className="mt-10 flex justify-center" role="status">
          <Loader2 size={22} className="animate-spin text-muted" />
          <span className="sr-only">Loading saved searches</span>
        </div>
      ) : error ? (
        <p className="mt-8 font-body text-sm text-red-700">{error}</p>
      ) : searches.length === 0 ? (
        <div className="mt-8 rounded-lg bg-surface-soft p-8 text-center">
          <p className="font-body text-sm text-muted">No saved searches yet.</p>
          <Link
            href="/tenant/browse"
            className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 font-body text-sm font-bold text-white hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <Search size={15} aria-hidden="true" />
            Browse homes
          </Link>
        </div>
      ) : (
        <ul className="mt-8 grid gap-4 md:grid-cols-2">
          {searches.map((search) => (
            <li key={search.id} className="flex flex-col rounded-lg bg-bg p-5 shadow-sm">
              <p className="font-body text-lg font-bold text-primary">{search.name}</p>
              <p className="mt-1 font-body text-sm text-muted">
                {describe(search).join(" · ") || "Any home"}
                {search.minPrice || search.maxPrice ? (
                  <>
                    {" · "}
                    {search.minPrice ? <PropertyPrice value={search.minPrice} /> : "Any"}
                    {" to "}
                    {search.maxPrice ? <PropertyPrice value={search.maxPrice} /> : "any"}
                  </>
                ) : null}
              </p>
              <p className="mt-2 font-body text-xs text-muted">
                {search.lastAlertedAt
                  ? `Last alert ${new Date(search.lastAlertedAt).toLocaleDateString("en-NG", { dateStyle: "medium" })}`
                  : "No alerts sent yet"}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={`/tenant/browse?search=${search.id}`}
                  className="inline-flex min-h-10 items-center gap-2 rounded-full bg-primary px-4 font-body text-sm font-bold text-white hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  See homes
                </Link>
                <button
                  type="button"
                  onClick={() => void toggleAlerts(search)}
                  disabled={busyId === search.id}
                  aria-pressed={search.alerts}
                  className="inline-flex min-h-10 items-center gap-2 rounded-full border border-primary/20 px-4 font-body text-sm font-bold text-primary hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
                >
                  {search.alerts ? <Bell size={14} aria-hidden="true" /> : <BellOff size={14} aria-hidden="true" />}
                  {search.alerts ? "Alerts on" : "Alerts off"}
                </button>
                <button
                  type="button"
                  onClick={() => void remove(search)}
                  disabled={busyId === search.id}
                  aria-label={`Delete ${search.name}`}
                  className="inline-flex min-h-10 items-center gap-2 rounded-full px-3 font-body text-sm font-bold text-muted hover:text-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
                >
                  <Trash2 size={14} aria-hidden="true" />
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

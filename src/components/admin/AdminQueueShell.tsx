"use client";

import type { ReactElement, ReactNode } from "react";
import { ChevronLeft, ChevronRight, Loader2, Search } from "lucide-react";
import { Select, type SelectOption } from "@/components/ui/select";
import { CardListSkeleton } from "@/components/ui/skeleton";

// === Types

export interface AdminQueueShellProps {
  children: ReactNode;
  /** Shown when a search returns nothing, in place of the rows. */
  emptyMessage: string;
  error: string;
  eyebrow: string;
  intro: string;
  isEmpty: boolean;
  isLoading: boolean;
  isSearching: boolean;
  onPageChange: (next: number) => void;
  onQueryChange: (next: string) => void;
  onStatusChange: (next: string) => void;
  page: number;
  query: string;
  searchLabel: string;
  searchPlaceholder: string;
  status: string;
  statusOptions: SelectOption[];
  title: string;
  totalItems: number;
  totalPages: number;
}

// === Component

/**
 * The frame the three admin queues share: search, a status filter, and paging.
 * Each page supplies only its own rows.
 */
export default function AdminQueueShell({
  children,
  emptyMessage,
  error,
  eyebrow,
  intro,
  isEmpty,
  isLoading,
  isSearching,
  onPageChange,
  onQueryChange,
  onStatusChange,
  page,
  query,
  searchLabel,
  searchPlaceholder,
  status,
  statusOptions,
  title,
  totalItems,
  totalPages,
}: AdminQueueShellProps): ReactElement {
  const showRows = !isLoading && !isEmpty;

  return (
    <main className="min-h-screen overflow-x-hidden px-5 py-12 sm:px-8 lg:px-10 lg:py-16 xl:px-14">
      <header className="pb-8">
        <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-primary">
          {eyebrow}
        </p>
        <h1 className="mt-4 font-display text-4xl font-bold leading-[0.92] text-primary sm:text-5xl">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl font-body text-base leading-7 text-muted">
          {intro}
        </p>
      </header>

      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative flex-1">
          <span className="sr-only">{searchLabel}</span>
          <Search
            size={16}
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={searchPlaceholder}
            className="min-h-12 w-full rounded-lg border border-primary/15 bg-surface-soft pl-11 pr-4 font-body text-sm text-primary outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
          />
          {isSearching && !isLoading ? (
            <Loader2
              size={15}
              aria-hidden="true"
              className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-muted"
            />
          ) : null}
        </label>

        <Select
          ariaLabel="Filter by status"
          value={status}
          onValueChange={onStatusChange}
          options={statusOptions}
          className="min-h-12 sm:w-56"
        />
      </div>

      {error ? (
        <p className="mb-6 font-body text-sm text-red-700">{error}</p>
      ) : null}

      {isLoading ? (
        <CardListSkeleton count={4} label={`Loading ${title.toLowerCase()}`} />
      ) : isEmpty ? (
        <div className="rounded-lg bg-surface-soft p-10 text-center shadow-sm">
          <p className="font-body text-base leading-7 text-muted">
            {emptyMessage}
          </p>
        </div>
      ) : null}

      {showRows ? <div className="grid gap-4">{children}</div> : null}

      {showRows && totalPages > 1 ? (
        <nav
          aria-label="Pages"
          className="mt-8 flex items-center justify-between gap-4"
        >
          <p className="font-body text-sm text-muted">
            Page {page + 1} of {totalPages} · {totalItems} in total
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onPageChange(page - 1)}
              disabled={page === 0}
              className="inline-flex min-h-10 items-center gap-1 rounded px-4 font-accent text-xs font-bold uppercase tracking-[0.16em] text-primary shadow-sm transition-all duration-200 ease-in-out hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft size={15} aria-hidden="true" />
              Previous
            </button>
            <button
              type="button"
              onClick={() => onPageChange(page + 1)}
              disabled={page + 1 >= totalPages}
              className="inline-flex min-h-10 items-center gap-1 rounded px-4 font-accent text-xs font-bold uppercase tracking-[0.16em] text-primary shadow-sm transition-all duration-200 ease-in-out hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
              <ChevronRight size={15} aria-hidden="true" />
            </button>
          </div>
        </nav>
      ) : null}
    </main>
  );
}

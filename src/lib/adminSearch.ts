"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminPage, AdminResult, AdminSearch } from "@/lib/admin";

// === Types

export interface AdminSearchController<TItem> {
  /** True until the first response lands, so the shell can show a skeleton. */
  isLoading: boolean;
  /** True while the visible results are behind what has been typed or picked. */
  isSearching: boolean;
  error: string;
  items: TItem[];
  page: number;
  query: string;
  status: string;
  totalItems: number;
  totalPages: number;
  goToPage: (next: number) => void;
  refresh: () => void;
  replaceItem: (match: (item: TItem) => boolean, next: TItem) => void;
  setQuery: (next: string) => void;
  setStatus: (next: string) => void;
}

const DEBOUNCE_MS = 250;

/**
 * Search state for the admin queues.
 *
 * Shared because bookings, escrow and reviews are the same screen with different
 * rows: type, filter, page, act on a row.
 */
export function useAdminSearch<TItem>(
  fetcher: (search: AdminSearch) => Promise<AdminResult<AdminPage<TItem>>>,
): AdminSearchController<TItem> {
  const [query, setQueryValue] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [status, setStatusValue] = useState("");
  const [page, setPage] = useState(0);
  const [reloadToken, setReloadToken] = useState(0);
  const [result, setResult] = useState<AdminPage<TItem> | null>(null);
  const [error, setError] = useState("");
  const [applied, setApplied] = useState<AdminSearch | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(
      () => setDebouncedQuery(query),
      DEBOUNCE_MS,
    );

    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    let active = true;
    const search: AdminSearch = { query: debouncedQuery, status, page };

    void fetcher(search).then((response) => {
      if (!active) {
        return;
      }

      setResult(response.data);
      setError(response.message ?? "");
      setApplied(search);
    });

    return () => {
      active = false;
    };
  }, [debouncedQuery, status, page, reloadToken, fetcher]);

  // Derived rather than a flag set in the effect: what is on screen is stale
  // exactly when it was fetched for different terms than the current ones
  const isSearching =
    applied === null ||
    applied.query !== debouncedQuery ||
    applied.status !== status ||
    applied.page !== page;

  const setQuery = useCallback((next: string) => {
    setQueryValue(next);
    setPage(0);
  }, []);

  const setStatus = useCallback((next: string) => {
    setStatusValue(next);
    setPage(0);
  }, []);

  const goToPage = useCallback((next: number) => {
    setPage(Math.max(next, 0));
  }, []);

  const refresh = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  const replaceItem = useCallback(
    (match: (item: TItem) => boolean, next: TItem) => {
      setResult((current) =>
        current === null
          ? current
          : {
              ...current,
              items: current.items.map((item) => (match(item) ? next : item)),
            },
      );
    },
    [],
  );

  return {
    isLoading: result === null,
    isSearching,
    error,
    items: result?.items ?? [],
    page,
    query,
    status,
    totalItems: result?.totalItems ?? 0,
    totalPages: result?.totalPages ?? 0,
    goToPage,
    refresh,
    replaceItem,
    setQuery,
    setStatus,
  };
}

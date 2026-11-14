"use client";

import { ChevronDown, Loader2, MapPin, RefreshCw } from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactElement,
} from "react";
import { searchCities, type CitySuggestion } from "@/lib/cities";
import { cn } from "@/lib/utils";

export interface CityComboboxProps {
  className?: string;
  describedBy?: string;
  id: string;
  invalid?: boolean;
  onValueChange: (value: string) => void;
  value: string;
}

export function CityCombobox({
  className,
  describedBy,
  id,
  invalid = false,
  onValueChange,
  value,
}: CityComboboxProps): ReactElement {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [draftQuery, setDraftQuery] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const query = draftQuery ?? value;
  const trimmedQuery = query.trim();
  const needsSearch = trimmedQuery.length >= 2 && query !== value;

  useEffect(() => {
    function handlePointerDown(event: PointerEvent): void {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  useEffect(() => {
    if (!needsSearch) return;

    const controller = new AbortController();
    const debounce = setTimeout(async () => {
      setIsLoading(true);
      setError("");
      setIsOpen(true);

      try {
        const result = await searchCities(trimmedQuery, controller.signal);
        setSuggestions(result.data);
        setActiveIndex(result.data.length ? 0 : -1);
      } catch (searchError) {
        if (searchError instanceof Error && searchError.name === "AbortError") {
          return;
        }

        setSuggestions([]);
        setActiveIndex(-1);
        setError(
          searchError instanceof Error
            ? searchError.message
            : "City search is unavailable right now. Please try again.",
        );
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }, 400);

    return () => {
      clearTimeout(debounce);
      controller.abort();
    };
  }, [needsSearch, retryCount, trimmedQuery]);

  function selectSuggestion(suggestion: CitySuggestion): void {
    onValueChange(suggestion.name);
    setDraftQuery(null);
    setSuggestions([]);
    setActiveIndex(-1);
    setIsOpen(false);
    setError("");
    inputRef.current?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key === "Escape") {
      setIsOpen(false);
      return;
    }

    if (event.key === "Tab") {
      setIsOpen(false);
      return;
    }

    if (!isOpen || !suggestions.length) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex(
        (current) => (current - 1 + suggestions.length) % suggestions.length,
      );
    } else if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setActiveIndex(suggestions.length - 1);
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      selectSuggestion(suggestions[activeIndex]);
    }
  }

  const activeOptionId =
    isOpen && activeIndex >= 0
      ? `${listboxId}-option-${suggestions[activeIndex]?.id}`
      : undefined;
  const statusMessage = isLoading
    ? "Searching for cities"
    : error
      ? error
      : suggestions.length
        ? `${suggestions.length} city suggestions available`
        : needsSearch
          ? "No Nigerian cities found"
          : "Type at least 2 characters to search";

  return (
    <div ref={rootRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          role="combobox"
          aria-activedescendant={activeOptionId}
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-describedby={describedBy}
          aria-expanded={isOpen}
          aria-invalid={invalid}
          autoComplete="off"
          className={cn(className, "pr-11")}
          onChange={(event) => {
            setDraftQuery(event.target.value);
            onValueChange("");
            setSuggestions([]);
            setActiveIndex(-1);
            setIsLoading(false);
            setError("");
            setIsOpen(true);
          }}
          onFocus={() => {
            if (trimmedQuery.length >= 2 && query !== value) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Start typing a Nigerian city"
          spellCheck={false}
          value={query}
        />
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted transition-transform",
            isOpen && "rotate-180",
          )}
        />
      </div>

      {isOpen ? (
        <div className="absolute left-0 right-0 z-[80] mt-2 overflow-hidden rounded-xl border border-border bg-bg shadow-xl">
          <div
            id={listboxId}
            role={
              suggestions.length > 0 && !isLoading && !error
                ? "listbox"
                : undefined
            }
            aria-label="Nigerian city suggestions"
            aria-busy={isLoading}
            className="max-h-72 overflow-y-auto p-2"
          >
            {trimmedQuery.length < 2 ? (
              <p className="px-3 py-4 font-body text-sm text-muted">
                Type at least 2 characters to search.
              </p>
            ) : isLoading ? (
              <div className="flex items-center gap-3 px-3 py-4 font-body text-sm text-muted">
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                Searching Nigerian cities...
              </div>
            ) : error ? (
              <div className="flex items-center justify-between gap-4 px-3 py-3">
                <p className="font-body text-sm leading-5 text-muted">{error}</p>
                <button
                  type="button"
                  className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-3 font-body text-sm font-bold text-primary outline-none hover:bg-surface focus-visible:ring-2 focus-visible:ring-accent"
                  onClick={() => setRetryCount((count) => count + 1)}
                >
                  <RefreshCw aria-hidden="true" className="size-4" />
                  Retry
                </button>
              </div>
            ) : suggestions.length ? (
              suggestions.map((suggestion, index) => {
                const optionId = `${listboxId}-option-${suggestion.id}`;
                const isActive = activeIndex === index;

                return (
                  <button
                    key={`${suggestion.id}-${suggestion.region}`}
                    id={optionId}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    className={cn(
                      "flex min-h-14 w-full items-center gap-3 rounded-lg px-3 py-2 text-left outline-none transition-colors",
                      isActive
                        ? "bg-primary text-white"
                        : "text-primary hover:bg-surface-soft",
                    )}
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => selectSuggestion(suggestion)}
                  >
                    <MapPin
                      aria-hidden="true"
                      className={cn(
                        "size-4 shrink-0",
                        isActive ? "text-accent" : "text-accent-alt",
                      )}
                    />
                    <span className="min-w-0">
                      <span
                        className={cn(
                          "block truncate font-body text-sm font-bold",
                          isActive ? "text-white" : "text-primary",
                        )}
                      >
                        {suggestion.name}
                      </span>
                      <span
                        className={cn(
                          "block truncate font-body text-xs",
                          isActive ? "text-white/75" : "text-muted",
                        )}
                      >
                        {suggestion.region}, Nigeria
                      </span>
                    </span>
                  </button>
                );
              })
            ) : (
              <p className="px-3 py-4 font-body text-sm text-muted">
                No Nigerian cities found. Check the spelling and try again.
              </p>
            )}
          </div>
        </div>
      ) : null}

      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {statusMessage}
      </span>
    </div>
  );
}

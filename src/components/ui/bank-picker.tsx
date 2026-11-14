"use client";

import { Check, ChevronDown, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import { cn } from "@/lib/utils";
import { type BankOption } from "@/lib/payout";

// === Types

interface BankPickerProps {
  banks: BankOption[];
  disabled?: boolean;
  id?: string;
  onChange: (bankCode: string) => void;
  placeholder?: string;
  value: string;
}

// === Component

/**
 * A bank picker with a filter box.
 *
 * Paystack lists a few hundred Nigerian institutions, which is past the point where a
 * plain select works: the wallets and microfinance banks most hosts use are buried far
 * down an alphabetical list. Typing narrows it instead.
 */
export default function BankPicker({
  banks,
  disabled = false,
  id,
  onChange,
  placeholder = "Select your bank",
  value,
}: BankPickerProps): ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const selected = banks.find((bank) => bank.code === value) ?? null;

  const matches = useMemo(() => {
    const trimmed = query.trim().toLowerCase();

    if (!trimmed) return banks;

    return banks.filter((bank) => bank.name.toLowerCase().includes(trimmed));
  }, [banks, query]);

  useEffect(() => {
    if (!isOpen) return;

    searchRef.current?.focus();

    const closeOnOutside = (event: MouseEvent): void => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent): void => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  const choose = (bankCode: string): void => {
    onChange(bankCode);
    setIsOpen(false);
    setQuery("");
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        id={id}
        disabled={disabled}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        onClick={() => setIsOpen((current) => !current)}
        className="mt-2 flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-white px-4 py-3 font-body text-base text-primary transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className={cn(!selected && "text-muted")}>
          {selected?.name ?? placeholder}
        </span>
        <ChevronDown
          size={18}
          aria-hidden="true"
          className="shrink-0 text-primary/60"
        />
      </button>

      {isOpen ? (
        <div className="absolute left-0 right-0 z-[120] mt-1.5 overflow-hidden rounded-xl bg-[var(--color-bg)] p-1.5 shadow-xl">
          <div className="flex items-center gap-2 rounded-lg bg-surface-soft px-3 py-2">
            <Search size={15} aria-hidden="true" className="text-muted" />
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search banks"
              aria-label="Search banks"
              className="w-full bg-transparent font-body text-sm text-primary outline-none placeholder:text-muted"
            />
          </div>

          <ul role="listbox" className="mt-1.5 max-h-64 overflow-y-auto">
            {matches.length === 0 ? (
              <li className="px-3 py-3 font-body text-sm text-muted">
                No bank matches &ldquo;{query.trim()}&rdquo;.
              </li>
            ) : (
              matches.map((bank) => (
                <li key={bank.code}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={bank.code === value}
                    onClick={() => choose(bank.code)}
                    className={cn(
                      "flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left font-body text-sm text-primary transition-all duration-150 ease-in-out hover:bg-primary/5 focus:outline-none focus-visible:bg-primary/5",
                      bank.code === value && "font-bold",
                    )}
                  >
                    {bank.name}
                    {bank.code === value ? (
                      <Check
                        size={16}
                        aria-hidden="true"
                        className="shrink-0 text-accent-alt"
                      />
                    ) : null}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

import type { ReactElement } from "react";
import { MapPin, Search } from "lucide-react";

export default function HeroSearchBar(): ReactElement {
  return (
    <div className="w-full overflow-hidden rounded-2xl bg-[var(--color-bg)] p-2 shadow-sm ring-1 ring-[var(--color-border)] lg:max-w-3xl">
      <div className="grid gap-2 sm:grid-cols-2 sm:items-center xl:grid-cols-[1.15fr_0.85fr_auto]">
        <label className="flex min-h-14 items-center gap-3 rounded-lg bg-[var(--color-surface-soft)] px-4 transition-all duration-200 ease-in-out focus-within:ring-2 focus-within:ring-[color-mix(in_srgb,var(--color-accent)_40%,transparent)]">
          <MapPin
            className="shrink-0 text-accent"
            size={20}
            aria-hidden="true"
          />
          <span className="sr-only">Location</span>
          <input
            type="text"
            placeholder="Where are you looking?"
            className="min-w-0 flex-1 bg-transparent font-body text-base text-primary outline-none placeholder:text-muted"
          />
        </label>

        <label className="flex min-h-14 items-center rounded-lg bg-[var(--color-surface-soft)] px-4 transition-all duration-200 ease-in-out focus-within:ring-2 focus-within:ring-[color-mix(in_srgb,var(--color-accent)_40%,transparent)]">
          <span className="sr-only">Property type</span>
          <select
            defaultValue=""
            className="w-full bg-transparent font-body text-base text-primary outline-none"
          >
            <option value="" disabled>
              Any type
            </option>
            <option value="apartment">Apartment</option>
            <option value="duplex">Duplex</option>
            <option value="studio">Studio</option>
            <option value="shortlet">Shortlet</option>
          </select>
        </label>

        <button
          type="button"
          className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-accent px-7 font-body text-base font-bold text-[var(--color-bg)] transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <Search size={18} aria-hidden="true" />
          Search
        </button>
      </div>
    </div>
  );
}

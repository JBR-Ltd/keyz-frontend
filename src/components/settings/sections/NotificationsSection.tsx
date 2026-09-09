"use client";

import { usePathname } from "next/navigation";
import type { ReactElement } from "react";
import { usePreferenceToggles } from "@/lib/preferences";

const INITIAL_PREFERENCES = [
  {
    id: "property",
    label: "Property recommendations",
    description: "New homes selected from your saved searches and activity.",
    defaultOn: true,
  },
  {
    id: "viewing",
    label: "Viewing reminders",
    description: "Schedule updates and reminders before an upcoming viewing.",
    defaultOn: true,
  },
  {
    id: "offers",
    label: "Offer updates",
    description: "Immediate changes to offers you have sent or received.",
    defaultOn: true,
  },
  {
    id: "editorial",
    label: "Rello editorial",
    description: "Occasional market notes, neighbourhood stories, and guides.",
    defaultOn: false,
  },
];

const LANDLORD_PREFERENCES = [
  {
    id: "bookings",
    label: "Booking requests",
    description: "New requests and changes across your active properties.",
    defaultOn: true,
  },
  {
    id: "listings",
    label: "Listing performance",
    description: "Views, saves, and activity summaries for your listings.",
    defaultOn: true,
  },
  {
    id: "payouts",
    label: "Payout updates",
    description: "Escrow releases and settlement updates for funded bookings.",
    defaultOn: true,
  },
  {
    id: "editorial",
    label: "Rello host notes",
    description:
      "Occasional market reports, hosting guidance, and product news.",
    defaultOn: false,
  },
];

export default function NotificationsSection(): ReactElement {
  const pathname = usePathname();
  const preferences = pathname.startsWith("/landlord")
    ? LANDLORD_PREFERENCES
    : INITIAL_PREFERENCES;
  const { error, isLoading, toggle, values } = usePreferenceToggles(
    "notify",
    preferences,
  );

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-bg shadow-sm">
      <div className="border-b border-border bg-surface-soft p-6 sm:p-8">
        <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-primary">
          Your attention
        </p>
        <h2 className="mt-3 font-display text-3xl font-bold leading-none text-primary sm:text-4xl">
          Notifications
        </h2>
        <p className="mt-4 max-w-2xl font-body text-sm leading-6 text-muted">
          Choose which updates deserve a place in your inbox. Critical account
          notices will always be delivered.
        </p>
        {error ? (
          <p className="mt-3 font-body text-sm text-red-700">{error}</p>
        ) : null}
      </div>

      <div className="px-5 sm:px-7">
        {preferences.map((preference) => (
          <div
            key={preference.id}
            className="grid gap-5 border-b border-border py-7 transition-all duration-200 ease-in-out hover:bg-surface-soft hover:shadow-sm sm:grid-cols-[1fr_auto] sm:items-center"
          >
            <div>
              <h2 className="font-body text-lg font-bold text-primary">
                {preference.label}
              </h2>
              <p className="mt-2 max-w-2xl font-body text-sm leading-6 text-muted">
                {preference.description}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={values[preference.id]}
              aria-label={`Toggle ${preference.label}`}
              disabled={isLoading}
              onClick={() => toggle(preference.id)}
              className={`relative h-7 w-12 rounded-full transition-all duration-200 ease-in-out hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50 ${
                values[preference.id] ? "bg-accent" : "bg-border"
              }`}
            >
              <span
                className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-200 ease-in-out ${
                  values[preference.id] ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

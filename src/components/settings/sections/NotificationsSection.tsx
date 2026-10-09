"use client";

import { usePathname } from "next/navigation";
import type { ReactElement } from "react";
import SettingsSectionHeader from "@/components/settings/SettingsSectionHeader";
import { usePreferenceToggles } from "@/lib/preferences";
import { Skeleton } from "@/components/ui/skeleton";

const INITIAL_PREFERENCES = [
  {
    id: "property",
    label: "Property recommendations",
    description: "Alerts when a new home matches one of your saved searches.",
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

/** How the moments that matter reach a phone. Stored as notify.sms and notify.whatsapp, which the backend reads. */
const TEXT_PREFERENCES = [
  {
    id: "sms",
    label: "Text messages",
    description:
      "Booking decisions, payment deadlines, payouts and reminders, texted as well as emailed.",
    defaultOn: true,
  },
  {
    id: "whatsapp",
    label: "Send texts by WhatsApp",
    description: "Receive those messages on WhatsApp instead of SMS.",
    defaultOn: false,
  },
];

export default function NotificationsSection(): ReactElement {
  const pathname = usePathname();
  const preferences = [
    ...(pathname.startsWith("/landlord") || pathname.startsWith("/agent")
      ? LANDLORD_PREFERENCES
      : INITIAL_PREFERENCES),
    ...TEXT_PREFERENCES,
  ];
  const { error, isLoading, toggle, values } = usePreferenceToggles(
    "notify",
    preferences,
  );

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-bg shadow-sm">
      <SettingsSectionHeader
        title="Notifications"
        description="Choose which updates reach you. Critical account notices are always delivered."
      />

      {error ? (
        <div className="border-b border-border bg-red-50 px-5 py-4 font-body text-sm text-red-700 sm:px-6">
          {error}
        </div>
      ) : null}

      <div className="px-5 sm:px-6">
        {isLoading
          ? preferences.map((preference) => (
              <div
                key={`loading-${preference.id}`}
                className="grid gap-5 border-b border-border py-6 sm:grid-cols-[1fr_auto] sm:items-center"
                aria-hidden="true"
              >
                <div>
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="mt-3 h-4 w-3/4" />
                </div>
                <Skeleton className="h-7 w-12 rounded-full" />
              </div>
            ))
          : preferences.map((preference) => (
              <div
                key={preference.id}
                className="grid gap-5 border-b border-border py-6 sm:grid-cols-[1fr_auto] sm:items-center"
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

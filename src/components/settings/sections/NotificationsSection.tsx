"use client";

import { useState } from "react";

const INITIAL_PREFERENCES = [
  {
    id: "property",
    label: "Property recommendations",
    description: "New homes selected from your saved searches and activity.",
    enabled: true,
  },
  {
    id: "viewing",
    label: "Viewing reminders",
    description: "Schedule updates and reminders before an upcoming viewing.",
    enabled: true,
  },
  {
    id: "offers",
    label: "Offer updates",
    description: "Immediate changes to offers you have sent or received.",
    enabled: true,
  },
  {
    id: "editorial",
    label: "Rello editorial",
    description: "Occasional market notes, neighbourhood stories, and guides.",
    enabled: false,
  },
];

export default function NotificationsSection() {
  const [preferences, setPreferences] = useState(INITIAL_PREFERENCES);

  const togglePreference = (id: string) => {
    setPreferences((current) =>
      current.map((preference) =>
        preference.id === id
          ? { ...preference, enabled: !preference.enabled }
          : preference,
      ),
    );
  };

  return (
    <section className="border border-primary">
      <div className="border-b border-primary bg-surface-soft p-6 sm:p-8">
        <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-accent-alt">
          Your attention
        </p>
        <h2 className="mt-3 font-display text-4xl font-bold leading-none text-primary">
          Notifications
        </h2>
        <p className="mt-4 max-w-2xl font-body text-sm leading-6 text-muted">
          Choose which updates deserve a place in your inbox. Critical account
          notices will always be delivered.
        </p>
      </div>

      <div className="px-5 sm:px-7">
          {preferences.map((preference) => (
            <div
              key={preference.id}
              className="grid gap-5 border-b border-primary py-7 sm:grid-cols-[1fr_auto] sm:items-center"
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
                aria-checked={preference.enabled}
                aria-label={`Toggle ${preference.label}`}
                onClick={() => togglePreference(preference.id)}
                className={`relative h-8 w-16 border border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  preference.enabled ? "bg-accent" : "bg-white"
                }`}
              >
                <span
                  className={`absolute top-1 h-6 w-6 bg-primary ${
                    preference.enabled ? "left-9" : "left-1"
                  }`}
                />
              </button>
            </div>
          ))}
      </div>
    </section>
  );
}

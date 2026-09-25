"use client";

import { usePathname } from "next/navigation";
import DataExportPanel from "@/components/settings/DataExportPanel";
import type { ReactElement } from "react";
import { usePreferenceToggles } from "@/lib/preferences";
import { Skeleton } from "@/components/ui/skeleton";

const INITIAL_CONTROLS = [
  {
    id: "discoverable",
    label: "Profile discovery",
    description:
      "Allow verified agents and property owners to contact you about relevant listings.",
    defaultOn: true,
  },
  {
    id: "activity",
    label: "Activity personalisation",
    description: "Use saved homes and searches to improve recommendations.",
    defaultOn: true,
  },
  {
    id: "analytics",
    label: "Product analytics",
    description: "Share anonymous usage data that helps improve Rello.",
    defaultOn: false,
  },
];

const LANDLORD_CONTROLS = [
  {
    id: "discoverable",
    label: "Profile discovery",
    description:
      "Allow verified tenants and agents to contact you about your active listings.",
    defaultOn: true,
  },
  {
    id: "activity",
    label: "Portfolio personalisation",
    description:
      "Use listing and booking activity to improve landlord recommendations.",
    defaultOn: true,
  },
  {
    id: "analytics",
    label: "Product analytics",
    description: "Share anonymous usage data that helps improve Rello.",
    defaultOn: false,
  },
];

export default function PrivacySection(): ReactElement {
  const pathname = usePathname();
  const isLandlord = pathname.startsWith("/landlord");
  const controls = isLandlord ? LANDLORD_CONTROLS : INITIAL_CONTROLS;
  const { error, isLoading, toggle, values } = usePreferenceToggles(
    "privacy",
    controls,
  );

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-bg shadow-sm">
      <div className="border-b border-border bg-surface-soft p-6 sm:p-8">
        <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-primary">
          Data controls
        </p>
        <h2 className="mt-3 font-display text-3xl font-bold leading-none text-primary sm:text-4xl">
          Privacy
        </h2>
        <p className="mt-4 max-w-2xl font-body text-sm leading-6 text-muted">
          {isLandlord
            ? "Decide how your portfolio activity supports recommendations and how verified renters can connect with you."
            : "Decide how your activity supports recommendations and how verified professionals can connect with you."}
        </p>
        {error ? (
          <p className="mt-3 font-body text-sm text-red-700">{error}</p>
        ) : null}
      </div>

      <div className="px-5 sm:px-7">
        {isLoading
          ? controls.map((control) => (
              <div
                key={`loading-${control.id}`}
                className="grid gap-5 border-b border-border py-7 sm:grid-cols-[1fr_auto] sm:items-center"
                aria-hidden="true"
              >
                <div>
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="mt-3 h-4 w-3/4" />
                </div>
                <Skeleton className="h-7 w-12 rounded-full" />
              </div>
            ))
          : controls.map((control) => (
              <div
                key={control.id}
                className="grid gap-5 border-b border-border py-7 transition-all duration-200 ease-in-out hover:bg-surface-soft hover:shadow-sm sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <div>
                  <h2 className="font-body text-lg font-bold text-primary">
                    {control.label}
                  </h2>
                  <p className="mt-2 max-w-2xl font-body text-sm leading-6 text-muted">
                    {control.description}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={values[control.id]}
                  aria-label={`Toggle ${control.label}`}
                  disabled={isLoading}
                  onClick={() => toggle(control.id)}
                  className={`relative h-7 w-12 rounded-full transition-all duration-200 ease-in-out hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50 ${
                    values[control.id] ? "bg-accent" : "bg-border"
                  }`}
                >
                  <span
                    className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-200 ease-in-out ${
                      values[control.id] ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            ))}
      </div>

      <DataExportPanel />
    </section>
  );
}

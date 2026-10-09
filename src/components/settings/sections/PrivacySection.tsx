"use client";

import { usePathname } from "next/navigation";
import DataExportPanel from "@/components/settings/DataExportPanel";
import type { ReactElement } from "react";
import SettingsSectionHeader from "@/components/settings/SettingsSectionHeader";
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
  const isHost =
    pathname.startsWith("/landlord") || pathname.startsWith("/agent");
  const controls = isHost ? LANDLORD_CONTROLS : INITIAL_CONTROLS;
  const { error, isLoading, toggle, values } = usePreferenceToggles(
    "privacy",
    controls,
  );

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-bg shadow-sm">
      <SettingsSectionHeader
        title="Privacy"
        description={
          isHost
            ? "Control how your portfolio supports recommendations and how verified renters can find you."
            : "Control discovery, personalisation, analytics, and your account data."
        }
      />

      {error ? (
        <div className="border-b border-border bg-red-50 px-5 py-4 font-body text-sm text-red-700 sm:px-6">
          {error}
        </div>
      ) : null}

      <div className="px-5 sm:px-6">
        {isLoading
          ? controls.map((control) => (
              <div
                key={`loading-${control.id}`}
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
          : controls.map((control) => (
              <div
                key={control.id}
                className="grid gap-5 border-b border-border py-6 sm:grid-cols-[1fr_auto] sm:items-center"
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

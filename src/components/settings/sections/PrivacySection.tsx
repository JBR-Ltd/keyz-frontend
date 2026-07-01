"use client";

import { Download } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/ui/toast";

const INITIAL_CONTROLS = [
  {
    id: "discoverable",
    label: "Profile discovery",
    description: "Allow verified agents to find your profile for matching homes.",
    enabled: true,
  },
  {
    id: "activity",
    label: "Activity personalisation",
    description: "Use saved homes and searches to improve recommendations.",
    enabled: true,
  },
  {
    id: "analytics",
    label: "Product analytics",
    description: "Share anonymous usage data that helps improve Rello.",
    enabled: false,
  },
];

export default function PrivacySection() {
  const [controls, setControls] = useState(INITIAL_CONTROLS);
  const { notify } = useToast();

  const toggleControl = (id: string) => {
    setControls((current) =>
      current.map((control) =>
        control.id === id
          ? { ...control, enabled: !control.enabled }
          : control,
      ),
    );
  };

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-bg shadow-sm">
      <div className="border-b border-border bg-surface-soft p-6 sm:p-8">
        <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-accent-alt">
          Data controls
        </p>
        <h2 className="mt-3 font-display text-3xl font-bold leading-none text-primary sm:text-4xl">
          Privacy
        </h2>
        <p className="mt-4 max-w-2xl font-body text-sm leading-6 text-muted">
          Decide how your activity supports recommendations and how verified
          professionals can connect with you.
        </p>
      </div>

      <div className="px-5 sm:px-7">
        {controls.map((control) => (
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
              aria-checked={control.enabled}
              aria-label={`Toggle ${control.label}`}
              onClick={() => toggleControl(control.id)}
              className={`relative h-7 w-12 rounded-full transition-all duration-200 ease-in-out hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                control.enabled ? "bg-accent" : "bg-border"
              }`}
            >
              <span
                className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-200 ease-in-out ${
                  control.enabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      <div className="grid border-t border-border lg:grid-cols-[1fr_auto]">
        <div className="p-6 sm:p-8">
          <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-accent-alt">
            Your archive
          </p>
          <h2 className="mt-4 font-display text-3xl font-bold leading-none text-primary sm:text-4xl">
            Take your data with you.
          </h2>
        </div>
        <div className="border-t border-border lg:w-72 lg:border-l lg:border-t-0">
          <button
            type="button"
            onClick={() =>
              notify({
                title: "Archive requested",
                description: "Your simulated data archive is being prepared.",
                variant: "success",
              })
            }
            className="flex min-h-16 h-full w-full items-center justify-center gap-3 rounded-full bg-accent px-6 py-4 font-body text-sm font-medium text-white transition-all duration-200 ease-in-out hover:scale-[1.02] hover:bg-accent-alt hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <Download size={18} />
            Download data
          </button>
        </div>
      </div>
    </section>
  );
}

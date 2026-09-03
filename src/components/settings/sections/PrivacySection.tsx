"use client";

import { Download, LoaderCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/ui/toast";

const INITIAL_CONTROLS = [
  {
    id: "discoverable",
    label: "Profile discovery",
    description:
      "Allow verified agents and property owners to contact you about relevant listings.",
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

const LANDLORD_CONTROLS = [
  {
    id: "discoverable",
    label: "Profile discovery",
    description:
      "Allow verified tenants and agents to contact you about your active listings.",
    enabled: true,
  },
  {
    id: "activity",
    label: "Portfolio personalisation",
    description:
      "Use listing and booking activity to improve landlord recommendations.",
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
  const pathname = usePathname();
  const isLandlord = pathname.startsWith("/landlord");
  const [controls, setControls] = useState(
    isLandlord ? LANDLORD_CONTROLS : INITIAL_CONTROLS,
  );
  const [isPreparingArchive, setIsPreparingArchive] = useState(false);
  const { notify } = useToast();

  const toggleControl = (id: string) => {
    setControls((current) =>
      current.map((control) =>
        control.id === id ? { ...control, enabled: !control.enabled } : control,
      ),
    );
  };

  const requestArchive = async (): Promise<void> => {
    setIsPreparingArchive(true);
    await new Promise((resolve) => setTimeout(resolve, 900));
    setIsPreparingArchive(false);
    notify({
      title: "Archive requested",
      description: "Your simulated data archive is being prepared.",
      variant: "success",
    });
  };

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

      <div className="grid gap-5 px-5 py-7 sm:grid-cols-[1fr_auto] sm:items-center sm:px-7">
        <div>
          <h2 className="font-body text-lg font-bold text-primary">
            Download your data
          </h2>
          <p className="mt-2 max-w-2xl font-body text-sm leading-6 text-muted">
            Request a copy of your profile, account activity, and personal
            information.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void requestArchive()}
          disabled={isPreparingArchive}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-primary/30 px-5 py-2.5 font-body text-sm font-bold text-primary transition-all duration-200 ease-in-out hover:border-primary hover:bg-primary hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-60"
        >
          {isPreparingArchive ? (
            <LoaderCircle className="animate-spin" size={17} />
          ) : (
            <Download size={17} />
          )}
          {isPreparingArchive ? "Preparing archive" : "Request archive"}
        </button>
      </div>
    </section>
  );
}

"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import ConfirmActionModal from "@/components/profile/ConfirmActionModal";
import type { ConfirmAction, PreferenceItem } from "@/components/profile/types";
import { useToast } from "@/components/ui/toast";

const INITIAL_PRIVACY_PREFERENCES: PreferenceItem[] = [
  {
    id: "visibility",
    label: "Profile Visibility",
    description: "Allow verified hosts to see your booking profile.",
    enabled: true,
  },
  {
    id: "activity",
    label: "Show Activity Status",
    description: "Show recent account activity during active bookings.",
    enabled: false,
  },
  {
    id: "data",
    label: "Data Sharing Preferences",
    description: "Use account data to personalize property recommendations.",
    enabled: true,
  },
];

function waitForMockAction(): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, 650));
}

export default function PrivacyTab() {
  const reduceMotion = useReducedMotion();
  const { notify } = useToast();
  const [preferences, setPreferences] = useState(INITIAL_PRIVACY_PREFERENCES);
  const [pendingId, setPendingId] = useState("");
  const [pendingAction, setPendingAction] = useState<ConfirmAction | null>(null);

  const handleToggle = (id: string): void => {
    setPendingId(id);

    window.setTimeout(() => {
      setPreferences((current) =>
        current.map((item) =>
          item.id === id ? { ...item, enabled: !item.enabled } : item,
        ),
      );
      setPendingId("");
      notify({
        title: "Privacy updated",
        description: "This setting is stored locally for now.",
        variant: "success",
      });
    }, 550);
  };

  const requestPrivacyAction = (
    title: string,
    description: string,
    confirmLabel: string,
  ): void => {
    setPendingAction({
      title,
      description,
      confirmLabel,
      onConfirm: async () => {
        await waitForMockAction();
        setPendingAction(null);
        notify({
          title: "Request confirmed",
          description: "No request was sent because this is UI-only.",
          variant: "success",
        });
      },
    });
  };

  return (
    <motion.section
      id="profile-panel-privacy"
      role="tabpanel"
      aria-labelledby="profile-tab-privacy"
      className="grid gap-8"
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={reduceMotion ? undefined : { opacity: 1 }}
      exit={reduceMotion ? undefined : { opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <section className="border border-primary bg-[var(--color-bg)] p-5 sm:p-7">
        <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-accent">
          Privacy
        </p>
        <h2 className="mt-3 font-display text-4xl font-bold leading-tight text-primary">
          Data controls
        </h2>

        <div className="mt-7 border border-surface">
          {preferences.map((item, index) => (
            <div
              key={item.id}
              className={`flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between ${
                index > 0 ? "border-t border-surface" : ""
              }`}
            >
              <div className="max-w-2xl">
                <h3 className="font-body text-base font-bold text-primary">
                  {item.label}
                </h3>
                <p className="mt-2 font-body text-sm leading-6 text-muted">
                  {item.description}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={item.enabled}
                disabled={pendingId === item.id}
                onClick={() => handleToggle(item.id)}
                className={`flex h-9 w-16 shrink-0 items-center border p-1 transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-70 ${
                  item.enabled
                    ? "border-primary bg-primary"
                    : "border-surface bg-[var(--color-bg)]"
                }`}
              >
                <span
                  className={`block h-5 w-6 border transition-all duration-200 ease-in-out ${
                    item.enabled
                      ? "translate-x-6 border-accent bg-accent"
                      : "translate-x-0 border-primary bg-[var(--color-bg)]"
                  }`}
                />
                <span className="sr-only">
                  {item.enabled ? "Disable" : "Enable"} {item.label}
                </span>
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="border border-primary bg-[var(--color-bg)] p-5 sm:p-7">
        <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-accent">
          Data Requests
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() =>
              requestPrivacyAction(
                "Download your data?",
                "A real account export would be prepared after confirmation.",
                "Download My Data",
              )
            }
            className="min-h-16 border border-primary px-5 py-4 text-left font-body text-sm font-bold text-primary transition-all duration-200 ease-in-out hover:border-accent hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Download My Data
          </button>
          <button
            type="button"
            onClick={() =>
              requestPrivacyAction(
                "Request account data deletion?",
                "A real deletion request would enter review before any data is removed.",
                "Request Deletion",
              )
            }
            className="min-h-16 border border-red-500 px-5 py-4 text-left font-body text-sm font-bold text-red-500 transition-all duration-200 ease-in-out hover:bg-red-500 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            Request Account Data Deletion
          </button>
        </div>
      </section>

      <ConfirmActionModal
        open={pendingAction !== null}
        title={pendingAction?.title ?? ""}
        description={pendingAction?.description ?? ""}
        confirmLabel={pendingAction?.confirmLabel ?? "Confirm"}
        onCancel={() => setPendingAction(null)}
        onConfirm={pendingAction?.onConfirm ?? waitForMockAction}
      />
    </motion.section>
  );
}

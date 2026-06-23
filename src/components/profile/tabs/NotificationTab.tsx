"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import type { PreferenceItem } from "@/components/profile/types";
import { useToast } from "@/components/ui/toast";

const INITIAL_NOTIFICATION_PREFERENCES: PreferenceItem[] = [
  {
    id: "email",
    label: "Email Notifications",
    description: "Receive reservation updates and account notices by email.",
    enabled: true,
  },
  {
    id: "sms",
    label: "SMS Notifications",
    description: "Get time-sensitive booking reminders by text.",
    enabled: true,
  },
  {
    id: "booking",
    label: "Booking Updates",
    description: "Track changes to upcoming stays and completed trips.",
    enabled: true,
  },
  {
    id: "marketing",
    label: "Marketing Communications",
    description: "Hear about new neighborhoods, homes, and Rello offers.",
    enabled: false,
  },
  {
    id: "price",
    label: "Price Alerts",
    description: "Know when saved homes change price or availability.",
    enabled: true,
  },
];

export default function NotificationTab() {
  const reduceMotion = useReducedMotion();
  const { notify } = useToast();
  const [preferences, setPreferences] = useState(INITIAL_NOTIFICATION_PREFERENCES);
  const [pendingId, setPendingId] = useState("");

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
        title: "Preference saved",
        description: "This setting is stored locally for now.",
        variant: "success",
      });
    }, 550);
  };

  return (
    <motion.section
      id="profile-panel-notification"
      role="tabpanel"
      aria-labelledby="profile-tab-notification"
      className="border border-primary bg-[var(--color-bg)] p-5 sm:p-7"
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={reduceMotion ? undefined : { opacity: 1 }}
      exit={reduceMotion ? undefined : { opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-accent">
        Notifications
      </p>
      <h2 className="mt-3 font-display text-4xl font-bold leading-tight text-primary">
        Contact preferences
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
    </motion.section>
  );
}

"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useState } from "react";
import SettingsStatStrip from "@/components/settings/SettingsStatStrip";
import SettingsTabBar from "@/components/settings/SettingsTabBar";
import NotificationsSection from "@/components/settings/sections/NotificationsSection";
import PaymentsSection from "@/components/settings/sections/PaymentsSection";
import PrivacySection from "@/components/settings/sections/PrivacySection";
import SecuritySection from "@/components/settings/sections/SecuritySection";
import { SettingsSectionId } from "@/components/settings/types";

const SECTION_COMPONENTS = {
  security: SecuritySection,
  notifications: NotificationsSection,
  payments: PaymentsSection,
  privacy: PrivacySection,
} satisfies Record<SettingsSectionId, React.ComponentType>;

export default function SettingsView() {
  const pathname = usePathname();
  const [activeSection, setActiveSection] =
    useState<SettingsSectionId>("security");
  const reduceMotion = useReducedMotion();
  const ActiveSection = SECTION_COMPONENTS[activeSection];
  const role = pathname.split("/")[1] as
    | "tenant"
    | "landlord"
    | "agent"
    | "admin";

  const showSection = (section: SettingsSectionId) => {
    setActiveSection(section);
  };

  return (
    <motion.main
      className="min-h-screen overflow-x-hidden bg-surface-soft px-5 py-12 sm:px-8 lg:px-10 lg:py-16"
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="mx-auto max-w-6xl">
        <header>
          <h1 className="font-display text-4xl font-bold leading-[0.92] text-primary sm:text-5xl">
            Account Settings
          </h1>
          <p className="mt-3 font-body text-base text-muted">
            Manage your account and preferences
          </p>
        </header>

        <div className="mt-8 overflow-hidden rounded-xl border border-border bg-bg shadow-sm">
          <SettingsTabBar
            activeSection={activeSection}
            onSectionChange={showSection}
          />
        </div>
        <SettingsStatStrip role={role} />

        <div className="mt-10">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeSection}
              initial={reduceMotion ? false : { opacity: 0, x: 8 }}
              animate={reduceMotion ? undefined : { opacity: 1, x: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, x: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <ActiveSection />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.main>
  );
}

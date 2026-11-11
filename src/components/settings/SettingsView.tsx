"use client";

import { motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactElement } from "react";
import SettingsTabBar from "@/components/settings/SettingsTabBar";
import NotificationsSection from "@/components/settings/sections/NotificationsSection";
import PaymentsSection from "@/components/settings/sections/PaymentsSection";
import PrivacySection from "@/components/settings/sections/PrivacySection";
import ProfileSection from "@/components/settings/sections/ProfileSection";
import SecuritySection from "@/components/settings/sections/SecuritySection";
import type { SettingsSectionId } from "@/components/settings/types";

interface SettingsViewProps {
  activeSection?: SettingsSectionId;
}

const SECTION_COMPONENTS = {
  security: SecuritySection,
  notifications: NotificationsSection,
  payments: PaymentsSection,
  privacy: PrivacySection,
} satisfies Record<Exclude<SettingsSectionId, "profile">, React.ComponentType>;

export default function SettingsView({
  activeSection = "profile",
}: SettingsViewProps): ReactElement {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const contentRef = useRef<HTMLDivElement>(null);
  const previousSectionRef = useRef(activeSection);

  useEffect(() => {
    if (previousSectionRef.current === activeSection) {
      return;
    }

    previousSectionRef.current = activeSection;
    contentRef.current?.focus();
  }, [activeSection]);

  const activeContent =
    activeSection === "profile" ? (
      <ProfileSection variant="settings" />
    ) : (
      (() => {
        const ActiveSection = SECTION_COMPONENTS[activeSection];
        return <ActiveSection />;
      })()
    );

  return (
    <motion.main
      className="min-h-screen overflow-x-hidden bg-surface-soft px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10"
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="mx-auto max-w-6xl">
        <header>
          <h1 className="font-display text-3xl font-bold leading-tight text-primary sm:text-4xl">
            Account settings
          </h1>
          <p className="mt-2 font-body text-sm leading-6 text-muted sm:text-base">
            Manage your account, security, payments, and preferences.
          </p>
        </header>

        <div className="mt-6 lg:hidden">
          <SettingsTabBar
            activeSection={activeSection}
            basePath={pathname}
            variant="mobile"
          />
        </div>

        <div className="mt-5 grid items-start gap-6 lg:mt-7 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-8">
          <SettingsTabBar
            activeSection={activeSection}
            basePath={pathname}
            variant="sidebar"
          />
          <motion.div
            ref={contentRef}
            key={activeSection}
            tabIndex={-1}
            className="min-w-0 scroll-mt-6 outline-none"
            initial={reduceMotion ? false : { opacity: 0, x: 8 }}
            animate={reduceMotion ? undefined : { opacity: 1, x: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            {activeContent}
          </motion.div>
        </div>
      </div>
    </motion.main>
  );
}

"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactElement } from "react";
import SettingsAccountCard from "@/components/settings/SettingsAccountCard";
import SettingsTabBar, {
  settingsTabLabel,
} from "@/components/settings/SettingsTabBar";
import NotificationsSection from "@/components/settings/sections/NotificationsSection";
import PaymentsSection from "@/components/settings/sections/PaymentsSection";
import PrivacySection from "@/components/settings/sections/PrivacySection";
import ProfileSection from "@/components/settings/sections/ProfileSection";
import SecuritySection from "@/components/settings/sections/SecuritySection";
import type { SettingsSectionId } from "@/components/settings/types";

interface SettingsViewProps {
  activeSection?: SettingsSectionId;
  /**
   * False when the address names no section. On a phone that shows the settings
   * home, a list of sections; on a wide screen Profile opens beside the menu.
   */
  hasChosenSection?: boolean;
}

const SECTION_COMPONENTS = {
  security: SecuritySection,
  notifications: NotificationsSection,
  payments: PaymentsSection,
  privacy: PrivacySection,
} satisfies Record<Exclude<SettingsSectionId, "profile">, React.ComponentType>;

export default function SettingsView({
  activeSection = "profile",
  hasChosenSection = true,
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
      className="min-h-screen overflow-x-hidden bg-surface-soft px-4 pb-28 pt-5 sm:px-8 sm:py-8 lg:px-10 lg:py-10"
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="mx-auto max-w-6xl">
        {/* Phone: the settings home, a list of sections like a phone's own settings app */}
        {!hasChosenSection ? (
          <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:hidden">
            <h1 className="font-display text-3xl font-bold leading-tight text-primary">
              Settings
            </h1>
            <SettingsAccountCard />
            <SettingsTabBar
              activeSection={activeSection}
              basePath={pathname}
              variant="list"
            />
          </div>
        ) : null}

        {/* Phone: one section on its own screen, with the way back to the list */}
        {hasChosenSection ? (
          <header className="mb-5 lg:hidden">
            <Link
              href={pathname}
              className="-ml-2 inline-flex min-h-11 items-center gap-1 rounded-full px-2 font-body text-sm font-bold text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <ChevronLeft size={20} aria-hidden="true" />
              Settings
            </Link>
            <h1 className="mt-1 font-display text-3xl font-bold leading-tight text-primary">
              {settingsTabLabel(activeSection)}
            </h1>
          </header>
        ) : null}

        <header className="hidden lg:block">
          <h1 className="font-display text-4xl font-bold leading-tight text-primary">
            Account settings
          </h1>
          <p className="mt-2 font-body text-base leading-6 text-muted">
            Manage your account, security, payments, and preferences.
          </p>
        </header>

        <div
          className={`items-start gap-8 lg:mt-7 lg:grid lg:grid-cols-[17rem_minmax(0,1fr)] ${
            hasChosenSection ? "" : "hidden"
          }`}
        >
          <aside className="sticky top-6 hidden gap-4 lg:grid">
            <SettingsAccountCard />
            <SettingsTabBar
              activeSection={activeSection}
              basePath={pathname}
              variant="sidebar"
            />
          </aside>
          <motion.div
            ref={contentRef}
            key={activeSection}
            tabIndex={-1}
            className="settings-content min-w-0 scroll-mt-6 outline-none"
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

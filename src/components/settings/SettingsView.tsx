"use client";

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
    <main className="min-h-screen overflow-x-hidden bg-surface-soft px-4 pb-28 pt-5 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-5xl">
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

        {/* Desktop: who is signed in beside the title, then the sections as tabs so the content gets the full width */}
        <header className="hidden items-center justify-between gap-8 pt-6 lg:flex">
          <div className="min-w-0">
            <h1 className="font-display text-4xl font-bold leading-tight text-primary">
              Account settings
            </h1>
            <p className="mt-2 font-body text-base leading-6 text-muted">
              Manage your account, security, payments, and preferences.
            </p>
          </div>
          <div className="w-80 shrink-0">
            <SettingsAccountCard />
          </div>
        </header>

        <div className="mt-8 hidden lg:block">
          <SettingsTabBar
            activeSection={activeSection}
            basePath={pathname}
            variant="tabs"
          />
        </div>

        <div className={`lg:mt-6 lg:block ${hasChosenSection ? "" : "hidden"}`}>
          <div
            ref={contentRef}
            tabIndex={-1}
            className="settings-content min-w-0 scroll-mt-6 outline-none"
          >
            {activeContent}
          </div>
        </div>
      </div>
    </main>
  );
}

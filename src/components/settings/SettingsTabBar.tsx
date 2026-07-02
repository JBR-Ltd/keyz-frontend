"use client";

import {
  BadgeCheck,
  Bell,
  CreditCard,
  LockKeyhole,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { SettingsSectionId } from "@/components/settings/types";

interface SettingsTabBarProps {
  activeSection: SettingsSectionId;
  onSectionChange: (section: SettingsSectionId) => void;
}

const SETTINGS_TABS = [
  { id: "profile", label: "Profile", icon: UserRound },
  { id: "security", label: "Security", icon: LockKeyhole },
  { id: "verification", label: "Verification", icon: BadgeCheck },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "privacy", label: "Privacy", icon: ShieldCheck },
] satisfies {
  id: SettingsSectionId;
  label: string;
  icon: typeof UserRound;
}[];

export default function SettingsTabBar({
  activeSection,
  onSectionChange,
}: SettingsTabBarProps) {
  const pathname = usePathname();
  const isTenant = pathname.startsWith("/tenant");
  const tabs = isTenant
    ? SETTINGS_TABS
    : SETTINGS_TABS.filter(({ id }) => id !== "verification");

  return (
    <div className="overflow-x-auto rounded-t-2xl bg-bg">
      <nav
        className="flex min-w-max border-b border-border"
        aria-label="Settings sections"
      >
        {tabs.map(({ id, label, icon: Icon }) => {
          const isActive = id === activeSection;

          return (
            <button
              key={id}
              type="button"
              onClick={() => onSectionChange(id)}
              aria-current={isActive ? "page" : undefined}
              className={`relative flex min-h-14 items-center justify-center gap-3 rounded-none px-5 py-3 font-body text-sm font-bold transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent ${
                isActive
                  ? "bg-primary text-white after:absolute after:inset-x-0 after:-bottom-px after:h-px after:bg-primary"
                  : "text-muted hover:bg-primary/5 hover:text-primary"
              }`}
            >
              <Icon size={18} strokeWidth={1.8} />
              {label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

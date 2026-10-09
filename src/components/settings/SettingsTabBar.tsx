import {
  Bell,
  CreditCard,
  LockKeyhole,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import type { ReactElement } from "react";
import type { SettingsSectionId } from "@/components/settings/types";

interface SettingsTabBarProps {
  activeSection: SettingsSectionId;
  basePath: string;
  variant: "mobile" | "sidebar";
}

const SETTINGS_TABS = [
  {
    id: "profile",
    label: "Profile",
    description: "Personal details and identity",
    icon: UserRound,
  },
  {
    id: "security",
    label: "Security",
    description: "Password, two-step sign-in and sessions",
    icon: LockKeyhole,
  },
  {
    id: "notifications",
    label: "Notifications",
    description: "Choose the updates you receive",
    icon: Bell,
  },
  {
    id: "payments",
    label: "Payments",
    description: "Payout details and payment history",
    icon: CreditCard,
  },
  {
    id: "privacy",
    label: "Privacy",
    description: "Discovery, personalisation and data",
    icon: ShieldCheck,
  },
] satisfies {
  id: SettingsSectionId;
  label: string;
  description: string;
  icon: typeof LockKeyhole;
}[];

export default function SettingsTabBar({
  activeSection,
  basePath,
  variant,
}: SettingsTabBarProps): ReactElement {
  if (variant === "mobile") {
    return (
      <div className="overflow-x-auto pb-1 lg:hidden">
        <nav
          className="flex min-w-max gap-2"
          aria-label="Account settings sections"
        >
          {SETTINGS_TABS.map(({ id, label, icon: Icon }) => {
            const isActive = id === activeSection;

            return (
              <Link
                key={id}
                href={`${basePath}?section=${id}`}
                scroll={false}
                aria-current={isActive ? "page" : undefined}
                className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 py-2.5 font-body text-sm font-bold transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  isActive
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-bg text-muted hover:border-primary/30 hover:text-primary"
                }`}
              >
                <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    );
  }

  return (
    <aside className="hidden lg:block">
      <nav
        className="sticky top-6 rounded-2xl border border-border bg-bg p-2 shadow-sm"
        aria-label="Account settings sections"
      >
        {SETTINGS_TABS.map(({ id, label, description, icon: Icon }) => {
          const isActive = id === activeSection;

          return (
            <Link
              key={id}
              href={`${basePath}?section=${id}`}
              scroll={false}
              aria-current={isActive ? "page" : undefined}
              className={`grid min-h-16 grid-cols-[2.25rem_1fr] items-start gap-3 rounded-xl px-3 py-3 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                isActive
                  ? "bg-primary text-white"
                  : "text-primary hover:bg-surface-soft"
              }`}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                  isActive ? "bg-white/10 text-accent" : "bg-surface-soft text-primary"
                }`}
              >
                <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
              </span>
              <span className="min-w-0 pt-0.5">
                <span className="block font-body text-sm font-bold">{label}</span>
                <span
                  className={`mt-1 block font-body text-xs leading-4 ${
                    isActive ? "text-white/70" : "text-muted"
                  }`}
                >
                  {description}
                </span>
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

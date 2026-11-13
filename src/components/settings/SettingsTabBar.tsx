"use client";

import {
  Bell,
  ChevronRight,
  CreditCard,
  LockKeyhole,
  LogOut,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactElement } from "react";
import type { SettingsSectionId } from "@/components/settings/types";
import { logOutAccount } from "@/lib/account";

interface SettingsTabBarProps {
  activeSection: SettingsSectionId;
  basePath: string;
  /** "list" is the phone's settings home; "sidebar" is the desktop menu beside the content. */
  variant: "list" | "sidebar";
}

interface SettingsTab {
  id: SettingsSectionId;
  label: string;
  description: string;
  icon: typeof LockKeyhole;
}

export const SETTINGS_TABS: SettingsTab[] = [
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
];

/** How the phone list groups the sections, the way a phone's own settings app does. */
const LIST_GROUPS: { title: string; ids: SettingsSectionId[] }[] = [
  { title: "Account", ids: ["profile", "security"] },
  { title: "Preferences", ids: ["notifications", "privacy"] },
  { title: "Money", ids: ["payments"] },
];

export function settingsTabLabel(id: SettingsSectionId): string {
  return SETTINGS_TABS.find((tab) => tab.id === id)?.label ?? "Settings";
}

function SignOutRow(): ReactElement {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  return (
    <button
      type="button"
      disabled={isSigningOut}
      onClick={async () => {
        setIsSigningOut(true);
        await logOutAccount();
        router.replace("/login");
      }}
      className="flex min-h-14 w-full items-center gap-3 rounded-2xl border border-border bg-bg px-4 font-body text-base font-bold text-red-700 transition-colors active:bg-red-700/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-700/10">
        <LogOut size={18} strokeWidth={1.9} aria-hidden="true" />
      </span>
      {isSigningOut ? "Signing out…" : "Sign out"}
    </button>
  );
}

export default function SettingsTabBar({
  activeSection,
  basePath,
  variant,
}: SettingsTabBarProps): ReactElement {
  if (variant === "list") {
    return (
      <nav
        className="grid grid-cols-[minmax(0,1fr)] gap-6"
        aria-label="Account settings sections"
      >
        {LIST_GROUPS.map((group) => (
          <section key={group.title}>
            <h2 className="px-1 font-body text-xs font-bold uppercase tracking-[0.14em] text-muted">
              {group.title}
            </h2>
            <ul className="mt-2 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-bg">
              {group.ids.map((id) => {
                const tab = SETTINGS_TABS.find((item) => item.id === id);

                if (!tab) return null;
                const Icon = tab.icon;

                return (
                  <li key={id}>
                    <Link
                      href={`${basePath}?section=${id}`}
                      className="flex min-h-16 items-center gap-3 px-4 py-3 transition-colors active:bg-surface-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-soft text-primary">
                        <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-body text-base font-bold text-primary">
                          {tab.label}
                        </span>
                        <span className="block truncate font-body text-sm text-muted">
                          {tab.description}
                        </span>
                      </span>
                      <ChevronRight
                        size={20}
                        className="shrink-0 text-muted"
                        aria-hidden="true"
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
        <SignOutRow />
      </nav>
    );
  }

  return (
    <nav
      className="rounded-2xl border border-border bg-bg p-2 shadow-sm"
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
                isActive
                  ? "bg-white/10 text-accent"
                  : "bg-surface-soft text-primary"
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
  );
}

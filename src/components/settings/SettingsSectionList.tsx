"use client";

import {
  BadgeCheck,
  Bell,
  ChevronRight,
  CreditCard,
  LockKeyhole,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { SettingsSectionId } from "@/components/settings/types";

interface SettingsSectionListProps {
  onSectionChange: (section: SettingsSectionId) => void;
}

const SETTINGS_SECTIONS = [
  {
    id: "profile",
    title: "Profile",
    description: "Update your personal details and contact information.",
    icon: UserRound,
  },
  {
    id: "security",
    title: "Security",
    description: "Manage your password and active sessions.",
    icon: LockKeyhole,
  },
  {
    id: "verification",
    title: "Tenant Verification",
    description: "Verify your NIN, BVN, and selfie liveness with Smile ID.",
    icon: BadgeCheck,
  },
  {
    id: "notifications",
    title: "Notifications",
    description: "Choose which account and property updates you receive.",
    icon: Bell,
  },
  {
    id: "payments",
    title: "Payments",
    description: "Review payment methods and previous transactions.",
    icon: CreditCard,
  },
  {
    id: "privacy",
    title: "Privacy",
    description: "Control discovery, personalisation, and your data archive.",
    icon: ShieldCheck,
  },
] satisfies {
  id: SettingsSectionId;
  title: string;
  description: string;
  icon: typeof UserRound;
}[];

export default function SettingsSectionList({
  onSectionChange,
}: SettingsSectionListProps) {
  const pathname = usePathname();
  const isTenant = pathname.startsWith("/tenant");
  const sections = isTenant
    ? SETTINGS_SECTIONS
    : SETTINGS_SECTIONS.filter(({ id }) => id !== "verification");

  return (
    <section className="grid gap-4">
      {sections.map(({ id, title, description, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onSectionChange(id)}
          className="grid w-full grid-cols-[3.25rem_1fr_auto] items-center gap-4 rounded-lg border border-primary/15 bg-[var(--color-bg)] px-4 py-4 text-left shadow-sm transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:bg-surface-soft hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:grid-cols-[3.5rem_1fr_auto] sm:px-5"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-soft text-primary sm:h-14 sm:w-14">
            <Icon size={24} strokeWidth={1.7} />
          </span>
          <span>
            <span className="block font-body text-lg font-bold text-primary">
              {title}
            </span>
            <span className="mt-1 block font-body text-sm leading-6 text-muted">
              {description}
            </span>
          </span>
          <ChevronRight size={22} className="text-primary" />
        </button>
      ))}
    </section>
  );
}

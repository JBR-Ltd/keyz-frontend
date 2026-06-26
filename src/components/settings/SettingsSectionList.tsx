import {
  Bell,
  ChevronRight,
  CreditCard,
  LockKeyhole,
  ShieldCheck,
  UserRound,
} from "lucide-react";
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
    description: "Manage your password, verification, and active sessions.",
    icon: LockKeyhole,
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
  return (
    <section className="grid gap-3">
      {SETTINGS_SECTIONS.map(({ id, title, description, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onSectionChange(id)}
          className="grid w-full grid-cols-[3.5rem_1fr_auto] items-center gap-5 border border-surface bg-[var(--color-bg)] px-5 py-5 text-left transition-all duration-200 ease-in-out hover:border-primary hover:bg-surface-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:px-7 sm:py-6"
        >
          <span className="flex h-14 w-14 items-center justify-center bg-surface-soft text-primary">
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

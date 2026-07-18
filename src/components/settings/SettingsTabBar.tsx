import {
  Bell,
  CreditCard,
  LockKeyhole,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { SettingsSectionId } from "@/components/settings/types";

interface SettingsTabBarProps {
  activeSection: SettingsSectionId;
  onSectionChange: (section: SettingsSectionId) => void;
}

const SETTINGS_TABS = [
  { id: "profile", label: "Profile", icon: UserRound },
  { id: "security", label: "Security", icon: LockKeyhole },
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
  return (
    <div className="overflow-x-auto rounded-t-xl bg-bg">
      <nav
        className="flex min-w-max border-b border-border"
        aria-label="Settings sections"
      >
        {SETTINGS_TABS.map(({ id, label, icon: Icon }) => {
          const isActive = id === activeSection;

          return (
            <button
              key={id}
              type="button"
              onClick={() => onSectionChange(id)}
              aria-current={isActive ? "page" : undefined}
              className={`relative flex min-h-14 items-center justify-center gap-3 rounded-none px-5 py-3 font-body text-sm font-bold transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent ${
                isActive
                  ? "text-primary after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-accent"
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

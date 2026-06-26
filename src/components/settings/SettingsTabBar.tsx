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
    <div className="overflow-x-auto">
      <nav
        className="grid min-w-[44rem] grid-cols-5 border border-primary"
        aria-label="Settings sections"
      >
        {SETTINGS_TABS.map(({ id, label, icon: Icon }, index) => {
          const isActive = id === activeSection;

          return (
            <button
              key={id}
              type="button"
              onClick={() => onSectionChange(id)}
              aria-current={isActive ? "page" : undefined}
              className={`flex min-h-13 items-center justify-center gap-3 px-4 py-3 font-body text-sm font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent ${
                index > 0 ? "border-l border-primary" : ""
              } ${
                isActive
                  ? "bg-primary text-white"
                  : "bg-[var(--color-bg)] text-muted transition-all duration-200 ease-in-out hover:bg-accent hover:text-primary"
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

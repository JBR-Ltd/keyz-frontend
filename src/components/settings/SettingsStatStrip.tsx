import { Bookmark, Building2, CalendarCheck, FileCheck2 } from "lucide-react";

interface SettingsStatStripProps {
  role: "tenant" | "landlord" | "agent" | "admin";
}

const ROLE_STATS = {
  tenant: [
    { value: "12", label: "Saved Homes", icon: Bookmark },
    { value: "04", label: "Active Viewings", icon: CalendarCheck },
    { value: "02", label: "Open Offers", icon: FileCheck2 },
  ],
  landlord: [
    { value: "08", label: "Active Listings", icon: Building2 },
    { value: "06", label: "Scheduled Viewings", icon: CalendarCheck },
    { value: "03", label: "Open Offers", icon: FileCheck2 },
  ],
  agent: [
    { value: "18", label: "Active Clients", icon: Building2 },
    { value: "09", label: "Scheduled Viewings", icon: CalendarCheck },
    { value: "05", label: "Open Deals", icon: FileCheck2 },
  ],
  admin: [
    { value: "248", label: "Active Users", icon: Building2 },
    { value: "14", label: "Pending Reviews", icon: CalendarCheck },
    { value: "07", label: "Open Disputes", icon: FileCheck2 },
  ],
};

export default function SettingsStatStrip({
  role,
}: SettingsStatStripProps) {
  return (
    <section className="grid border border-primary bg-[var(--color-bg)] sm:grid-cols-3">
      {ROLE_STATS[role].map(({ value, label, icon: Icon }, index) => (
        <div
          key={label}
          className={`grid grid-cols-[2.75rem_1fr] items-center gap-4 px-5 py-5 sm:grid-cols-[2.75rem_1fr] sm:px-6 ${
            index > 0
              ? "border-t border-primary sm:border-l sm:border-t-0"
              : ""
          }`}
        >
          <span className="flex h-11 w-11 items-center justify-center text-accent-alt">
            <Icon size={25} strokeWidth={1.7} />
          </span>
          <div>
            <p className="font-display text-3xl font-bold leading-none text-primary">
              {value}
            </p>
            <p className="mt-2 font-body text-xs text-muted sm:text-sm">
              {label}
            </p>
          </div>
        </div>
      ))}
    </section>
  );
}

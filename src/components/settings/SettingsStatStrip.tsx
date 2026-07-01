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
    <section className="mt-8 grid gap-5 sm:grid-cols-3">
      {ROLE_STATS[role].map(({ value, label, icon: Icon }) => (
        <article
          key={label}
          className="min-w-0 rounded-lg border border-primary/15 bg-[var(--color-bg)] p-5 shadow-sm transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:bg-surface-soft hover:shadow-md"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-surface-soft text-accent-alt">
            <Icon size={24} strokeWidth={1.7} />
          </span>
          <p className="mt-4 font-display text-3xl font-bold leading-none text-primary">
            {value}
          </p>
          <p className="mt-2 font-body text-xs font-medium uppercase tracking-[0.14em] text-muted">
            {label}
          </p>
        </article>
      ))}
    </section>
  );
}

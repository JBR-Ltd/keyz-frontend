import {
  Banknote,
  Bookmark,
  Building2,
  CalendarCheck,
  FileCheck2,
  Home,
  Percent,
  Trophy,
} from "lucide-react";

interface SettingsStatStripProps {
  role: "tenant" | "landlord" | "agent" | "admin";
}

const tenantPendingOffersCount = "01"; // Mirrors portfolio pendingOffersCount until settings uses live data.

const ROLE_STATS = {
  tenant: [
    { value: "12", label: "Saved Homes", icon: Bookmark },
    { value: "04", label: "Active Viewings", icon: CalendarCheck },
    { value: tenantPendingOffersCount, label: "Open Offers", icon: FileCheck2 },
  ],
  landlord: [
    { value: "08", label: "Active Listings", icon: Building2 },
    { value: "06", label: "Pending Requests", icon: FileCheck2 },
    { value: "₦4.8M", label: "Total Earnings", icon: Banknote },
    { value: "92%", label: "Occupancy Rate", icon: Percent },
  ],
  agent: [
    { value: "14", label: "Active Listings", icon: Building2 },
    { value: "05", label: "Pending Offers", icon: FileCheck2 },
    { value: "₦320M", label: "Total Sales Value", icon: Banknote },
    { value: "11", label: "Properties Sold", icon: Trophy },
  ],
  admin: [
    { value: "248", label: "Active Users", icon: Building2 },
    { value: "14", label: "Pending Reviews", icon: CalendarCheck },
    { value: "07", label: "Open Disputes", icon: FileCheck2 },
    { value: "36", label: "Listed Homes", icon: Home },
  ],
};

export default function SettingsStatStrip({ role }: SettingsStatStripProps) {
  const gridClass =
    role === "tenant" ? "sm:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-4";

  return (
    <section className={`mt-8 grid gap-5 ${gridClass}`}>
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

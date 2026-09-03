import {
  Banknote,
  Building2,
  CalendarCheck,
  FileCheck2,
  Home,
  Trophy,
} from "lucide-react";
import PropertyPrice from "@/components/property/PropertyPrice";
import { IconTile } from "@/components/ui/icon-tile";
import { utilityCardVariants } from "@/components/ui/utility-card";

interface SettingsStatStripProps {
  role: "tenant" | "landlord" | "agent" | "admin";
}

const ROLE_STATS = {
  agent: [
    { value: "14", label: "Active Listings", icon: Building2 },
    { value: "05", label: "Pending Offers", icon: FileCheck2 },
    { value: "₦320M", label: "Portfolio Value", icon: Banknote },
    { value: "11", label: "Completed Listings", icon: Trophy },
  ],
  admin: [
    { value: "248", label: "Active Users", icon: Building2 },
    { value: "14", label: "Pending Reviews", icon: CalendarCheck },
    { value: "07", label: "Open Disputes", icon: FileCheck2 },
    { value: "36", label: "Listed Homes", icon: Home },
  ],
};

export default function SettingsStatStrip({ role }: SettingsStatStripProps) {
  if (role === "tenant" || role === "landlord") {
    return null;
  }

  return (
    <section className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {ROLE_STATS[role].map(({ value, label, icon: Icon }) => (
        <article
          key={label}
          className={utilityCardVariants({ interactive: true })}
        >
          <IconTile tone="accent">
            <Icon size={24} strokeWidth={1.7} />
          </IconTile>
          <p className="mt-4 font-display text-3xl font-bold leading-none text-primary">
            {typeof value === "string" && value.startsWith("₦") ? (
              <PropertyPrice value={value} />
            ) : (
              value
            )}
          </p>
          <p className="mt-2 font-body text-xs font-medium uppercase tracking-[0.14em] text-muted">
            {label}
          </p>
        </article>
      ))}
    </section>
  );
}

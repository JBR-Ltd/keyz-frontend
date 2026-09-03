import { Building2, CalendarCheck, FileCheck2, Home } from "lucide-react";
import { IconTile } from "@/components/ui/icon-tile";
import { utilityCardVariants } from "@/components/ui/utility-card";

interface SettingsStatStripProps {
  role: "tenant" | "landlord" | "agent" | "admin";
}

const ROLE_STATS = {
  admin: [
    { value: "248", label: "Active Users", icon: Building2 },
    { value: "14", label: "Pending Reviews", icon: CalendarCheck },
    { value: "07", label: "Open Disputes", icon: FileCheck2 },
    { value: "36", label: "Listed Homes", icon: Home },
  ],
};

export default function SettingsStatStrip({ role }: SettingsStatStripProps) {
  if (role !== "admin") {
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

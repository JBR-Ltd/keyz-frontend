"use client";

import { BadgeCheck, Mail, MapPin } from "lucide-react";
import VerifiedBadge from "@/components/ui/VerifiedBadge";
import {
  isTenantVerified,
  useTenantVerificationSnapshot,
} from "@/lib/tenantVerification";
import { usePathname } from "next/navigation";

interface SettingsHeroProps {
  onViewProfile: () => void;
}

const ROLE_PROFILES = {
  tenant: {
    initials: "AO",
    name: "Jemimah",
    email: "amara.okafor@example.com",
    location: "Lagos, Nigeria",
  },
  landlord: {
    initials: "CO",
    name: "Chinedu",
    email: "chinedu.okafor@example.com",
    location: "Abuja, Nigeria",
  },
  agent: {
    initials: "TA",
    name: "Tomi",
    email: "tomi.adeyemi@example.com",
    location: "Port Harcourt, Nigeria",
  },
  admin: {
    initials: "AU",
    name: "Admin",
    email: "admin@rello.ng",
    location: "Nigeria",
  },
};

function getRoleFromPath(pathname: string): keyof typeof ROLE_PROFILES {
  const role = pathname.split("/")[1];

  if (role === "landlord" || role === "agent" || role === "admin") {
    return role;
  }

  return "tenant";
}

export default function SettingsHero({ onViewProfile }: SettingsHeroProps) {
  const pathname = usePathname();
  const role = getRoleFromPath(pathname);
  const profile = ROLE_PROFILES[role];
  const { state } = useTenantVerificationSnapshot();
  const showTenantVerifiedBadge = role === "tenant" && isTenantVerified(state);

  return (
    <section className="grid overflow-hidden rounded-b-xl bg-primary text-white lg:grid-cols-[8rem_1fr_19rem] lg:items-center">
      <div className="flex min-h-40 items-center justify-center px-6 pt-10 sm:justify-start sm:px-8 lg:min-h-0 lg:px-10 lg:py-10">
        <div className="flex h-28 w-28 items-center justify-center rounded-xl bg-[var(--color-bg)] font-display text-5xl font-bold text-primary shadow-md ring-4 ring-white/10">
          {profile.initials}
        </div>
      </div>

      <div className="px-6 py-8 sm:px-8 lg:px-6 lg:py-12">
        <p className="font-body text-sm text-white/70">Welcome back,</p>
        <h2 className="mt-3 font-display text-6xl font-bold leading-[0.88] tracking-[-0.03em] sm:text-7xl">
          {profile.name}
        </h2>
        {role === "tenant" ? (
          showTenantVerifiedBadge ? (
            <div className="mt-6">
              <VerifiedBadge />
            </div>
          ) : null
        ) : (
          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1.5 font-body text-xs font-medium text-primary">
            <BadgeCheck size={17} />
            Verified
          </div>
        )}
      </div>

      <div className="flex flex-col justify-center px-6 pb-10 pt-2 lg:px-8 lg:py-8">
        <div className="space-y-4 font-body text-sm text-white/70">
          <p className="flex items-center gap-3 break-all">
            <Mail size={17} className="shrink-0 text-accent" />
            {profile.email}
          </p>
          <p className="flex items-center gap-3">
            <MapPin size={17} className="shrink-0 text-accent" />
            {profile.location}
          </p>
        </div>
        <button
          type="button"
          onClick={onViewProfile}
          className="mt-6 min-h-12 self-start rounded-full bg-accent px-6 py-3 font-body text-sm font-medium text-primary transition-all duration-200 ease-in-out hover:scale-[1.02] hover:bg-primary hover:text-white hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          View profile
        </button>
      </div>
    </section>
  );
}

"use client";

import { BadgeCheck, Edit3, Home, Mail, Phone } from "lucide-react";
import type { ProfileContactItem, UserProfile } from "@/components/profile/types";

interface ProfileOverviewCardProps {
  profile: UserProfile;
  onEdit: () => void;
}

export default function ProfileOverviewCard({
  profile,
  onEdit,
}: ProfileOverviewCardProps) {
  const contactItems: ProfileContactItem[] = [
    { label: "Email", value: profile.email, icon: Mail },
    { label: "Phone", value: profile.phone, icon: Phone },
  ];

  return (
    <section className="h-full border border-surface bg-[var(--color-bg)] p-5 sm:p-7">
      <p className="font-display text-3xl font-bold leading-tight text-primary">
        Profile Overview
      </p>

      <div className="mt-7 flex flex-col gap-6 sm:flex-row sm:items-start">
        <div className="grid h-32 w-32 shrink-0 place-items-center border border-primary bg-primary font-display text-4xl font-bold text-white">
          {profile.name
            .split(" ")
            .map((part) => part[0])
            .join("")
            .slice(0, 2)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-display text-3xl font-bold leading-tight text-primary sm:text-4xl">
              {profile.name}
            </h2>
            {profile.verified ? (
              <span className="inline-flex items-center gap-2 border border-accent px-3 py-2 font-accent text-xs font-bold uppercase tracking-[0.22em] text-accent">
                <BadgeCheck size={16} />
                Verified
              </span>
            ) : null}
          </div>
          <p className="mt-3 flex items-center gap-2 font-accent text-xs font-bold uppercase tracking-[0.3em] text-muted">
            <Home size={15} />
            Resident Profile
          </p>

          <dl className="mt-6 grid gap-4">
            {contactItems.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className="grid gap-2 sm:grid-cols-[1.75rem_1fr] sm:items-start"
                >
                  <dt className="flex h-7 items-center text-primary">
                    <Icon size={16} />
                    <span className="sr-only">{item.label}</span>
                  </dt>
                  <dd className="min-w-0 font-body text-base font-bold leading-7 text-muted">
                    {item.value}
                  </dd>
                </div>
              );
            })}
          </dl>

          <button
            type="button"
            onClick={onEdit}
            className="mt-6 inline-flex min-h-12 items-center justify-center gap-3 border border-surface px-5 py-3 font-body text-base font-bold text-muted transition-all duration-200 ease-in-out hover:border-accent hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <Edit3 size={18} />
            Edit Profile
          </button>
        </div>
      </div>
    </section>
  );
}

"use client";

import {
  BadgeCheck,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/ui/toast";
import { useAuthenticatedUser } from "@/lib/account";

const inputClassName =
  "mt-2 min-h-14 w-full rounded-lg border border-border bg-bg px-4 py-3 font-body text-base text-[var(--color-text)] outline-none transition-all duration-200 ease-in-out placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/50";

export default function ProfileSection() {
  const pathname = usePathname();
  const isLandlord = pathname.startsWith("/landlord");
  const { user } = useAuthenticatedUser();
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState(
    isLandlord ? "Chinedu" : "Jemimah",
  );
  const [lastName, setLastName] = useState("Okafor");
  const [phone, setPhone] = useState(
    isLandlord ? "+234 809 555 0126" : "+234 803 555 0184",
  );
  const [location, setLocation] = useState(
    isLandlord ? "Abuja, Nigeria" : "Lagos, Nigeria",
  );
  const { notify } = useToast();
  const displayedFirstName = isEditing
    ? firstName
    : (user?.firstName ?? firstName);
  const displayedLastName = isEditing ? lastName : (user?.lastName ?? lastName);
  const fullName = [displayedFirstName, displayedLastName]
    .filter(Boolean)
    .join(" ");
  const email =
    user?.email ??
    (isLandlord ? "chinedu.okafor@example.com" : "amara.okafor@example.com");
  const initials = user
    ? [user.firstName.charAt(0), user.lastName.charAt(0)].join("").toUpperCase()
    : isLandlord
      ? "CO"
      : "AO";
  const pathnameRole = pathname.split("/")[1];
  const roleLabel =
    user?.role.toLowerCase() ??
    (pathnameRole === "landlord" ||
    pathnameRole === "agent" ||
    pathnameRole === "admin"
      ? pathnameRole
      : "tenant");
  const isVerified = user?.identityVerified ?? false;
  const canVerifyIdentity = roleLabel !== "admin";
  const verificationHref = "/" + roleLabel + "/verify";
  const profileFields = [
    {
      label: "First name",
      value: displayedFirstName,
      onChange: setFirstName,
      autoComplete: "given-name",
    },
    {
      label: "Last name",
      value: displayedLastName,
      onChange: setLastName,
      autoComplete: "family-name",
    },
    {
      label: "Phone",
      value: phone,
      onChange: setPhone,
      autoComplete: "tel",
    },
    {
      label: "Location",
      value: location,
      onChange: setLocation,
      autoComplete: "address-level2",
    },
  ];

  const startEditing = (): void => {
    if (user) {
      setFirstName(user.firstName);
      setLastName(user.lastName);
    }

    setIsEditing(true);
  };

  const saveProfile = () => {
    setIsEditing(false);
    notify({
      title: "Profile updated",
      description: "Your local profile details have been saved.",
      variant: "success",
    });
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-bg shadow-sm">
      <div className="relative overflow-hidden bg-primary px-6 py-8 text-white sm:px-8 sm:py-10">
        <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-accent/15 blur-2xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white font-display text-2xl font-bold text-primary shadow-lg ring-4 ring-white/10 sm:h-24 sm:w-24 sm:text-3xl">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="font-body text-sm text-white/65">Your account</p>
              <h2 className="mt-1 truncate font-display text-3xl font-bold leading-tight sm:text-4xl">
                {fullName}
              </h2>
              <p className="mt-2 font-body text-sm capitalize text-white/70">
                {roleLabel} account
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 font-body text-xs font-bold ${isVerified ? "bg-accent text-primary" : "bg-white/10 text-white"}`}
            >
              {isVerified ? <BadgeCheck size={15} /> : null}
              {isVerified ? "Verified" : "Not verified"}
            </div>
            {!isEditing ? (
              <button
                type="button"
                onClick={startEditing}
                className="min-h-10 rounded-full border border-white/25 px-4 py-2 font-body text-sm font-bold text-white transition-all duration-200 ease-in-out hover:border-accent hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Edit profile
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {!isVerified && canVerifyIdentity ? (
        <div className="border-b border-border bg-accent/10 px-6 py-5 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
                <ShieldCheck size={21} aria-hidden="true" />
              </span>
              <div>
                <h3 className="font-body text-sm font-bold text-primary">
                  Identity verification required
                </h3>
                <p className="mt-1 max-w-2xl font-body text-sm leading-6 text-muted">
                  Verify your identity to access protected property actions and
                  strengthen trust across your account.
                </p>
              </div>
            </div>
            <Link
              href={verificationHref}
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-primary px-5 py-2.5 font-body text-sm font-bold text-white transition-all duration-200 ease-in-out hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Verify identity
            </Link>
          </div>
        </div>
      ) : null}

      <div className="border-b border-border px-6 py-7 sm:px-8">
        <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-accent-alt">
          Personal information
        </p>
        <h3 className="mt-3 font-display text-2xl font-bold leading-tight text-primary sm:text-3xl">
          Profile details
        </h3>
        <p className="mt-4 max-w-2xl font-body text-sm leading-6 text-muted">
          {isLandlord
            ? "Keep your ownership and contact details accurate so tenants and agents can reach you about bookings and property requests."
            : "Keep your contact details accurate so agents and property owners can reach you about viewings and offers."}
        </p>
      </div>

      <div className="p-6 sm:p-8">
        <div className="grid gap-4 border-b border-border pb-6 sm:grid-cols-2">
          <div className="rounded-xl bg-surface-soft p-4">
            <span className="flex items-center gap-2 font-body text-xs font-bold uppercase tracking-[0.14em] text-muted">
              <Mail size={14} /> Email address
            </span>
            <span className="mt-2 block break-words font-body text-sm font-semibold text-primary">
              {email}
            </span>
          </div>
          <div className="rounded-xl bg-surface-soft p-4">
            <span className="flex items-center gap-2 font-body text-xs font-bold uppercase tracking-[0.14em] text-muted">
              <MapPin size={14} /> Location
            </span>
            <span className="mt-2 block font-body text-sm font-semibold text-primary">
              {location}
            </span>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {profileFields.map((field) => (
            <label
              key={field.label}
              className="min-w-0 rounded-xl border border-border bg-bg p-5 transition-all duration-200 ease-in-out hover:border-primary/30 hover:bg-surface-soft"
            >
              <span className="flex items-center gap-2 font-body text-xs font-medium uppercase tracking-[0.14em] text-muted">
                {field.label === "Phone" ? (
                  <Phone size={14} />
                ) : field.label === "Location" ? (
                  <MapPin size={14} />
                ) : (
                  <UserRound size={14} />
                )}
                {field.label}
              </span>
              {isEditing ? (
                <input
                  value={field.value}
                  onChange={(event) => field.onChange(event.target.value)}
                  autoComplete={field.autoComplete}
                  className={inputClassName}
                />
              ) : (
                <span className="mt-3 block break-words font-body text-base font-semibold text-primary">
                  {field.value}
                </span>
              )}
            </label>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={saveProfile}
                className="min-h-12 rounded-full bg-accent px-6 py-3 font-body text-sm font-medium text-primary transition-all duration-200 ease-in-out hover:scale-[1.02] hover:bg-primary hover:text-white hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Save changes
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="min-h-12 rounded-full border border-primary/30 px-6 py-3 font-body text-sm font-medium text-primary transition-all duration-200 ease-in-out hover:scale-[1.02] hover:bg-primary/10 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Cancel
              </button>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}

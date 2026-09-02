"use client";

import { BadgeCheck, Mail, MapPin, Phone, UserRound } from "lucide-react";
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
  const roleLabel =
    user?.role.toLowerCase() ?? (isLandlord ? "landlord" : "tenant");
  const isVerified = user?.identityVerified ?? false;
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
    <section className="overflow-hidden rounded-lg border border-border bg-bg shadow-sm">
      <div className="grid gap-6 border-b border-border bg-surface-soft p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-primary">
            Personal information
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold leading-none text-primary sm:text-4xl">
            Profile details
          </h2>
          <p className="mt-4 max-w-2xl font-body text-sm leading-6 text-muted">
            {isLandlord
              ? "Keep your ownership and contact details accurate so tenants and agents can reach you about bookings and property requests."
              : "Keep your contact details accurate so agents and property owners can reach you about viewings and offers."}
          </p>
        </div>
        <div
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 font-body text-xs font-medium text-primary ${
            isVerified ? "bg-accent" : "bg-primary/5"
          }`}
        >
          {isVerified ? <BadgeCheck size={15} /> : null}
          {isVerified ? "Verified" : "Not verified"} {roleLabel}
        </div>
      </div>

      <div className="p-5 sm:p-7">
        <div className="grid gap-5 rounded-lg border border-border bg-surface-soft p-5 sm:grid-cols-[4.5rem_1fr] sm:items-center sm:p-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary font-display text-2xl font-bold text-white shadow-sm">
            {initials}
          </div>
          <div className="min-w-0">
            <h3 className="font-display text-2xl font-bold text-primary">
              {fullName}
            </h3>
            <div className="mt-3 flex flex-wrap gap-3 font-body text-sm text-muted">
              <span className="inline-flex items-center gap-2">
                <Mail size={15} className="text-primary/60" />
                {email}
              </span>
              <span className="inline-flex items-center gap-2">
                <MapPin size={15} className="text-primary/60" />
                {location}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {profileFields.map((field) => (
            <label
              key={field.label}
              className="min-w-0 rounded-lg border border-border bg-bg p-5 shadow-sm transition-all duration-200 ease-in-out hover:bg-surface-soft hover:shadow-md"
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
          ) : (
            <button
              type="button"
              onClick={startEditing}
              className="min-h-12 rounded-full bg-accent px-6 py-3 font-body text-sm font-medium text-primary transition-all duration-200 ease-in-out hover:scale-[1.02] hover:bg-primary hover:text-white hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Edit profile
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

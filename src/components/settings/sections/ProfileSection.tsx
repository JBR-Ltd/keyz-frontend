"use client";

import { BadgeCheck, Mail, MapPin, Phone, UserRound } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/ui/toast";

const inputClassName =
  "mt-2 min-h-14 w-full rounded-xl border border-border bg-bg px-4 py-3 font-body text-base text-[var(--color-text)] outline-none transition-all duration-200 ease-in-out placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/50";

export default function ProfileSection() {
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState("Jemimah");
  const [lastName, setLastName] = useState("Okafor");
  const [phone, setPhone] = useState("+234 803 555 0184");
  const [location, setLocation] = useState("Lagos, Nigeria");
  const { notify } = useToast();
  const fullName = `${firstName} ${lastName}`;
  const profileFields = [
    {
      label: "First name",
      value: firstName,
      onChange: setFirstName,
      autoComplete: "given-name",
    },
    {
      label: "Last name",
      value: lastName,
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

  const saveProfile = () => {
    setIsEditing(false);
    notify({
      title: "Profile updated",
      description: "Your local profile details have been saved.",
      variant: "success",
    });
  };

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-bg shadow-sm">
      <div className="grid gap-6 border-b border-border bg-surface-soft p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-accent-alt">
            Personal information
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold leading-none text-primary sm:text-4xl">
            Profile details
          </h2>
          <p className="mt-4 max-w-2xl font-body text-sm leading-6 text-muted">
            Keep your contact details accurate so agents and property owners can
            reach you about viewings and offers.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1.5 font-body text-xs font-medium text-white">
          <BadgeCheck size={15} />
          Verified tenant
        </div>
      </div>

      <div className="p-5 sm:p-7">
        <div className="grid gap-5 rounded-2xl border border-border bg-primary/5 p-5 sm:grid-cols-[4.5rem_1fr] sm:items-center sm:p-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary font-display text-2xl font-bold text-white shadow-sm">
            AO
          </div>
          <div className="min-w-0">
            <h3 className="font-display text-2xl font-bold text-primary">
              {fullName}
            </h3>
            <div className="mt-3 flex flex-wrap gap-3 font-body text-sm text-muted">
              <span className="inline-flex items-center gap-2">
                <Mail size={15} className="text-primary/60" />
                amara.okafor@example.com
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
              className="min-w-0 rounded-xl border border-border bg-bg p-5 shadow-sm transition-all duration-200 ease-in-out hover:bg-surface-soft hover:shadow-md"
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
                className="min-h-12 rounded-full bg-accent px-6 py-3 font-body text-sm font-medium text-white transition-all duration-200 ease-in-out hover:scale-[1.02] hover:bg-accent-alt hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
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
              onClick={() => setIsEditing(true)}
              className="min-h-12 rounded-full bg-accent px-6 py-3 font-body text-sm font-medium text-white transition-all duration-200 ease-in-out hover:scale-[1.02] hover:bg-accent-alt hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Edit profile
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

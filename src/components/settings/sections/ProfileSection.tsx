"use client";

import {
  AtSign,
  BadgeCheck,
  Camera,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState, type ReactElement } from "react";
import { useToast } from "@/components/ui/toast";
import {
  updateProfile,
  uploadAvatar,
  useAuthenticatedUser,
  type AuthenticatedUser,
  type ProfileEdit,
} from "@/lib/account";

const inputClassName =
  "mt-2 min-h-14 w-full rounded-lg border border-border bg-bg px-4 py-3 font-body text-base text-[var(--color-text)] outline-none transition-all duration-200 ease-in-out placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/50";

interface ProfileDraft {
  city: string;
  firstName: string;
  lastName: string;
  phone: string;
  username: string;
}

function draftFrom(user: AuthenticatedUser | null): ProfileDraft {
  return {
    city: user?.city ?? "",
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    phone: user?.phone ?? "",
    username: user?.username ?? "",
  };
}

export default function ProfileSection(): ReactElement {
  const { notify } = useToast();
  const { user: loadedUser, isLoading } = useAuthenticatedUser();
  const fileInputRef = useRef<HTMLInputElement>(null);

  /** Set on every save, so the screen shows what the server accepted. */
  const [savedUser, setSavedUser] = useState<AuthenticatedUser | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [draft, setDraft] = useState<ProfileDraft>(draftFrom(null));

  const user = savedUser ?? loadedUser;
  const roleLabel = (user?.role ?? "tenant").toLowerCase();
  const isVerified = user?.identityVerified ?? false;
  const canVerifyIdentity = roleLabel !== "admin";
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ");
  const initials = user
    ? [user.firstName.charAt(0), user.lastName.charAt(0)].join("").toUpperCase()
    : "";

  // Seeded when editing opens rather than in an effect, so the draft is only
  // ever written in response to something the person did
  const startEditing = (): void => {
    setDraft(draftFrom(user));
    setIsEditing(true);
  };

  const save = async (): Promise<void> => {
    const original = draftFrom(user);
    // Only what actually changed: sending a field back unchanged is how a blank
    // one gets rejected for being blank
    const edit: ProfileEdit = {};

    if (draft.city !== original.city) {
      edit.city = draft.city.trim();
    }

    if (draft.phone !== original.phone) {
      edit.phone = draft.phone.trim();
    }

    if (draft.username !== original.username) {
      edit.username = draft.username.trim();
    }

    // A verified name is fixed, so it is never sent
    if (!isVerified) {
      if (draft.firstName !== original.firstName) {
        edit.firstName = draft.firstName.trim();
      }

      if (draft.lastName !== original.lastName) {
        edit.lastName = draft.lastName.trim();
      }
    }

    if (Object.keys(edit).length === 0) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    const result = await updateProfile(edit);
    setIsSaving(false);

    if (!result.success) {
      notify({
        title: "Not saved",
        description: result.message,
        variant: "error",
      });
      return;
    }

    setSavedUser(result.user);
    setIsEditing(false);
    notify({ title: "Profile updated", variant: "success" });
  };

  const changePhoto = async (file: File | undefined): Promise<void> => {
    if (!file) {
      return;
    }

    setIsUploading(true);
    const result = await uploadAvatar(file);
    setIsUploading(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    if (!result.success) {
      notify({
        title: "Photo not saved",
        description: result.message,
        variant: "error",
      });
      return;
    }

    setSavedUser(result.user);
    notify({ title: "Photo updated", variant: "success" });
  };

  const details = [
    {
      label: "First name",
      icon: <UserRound size={14} />,
      value: draft.firstName,
      display: user?.firstName ?? "",
      locked: isVerified,
      autoComplete: "given-name",
      onChange: (value: string) =>
        setDraft((current) => ({ ...current, firstName: value })),
    },
    {
      label: "Last name",
      icon: <UserRound size={14} />,
      value: draft.lastName,
      display: user?.lastName ?? "",
      locked: isVerified,
      autoComplete: "family-name",
      onChange: (value: string) =>
        setDraft((current) => ({ ...current, lastName: value })),
    },
    {
      label: "Username",
      icon: <AtSign size={14} />,
      value: draft.username,
      display: user?.username ?? "Not set",
      locked: false,
      autoComplete: "username",
      onChange: (value: string) =>
        setDraft((current) => ({ ...current, username: value })),
    },
    {
      label: "Phone",
      icon: <Phone size={14} />,
      value: draft.phone,
      display: user?.phone ?? "Not set",
      locked: false,
      autoComplete: "tel",
      onChange: (value: string) =>
        setDraft((current) => ({ ...current, phone: value })),
    },
    {
      label: "City",
      icon: <MapPin size={14} />,
      value: draft.city,
      display: user?.city ?? "Not set",
      locked: false,
      autoComplete: "address-level2",
      onChange: (value: string) =>
        setDraft((current) => ({ ...current, city: value })),
    },
  ];

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-bg shadow-sm">
      <div className="relative overflow-hidden bg-primary px-6 py-8 text-white sm:px-8 sm:py-10">
        <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-accent/15 blur-2xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4 sm:gap-5">
            <label className="group relative flex h-20 w-20 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-2xl bg-white font-display text-2xl font-bold text-primary shadow-lg ring-4 ring-white/10 focus-within:ring-accent sm:h-24 sm:w-24 sm:text-3xl">
              {user?.avatarUrl ? (
                <Image
                  src={user.avatarUrl}
                  alt=""
                  fill
                  unoptimized
                  sizes="96px"
                  className="object-cover"
                />
              ) : (
                <span>{initials}</span>
              )}
              <span className="absolute inset-0 flex items-center justify-center bg-primary/60 opacity-0 transition-opacity group-hover:opacity-100">
                {isUploading ? (
                  <Loader2 size={20} className="animate-spin text-white" />
                ) : (
                  <Camera size={20} className="text-white" aria-hidden="true" />
                )}
              </span>
              <span className="sr-only">Change your photo</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={isUploading}
                onChange={(event) => void changePhoto(event.target.files?.[0])}
                className="sr-only"
              />
            </label>
            <div className="min-w-0">
              <p className="font-body text-sm text-white/65">Your account</p>
              <h2 className="mt-1 truncate font-display text-3xl font-bold leading-tight sm:text-4xl">
                {isLoading && !user ? "Loading..." : fullName}
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
                disabled={!user}
                className="min-h-10 rounded-full border border-white/25 px-4 py-2 font-body text-sm font-bold text-white transition-all duration-200 ease-in-out hover:border-accent hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
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
                  Verifying is what unlocks listing, booking and payouts. Your
                  name is taken from the ID and fixed afterwards.
                </p>
              </div>
            </div>
            <Link
              href={`/${roleLabel}/verify`}
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
          {isVerified
            ? "Your name matches the ID you verified with, and stays as it is. Everything else is yours to change."
            : "Keep your contact details accurate so the other side of a booking can reach you."}
        </p>
      </div>

      <div className="p-6 sm:p-8">
        <div className="grid gap-4 border-b border-border pb-6 sm:grid-cols-2">
          <div className="rounded-xl bg-surface-soft p-4">
            <span className="flex items-center gap-2 font-body text-xs font-bold uppercase tracking-[0.14em] text-muted">
              <Mail size={14} /> Email address
            </span>
            <span className="mt-2 block break-words font-body text-sm font-semibold text-primary">
              {user?.email ?? ""}
            </span>
          </div>
          <div className="rounded-xl bg-surface-soft p-4">
            <span className="flex items-center gap-2 font-body text-xs font-bold uppercase tracking-[0.14em] text-muted">
              <ShieldCheck size={14} /> Trust
            </span>
            <span className="mt-2 block font-body text-sm font-semibold text-primary">
              {isVerified ? "Identity verified" : "Not verified yet"}
            </span>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {details.map((field) => (
            <label
              key={field.label}
              className="min-w-0 rounded-xl border border-border bg-bg p-5 transition-all duration-200 ease-in-out hover:border-primary/30 hover:bg-surface-soft"
            >
              <span className="flex items-center gap-2 font-body text-xs font-medium uppercase tracking-[0.14em] text-muted">
                {field.icon}
                {field.label}
                {isEditing && field.locked ? (
                  <Lock size={12} aria-hidden="true" />
                ) : null}
              </span>
              {isEditing && !field.locked ? (
                <input
                  value={field.value}
                  onChange={(event) => field.onChange(event.target.value)}
                  autoComplete={field.autoComplete}
                  className={inputClassName}
                />
              ) : (
                <span className="mt-3 block break-words font-body text-base font-semibold text-primary">
                  {field.display}
                </span>
              )}
            </label>
          ))}
        </div>

        {isEditing ? (
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void save()}
              disabled={isSaving}
              className="flex min-h-12 items-center gap-2 rounded-full bg-accent px-6 py-3 font-body text-sm font-medium text-primary transition-all duration-200 ease-in-out hover:scale-[1.02] hover:bg-primary hover:text-white hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-70"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : null}
              Save changes
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="min-h-12 rounded-full border border-primary/30 px-6 py-3 font-body text-sm font-medium text-primary transition-all duration-200 ease-in-out hover:scale-[1.02] hover:bg-primary/10 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Cancel
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

"use client";

import {
  AtSign,
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
import { AsyncButtonContent } from "@/components/ui/async-button-content";
import { Skeleton } from "@/components/ui/skeleton";
import VerifiedBadge from "@/components/ui/VerifiedBadge";
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

function ProfileSectionSkeleton(): ReactElement {
  return (
    <section
      className="space-y-8"
      role="status"
      aria-label="Loading profile"
    >
      <div className="border-b border-border pb-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <Skeleton className="h-24 w-24 shrink-0 rounded-full sm:h-28 sm:w-28" />
          <div className="min-w-0 flex-1">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="mt-4 h-10 w-64 max-w-full" />
            <Skeleton className="mt-4 h-5 w-full max-w-xl" />
            <Skeleton className="mt-2 h-5 w-3/4 max-w-md" />
          </div>
          <Skeleton className="h-11 w-28 rounded-full" />
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-bg shadow-sm">
        <div className="border-b border-border p-6 sm:p-8">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="mt-4 h-4 w-3/4" />
        </div>
        <div className="p-6 sm:p-8">
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 7 }, (_, index) => (
              <div
                key={`profile-field-${index + 1}`}
                className="rounded-xl border border-border p-5"
              >
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-4 h-5 w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <span className="sr-only">Loading profile</span>
    </section>
  );
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
    const result = await updateProfile(edit).finally(() => {
      setIsSaving(false);
    });

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

  if (isLoading && !user) {
    return <ProfileSectionSkeleton />;
  }

  return (
    <section className="space-y-8">
      <header className="border-b border-border pb-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
          <label className="group relative flex h-24 w-24 shrink-0 cursor-pointer items-center justify-center rounded-full bg-primary font-display text-3xl font-bold text-white shadow-sm ring-4 ring-bg focus-within:outline-none focus-within:ring-accent sm:h-28 sm:w-28 sm:text-4xl">
            <span className="absolute inset-0 overflow-hidden rounded-full">
              {user?.avatarUrl ? (
                <Image
                  src={user.avatarUrl}
                  alt=""
                  fill
                  unoptimized
                  sizes="112px"
                  className="object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center">
                  {initials}
                </span>
              )}
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-primary/50 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100 motion-reduce:transition-none">
                {isUploading ? (
                  <Loader2 size={20} className="animate-spin text-white" />
                ) : (
                  <Camera size={20} className="text-white" aria-hidden="true" />
                )}
              </span>
            </span>
            <span className="absolute bottom-0 right-0 flex h-10 w-10 items-center justify-center rounded-full border-4 border-surface-soft bg-accent text-primary shadow-sm transition-colors group-hover:bg-primary group-hover:text-white group-focus-within:bg-primary group-focus-within:text-white">
              {isUploading ? (
                <Loader2
                  size={17}
                  className="animate-spin motion-reduce:animate-none"
                  aria-hidden="true"
                />
              ) : (
                <Camera size={17} aria-hidden="true" />
              )}
            </span>
            <span className="sr-only">
              {isUploading ? "Uploading profile photo" : "Change profile photo"}
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={isUploading}
              onChange={(event) => void changePhoto(event.target.files?.[0])}
              className="sr-only"
            />
          </label>

          <div className="min-w-0 flex-1">
            <p className="font-accent text-xs font-bold uppercase tracking-[0.22em] text-accent-alt">
              {roleLabel}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="break-words font-display text-4xl font-bold leading-tight text-primary sm:text-5xl">
                {fullName}
              </h1>
              {isVerified ? (
                <VerifiedBadge size="md" />
              ) : (
                <span className="inline-flex min-h-8 items-center rounded-full bg-bg px-3 py-1.5 font-body text-xs font-semibold text-muted">
                  Verification not completed
                </span>
              )}
            </div>
            <p className="mt-4 max-w-2xl font-body text-base leading-7 text-muted">
              Manage your personal details, account identity, and profile photo.
            </p>
          </div>

          {!isEditing ? (
            <button
              type="button"
              onClick={startEditing}
              disabled={!user}
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border border-primary/25 px-5 py-2.5 font-body text-sm font-bold text-primary transition-colors duration-200 hover:border-primary hover:bg-primary hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
            >
              Edit profile
            </button>
          ) : null}
        </div>
      </header>

      {!isVerified && canVerifyIdentity ? (
        <div className="rounded-2xl border border-accent/30 bg-accent/10 px-5 py-5 sm:px-6">
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

      <div className="overflow-hidden rounded-2xl border border-border bg-bg shadow-sm">
        <div className="border-b border-border px-6 py-6 sm:px-8">
          <h2 className="font-display text-2xl font-bold leading-tight text-primary sm:text-3xl">
            Profile details
          </h2>
          <p className="mt-3 max-w-2xl font-body text-sm leading-6 text-muted">
            {isVerified
              ? "Your verified name cannot be changed. You can update your other profile details."
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
                aria-busy={isSaving}
                className="flex min-h-12 items-center gap-2 rounded-full bg-accent px-6 py-3 font-body text-sm font-medium text-primary transition-all duration-200 ease-in-out hover:scale-[1.02] hover:bg-primary hover:text-white hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-70"
              >
                <AsyncButtonContent
                  isPending={isSaving}
                  pendingLabel="Saving profile…"
                >
                  Save changes
                </AsyncButtonContent>
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
      </div>
    </section>
  );
}

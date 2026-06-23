"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import type { UserProfile } from "@/components/profile/types";
import { useToast } from "@/components/ui/toast";

interface ProfileTabProps {
  profile: UserProfile;
  editing: boolean;
  onEditingChange: (editing: boolean) => void;
  onSave: (profile: UserProfile) => void;
}

interface ProfileFormErrors {
  name?: string;
  email?: string;
  phone?: string;
}

function waitForMockAction(): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, 650));
}

function validateProfile(values: UserProfile): ProfileFormErrors {
  const errors: ProfileFormErrors = {};

  if (!values.name.trim()) {
    errors.name = "Name is required";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = "Enter a valid email address";
  }

  if (!values.phone.trim()) {
    errors.phone = "Phone is required";
  }

  return errors;
}

export default function ProfileTab({
  profile,
  editing,
  onEditingChange,
  onSave,
}: ProfileTabProps) {
  const reduceMotion = useReducedMotion();
  const { notify } = useToast();
  const [formValues, setFormValues] = useState(profile);
  const [errors, setErrors] = useState<ProfileFormErrors>({});
  const [saving, setSaving] = useState(false);

  const handleChange = (
    field: keyof UserProfile,
    value: string | boolean,
  ): void => {
    setFormValues((current) => ({ ...current, [field]: value }));
  };

  const handleEdit = (): void => {
    setFormValues(profile);
    setErrors({});
    onEditingChange(true);
  };

  const handleCancel = (): void => {
    setFormValues(profile);
    setErrors({});
    onEditingChange(false);
  };

  const handleSave = async (): Promise<void> => {
    const nextErrors = validateProfile(formValues);

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSaving(true);
    await waitForMockAction();
    onSave(formValues);
    setSaving(false);
    onEditingChange(false);
    notify({
      title: "Profile updated",
      description: "Your profile details are ready for the next API pass.",
      variant: "success",
    });
  };

  const displayValues = editing ? formValues : profile;
  const fields = [
    { id: "name", label: "Name", type: "text", value: displayValues.name },
    { id: "email", label: "Email", type: "email", value: displayValues.email },
    { id: "phone", label: "Phone", type: "tel", value: displayValues.phone },
  ] as const;

  return (
    <motion.section
      id="profile-panel-profile"
      role="tabpanel"
      aria-labelledby="profile-tab-profile"
      className="border border-primary bg-[var(--color-bg)] p-5 sm:p-7"
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={reduceMotion ? undefined : { opacity: 1 }}
      exit={reduceMotion ? undefined : { opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <div className="flex flex-col gap-4 border-b border-surface pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-accent">
            Profile
          </p>
          <h2 className="mt-3 font-display text-4xl font-bold leading-tight text-primary">
            Personal details
          </h2>
        </div>
        {!editing ? (
          <button
            type="button"
            onClick={handleEdit}
            className="inline-flex min-h-11 items-center justify-center border border-primary px-5 py-3 font-body text-sm font-bold text-primary transition-all duration-200 ease-in-out hover:border-accent hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Edit Profile
          </button>
        ) : null}
      </div>

      <div className="mt-6 grid gap-5">
        {fields.map((field) => {
          const error = errors[field.id];

          return (
            <label key={field.id} className="block" htmlFor={`profile-${field.id}`}>
              <span className="font-body text-sm font-bold text-primary">
                {field.label}
              </span>
              {editing ? (
                <>
                  <input
                    id={`profile-${field.id}`}
                    type={field.type}
                    value={field.value}
                    onChange={(event) =>
                      handleChange(field.id, event.currentTarget.value)
                    }
                    aria-invalid={error ? "true" : "false"}
                    aria-describedby={
                      error ? `profile-${field.id}-error` : undefined
                    }
                    className="mt-2 min-h-14 w-full border border-surface bg-[var(--color-bg)] px-4 py-3 font-body text-base text-[var(--color-text)] outline-none transition-all duration-200 ease-in-out focus:border-primary focus:ring-2 focus:ring-accent/30"
                  />
                  <AnimatePresence>
                    {error ? (
                      <motion.p
                        id={`profile-${field.id}-error`}
                        className="mt-2 font-body text-sm font-bold text-red-500"
                        initial={reduceMotion ? false : { opacity: 0, y: -4 }}
                        animate={
                          reduceMotion ? undefined : { opacity: 1, y: 0 }
                        }
                        exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                      >
                        {error}
                      </motion.p>
                    ) : null}
                  </AnimatePresence>
                </>
              ) : (
                <span className="mt-2 block border border-surface px-4 py-4 font-body text-base text-[var(--color-text)]">
                  {field.value}
                </span>
              )}
            </label>
          );
        })}
      </div>

      {editing ? (
        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleCancel}
            disabled={saving}
            className="inline-flex min-h-12 items-center justify-center border border-primary px-5 py-3 font-body text-sm font-bold text-primary transition-all duration-200 ease-in-out hover:border-accent hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-70"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex min-h-12 items-center justify-center bg-primary px-5 py-3 font-body text-sm font-bold text-white transition-all duration-200 ease-in-out hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? "Please wait..." : "Save Changes"}
          </button>
        </div>
      ) : null}
    </motion.section>
  );
}

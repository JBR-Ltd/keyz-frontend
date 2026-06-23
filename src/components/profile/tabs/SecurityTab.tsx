"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Eye, EyeOff, ShieldCheck, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ConfirmActionModal from "@/components/profile/ConfirmActionModal";
import type { ConfirmAction, SessionItem } from "@/components/profile/types";
import { useToast } from "@/components/ui/toast";

const MOCK_SESSIONS: SessionItem[] = [
  {
    id: "macbook",
    device: "MacBook Pro",
    location: "Lagos, Nigeria",
    lastActive: "Active now",
  },
  {
    id: "iphone",
    device: "iPhone 15",
    location: "Abuja, Nigeria",
    lastActive: "2 hours ago",
  },
  {
    id: "chrome",
    device: "Chrome on Windows",
    location: "Accra, Ghana",
    lastActive: "May 31, 2026",
  },
];

interface PasswordValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface PasswordErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

function waitForMockAction(delay = 650): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, delay));
}

function validatePassword(values: PasswordValues): PasswordErrors {
  const errors: PasswordErrors = {};

  if (!values.currentPassword) {
    errors.currentPassword = "Current password is required";
  }

  if (values.newPassword.length < 8) {
    errors.newPassword = "Use at least 8 characters";
  }

  if (values.confirmPassword !== values.newPassword) {
    errors.confirmPassword = "Passwords must match";
  }

  return errors;
}

function useEscapeClose(open: boolean, onClose: () => void): void {
  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);
}

export default function SecurityTab() {
  const reduceMotion = useReducedMotion();
  const { notify } = useToast();
  const passwordPanelRef = useRef<HTMLDivElement>(null);
  const sessionsPanelRef = useRef<HTMLDivElement>(null);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorMessage, setTwoFactorMessage] = useState("");
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [sessionsOpen, setSessionsOpen] = useState(false);
  const [passwordValues, setPasswordValues] = useState<PasswordValues>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState<PasswordErrors>({});
  const [visibleFields, setVisibleFields] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [sessions, setSessions] = useState(MOCK_SESSIONS);
  const [pendingAction, setPendingAction] = useState<ConfirmAction | null>(null);

  useEscapeClose(passwordOpen, () => setPasswordOpen(false));
  useEscapeClose(sessionsOpen, () => setSessionsOpen(false));

  useEffect(() => {
    if (passwordOpen) {
      passwordPanelRef.current?.focus();
    }
  }, [passwordOpen]);

  useEffect(() => {
    if (sessionsOpen) {
      sessionsPanelRef.current?.focus();
    }
  }, [sessionsOpen]);

  const handleTwoFactor = async (): Promise<void> => {
    setTwoFactorLoading(true);
    await waitForMockAction(550);
    setTwoFactorEnabled((current) => !current);
    setTwoFactorMessage(
      twoFactorEnabled
        ? "Two-factor authentication is disabled."
        : "Two-factor authentication is enabled.",
    );
    setTwoFactorLoading(false);
  };

  const handlePasswordChange = (
    field: keyof PasswordValues,
    value: string,
  ): void => {
    setPasswordValues((current) => ({ ...current, [field]: value }));
  };

  const handlePasswordSave = async (): Promise<void> => {
    const nextErrors = validatePassword(passwordValues);

    setPasswordErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setPasswordSaving(true);
    await waitForMockAction();
    setPasswordSaving(false);
    setPasswordOpen(false);
    setPasswordValues({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setPasswordErrors({});
    notify({
      title: "Password updated",
      description: "This mock action will connect to account security later.",
      variant: "success",
    });
  };

  const requestSessionRevoke = (session: SessionItem): void => {
    setPendingAction({
      title: "Revoke this session?",
      description: `${session.device} in ${session.location} will be signed out locally in this mock flow.`,
      confirmLabel: "Revoke Session",
      onConfirm: async () => {
        await waitForMockAction();
        setSessions((current) =>
          current.filter((item) => item.id !== session.id),
        );
        setPendingAction(null);
        notify({
          title: "Session revoked",
          description: `${session.device} has been removed from the list.`,
          variant: "success",
        });
      },
    });
  };

  const requestAccountAction = (
    title: string,
    description: string,
    confirmLabel: string,
  ): void => {
    setPendingAction({
      title,
      description,
      confirmLabel,
      onConfirm: async () => {
        await waitForMockAction();
        setPendingAction(null);
        notify({
          title: "Action confirmed",
          description: "No account change was sent because this is UI-only.",
          variant: "success",
        });
      },
    });
  };

  const securityRows = [
    {
      title: "Change Password",
      description: "Update the password used to access this account.",
      action: "Change",
      onClick: () => setPasswordOpen(true),
    },
    {
      title: "Two-Factor Authentication",
      description: "Add a second step before sensitive account access.",
      action: twoFactorEnabled ? "Disable" : "Enable",
      onClick: handleTwoFactor,
      loading: twoFactorLoading,
    },
    {
      title: "Login Sessions",
      description: "Review devices that recently accessed your account.",
      action: "Manage",
      onClick: () => setSessionsOpen(true),
    },
  ];

  const passwordFields = [
    {
      id: "currentPassword",
      label: "Current Password",
      autoComplete: "current-password",
    },
    {
      id: "newPassword",
      label: "New Password",
      autoComplete: "new-password",
    },
    {
      id: "confirmPassword",
      label: "Confirm New Password",
      autoComplete: "new-password",
    },
  ] as const;

  return (
    <motion.section
      id="profile-panel-security"
      role="tabpanel"
      aria-labelledby="profile-tab-security"
      className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)] lg:items-start"
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={reduceMotion ? undefined : { opacity: 1 }}
      exit={reduceMotion ? undefined : { opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <section className="border border-surface bg-[var(--color-bg)]">
        <div className="p-5 sm:p-7">
          <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-accent">
            Security
          </p>
          <h2 className="mt-3 font-display text-4xl font-bold leading-tight text-primary">
            Account protection
          </h2>
        </div>

        <div className="border-t border-surface">
          {securityRows.map((row, index) => (
            <div
              key={row.title}
              className={`grid gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_9rem] sm:items-center sm:p-7 ${
                index > 0 ? "border-t border-surface" : ""
              }`}
            >
              <div className="max-w-2xl">
                <h3 className="font-body text-base font-bold text-primary">
                  {row.title}
                </h3>
                <p className="mt-2 font-body text-sm leading-6 text-muted">
                  {row.description}
                </p>
                {row.title === "Two-Factor Authentication" &&
                twoFactorMessage ? (
                  <p className="mt-2 font-body text-sm font-bold text-accent">
                    {twoFactorMessage}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={row.onClick}
                disabled={row.loading}
                className="inline-flex min-h-11 items-center justify-center bg-primary px-5 py-3 font-body text-sm font-bold text-white transition-all duration-200 ease-in-out hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-70"
              >
                {row.loading ? "Please wait..." : row.action}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="border border-red-500 bg-[var(--color-bg)]">
        <div className="p-5 sm:p-7">
          <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-red-500">
            Danger Zone
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold leading-tight text-red-500">
            Account actions
          </h2>
        </div>
        <div className="border-t border-red-500">
          <div className="grid gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_9rem] sm:items-center sm:p-7">
            <div>
              <h3 className="font-body text-base font-bold text-red-500">
                Deactivate Account
              </h3>
              <p className="mt-2 font-body text-sm leading-6 text-muted">
                Hide your profile and pause account activity.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                requestAccountAction(
                  "Deactivate account?",
                  "Your profile would be paused after confirmation in the real account flow.",
                  "Deactivate Account",
                )
              }
              className="inline-flex min-h-11 items-center justify-center bg-red-500 px-5 py-3 font-body text-sm font-bold text-white transition-all duration-200 ease-in-out hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            >
              Deactivate
            </button>
          </div>
          <div className="grid gap-4 border-t border-red-500 p-5 sm:grid-cols-[minmax(0,1fr)_9rem] sm:items-center sm:p-7">
            <div>
              <h3 className="font-body text-base font-bold text-red-500">
                Delete Account
              </h3>
              <p className="mt-2 font-body text-sm leading-6 text-muted">
                Permanently remove your profile after a final confirmation.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                requestAccountAction(
                  "Delete account?",
                  "This destructive action would require backend confirmation before anything is removed.",
                  "Delete Account",
                )
              }
              className="inline-flex min-h-11 items-center justify-center bg-red-500 px-5 py-3 font-body text-sm font-bold text-white transition-all duration-200 ease-in-out hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            >
              Delete
            </button>
          </div>
        </div>
      </section>

      <AnimatePresence>
        {passwordOpen ? (
          <motion.div
            className="fixed inset-0 z-[60] flex min-h-screen items-center justify-center bg-black/50 p-4"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={reduceMotion ? undefined : { opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setPasswordOpen(false);
              }
            }}
          >
            <motion.div
              ref={passwordPanelRef}
              className="w-full max-w-xl border border-primary bg-[var(--color-bg)] p-6 shadow-[6px_6px_0_var(--color-primary)] outline-none"
              initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
              animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="password-modal-title"
              tabIndex={-1}
            >
              <div className="flex items-start justify-between gap-4">
                <ShieldCheck className="text-accent" size={28} />
                <button
                  type="button"
                  aria-label="Close password dialog"
                  onClick={() => setPasswordOpen(false)}
                  className="flex h-10 w-10 items-center justify-center border border-surface text-primary transition-all duration-200 ease-in-out hover:border-accent hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <X size={18} />
                </button>
              </div>
              <h2
                id="password-modal-title"
                className="mt-6 font-display text-3xl font-bold leading-tight text-primary"
              >
                Change password
              </h2>
              <div className="mt-6 grid gap-5">
                {passwordFields.map((field) => {
                  const visible = visibleFields[field.id];
                  const error = passwordErrors[field.id];

                  return (
                    <label
                      key={field.id}
                      className="block"
                      htmlFor={`security-${field.id}`}
                    >
                      <span className="font-body text-sm font-bold text-primary">
                        {field.label}
                      </span>
                      <span className="relative mt-2 block">
                        <input
                          id={`security-${field.id}`}
                          type={visible ? "text" : "password"}
                          value={passwordValues[field.id]}
                          autoComplete={field.autoComplete}
                          onChange={(event) =>
                            handlePasswordChange(
                              field.id,
                              event.currentTarget.value,
                            )
                          }
                          aria-invalid={error ? "true" : "false"}
                          aria-describedby={
                            error ? `security-${field.id}-error` : undefined
                          }
                          className="min-h-14 w-full border border-surface bg-[var(--color-bg)] px-4 py-3 pr-14 font-body text-base text-[var(--color-text)] outline-none transition-all duration-200 ease-in-out focus:border-primary focus:ring-2 focus:ring-accent/30"
                        />
                        <button
                          type="button"
                          aria-label={visible ? "Hide password" : "Show password"}
                          onClick={() =>
                            setVisibleFields((current) => ({
                              ...current,
                              [field.id]: !current[field.id],
                            }))
                          }
                          className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-primary transition-all duration-200 ease-in-out hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                        >
                          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </span>
                      {error ? (
                        <p
                          id={`security-${field.id}-error`}
                          className="mt-2 font-body text-sm font-bold text-red-500"
                        >
                          {error}
                        </p>
                      ) : null}
                    </label>
                  );
                })}
              </div>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setPasswordOpen(false)}
                  disabled={passwordSaving}
                  className="inline-flex min-h-12 items-center justify-center border border-primary px-5 py-3 font-body text-sm font-bold text-primary transition-all duration-200 ease-in-out hover:border-accent hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-70"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePasswordSave}
                  disabled={passwordSaving}
                  className="inline-flex min-h-12 items-center justify-center bg-primary px-5 py-3 font-body text-sm font-bold text-white transition-all duration-200 ease-in-out hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {passwordSaving ? "Please wait..." : "Save Password"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {sessionsOpen ? (
          <motion.div
            className="fixed inset-0 z-[60] flex min-h-screen items-center justify-center bg-black/50 p-4"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={reduceMotion ? undefined : { opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setSessionsOpen(false);
              }
            }}
          >
            <motion.div
              ref={sessionsPanelRef}
              className="max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto border border-primary bg-[var(--color-bg)] p-6 shadow-[6px_6px_0_var(--color-primary)] outline-none"
              initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
              animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="sessions-modal-title"
              tabIndex={-1}
            >
              <div className="flex items-start justify-between gap-4">
                <h2
                  id="sessions-modal-title"
                  className="font-display text-3xl font-bold leading-tight text-primary"
                >
                  Login sessions
                </h2>
                <button
                  type="button"
                  aria-label="Close sessions dialog"
                  onClick={() => setSessionsOpen(false)}
                  className="flex h-10 w-10 items-center justify-center border border-surface text-primary transition-all duration-200 ease-in-out hover:border-accent hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="mt-6 border border-surface">
                {sessions.map((session, index) => (
                  <div
                    key={session.id}
                    className={`flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between ${
                      index > 0 ? "border-t border-surface" : ""
                    }`}
                  >
                    <div>
                      <h3 className="font-body text-base font-bold text-primary">
                        {session.device}
                      </h3>
                      <p className="mt-2 font-body text-sm leading-6 text-muted">
                        {session.location}, {session.lastActive}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => requestSessionRevoke(session)}
                      className="inline-flex min-h-11 items-center justify-center bg-red-500 px-5 py-3 font-body text-sm font-bold text-white transition-all duration-200 ease-in-out hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                    >
                      Revoke
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <ConfirmActionModal
        open={pendingAction !== null}
        title={pendingAction?.title ?? ""}
        description={pendingAction?.description ?? ""}
        confirmLabel={pendingAction?.confirmLabel ?? "Confirm"}
        onCancel={() => setPendingAction(null)}
        onConfirm={pendingAction?.onConfirm ?? waitForMockAction}
      />
    </motion.section>
  );
}

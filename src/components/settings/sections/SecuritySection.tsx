"use client";

import { LoaderCircle } from "lucide-react";
import { FormEvent, useState, type ReactElement } from "react";
import LoginSessionsPanel from "@/components/settings/LoginSessionsPanel";
import SettingsDangerZone from "@/components/settings/SettingsDangerZone";
import { useToast } from "@/components/ui/toast";
import {
  changeAccountPassword,
  disableTwoFactor,
  enableTwoFactor,
  startTwoFactorSetup,
  useAuthenticatedUser,
} from "@/lib/account";

export default function SecuritySection(): ReactElement {
  const [isPasswordFormOpen, setIsPasswordFormOpen] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmedPassword, setConfirmedPassword] = useState("");
  const { notify } = useToast();
  const { user } = useAuthenticatedUser();

  /** Set once this screen changes it, so the switch reflects what just happened. */
  const [twoFactorOverride, setTwoFactorOverride] = useState<boolean | null>(
    null,
  );
  const [twoFactorBusy, setTwoFactorBusy] = useState(false);
  /** Set while a code is outstanding: the challenge it belongs to. */
  const [pendingReference, setPendingReference] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [isTurningOff, setIsTurningOff] = useState(false);

  const twoFactorOn = twoFactorOverride ?? user?.twoFactorEnabled ?? false;

  const sendCode = async (): Promise<void> => {
    setTwoFactorBusy(true);
    const result = await startTwoFactorSetup();
    setTwoFactorBusy(false);

    if (!result.success) {
      notify({
        title: "Code not sent",
        description: result.message,
        variant: "error",
      });
      return;
    }

    setPendingReference(result.reference);
    setCode("");
    notify({
      title: "Check your email",
      description: "Enter the six digit code to finish turning this on.",
      variant: "success",
    });
  };

  const confirmCode = async (): Promise<void> => {
    setTwoFactorBusy(true);
    const result = await enableTwoFactor(pendingReference, code.trim());
    setTwoFactorBusy(false);

    if (!result.success) {
      notify({
        title: "Not turned on",
        description: result.message,
        variant: "error",
      });
      return;
    }

    setPendingReference("");
    setCode("");
    setTwoFactorOverride(true);
    notify({ title: "Two step sign-in is on", variant: "success" });
  };

  const turnOff = async (): Promise<void> => {
    setTwoFactorBusy(true);
    const result = await disableTwoFactor(password);
    setTwoFactorBusy(false);
    setPassword("");

    if (!result.success) {
      notify({
        title: "Not turned off",
        description: result.message,
        variant: "error",
      });
      return;
    }

    setIsTurningOff(false);
    setTwoFactorOverride(false);
    notify({ title: "Two step sign-in is off", variant: "success" });
  };
  const handlePasswordChange = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();

    if (newPassword !== confirmedPassword) {
      notify({
        title: "Passwords do not match",
        description: "Enter the same new password in both fields.",
        variant: "error",
      });
      return;
    }

    if (oldPassword === newPassword) {
      notify({
        title: "Choose a new password",
        description: "Your new password must differ from your current one.",
        variant: "error",
      });
      return;
    }

    setIsChangingPassword(true);
    const result = await changeAccountPassword(oldPassword, newPassword);
    setIsChangingPassword(false);

    notify({
      title: result.success ? "Password changed" : "Password not changed",
      description: result.message,
      variant: result.success ? "success" : "error",
    });

    if (result.success) {
      setOldPassword("");
      setNewPassword("");
      setConfirmedPassword("");
      setIsPasswordFormOpen(false);
    }
  };

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-bg shadow-sm">
      <div className="border-b border-primary bg-surface-soft p-6 sm:p-8">
        <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-primary">
          Account protection
        </p>
        <h2 className="mt-3 font-display text-3xl font-bold leading-none text-primary sm:text-4xl">
          Security
        </h2>
        <p className="mt-4 max-w-2xl font-body text-sm leading-6 text-muted">
          Manage your password and active login sessions.
        </p>
      </div>

      <div className="px-5 sm:px-7">
        <div className="border-b border-border py-7 transition-all duration-200 ease-in-out hover:bg-surface-soft hover:shadow-sm">
          <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <h2 className="font-body text-xl font-bold text-primary">
                Change password
              </h2>
              <p className="mt-2 max-w-xl font-body text-sm leading-6 text-muted">
                Confirm your current password before choosing a new one.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsPasswordFormOpen((current) => !current)}
              className="min-h-12 rounded-full bg-accent px-6 py-3 font-body text-sm font-medium text-primary transition-all duration-200 ease-in-out hover:scale-[1.02] hover:bg-primary hover:text-white hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {isPasswordFormOpen ? "Close form" : "Change password"}
            </button>
          </div>
          {isPasswordFormOpen ? (
            <form
              onSubmit={handlePasswordChange}
              className="mt-6 grid gap-4 rounded-lg border border-border bg-bg p-5 md:grid-cols-3"
            >
              <label className="font-body text-sm font-medium text-primary">
                Current password
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(event) => setOldPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                  className="mt-2 min-h-12 w-full rounded-lg border border-border bg-bg px-4 outline-none focus:border-accent focus:ring-2 focus:ring-accent/50"
                />
              </label>
              <label className="font-body text-sm font-medium text-primary">
                New password
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  autoComplete="new-password"
                  required
                  className="mt-2 min-h-12 w-full rounded-lg border border-border bg-bg px-4 outline-none focus:border-accent focus:ring-2 focus:ring-accent/50"
                />
              </label>
              <label className="font-body text-sm font-medium text-primary">
                Confirm new password
                <input
                  type="password"
                  value={confirmedPassword}
                  onChange={(event) => setConfirmedPassword(event.target.value)}
                  autoComplete="new-password"
                  required
                  className="mt-2 min-h-12 w-full rounded-lg border border-border bg-bg px-4 outline-none focus:border-accent focus:ring-2 focus:ring-accent/50"
                />
              </label>
              <div className="flex flex-wrap gap-3 md:col-span-3">
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 font-body text-sm font-medium text-white transition-all duration-200 ease-in-out hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-70"
                >
                  {isChangingPassword ? (
                    <LoaderCircle className="animate-spin" size={18} />
                  ) : null}
                  {isChangingPassword ? "Changing password" : "Save password"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsPasswordFormOpen(false)}
                  disabled={isChangingPassword}
                  className="min-h-12 rounded-full border border-primary/30 px-6 py-3 font-body text-sm font-medium text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-70"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : null}
        </div>

        <div className="border-b border-border py-7 transition-all duration-200 ease-in-out hover:bg-surface-soft hover:shadow-sm">
          <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <h2 className="font-body text-xl font-bold text-primary">
                Two step sign-in
              </h2>
              <p className="mt-2 max-w-xl font-body text-sm leading-6 text-muted">
                {twoFactorOn
                  ? "Signing in asks for a code sent to your email, so your password alone is not enough."
                  : "Ask for a code sent to your email as well as your password. Worth it on an account that can move rent."}
              </p>
            </div>
            <button
              type="button"
              disabled={twoFactorBusy || !user}
              onClick={() => {
                if (twoFactorOn) {
                  setIsTurningOff((current) => !current);
                  return;
                }

                void sendCode();
              }}
              className={`flex min-h-12 items-center justify-center gap-2 rounded-full border border-primary/30 px-6 py-3 font-body text-sm font-medium transition-all duration-200 ease-in-out hover:scale-[1.02] hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-60 ${
                twoFactorOn
                  ? "bg-accent text-primary"
                  : "bg-primary/10 text-primary"
              }`}
            >
              {twoFactorBusy ? (
                <LoaderCircle size={16} className="animate-spin" />
              ) : null}
              {twoFactorOn ? "Turn it off" : "Turn it on"}
            </button>
          </div>

          {pendingReference ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
              <label className="block font-body text-sm font-bold text-primary">
                The code we emailed you
                <input
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="000000"
                  className="mt-2 min-h-12 w-full rounded-lg border border-border bg-bg px-4 font-body text-base tracking-[0.4em] text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
                />
              </label>
              <button
                type="button"
                onClick={() => void confirmCode()}
                disabled={twoFactorBusy || code.trim().length < 6}
                className="min-h-12 rounded-full bg-primary px-6 py-3 font-body text-sm font-bold text-white transition-all duration-200 ease-in-out hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-60"
              >
                Confirm
              </button>
            </div>
          ) : null}

          {isTurningOff ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
              <label className="block font-body text-sm font-bold text-primary">
                Your password
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  className="mt-2 min-h-12 w-full rounded-lg border border-border bg-bg px-4 font-body text-base text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
                />
                <span className="mt-1 block font-body text-xs font-normal text-muted">
                  Asked for so a borrowed session cannot switch this off.
                </span>
              </label>
              <button
                type="button"
                onClick={() => void turnOff()}
                disabled={twoFactorBusy || password.length === 0}
                className="min-h-12 rounded-full border border-red-700/25 px-6 py-3 font-body text-sm font-bold text-red-700 transition-all duration-200 ease-in-out hover:bg-red-700/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-60"
              >
                Turn it off
              </button>
            </div>
          ) : null}
        </div>

        <LoginSessionsPanel />

        {/* Account deactivation lives with security because it controls account access. */}
        <SettingsDangerZone />
      </div>
    </section>
  );
}

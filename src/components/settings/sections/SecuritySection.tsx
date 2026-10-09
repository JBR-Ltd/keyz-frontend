"use client";

import { FormEvent, useState, type ReactElement } from "react";
import LoginSessionsPanel from "@/components/settings/LoginSessionsPanel";
import SettingsDangerZone from "@/components/settings/SettingsDangerZone";
import SettingsSectionHeader from "@/components/settings/SettingsSectionHeader";
import { AsyncButtonContent } from "@/components/ui/async-button-content";
import PasswordRequirements from "@/components/auth/PasswordRequirements";
import { useToast } from "@/components/ui/toast";
import {
  changeAccountPassword,
  disableTwoFactor,
  enableTwoFactor,
  startTwoFactorSetup,
  useAuthenticatedUser,
} from "@/lib/account";
import { validatePassword } from "@/lib/passwordPolicy";

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
  const [twoFactorBusy, setTwoFactorBusy] = useState<
    "" | "confirm" | "disable" | "send"
  >("");
  /** Set while a code is outstanding: the challenge it belongs to. */
  const [pendingReference, setPendingReference] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [isTurningOff, setIsTurningOff] = useState(false);

  const twoFactorOn = twoFactorOverride ?? user?.twoFactorEnabled ?? false;

  const sendCode = async (): Promise<void> => {
    setTwoFactorBusy("send");
    const result = await startTwoFactorSetup().finally(() => {
      setTwoFactorBusy("");
    });

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
    setTwoFactorBusy("confirm");
    const result = await enableTwoFactor(pendingReference, code.trim()).finally(
      () => {
        setTwoFactorBusy("");
      },
    );

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
    setTwoFactorBusy("disable");
    const result = await disableTwoFactor(password).finally(() => {
      setTwoFactorBusy("");
    });
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

    const passwordResult = validatePassword(newPassword);
    if (passwordResult !== true) {
      notify({
        title: "Password requirements not met",
        description: passwordResult,
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
    const result = await changeAccountPassword(
      oldPassword,
      newPassword,
    ).finally(() => {
      setIsChangingPassword(false);
    });

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
    <section className="overflow-hidden rounded-2xl border border-border bg-bg shadow-sm">
      <SettingsSectionHeader
        title="Security"
        description="Manage your password, two-step sign-in, and active login sessions."
      />

      <div className="px-5 sm:px-6">
        <div className="border-b border-border py-6">
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
              className="min-h-12 rounded-full bg-accent px-6 py-3 font-body text-sm font-medium text-primary transition-colors duration-200 hover:bg-primary hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
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
              <div className="md:col-span-3">
                <PasswordRequirements password={newPassword} />
              </div>
              <div className="flex flex-wrap gap-3 md:col-span-3">
                <button
                  type="submit"
                  aria-busy={isChangingPassword}
                  disabled={isChangingPassword}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 font-body text-sm font-medium text-white transition-all duration-200 ease-in-out hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-70"
                >
                  <AsyncButtonContent
                    isPending={isChangingPassword}
                    pendingLabel="Changing password…"
                  >
                    Save password
                  </AsyncButtonContent>
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

        <div className="border-b border-border py-6">
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
              disabled={Boolean(twoFactorBusy) || !user}
              aria-busy={twoFactorBusy === "send"}
              onClick={() => {
                if (twoFactorOn) {
                  setIsTurningOff((current) => !current);
                  return;
                }

                void sendCode();
              }}
              className={`flex min-h-12 items-center justify-center gap-2 rounded-full border border-primary/30 px-6 py-3 font-body text-sm font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-60 ${
                twoFactorOn
                  ? "bg-accent text-primary"
                  : "bg-primary/10 text-primary"
              }`}
            >
              <AsyncButtonContent
                isPending={twoFactorBusy === "send"}
                pendingLabel="Sending verification code…"
              >
                {twoFactorOn ? "Turn it off" : "Turn it on"}
              </AsyncButtonContent>
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
                disabled={Boolean(twoFactorBusy) || code.trim().length < 6}
                aria-busy={twoFactorBusy === "confirm"}
                className="min-h-12 rounded-full bg-primary px-6 py-3 font-body text-sm font-bold text-white transition-all duration-200 ease-in-out hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-60"
              >
                <AsyncButtonContent
                  isPending={twoFactorBusy === "confirm"}
                  pendingLabel="Enabling two step sign-in…"
                >
                  Confirm
                </AsyncButtonContent>
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
                disabled={Boolean(twoFactorBusy) || password.length === 0}
                aria-busy={twoFactorBusy === "disable"}
                className="min-h-12 rounded-full border border-red-700/25 px-6 py-3 font-body text-sm font-bold text-red-700 transition-all duration-200 ease-in-out hover:bg-red-700/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-60"
              >
                <AsyncButtonContent
                  isPending={twoFactorBusy === "disable"}
                  pendingLabel="Disabling two step sign-in…"
                >
                  Turn it off
                </AsyncButtonContent>
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

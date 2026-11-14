"use client";

import { FormEvent, useState, type ReactElement } from "react";
import Image from "next/image";
import QRCode from "qrcode";
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
  type TwoFactorSetup,
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
  /** Set while the app is being set up: the secret to scan and its QR image. */
  const [setup, setSetup] = useState<TwoFactorSetup | null>(null);
  const [qrImage, setQrImage] = useState("");
  /** Shown once, straight after turning it on. The server only keeps hashes. */
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [isTurningOff, setIsTurningOff] = useState(false);

  const twoFactorOn = twoFactorOverride ?? user?.twoFactorEnabled ?? false;
  // A Google-only account has no password, so it proves the phone to turn this off
  const turnOffWithCode = user?.hasPassword === false;

  const beginSetup = async (): Promise<void> => {
    setTwoFactorBusy("send");
    const result = await startTwoFactorSetup().finally(() => {
      setTwoFactorBusy("");
    });

    if (!result.success || !result.setup) {
      notify({
        title: "Could not start setup",
        description: result.message,
        variant: "error",
      });
      return;
    }

    const image = await QRCode.toDataURL(result.setup.otpauthUri, {
      margin: 1,
      width: 192,
    }).catch(() => "");

    setSetup(result.setup);
    setQrImage(image);
    setCode("");
  };

  const confirmCode = async (): Promise<void> => {
    setTwoFactorBusy("confirm");
    const result = await enableTwoFactor(code.trim()).finally(() => {
      setTwoFactorBusy("");
    });

    if (!result.success) {
      notify({
        title: "Not turned on",
        description: result.message,
        variant: "error",
      });
      return;
    }

    setSetup(null);
    setQrImage("");
    setCode("");
    setRecoveryCodes(result.recoveryCodes);
    setTwoFactorOverride(true);
    notify({
      title: "Two step sign-in is on",
      description: "Save your recovery codes before you leave this page.",
      variant: "success",
    });
  };

  const copyRecoveryCodes = async (): Promise<void> => {
    const copied = await navigator.clipboard
      .writeText(recoveryCodes.join("\n"))
      .then(() => true)
      .catch(() => false);

    notify({
      title: copied ? "Recovery codes copied" : "Could not copy",
      description: copied
        ? "Paste them somewhere safe, such as a password manager."
        : "Write them down or use Download instead.",
      variant: copied ? "success" : "error",
    });
  };

  const downloadRecoveryCodes = (): void => {
    const text = [
      "Rello recovery codes",
      "Each code works once if you lose access to your authenticator app.",
      "",
      ...recoveryCodes,
    ].join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    link.download = "rello-recovery-codes.txt";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const turnOff = async (): Promise<void> => {
    setTwoFactorBusy("disable");
    const result = await disableTwoFactor(
      turnOffWithCode ? { code: code.trim() } : { password },
    ).finally(() => {
      setTwoFactorBusy("");
    });
    setPassword("");
    setCode("");

    if (!result.success) {
      notify({
        title: "Not turned off",
        description: result.message,
        variant: "error",
      });
      return;
    }

    setIsTurningOff(false);
    setRecoveryCodes([]);
    setTwoFactorOverride(false);
    notify({
      title: "Two step sign-in is off",
      description:
        "Future sign-ins will only need your password. We recommend turning it back on.",
      variant: "success",
    });
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
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-body text-xl font-bold text-primary">
                  Two step sign-in
                </h2>
                {twoFactorOn ? null : (
                  <span className="rounded-full bg-accent/20 px-2.5 py-1 font-body text-xs font-bold text-primary">
                    Recommended
                  </span>
                )}
              </div>
              <p className="mt-2 max-w-xl font-body text-sm leading-6 text-muted">
                {twoFactorOn
                  ? "Signing in asks for a code from your authenticator app, so your password alone is not enough."
                  : "Ask for a code from an authenticator app, such as Google Authenticator or Microsoft Authenticator, as well as your password. Worth it on an account that can move rent."}
              </p>
            </div>
            <button
              type="button"
              disabled={Boolean(twoFactorBusy) || !user || Boolean(setup)}
              aria-busy={twoFactorBusy === "send"}
              onClick={() => {
                if (twoFactorOn) {
                  setIsTurningOff((current) => !current);
                  setCode("");
                  return;
                }

                void beginSetup();
              }}
              className={`flex min-h-12 items-center justify-center gap-2 rounded-full border border-primary/30 px-6 py-3 font-body text-sm font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-60 ${
                twoFactorOn
                  ? "bg-accent text-primary"
                  : "bg-primary/10 text-primary"
              }`}
            >
              <AsyncButtonContent
                isPending={twoFactorBusy === "send"}
                pendingLabel="Preparing setup…"
              >
                {twoFactorOn ? "Turn it off" : "Set it up"}
              </AsyncButtonContent>
            </button>
          </div>

          {setup ? (
            <div className="mt-6 grid gap-6 rounded-lg border border-border p-5 md:grid-cols-[auto_1fr]">
              <div className="flex flex-col items-center gap-3">
                {qrImage ? (
                  <Image
                    src={qrImage}
                    alt="QR code to scan with your authenticator app"
                    width={192}
                    height={192}
                    unoptimized
                    className="rounded-lg border border-border bg-white"
                  />
                ) : null}
                <a
                  href={setup.otpauthUri}
                  className="font-body text-sm font-medium text-primary underline underline-offset-4 md:hidden"
                >
                  Open in authenticator app
                </a>
              </div>

              <div className="grid content-start gap-4">
                <ol className="grid list-decimal gap-2 pl-5 font-body text-sm leading-6 text-muted">
                  <li>
                    Open an authenticator app, such as Google Authenticator,
                    Microsoft Authenticator or 1Password.
                  </li>
                  <li>Scan the QR code, or enter the setup key below.</li>
                  <li>Type the six digit code the app shows for Rello.</li>
                </ol>

                <div>
                  <p className="font-body text-xs font-bold uppercase tracking-wide text-muted">
                    Setup key
                  </p>
                  <p className="mt-1 break-all font-mono text-sm text-primary">
                    {setup.secret.replace(/(.{4})/g, "$1 ").trim()}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                  <label className="block font-body text-sm font-bold text-primary">
                    Code from the app
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
                      pendingLabel="Turning it on…"
                    >
                      Turn it on
                    </AsyncButtonContent>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSetup(null);
                    setQrImage("");
                    setCode("");
                  }}
                  disabled={Boolean(twoFactorBusy)}
                  className="justify-self-center font-body text-sm font-medium text-muted transition-colors hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:justify-self-start"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : null}

          {recoveryCodes.length > 0 ? (
            <div className="mt-6 rounded-lg border border-accent/40 bg-accent/10 p-5">
              <h3 className="font-body text-base font-bold text-primary">
                Save your recovery codes
              </h3>
              <p className="mt-2 max-w-xl font-body text-sm leading-6 text-muted">
                If you lose your phone, each of these signs you in once. This is
                the only time they are shown.
              </p>
              <ul className="mt-4 grid grid-cols-2 gap-2 font-mono text-sm text-primary sm:grid-cols-5">
                {recoveryCodes.map((recoveryCode) => (
                  <li
                    key={recoveryCode}
                    className="rounded-md bg-bg px-3 py-2 text-center"
                  >
                    {recoveryCode}
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void copyRecoveryCodes()}
                  className="min-h-11 rounded-full bg-primary px-5 font-body text-sm font-bold text-white transition-all duration-200 ease-in-out hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  Copy codes
                </button>
                <button
                  type="button"
                  onClick={downloadRecoveryCodes}
                  className="min-h-11 rounded-full border border-primary/30 px-5 font-body text-sm font-bold text-primary transition-colors hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  Download
                </button>
                <button
                  type="button"
                  onClick={() => setRecoveryCodes([])}
                  className="min-h-11 px-2 font-body text-sm font-medium text-muted transition-colors hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  I have saved them
                </button>
              </div>
            </div>
          ) : null}

          {isTurningOff ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
              {turnOffWithCode ? (
                <label className="block font-body text-sm font-bold text-primary">
                  Code from your app, or a recovery code
                  <input
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    autoComplete="one-time-code"
                    maxLength={9}
                    className="mt-2 min-h-12 w-full rounded-lg border border-border bg-bg px-4 font-body text-base tracking-[0.2em] text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
                  />
                  <span className="mt-1 block font-body text-xs font-normal text-muted">
                    Asked for so a borrowed session cannot switch this off.
                  </span>
                </label>
              ) : (
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
              )}
              <button
                type="button"
                onClick={() => void turnOff()}
                disabled={
                  Boolean(twoFactorBusy) ||
                  (turnOffWithCode
                    ? code.trim().length < 6
                    : password.length === 0)
                }
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

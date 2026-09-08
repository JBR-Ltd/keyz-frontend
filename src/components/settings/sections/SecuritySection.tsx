"use client";

import { LoaderCircle } from "lucide-react";
import { FormEvent, useState } from "react";
import SettingsDangerZone from "@/components/settings/SettingsDangerZone";
import { useToast } from "@/components/ui/toast";
import { changeAccountPassword } from "@/lib/account";

export default function SecuritySection() {
  const [isPasswordFormOpen, setIsPasswordFormOpen] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmedPassword, setConfirmedPassword] = useState("");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const { notify } = useToast();
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

        <div className="grid gap-5 border-b border-border py-7 transition-all duration-200 ease-in-out hover:bg-surface-soft hover:shadow-sm sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <h2 className="font-body text-xl font-bold text-primary">
              Two-factor authentication
            </h2>
            <p className="mt-2 max-w-xl font-body text-sm leading-6 text-muted">
              Require a second verification step when signing in.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setTwoFactorEnabled((current) => !current)}
            className={`min-h-12 rounded-full border border-primary/30 px-6 py-3 font-body text-sm font-medium transition-all duration-200 ease-in-out hover:scale-[1.02] hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              twoFactorEnabled
                ? "bg-accent text-primary"
                : "bg-primary/10 text-primary"
            }`}
          >
            {twoFactorEnabled ? "Enabled" : "Enable 2FA"}
          </button>
        </div>

        <div className="grid gap-5 border-b border-border py-7 transition-all duration-200 ease-in-out hover:bg-surface-soft hover:shadow-sm sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <h2 className="font-body text-xl font-bold text-primary">
              Login sessions
            </h2>
            <p className="mt-2 max-w-xl font-body text-sm leading-6 text-muted">
              Managing other login sessions is not supported by the server yet.
            </p>
          </div>
          <button
            type="button"
            disabled
            className="min-h-12 rounded-full border border-primary/20 bg-primary/5 px-6 py-3 font-body text-sm font-medium text-primary/60"
          >
            Unavailable
          </button>
        </div>

        {/* Account deactivation lives with security because it controls account access. */}
        <SettingsDangerZone />
      </div>
    </section>
  );
}

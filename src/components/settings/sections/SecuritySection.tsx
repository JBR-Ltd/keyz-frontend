"use client";

import { useState } from "react";
import ConfirmActionModal from "@/components/settings/ConfirmActionModal";
import SettingsDangerZone from "@/components/settings/SettingsDangerZone";
import { useToast } from "@/components/ui/toast";

export default function SecuritySection() {
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const { notify } = useToast();

  const confirmSessions = () => {
    notify({
      title: "Sessions signed out",
      description: "This is a simulated profile action.",
      variant: "success",
    });
    setShowSessionModal(false);
  };

  return (
    <section className="overflow-hidden rounded-lg border border-primary/25 bg-[var(--color-bg)] shadow-sm">
      <div className="border-b border-primary bg-surface-soft p-6 sm:p-8">
        <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-accent-alt">
          Account protection
        </p>
        <h2 className="mt-3 font-display text-3xl font-bold leading-none text-primary sm:text-4xl">
          Security
        </h2>
        <p className="mt-4 max-w-2xl font-body text-sm leading-6 text-muted">
          Manage your password, verification, and active login sessions.
        </p>
      </div>

      <div className="px-5 sm:px-7">
        <div className="grid gap-5 border-b border-primary/20 py-7 transition-all duration-200 ease-in-out hover:bg-surface-soft hover:shadow-sm sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <h2 className="font-body text-xl font-bold text-primary">
              Change password
            </h2>
            <p className="mt-2 max-w-xl font-body text-sm leading-6 text-muted">
              Update your password regularly to keep your account protected.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              notify({
                title: "Password flow opened",
                description: "Password changes are simulated on this page.",
                variant: "success",
              })
            }
            className="min-h-12 rounded-full bg-accent px-6 py-3 font-body text-sm font-medium text-white transition-all duration-200 ease-in-out hover:scale-[1.02] hover:bg-accent-alt hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Change password
          </button>
        </div>

        <div className="grid gap-5 border-b border-primary/20 py-7 transition-all duration-200 ease-in-out hover:bg-surface-soft hover:shadow-sm sm:grid-cols-[1fr_auto] sm:items-center">
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
                ? "bg-accent text-white"
                : "bg-primary/10 text-primary"
            }`}
          >
            {twoFactorEnabled ? "Enabled" : "Enable 2FA"}
          </button>
        </div>

        <div className="grid gap-5 border-b border-primary/20 py-7 transition-all duration-200 ease-in-out hover:bg-surface-soft hover:shadow-sm sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <h2 className="font-body text-xl font-bold text-primary">
              Login sessions
            </h2>
            <p className="mt-2 max-w-xl font-body text-sm leading-6 text-muted">
              You are signed in on two devices. End every session except this
              one.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowSessionModal(true)}
            className="min-h-12 rounded-full bg-accent px-6 py-3 font-body text-sm font-medium text-white transition-all duration-200 ease-in-out hover:scale-[1.02] hover:bg-accent-alt hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Sign out others
          </button>
        </div>

        {/* Account deactivation lives with security because it controls account access. */}
        <SettingsDangerZone />
      </div>

      <ConfirmActionModal
        isOpen={showSessionModal}
        mode="confirm"
        title="Sign out other devices?"
        description="Every active session except this browser will be signed out."
        confirmLabel="Sign out devices"
        onCancel={() => setShowSessionModal(false)}
        onConfirm={confirmSessions}
      />
    </section>
  );
}

"use client";

import { useState } from "react";
import ConfirmActionModal from "@/components/settings/ConfirmActionModal";
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
    <section className="border border-primary">
      <div className="border-b border-primary bg-surface-soft p-6 sm:p-8">
        <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-accent-alt">
          Account protection
        </p>
        <h2 className="mt-3 font-display text-4xl font-bold leading-none text-primary">
          Security
        </h2>
        <p className="mt-4 max-w-2xl font-body text-sm leading-6 text-muted">
          Manage your password, verification, and active login sessions.
        </p>
      </div>

      <div className="px-5 sm:px-7">
            <div className="grid gap-5 border-b border-primary py-7 sm:grid-cols-[1fr_auto] sm:items-center">
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
                className="min-h-12 bg-primary px-5 py-3 font-body text-sm font-bold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Change password
              </button>
            </div>

            <div className="grid gap-5 border-b border-primary py-7 sm:grid-cols-[1fr_auto] sm:items-center">
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
                className={`min-h-12 border border-primary px-5 py-3 font-body text-sm font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  twoFactorEnabled
                    ? "bg-accent text-primary"
                    : "bg-primary text-white"
                }`}
              >
                {twoFactorEnabled ? "Enabled" : "Enable 2FA"}
              </button>
            </div>

            <div className="grid gap-5 border-b border-primary py-7 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <h2 className="font-body text-xl font-bold text-primary">
                  Login sessions
                </h2>
                <p className="mt-2 max-w-xl font-body text-sm leading-6 text-muted">
                  You are signed in on two devices. End every session except
                  this one.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSessionModal(true)}
                className="min-h-12 bg-primary px-5 py-3 font-body text-sm font-bold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Sign out others
              </button>
            </div>
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

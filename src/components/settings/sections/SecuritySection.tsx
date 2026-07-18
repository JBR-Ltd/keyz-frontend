"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import ConfirmActionModal from "@/components/settings/ConfirmActionModal";
import VerifiedBadge from "@/components/ui/VerifiedBadge";
import SettingsDangerZone from "@/components/settings/SettingsDangerZone";
import { useToast } from "@/components/ui/toast";
import {
  getHostVerificationSnapshot,
  HostVerificationRole,
} from "@/lib/hostVerification";
import {
  countVerifiedTenantSteps,
  isTenantVerified,
  useTenantVerificationSnapshot,
} from "@/lib/tenantVerification";

export default function SecuritySection() {
  const router = useRouter();
  const pathname = usePathname();
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const { state, verifiedAt } = useTenantVerificationSnapshot();
  const { notify } = useToast();
  const isTenant = pathname.startsWith("/tenant");
  const hostRole: HostVerificationRole | null = pathname.startsWith("/landlord")
    ? "landlord"
    : pathname.startsWith("/agent")
      ? "agent"
      : null;
  const hostVerification = hostRole
    ? getHostVerificationSnapshot(hostRole)
    : null;
  const verifiedStepCount = countVerifiedTenantSteps(state);
  const tenantVerified = isTenantVerified(state);
  const verificationStatus =
    verifiedStepCount === 0
      ? "Not verified"
      : tenantVerified
        ? "Verified"
        : `${verifiedStepCount} of 3 steps complete`;

  const confirmSessions = () => {
    notify({
      title: "Sessions signed out",
      description: "This is a simulated profile action.",
      variant: "success",
    });
    setShowSessionModal(false);
  };

  const openVerificationFlow = (): void => {
    const query = new URLSearchParams({
      source: "settings",
      returnTo: "/tenant/settings",
    });

    router.push(`/tenant/verify?${query.toString()}`);
  };

  const hostIdentityLabel =
    hostVerification?.identity.status === "approved"
      ? "Identity verified"
      : hostVerification?.identity.status === "pending"
        ? "Identity under review"
        : "Identity not started";
  const hostPayoutLabel =
    hostVerification?.payout.status === "approved"
      ? "Payout active"
      : hostVerification?.payout.status === "pending"
        ? "Payout deposits pending"
        : "Payout not started";

  return (
    <section className="overflow-hidden rounded-lg border border-primary/25 bg-[var(--color-bg)] shadow-sm">
      <div className="border-b border-primary bg-surface-soft p-6 sm:p-8">
        <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-primary">
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
        {hostRole ? (
          <div className="grid gap-5 border-b border-primary/20 py-7 transition-all duration-200 ease-in-out hover:bg-surface-soft hover:shadow-sm sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <h2 className="font-body text-xl font-bold text-primary">
                {hostRole === "landlord"
                  ? "Host Verification"
                  : "Verification Center"}
              </h2>
              <p className="mt-2 max-w-xl font-body text-sm leading-6 text-muted">
                {hostRole === "landlord"
                  ? "Complete business and payout checks to become a verified host."
                  : "Complete identity and payout checks before listing properties and receiving payouts."}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                {hostVerification?.identity.status === "approved" ? (
                  <VerifiedBadge size="sm" />
                ) : null}
                <span className="rounded-full bg-primary/5 px-3 py-1 font-body text-xs font-bold text-primary">
                  {hostIdentityLabel}
                </span>
                <span className="rounded-full bg-primary/5 px-3 py-1 font-body text-xs font-bold text-primary">
                  {hostPayoutLabel}
                </span>
              </div>
            </div>
            <Link
              href={`/${hostRole}/verify`}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-accent px-6 py-3 font-body text-sm font-medium text-primary transition-all duration-200 ease-in-out hover:scale-[1.02] hover:bg-primary hover:text-white hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {hostRole === "landlord"
                ? "Continue Host Verification"
                : "Open Verification Center"}
            </Link>
          </div>
        ) : null}
        {isTenant ? (
          <div className="grid gap-5 border-b border-primary/20 py-7 transition-all duration-200 ease-in-out hover:bg-surface-soft hover:shadow-sm sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <h2 className="font-body text-xl font-bold text-primary">
                Identity Verification
              </h2>
              <p className="mt-2 max-w-xl font-body text-sm leading-6 text-muted">
                Verify your NIN, BVN, and selfie before booking or making an
                offer.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                {tenantVerified ? <VerifiedBadge size="sm" /> : null}
                <span className="font-body text-sm font-bold text-primary">
                  {verificationStatus}
                </span>
                {tenantVerified && verifiedAt ? (
                  <span className="font-body text-sm text-muted">
                    Verified on{" "}
                    {new Date(verifiedAt).toLocaleDateString("en-NG")}
                  </span>
                ) : null}
                {!tenantVerified ? (
                  <span className="flex items-center gap-1.5">
                    {[state.nin, state.bvn, state.selfie].map(
                      (status, index) => (
                        <span
                          key={index}
                          className={`h-2.5 w-8 rounded-full transition-all duration-300 ease-in-out ${
                            status === "verified" ? "bg-accent" : "bg-border"
                          }`}
                        />
                      ),
                    )}
                  </span>
                ) : null}
              </div>
            </div>
            {tenantVerified ? (
              <button
                type="button"
                disabled
                className="min-h-12 rounded-full border border-primary/20 bg-primary/5 px-6 py-3 font-body text-sm font-medium text-primary/60"
              >
                Verified
              </button>
            ) : (
              <button
                type="button"
                onClick={openVerificationFlow}
                className="min-h-12 rounded-full bg-accent px-6 py-3 font-body text-sm font-medium text-primary transition-all duration-200 ease-in-out hover:scale-[1.02] hover:bg-primary hover:text-white hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {verifiedStepCount === 0
                  ? "Start Verification"
                  : "Continue Verification"}
              </button>
            )}
          </div>
        ) : null}
        <div className="grid gap-5 border-b border-primary/20 py-7 transition-all duration-200 ease-in-out hover:bg-surface-soft hover:shadow-sm sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <h2 className="font-body text-xl font-bold text-primary">
              Change password
            </h2>
            <p className="mt-2 max-w-xl font-body text-sm leading-6 text-muted">
              Update your password regularly to keep your account protected.
            </p>
          </div>
          <Link
            href="/forgot-password"
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-accent px-6 py-3 font-body text-sm font-medium text-primary transition-all duration-200 ease-in-out hover:scale-[1.02] hover:bg-primary hover:text-white hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Change password
          </Link>
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
                ? "bg-accent text-primary"
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
            className="min-h-12 rounded-full bg-accent px-6 py-3 font-body text-sm font-medium text-primary transition-all duration-200 ease-in-out hover:scale-[1.02] hover:bg-primary hover:text-white hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
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

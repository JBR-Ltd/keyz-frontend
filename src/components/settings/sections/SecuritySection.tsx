"use client";

import { LoaderCircle } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import VerifiedBadge from "@/components/ui/VerifiedBadge";
import SettingsDangerZone from "@/components/settings/SettingsDangerZone";
import { useToast } from "@/components/ui/toast";
import { changeAccountPassword } from "@/lib/account";
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
  const [isPasswordFormOpen, setIsPasswordFormOpen] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmedPassword, setConfirmedPassword] = useState("");
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
        <div className="border-b border-primary/20 py-7 transition-all duration-200 ease-in-out hover:bg-surface-soft hover:shadow-sm">
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

"use client";

import { Banknote, Clock, Home, Lock, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { ReactElement, useState } from "react";
import VerifiedBadge from "@/components/ui/VerifiedBadge";
import {
  getHostVerificationSnapshot,
  HostVerificationRole,
  maskAccountNumber,
} from "@/lib/hostVerification";
import { cn } from "@/lib/utils";

interface HostVerificationCenterProps {
  role: HostVerificationRole;
}

interface StatusCardProps {
  actionHref?: string;
  actionLabel?: string;
  children: ReactElement;
  icon: typeof ShieldCheck;
  locked?: boolean;
  title: string;
}

function formatDate(value: string | null): string {
  if (!value) {
    return "Date unavailable";
  }

  return new Date(value).toLocaleDateString("en-NG");
}

function StatusCard({
  actionHref,
  actionLabel,
  children,
  icon: Icon,
  locked = false,
  title,
}: StatusCardProps): ReactElement {
  const hasAction = Boolean(actionHref && actionLabel);

  return (
    <article
      className={cn(
        "rounded-xl border border-primary/10 bg-[var(--color-bg)] p-6 shadow-sm transition-all duration-200 ease-in-out",
        hasAction ? "hover:-translate-y-1 hover:shadow-md" : "",
        locked ? "opacity-75" : "",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon size={24} strokeWidth={1.9} />
        </span>
        {locked ? <Lock className="h-5 w-5 text-muted" /> : null}
      </div>
      <h2 className="mt-5 font-display text-xl font-bold text-primary">
        {title}
      </h2>
      <div className="mt-4 min-h-24">{children}</div>
      {hasAction ? (
        <Link
          href={actionHref ?? "#"}
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-accent px-5 py-3 font-body text-sm font-medium text-primary transition-all duration-200 ease-in-out hover:scale-[1.02] hover:bg-primary hover:text-white hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {actionLabel}
        </Link>
      ) : null}
    </article>
  );
}

function StatusBadge({ children }: { children: string }): ReactElement {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 font-body text-xs font-bold text-primary">
      <Clock size={14} />
      {children}
    </span>
  );
}

export default function HostVerificationCenter({
  role,
}: HostVerificationCenterProps): ReactElement {
  const [snapshot] = useState(() => getHostVerificationSnapshot(role));
  const isAgent = role === "agent";
  const rolePath = role;
  const identity = snapshot.identity;
  const payout = snapshot.payout;
  const completeCount =
    (identity.status === "approved" ? 1 : 0) +
    (payout.status === "approved" ? 1 : 0);
  const progressPercent = `${(completeCount / 2) * 100}%`;

  const renderIdentityStatus = (): ReactElement => {
    if (identity.status === "approved") {
      return (
        <div className="space-y-3">
          <VerifiedBadge size="sm" />
          <p className="font-body text-sm text-muted">
            {isAgent ? "Verified" : "Approved"} on{" "}
            {formatDate(identity.approvedAt)}
          </p>
        </div>
      );
    }

    if (role === "landlord" && identity.status === "pending") {
      return (
        <div className="space-y-3">
          <StatusBadge>Under review</StatusBadge>
          <p className="font-body text-sm leading-6 text-muted">
            Usually takes 1 to 2 business days. We will notify you once it is
            reviewed.
          </p>
        </div>
      );
    }

    if (identity.status === "rejected") {
      return (
        <div className="space-y-3">
          <span className="inline-flex rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 font-body text-xs font-bold text-red-700">
            Action needed
          </span>
          <p className="font-body text-sm leading-6 text-muted">
            {identity.rejectedReason ??
              "Review the issue and resubmit your details."}
          </p>
        </div>
      );
    }

    if (identity.status === "failed") {
      return (
        <p className="font-body text-sm leading-6 text-red-700">
          We could not verify your details. Try again when you are ready.
        </p>
      );
    }

    return <p className="font-body text-sm text-muted">Not started</p>;
  };

  const renderPayoutStatus = (): ReactElement => {
    if (payout.status === "approved") {
      return (
        <div className="space-y-3">
          <VerifiedBadge size="sm" />
          <p className="font-body text-sm text-muted">
            Active since {formatDate(payout.approvedAt)}
          </p>
          <p className="font-body text-sm font-bold text-primary">
            {payout.bankName} · {maskAccountNumber(payout.accountNumber)}
          </p>
        </div>
      );
    }

    if (payout.status === "pending") {
      return (
        <div className="space-y-3">
          <StatusBadge>Verifying deposits</StatusBadge>
          <p className="font-body text-sm leading-6 text-muted">
            Check your bank account in 1 to 2 business days, then confirm below.
          </p>
        </div>
      );
    }

    if (payout.status === "failed") {
      return (
        <p className="font-body text-sm leading-6 text-red-700">
          Payout setup failed. Check the account details and try again.
        </p>
      );
    }

    return <p className="font-body text-sm text-muted">Not started</p>;
  };

  const identityActionLabel =
    identity.status === "rejected" || identity.status === "failed"
      ? "Try Again"
      : identity.status === "not_started"
        ? "Begin"
        : undefined;
  const payoutActionLabel =
    payout.status === "pending"
      ? "Enter Deposit Amounts"
      : payout.status === "failed"
        ? "Try Again"
        : payout.status === "not_started"
          ? "Set Up Payout"
          : undefined;
  const payoutHref =
    payout.status === "pending"
      ? `/${rolePath}/verify/payout?mode=confirm`
      : `/${rolePath}/verify/payout`;

  return (
    <main className="min-h-screen bg-surface-soft px-5 py-12 sm:px-8 lg:px-10 lg:py-16">
      <section className="mx-auto max-w-6xl">
        <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-primary">
          Verification Center
        </p>
        <h1 className="mt-4 font-display text-4xl font-bold leading-[0.92] text-primary sm:text-5xl">
          Get fully verified
        </h1>
        <p className="mt-4 max-w-2xl font-body text-sm leading-6 text-muted">
          Complete identity and payout checks to unlock listing creation, safer
          buyer trust, and payout activation.
        </p>

        <div className="mt-8 rounded-xl border border-primary/10 bg-[var(--color-bg)] p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-body text-sm font-bold text-primary">
              {completeCount} of 2 complete
            </p>
            <p className="font-body text-xs text-muted">
              Property verification starts after your first listing is created.
            </p>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-accent transition-all duration-300 ease-in-out"
              style={{ width: progressPercent }}
            />
          </div>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          <StatusCard
            actionHref={
              identityActionLabel ? `/${rolePath}/verify/identity` : undefined
            }
            actionLabel={identityActionLabel}
            icon={ShieldCheck}
            title="Identity Verification"
          >
            {renderIdentityStatus()}
          </StatusCard>

          <StatusCard
            actionHref={payoutActionLabel ? payoutHref : undefined}
            actionLabel={payoutActionLabel}
            icon={Banknote}
            title="Payout Setup"
          >
            {renderPayoutStatus()}
          </StatusCard>

          <StatusCard icon={Home} locked title="Property Verification">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/5 px-3 py-1 font-body text-xs font-bold text-muted">
                <Lock size={14} />
                Locked
              </span>
              <p className="font-body text-sm leading-6 text-muted">
                Available once you add a property. Listing-specific property
                checks will live in the Add Listing flow.
              </p>
            </div>
          </StatusCard>
        </div>
      </section>
    </main>
  );
}

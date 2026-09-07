"use client";

import {
  AlertCircle,
  Banknote,
  Clock,
  FileText,
  Home,
  Loader2,
  Lock,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { ReactElement, useCallback, useEffect, useState } from "react";
import VerifiedBadge from "@/components/ui/VerifiedBadge";
import {
  getBankName,
  getHostVerification,
  maskAccountNumber,
  type HostCheckStatus,
  type HostVerificationRole,
  type HostVerificationSnapshot,
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

const CHECK_LABELS: Record<string, string> = {
  NIN: "NIN",
  BVN: "BVN",
  SELFIE: "Selfie",
};

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

function PendingBadge({ children }: { children: string }): ReactElement {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 font-body text-xs font-bold text-primary">
      <Clock size={14} />
      {children}
    </span>
  );
}

function ActionBadge(): ReactElement {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 font-body text-xs font-bold text-red-700">
      <AlertCircle size={14} />
      Action needed
    </span>
  );
}

function NotStarted(): ReactElement {
  return <p className="font-body text-sm text-muted">Not started</p>;
}

export default function HostVerificationCenter({
  role,
}: HostVerificationCenterProps): ReactElement {
  const [snapshot, setSnapshot] = useState<HostVerificationSnapshot | null>(
    null,
  );
  const [loadError, setLoadError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async (): Promise<void> => {
    const result = await getHostVerification();

    if (!result.data) {
      setLoadError(result.message ?? "Your status could not be loaded.");
    } else {
      setLoadError("");
      setSnapshot(result.data);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    let active = true;

    void getHostVerification().then((result) => {
      if (!active) {
        return;
      }

      if (!result.data) {
        setLoadError(result.message ?? "Your status could not be loaded.");
      } else {
        setLoadError("");
        setSnapshot(result.data);
      }

      setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  // Finishing a flow in another tab should not leave a stale page behind here
  useEffect(() => {
    const refresh = (): void => {
      if (document.visibilityState === "visible") {
        void load();
      }
    };

    document.addEventListener("visibilitychange", refresh);

    return () => document.removeEventListener("visibilitychange", refresh);
  }, [load]);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-surface-soft">
        <Loader2
          className="h-8 w-8 animate-spin text-primary"
          aria-label="Loading your verification status"
        />
      </main>
    );
  }

  if (!snapshot) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-surface-soft px-5">
        <div className="max-w-md text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-muted" />
          <p className="mt-4 font-body text-sm leading-6 text-muted">
            {loadError || "Your status could not be loaded."}
          </p>
          <button
            type="button"
            onClick={() => {
              setIsLoading(true);
              void load();
            }}
            className="mt-6 inline-flex min-h-11 items-center rounded-full bg-accent px-5 py-3 font-body text-sm font-medium text-primary transition-all hover:bg-primary hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  const { identity, kyb, payout } = snapshot;
  const completeCount = [identity.status, kyb.status, payout.status].filter(
    (status: HostCheckStatus) => status === "approved",
  ).length;

  const renderIdentity = (): ReactElement => {
    if (identity.status === "approved") {
      return (
        <div className="space-y-3">
          <VerifiedBadge size="sm" />
          <p className="font-body text-sm text-muted">
            {identity.required.map((check) => CHECK_LABELS[check]).join(", ")}{" "}
            confirmed
          </p>
        </div>
      );
    }

    if (identity.status === "partial") {
      return (
        <div className="space-y-3">
          <PendingBadge>Part finished</PendingBadge>
          <p className="font-body text-sm leading-6 text-muted">
            {identity.outstanding
              .map((check) => CHECK_LABELS[check])
              .join(" and ")}{" "}
            still to go.
          </p>
        </div>
      );
    }

    return <NotStarted />;
  };

  const renderKyb = (): ReactElement => {
    if (kyb.status === "approved") {
      return (
        <div className="space-y-3">
          <VerifiedBadge size="sm" />
          <p className="font-body text-sm text-muted">
            Business documents approved
          </p>
        </div>
      );
    }

    if (kyb.status === "pending") {
      return (
        <div className="space-y-3">
          <PendingBadge>Under review</PendingBadge>
          <p className="font-body text-sm leading-6 text-muted">
            Usually takes 1 to 2 business days. We will email you the decision.
          </p>
        </div>
      );
    }

    if (kyb.status === "rejected") {
      return (
        <div className="space-y-3">
          <ActionBadge />
          <p className="font-body text-sm leading-6 text-muted">
            {kyb.rejectionReason ?? "Upload clearer documents and resubmit."}
          </p>
        </div>
      );
    }

    return <NotStarted />;
  };

  const renderPayout = (): ReactElement => {
    if (payout.status === "approved") {
      return (
        <div className="space-y-3">
          <VerifiedBadge size="sm" />
          <p className="font-body text-sm font-bold text-primary">
            {getBankName(payout.bankCode)} ·{" "}
            {maskAccountNumber(payout.accountLast4)}
          </p>
          <p className="font-body text-sm text-muted">{payout.accountName}</p>
        </div>
      );
    }

    return <NotStarted />;
  };

  const identityActionLabel =
    identity.status === "approved"
      ? undefined
      : identity.status === "partial"
        ? "Finish"
        : "Begin";

  // Documents are collected inside the identity flow, so there is nowhere
  // separate to send a host who has not verified their identity yet
  const kybActionLabel =
    kyb.status === "rejected"
      ? "Resubmit"
      : kyb.status === "not_started" && identity.status === "approved"
        ? "Upload documents"
        : undefined;

  const payoutActionLabel =
    payout.status === "approved" ? undefined : "Set up payout";

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
          Complete these checks to publish listings and receive payouts. Your
          identity is confirmed straight away; business documents are reviewed
          by our team.
        </p>

        <div className="mt-8 rounded-xl border border-primary/10 bg-[var(--color-bg)] p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-body text-sm font-bold text-primary">
              {completeCount} of 3 complete
            </p>
            <p className="font-body text-xs text-muted">
              Property verification starts after your first listing is created.
            </p>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-accent transition-all duration-300 ease-in-out"
              style={{ width: `${(completeCount / 3) * 100}%` }}
            />
          </div>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <StatusCard
            actionHref={
              identityActionLabel ? `/${role}/verify/identity` : undefined
            }
            actionLabel={identityActionLabel}
            icon={ShieldCheck}
            title="Identity Verification"
          >
            {renderIdentity()}
          </StatusCard>

          <StatusCard
            actionHref={kybActionLabel ? `/${role}/verify/identity` : undefined}
            actionLabel={kybActionLabel}
            icon={FileText}
            title="Business Documents"
          >
            {renderKyb()}
          </StatusCard>

          <StatusCard
            actionHref={payoutActionLabel ? `/${role}/verify/payout` : undefined}
            actionLabel={payoutActionLabel}
            icon={Banknote}
            title="Payout Setup"
          >
            {renderPayout()}
          </StatusCard>

          <StatusCard icon={Home} locked title="Property Verification">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/5 px-3 py-1 font-body text-xs font-bold text-muted">
                <Lock size={14} />
                Locked
              </span>
              <p className="font-body text-sm leading-6 text-muted">
                Available once you add a property. Each listing is verified with
                a photo taken at the address.
              </p>
            </div>
          </StatusCard>
        </div>
      </section>
    </main>
  );
}

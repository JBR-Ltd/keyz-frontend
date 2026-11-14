"use client";

import {
  AlertCircle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  FileText,
  IdCard,
  Landmark,
  LockKeyhole,
  ScanFace,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { type ReactElement, useCallback, useEffect, useState } from "react";
import VerifiedBadge from "@/components/ui/VerifiedBadge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getHostVerification,
  type HostVerificationRole,
  type HostVerificationSnapshot,
} from "@/lib/hostVerification";

interface HostVerificationCenterProps {
  role: HostVerificationRole;
}

interface Requirement {
  description: string;
  icon: typeof ShieldCheck;
  title: string;
}

const LANDLORD_REQUIREMENTS: Requirement[] = [
  {
    description: "Your 11 digit National Identification Number",
    icon: IdCard,
    title: "NIN",
  },
  {
    description: "Your 11 digit Bank Verification Number",
    icon: Landmark,
    title: "BVN",
  },
  {
    description: "A clear, current photo of your face",
    icon: ScanFace,
    title: "Live selfie",
  },
];

const AGENT_REQUIREMENTS: Requirement[] = [
  ...LANDLORD_REQUIREMENTS,
  {
    description: "Your CAC certificate or equivalent ownership record",
    icon: Building2,
    title: "Business registration",
  },
  {
    description: "A recent utility bill, bank statement, or address document",
    icon: FileText,
    title: "Proof of address",
  },
];

function PreparationSkeleton(): ReactElement {
  return (
    <main
      className="min-h-screen bg-surface-soft px-5 py-12 sm:px-8 lg:px-10 lg:py-16"
      role="status"
      aria-label="Loading identity verification"
    >
      <div className="mx-auto max-w-3xl">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-6 h-12 w-4/5 max-w-xl" />
        <Skeleton className="mt-4 h-5 w-full max-w-2xl" />
        <div className="mt-12 border-y border-border">
          {Array.from({ length: 3 }, (_, index) => (
            <div
              key={`identity-requirement-${index + 1}`}
              className="flex items-center gap-4 border-b border-border py-5 last:border-b-0"
              aria-hidden="true"
            >
              <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="mt-2 h-4 w-3/4" />
              </div>
            </div>
          ))}
        </div>
        <Skeleton className="mt-8 h-12 w-48 rounded-full" />
      </div>
      <span className="sr-only">Loading identity verification</span>
    </main>
  );
}

export default function HostVerificationCenter({
  role,
}: HostVerificationCenterProps): ReactElement {
  const [snapshot, setSnapshot] = useState<HostVerificationSnapshot | null>(
    null,
  );
  const [loadError, setLoadError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback((): void => {
    setRefreshKey((current) => current + 1);
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
  }, [refreshKey]);

  useEffect(() => {
    const refresh = (): void => {
      if (document.visibilityState === "visible") {
        load();
      }
    };

    document.addEventListener("visibilitychange", refresh);
    return () => document.removeEventListener("visibilitychange", refresh);
  }, [load]);

  if (isLoading) {
    return <PreparationSkeleton />;
  }

  if (!snapshot) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-surface-soft px-5 py-16">
        <section className="w-full max-w-lg text-center">
          <AlertCircle className="mx-auto h-11 w-11 text-red-700" />
          <h1 className="mt-5 font-display text-3xl font-bold text-primary">
            We could not load your verification
          </h1>
          <p className="mt-3 font-body text-sm leading-6 text-muted">
            {loadError || "Your status could not be loaded."}
          </p>
          <button
            type="button"
            onClick={() => {
              setIsLoading(true);
              load();
            }}
            className="mt-7 inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-6 font-body text-sm font-bold text-white transition-colors hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Try again
          </button>
        </section>
      </main>
    );
  }

  const { identity, kyb } = snapshot;
  const isAgent = role === "agent";
  const dashboardHref = `/${role}/dashboard`;
  const identityHref = `/${role}/verify/identity`;
  const requirements = isAgent ? AGENT_REQUIREMENTS : LANDLORD_REQUIREMENTS;
  const isApproved =
    identity.status === "approved" && (!isAgent || kyb.status === "approved");
  const isPending =
    isAgent && identity.status === "approved" && kyb.status === "pending";
  const isRejected = isAgent && kyb.status === "rejected";
  const needsDocuments =
    isAgent && identity.status === "approved" && kyb.status === "not_started";

  if (isApproved || isPending) {
    return (
      <main className="min-h-screen bg-surface-soft px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
        <section className="mx-auto max-w-2xl text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent/15 text-primary">
            {isApproved ? (
              <CheckCircle2 size={30} aria-hidden="true" />
            ) : (
              <Clock3 size={30} aria-hidden="true" />
            )}
          </span>
          <p className="mt-6 font-accent text-xs font-bold uppercase tracking-[0.3em] text-accent-alt">
            Identity verification
          </p>
          <h1 className="mt-3 font-display text-4xl font-bold leading-tight text-primary sm:text-5xl">
            {isApproved
              ? isAgent
                ? "Your agent profile is verified"
                : "Your identity is confirmed"
              : "Your documents are under review"}
          </h1>
          <p className="mx-auto mt-4 max-w-xl font-body text-base leading-7 text-muted">
            {isApproved
              ? "Your verification is complete. Return to your dashboard to continue setting up your Rello account."
              : "Your identity is confirmed. Our team will email you when the business-document review is complete."}
          </p>
          {isApproved ? (
            <div className="mt-6 flex justify-center">
              <VerifiedBadge size="md" />
            </div>
          ) : (
            <p
              className="mt-6 font-body text-sm font-bold text-primary"
              role="status"
            >
              Review in progress
            </p>
          )}
          <Link
            href={dashboardHref}
            className="mt-9 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-7 font-body text-sm font-bold text-white transition-colors hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Back to dashboard
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </section>
      </main>
    );
  }

  const actionLabel = isRejected
    ? "Resubmit documents"
    : needsDocuments
      ? "Upload business documents"
      : identity.status === "partial"
        ? "Continue identity check"
        : "Start identity check";

  return (
    <main className="min-h-screen bg-surface-soft px-5 py-12 sm:px-8 lg:px-10 lg:py-16">
      <section className="mx-auto max-w-3xl">
        <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-accent-alt">
          Account verification
        </p>
        <h1 className="mt-4 max-w-2xl font-display text-4xl font-bold leading-[0.96] text-primary sm:text-5xl">
          {isAgent ? "Verify your agent profile" : "Confirm your identity"}
        </h1>
        <p className="mt-5 max-w-2xl font-body text-base leading-7 text-muted">
          {isAgent
            ? "Confirm who you are and provide your business documents before publishing listings on Rello."
            : "Confirm who you are so tenants can trust your profile and you can publish homes on Rello."}
        </p>

        {isRejected ? (
          <div className="mt-8 border-l-4 border-red-700 pl-5" role="alert">
            <p className="font-body text-sm font-bold text-red-700">
              Your business documents need attention
            </p>
            <p className="mt-2 font-body text-sm leading-6 text-muted">
              {kyb.rejectionReason ??
                "Upload clearer or more recent documents and submit them again."}
            </p>
          </div>
        ) : null}

        <div className="mt-12">
          <h2 className="font-body text-sm font-bold text-primary">
            Have these ready
          </h2>
          <ul
            className="mt-4 border-y border-border"
            aria-label="Verification requirements"
          >
            {requirements.map((requirement) => {
              const Icon = requirement.icon;

              return (
                <li
                  key={requirement.title}
                  className="flex min-h-20 items-center gap-4 border-b border-border py-4 last:border-b-0"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/5 text-primary">
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block font-body text-sm font-bold text-primary">
                      {requirement.title}
                    </span>
                    <span className="mt-1 block font-body text-sm leading-6 text-muted">
                      {requirement.description}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="mt-7 flex items-start gap-3 text-muted">
          <LockKeyhole
            className="mt-0.5 h-5 w-5 shrink-0 text-accent-alt"
            aria-hidden="true"
          />
          <p className="max-w-2xl font-body text-sm leading-6">
            Your identity information is securely checked through Dojah and is
            not shown on your public profile.
          </p>
        </div>

        <Link
          href={identityHref}
          className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-7 font-body text-sm font-bold text-white transition-colors hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {actionLabel}
          <ArrowRight size={17} aria-hidden="true" />
        </Link>
      </section>
    </main>
  );
}

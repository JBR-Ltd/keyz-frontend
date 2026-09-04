"use client";

import type { ChangeEvent, ReactElement, ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Banknote,
  Camera,
  Check,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Select } from "@/components/ui/select";
import { useAuthenticatedUser } from "@/lib/account";
import {
  approveAgentIdentity,
  approveHostPayout,
  getHostVerificationSnapshot,
  saveHostIdentityVerification,
  setupHostPayout,
} from "@/lib/hostVerification";

type VerificationScreen =
  | "overview"
  | "nin"
  | "bvn"
  | "selfie"
  | "review"
  | "processing"
  | "approved"
  | "payout"
  | "deposits"
  | "complete"
  | "failed";

interface FlowCardProps {
  backLabel?: string;
  children: ReactNode;
  description: string;
  eyebrow: string;
  onBack?: () => void;
  progress?: number;
  title: string;
}

const PRIMARY_BUTTON_CLASS =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 font-body text-sm font-bold text-white transition-all duration-200 ease-in-out hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50";

const SECONDARY_BUTTON_CLASS =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-primary/15 bg-bg px-6 py-3 font-body text-sm font-bold text-primary transition-colors hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent";

function FlowCard({
  backLabel = "Back",
  children,
  description,
  eyebrow,
  onBack,
  progress,
  title,
}: FlowCardProps): ReactElement {
  return (
    <section className="mx-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-primary/10 bg-bg shadow-sm">
      {typeof progress === "number" ? (
        <div className="h-1.5 bg-primary/5">
          <div
            className="h-full rounded-r-full bg-accent transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      ) : null}
      <div className="p-6 sm:p-8 lg:p-10">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="mb-8 inline-flex items-center gap-2 font-body text-sm font-bold text-muted transition-colors hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <ArrowLeft size={17} aria-hidden="true" />
            {backLabel}
          </button>
        ) : null}
        <p className="font-accent text-[11px] font-bold uppercase tracking-[0.24em] text-accent-alt">
          {eyebrow}
        </p>
        <h1 className="mt-3 font-display text-3xl font-bold leading-tight text-primary sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 max-w-xl font-body text-sm leading-6 text-muted">
          {description}
        </p>
        <div className="mt-8">{children}</div>
      </div>
    </section>
  );
}

interface IdentityNumberScreenProps {
  label: string;
  /** Omitted on the first step, where there is nothing to go back to. */
  onBack?: () => void;
  onContinue: () => void;
  progress: number;
  supportingText: string;
  title: string;
  value: string;
  onValueChange: (value: string) => void;
}

function IdentityNumberScreen({
  label,
  onBack,
  onContinue,
  progress,
  supportingText,
  title,
  value,
  onValueChange,
}: IdentityNumberScreenProps): ReactElement {
  return (
    <FlowCard
      eyebrow="Identity verification"
      title={title}
      description={supportingText}
      progress={progress}
      onBack={onBack}
    >
      <label className="block font-body text-sm font-bold text-primary">
        {label}
        <input
          value={value}
          onChange={(event) =>
            onValueChange(event.target.value.replace(/\D/g, "").slice(0, 11))
          }
          inputMode="numeric"
          placeholder="Enter 11 digits"
          className="mt-3 min-h-14 w-full rounded-xl border border-primary/15 bg-bg px-4 font-body text-base tracking-[0.18em] text-primary outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
        />
      </label>
      <div className="mt-4 flex items-start gap-3 rounded-xl bg-primary/5 p-4">
        <LockKeyhole
          size={18}
          className="mt-0.5 shrink-0 text-primary"
          aria-hidden="true"
        />
        <p className="font-body text-xs leading-5 text-muted">
          Your number is encrypted and used only to confirm your legal identity.
        </p>
      </div>
      <button
        type="button"
        onClick={onContinue}
        disabled={value.length !== 11}
        className={`mt-8 w-full ${PRIMARY_BUTTON_CLASS}`}
      >
        Continue
        <ArrowRight size={17} aria-hidden="true" />
      </button>
    </FlowCard>
  );
}

function getInitialScreen(): VerificationScreen {
  const snapshot = getHostVerificationSnapshot("agent");

  if (snapshot.payout.status === "approved") return "complete";
  if (snapshot.payout.status === "pending") return "deposits";
  if (snapshot.identity.status === "approved") return "approved";
  if (snapshot.identity.status === "failed") return "failed";

  return "overview";
}

function emitVerificationChange(): void {
  window.dispatchEvent(new Event("storage"));
}

export default function AgentVerificationPage(): ReactElement {
  const { user } = useAuthenticatedUser();
  const [screen, setScreen] = useState<VerificationScreen>(getInitialScreen);
  const [nin, setNin] = useState("");
  const [bvn, setBvn] = useState("");
  const [bankCode, setBankCode] = useState("058");
  const [accountNumber, setAccountNumber] = useState("");
  const [depositOne, setDepositOne] = useState("");
  const [depositTwo, setDepositTwo] = useState("");
  const [selfieName, setSelfieName] = useState("");
  const accountName = user
    ? `${user.firstName} ${user.lastName}`.trim()
    : "Agent account";

  useEffect(() => {
    if (screen !== "processing") return;

    const timeout = window.setTimeout(() => {
      if (nin === "00000000000" || bvn === "00000000000") {
        saveHostIdentityVerification("agent", {
          status: "failed",
          submittedAt: new Date().toISOString(),
          approvedAt: null,
          rejectedReason:
            "The submitted identity details could not be matched.",
        });
        emitVerificationChange();
        setScreen("failed");
        return;
      }

      approveAgentIdentity("agent");
      emitVerificationChange();
      setScreen("approved");
    }, 1600);

    return () => window.clearTimeout(timeout);
  }, [bvn, nin, screen]);

  const handleSelfieUpload = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (file) setSelfieName(file.name);
  };

  const submitPayout = (): void => {
    const bankNames: Record<string, string> = {
      "058": "Guaranty Trust Bank",
      "044": "Access Bank",
      "033": "United Bank for Africa",
    };

    setupHostPayout("agent", {
      bankName: bankNames[bankCode] ?? "Selected bank",
      accountNumber,
      accountName,
    });
    emitVerificationChange();
    setScreen("deposits");
  };

  const confirmDeposits = (): void => {
    approveHostPayout("agent");
    emitVerificationChange();
    setScreen("complete");
  };

  const renderScreen = (): ReactElement => {
    if (screen === "overview") {
      return (
        <FlowCard
          eyebrow="Agent onboarding"
          title="Verify your agent account"
          description="Build trust with clients, publish listings, and prepare your account to receive earnings. Most agents finish in about 3 minutes."
        >
          <div className="space-y-3">
            <div className="flex items-center gap-4 rounded-xl border border-primary/10 p-4 sm:p-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/15 text-primary">
                <ShieldCheck size={21} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-body text-sm font-bold text-primary">
                  Verify your identity
                </span>
                <span className="mt-1 block font-body text-xs leading-5 text-muted">
                  NIN, BVN, and a quick selfie
                </span>
              </span>
              <span className="rounded-full bg-accent/10 px-3 py-1 font-body text-[11px] font-bold text-accent-alt">
                Required
              </span>
            </div>
            <div className="flex items-center gap-4 rounded-xl border border-primary/10 p-4 sm:p-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/5 text-primary">
                <Banknote size={21} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-body text-sm font-bold text-primary">
                  Add a payout account
                </span>
                <span className="mt-1 block font-body text-xs leading-5 text-muted">
                  Complete this after identity approval
                </span>
              </span>
              <span className="font-body text-xs font-bold text-muted">
                Step 2
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setScreen("nin")}
            className={`mt-8 w-full ${PRIMARY_BUTTON_CLASS}`}
          >
            Start verification
            <ArrowRight size={17} aria-hidden="true" />
          </button>
          <p className="mt-4 text-center font-body text-xs text-muted">
            Your details are never displayed publicly.
          </p>
        </FlowCard>
      );
    }

    if (screen === "nin") {
      return (
        <IdentityNumberScreen
          label="National Identification Number"
          title="Enter your NIN"
          supportingText="We use your NIN to confirm your name and identity with trusted records."
          progress={25}
          value={nin}
          onValueChange={setNin}
          onContinue={() => setScreen("bvn")}
        />
      );
    }

    if (screen === "bvn") {
      return (
        <IdentityNumberScreen
          label="Bank Verification Number"
          title="Enter your BVN"
          supportingText="Your BVN helps us match your identity to the payout account you add later."
          progress={50}
          value={bvn}
          onValueChange={setBvn}
          onBack={() => setScreen("nin")}
          onContinue={() => setScreen("selfie")}
        />
      );
    }

    if (screen === "selfie") {
      return (
        <FlowCard
          eyebrow="Identity verification"
          title="Take a quick selfie"
          description="We will compare this with your verified identity details. Use a bright space and keep your face clearly visible."
          progress={75}
          onBack={() => setScreen("bvn")}
        >
          <div className="rounded-2xl border border-dashed border-primary/20 bg-primary/[0.025] px-6 py-10 text-center">
            <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary text-white shadow-md">
              <Camera size={31} strokeWidth={1.7} aria-hidden="true" />
            </span>
            <p className="mt-5 font-body text-sm font-bold text-primary">
              Position your face inside the frame
            </p>
            <p className="mx-auto mt-2 max-w-sm font-body text-xs leading-5 text-muted">
              Remove hats and tinted glasses. Do not upload a photo of another
              screen.
            </p>
            <input
              id="agent-selfie"
              type="file"
              accept="image/*"
              capture="user"
              onChange={handleSelfieUpload}
              className="sr-only"
            />
            <label
              htmlFor="agent-selfie"
              className={"mt-6 cursor-pointer " + PRIMARY_BUTTON_CLASS}
            >
              {selfieName ? (
                <CheckCircle2 size={17} aria-hidden="true" />
              ) : (
                <Camera size={17} aria-hidden="true" />
              )}
              {selfieName || "Take or upload selfie"}
            </label>
          </div>
          <button
            type="button"
            onClick={() => setScreen("review")}
            disabled={!selfieName}
            className={`mt-6 w-full ${PRIMARY_BUTTON_CLASS}`}
          >
            Continue
            <ArrowRight size={17} aria-hidden="true" />
          </button>
        </FlowCard>
      );
    }

    if (screen === "review") {
      return (
        <FlowCard
          eyebrow="Identity verification"
          title="Review your details"
          description="Make sure these details are correct before submitting them for verification."
          progress={100}
          onBack={() => setScreen("selfie")}
        >
          <div className="divide-y divide-primary/10 rounded-xl border border-primary/10">
            {[
              ["NIN", `•••••••${nin.slice(-4)}`],
              ["BVN", `•••••••${bvn.slice(-4)}`],
              ["Selfie", "Ready to submit"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between gap-4 px-4 py-4"
              >
                <span className="font-body text-sm text-muted">{label}</span>
                <span className="flex items-center gap-2 font-body text-sm font-bold text-primary">
                  <CheckCircle2 size={16} className="text-accent-alt" />
                  {value}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-start gap-3 rounded-xl bg-primary/5 p-4">
            <LockKeyhole size={18} className="mt-0.5 shrink-0 text-primary" />
            <p className="font-body text-xs leading-5 text-muted">
              By continuing, you consent to secure identity checks for fraud
              prevention and account verification.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setScreen("processing")}
            className={`mt-8 w-full ${PRIMARY_BUTTON_CLASS}`}
          >
            Submit for verification
            <ShieldCheck size={17} aria-hidden="true" />
          </button>
        </FlowCard>
      );
    }

    if (screen === "processing") {
      return (
        <FlowCard
          eyebrow="Submitted"
          title="We are checking your details"
          description="You can safely leave this page. We will notify you as soon as there is an update."
        >
          <div className="py-5 text-center">
            <span className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-accent/10 text-primary">
              <LoaderCircle
                size={42}
                strokeWidth={1.6}
                className="animate-spin"
                aria-hidden="true"
              />
            </span>
            <div className="mx-auto mt-7 max-w-sm rounded-xl bg-primary/5 p-4">
              <p className="font-body text-sm font-bold text-primary">
                Verification in progress
              </p>
              <p className="mt-1 font-body text-xs leading-5 text-muted">
                This usually takes less than a minute, but some checks may need
                additional review.
              </p>
            </div>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/agent/dashboard" className={SECONDARY_BUTTON_CLASS}>
                Return to dashboard
              </Link>
            </div>
          </div>
        </FlowCard>
      );
    }

    if (screen === "approved") {
      return (
        <FlowCard
          eyebrow="Identity approved"
          title="Your identity is verified"
          description="Your agent profile can now display a verified identity badge. Complete payout setup to receive earnings through Rello."
        >
          <div className="rounded-2xl bg-accent/10 p-6 text-center sm:p-8">
            <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary text-white">
              <BadgeCheck size={38} strokeWidth={1.7} aria-hidden="true" />
            </span>
            <p className="mt-5 font-display text-xl font-bold text-primary">
              Verified agent
            </p>
            <p className="mt-2 font-body text-sm text-muted">
              Identity verification completed today
            </p>
          </div>
          <button
            type="button"
            onClick={() => setScreen("payout")}
            className={`mt-8 w-full ${PRIMARY_BUTTON_CLASS}`}
          >
            Set up payouts
            <ArrowRight size={17} aria-hidden="true" />
          </button>
        </FlowCard>
      );
    }

    if (screen === "payout") {
      return (
        <FlowCard
          eyebrow="Payout setup"
          title="Where should we send your earnings?"
          description="The account name should match the legal name used during identity verification."
          onBack={() => setScreen("approved")}
        >
          <div className="space-y-5">
            <label className="block font-body text-sm font-bold text-primary">
              Bank
              <Select
                ariaLabel="Bank"
                value={bankCode}
                onValueChange={setBankCode}
                className="mt-2 min-h-14 w-full rounded-xl border border-primary/15 bg-bg px-4 font-body text-sm text-primary outline-none focus:border-accent focus:ring-4 focus:ring-accent/10"
                options={[
                  { label: "Guaranty Trust Bank", value: "058" },
                  { label: "Access Bank", value: "044" },
                  { label: "United Bank for Africa", value: "033" },
                ]}
              />
            </label>
            <label className="block font-body text-sm font-bold text-primary">
              Account number
              <input
                value={accountNumber}
                onChange={(event) =>
                  setAccountNumber(
                    event.target.value.replace(/\D/g, "").slice(0, 10),
                  )
                }
                inputMode="numeric"
                className="mt-2 min-h-14 w-full rounded-xl border border-primary/15 bg-bg px-4 font-body text-base tracking-[0.18em] text-primary outline-none focus:border-accent focus:ring-4 focus:ring-accent/10"
              />
            </label>
            <div className="flex items-center gap-3 rounded-xl border border-accent/30 bg-accent/10 p-4">
              <CheckCircle2 size={19} className="shrink-0 text-primary" />
              <span>
                <span className="block font-body text-sm font-bold text-primary">
                  {accountName}
                </span>
                <span className="mt-0.5 block font-body text-xs text-muted">
                  Account name matched
                </span>
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={submitPayout}
            disabled={accountNumber.length !== 10}
            className={`mt-8 w-full ${PRIMARY_BUTTON_CLASS}`}
          >
            Confirm payout account
            <ArrowRight size={17} aria-hidden="true" />
          </button>
        </FlowCard>
      );
    }

    if (screen === "deposits") {
      return (
        <FlowCard
          eyebrow="Confirm payout account"
          title="Enter the two deposit amounts"
          description={`We sent two small deposits to your account ending in ${accountNumber.slice(-4)}. Enter both amounts to confirm that you control the account.`}
          onBack={() => setScreen("payout")}
        >
          <div className="flex items-start gap-3 rounded-xl bg-primary/5 p-4">
            <Clock3 size={19} className="mt-0.5 shrink-0 text-primary" />
            <p className="font-body text-xs leading-5 text-muted">
              Deposits can take 1 to 2 business days to appear in your bank
              statement.
            </p>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              ["First deposit", depositOne, setDepositOne],
              ["Second deposit", depositTwo, setDepositTwo],
            ].map(([label, value, setter]) => (
              <label
                key={label as string}
                className="block font-body text-sm font-bold text-primary"
              >
                {label as string}
                <span className="mt-2 flex min-h-14 items-center rounded-xl border border-primary/15 px-4 focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/10">
                  <span className="font-body text-sm text-muted">₦</span>
                  <input
                    value={value as string}
                    onChange={(event) =>
                      (setter as (nextValue: string) => void)(
                        event.target.value.replace(/[^\d.]/g, ""),
                      )
                    }
                    inputMode="decimal"
                    placeholder="0.00"
                    className="min-w-0 flex-1 bg-transparent px-2 font-body text-base text-primary outline-none"
                  />
                </span>
              </label>
            ))}
          </div>
          <button
            type="button"
            onClick={confirmDeposits}
            disabled={!depositOne || !depositTwo}
            className={`mt-8 w-full ${PRIMARY_BUTTON_CLASS}`}
          >
            Verify deposits
            <Check size={17} aria-hidden="true" />
          </button>
        </FlowCard>
      );
    }

    if (screen === "complete") {
      return (
        <FlowCard
          eyebrow="Setup complete"
          title="You are ready to use Rello"
          description="Your identity and payout account are verified. You can now publish listings and receive earnings."
        >
          <div className="rounded-2xl bg-primary px-6 py-8 text-center text-white sm:p-10">
            <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-accent text-primary">
              <CheckCircle2 size={40} strokeWidth={1.7} aria-hidden="true" />
            </span>
            <p className="mt-5 font-display text-2xl font-bold">
              Fully verified
            </p>
            <div className="mx-auto mt-6 grid max-w-sm gap-3 text-left sm:grid-cols-2">
              {["Identity approved", "Payouts active"].map((item) => (
                <span
                  key={item}
                  className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-3 font-body text-xs font-bold"
                >
                  <Check size={15} className="text-accent" />
                  {item}
                </span>
              ))}
            </div>
          </div>
          <Link
            href="/agent/dashboard"
            className={`mt-8 w-full ${PRIMARY_BUTTON_CLASS}`}
          >
            Go to dashboard
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </FlowCard>
      );
    }

    return (
      <FlowCard
        eyebrow="Action needed"
        title="We could not verify your identity"
        description="Your details were not changed. Review the issue below and try again when you are ready."
      >
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-700 text-white">
            <XCircle size={30} aria-hidden="true" />
          </span>
          <p className="mt-5 font-body text-sm font-bold text-red-700">
            Selfie could not be matched
          </p>
          <p className="mx-auto mt-2 max-w-sm font-body text-xs leading-5 text-muted">
            Take a new photo in brighter lighting and make sure your face is
            fully visible.
          </p>
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => setScreen("selfie")}
            className={`flex-1 ${PRIMARY_BUTTON_CLASS}`}
          >
            <RefreshCw size={17} aria-hidden="true" />
            Retake selfie
          </button>
          <button
            type="button"
            onClick={() => setScreen("overview")}
            className={`flex-1 ${SECONDARY_BUTTON_CLASS}`}
          >
            Start again
          </button>
        </div>
      </FlowCard>
    );
  };

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-surface-soft px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      {renderScreen()}
    </main>
  );
}

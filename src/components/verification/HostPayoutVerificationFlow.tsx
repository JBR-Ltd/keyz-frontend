"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Banknote, Check, Landmark, Loader2, Lock } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChangeEvent,
  FormEvent,
  ReactElement,
  useEffect,
  useState,
} from "react";
import { Select } from "@/components/ui/select";
import {
  resolvePayoutAccount,
  savePayoutAccount,
  type ResolvedAccount,
} from "@/lib/payout";
import VerifiedBadge from "@/components/ui/VerifiedBadge";
import VerificationFlowSkeleton from "@/components/verification/VerificationFlowSkeleton";
import {
  getHostVerification,
  HostVerificationRole,
} from "@/lib/hostVerification";
import { cn } from "@/lib/utils";

interface HostPayoutVerificationFlowProps {
  role: HostVerificationRole;
}

interface BankOption {
  name: string;
  code: string;
}

type PayoutScreen = "loading" | "overview" | "setup" | "complete";

const BANK_OPTIONS: BankOption[] = [
  { name: "Access Bank", code: "044" },
  { name: "First Bank", code: "011" },
  { name: "GTBank", code: "058" },
  { name: "UBA", code: "033" },
  { name: "Zenith Bank", code: "057" },
];

function isValidAccountNumber(value: string): boolean {
  return /^\d{10}$/.test(value);
}

export default function HostPayoutVerificationFlow({
  role,
}: HostPayoutVerificationFlowProps): ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reduceMotion = useReducedMotion();
  const centerHref = `/${role}/verify`;
  const initialMode: PayoutScreen =
    searchParams.get("mode") === "setup" ? "setup" : "overview";
  const [screen, setScreen] = useState<PayoutScreen>("loading");
  const [bankName, setBankName] = useState(BANK_OPTIONS[0].name);
  const [accountNumber, setAccountNumber] = useState("");
  const [resolved, setResolved] = useState<ResolvedAccount | null>(null);
  const [formError, setFormError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    let active = true;

    void getHostVerification().then((result) => {
      if (!active) {
        return;
      }

      setScreen(
        result.data?.payout.status === "approved" ? "complete" : initialMode,
      );
    });

    return () => {
      active = false;
    };
  }, [initialMode]);

  const exitFlow = (): void => {
    router.push(centerHref);
  };

  const handleAccountNumberChange = (
    event: ChangeEvent<HTMLInputElement>,
  ): void => {
    setAccountNumber(event.target.value.replace(/\D/g, "").slice(0, 10));
    setResolved(null);
    setFormError("");
  };

  /** Step one: ask the bank who owns the account. Nothing is saved yet. */
  const lookUpAccount = async (): Promise<void> => {
    setFormError("");

    const bankCode = BANK_OPTIONS.find((bank) => bank.name === bankName)?.code;

    if (!bankCode || !isValidAccountNumber(accountNumber)) {
      setFormError("Choose your bank and enter a 10 digit account number.");
      return;
    }

    setIsProcessing(true);

    try {
      const result = await resolvePayoutAccount(bankCode, accountNumber);

      if (!result.data) {
        setResolved(null);
        setFormError(result.message ?? "We could not find that account.");
        return;
      }

      setResolved(result.data);
    } finally {
      setIsProcessing(false);
    }
  };

  /** Step two: the host has seen the name and confirmed it is theirs. */
  const submitSetup = async (): Promise<void> => {
    setFormError("");

    const bankCode = BANK_OPTIONS.find((bank) => bank.name === bankName)?.code;

    if (!resolved || !bankCode) {
      setFormError("Look up the account before saving it.");
      return;
    }

    setIsProcessing(true);

    try {
      const result = await savePayoutAccount(bankCode, accountNumber);

      if (!result.data) {
        setFormError(result.message ?? "Payout setup failed. Try again.");
        return;
      }

      setScreen("complete");
    } finally {
      setIsProcessing(false);
    }
  };

  const submitStep = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    void submitSetup();
  };

  const renderOverview = (): ReactElement => (
    <main className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-primary px-5 py-16 text-white">
      <motion.div
        className="w-full max-w-2xl text-center"
        initial={reduceMotion ? false : { opacity: 0, y: 20 }}
        animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <Banknote className="mx-auto mb-6 h-12 w-12 text-accent" />
        <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-accent">
          Payout Setup
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold leading-tight text-white">
          Set up how you get paid.
        </h1>
        <p className="mx-auto mt-4 max-w-md font-body text-base leading-7 text-white/70">
          Enter your account number and we will show you the name your bank has
          on it. Confirm it is yours and payouts are active straight away.
        </p>
        <div className="mx-auto mt-12 max-w-xl rounded-lg border border-white/10 bg-primary p-6 text-left">
          <div className="flex items-center gap-3">
            <Lock className="h-5 w-5 text-accent" />
            <p className="font-body text-sm font-bold text-white/80">
              Instant bank verification
            </p>
          </div>
          <p className="mt-3 font-body text-xs leading-6 text-white/70">
            We check the name on the account against your verified identity, so
            payouts cannot be redirected to someone else.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setScreen("setup")}
          className="mt-10 rounded-full bg-accent px-10 py-4 font-body text-sm font-medium text-primary transition-all duration-200 ease-in-out hover:scale-[1.02] hover:bg-primary hover:text-white hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Set Up Payout
        </button>
        <button
          type="button"
          onClick={exitFlow}
          className="mx-auto mt-4 block font-body text-sm text-white/70 underline-offset-4 transition-all duration-200 ease-in-out hover:text-white hover:underline"
        >
          Save and exit
        </button>
      </motion.div>
    </main>
  );

  const renderTopBar = (): ReactElement => (
    <div className="fixed inset-x-0 top-0 z-[101] border-b border-border bg-bg px-5 py-4 shadow-sm">
      <div className="mx-auto grid max-w-5xl grid-cols-[1fr_auto_1fr] items-center gap-4">
        <button
          type="button"
          onClick={exitFlow}
          className="justify-self-start font-body text-sm font-medium text-muted transition-all duration-200 ease-in-out hover:text-primary"
        >
          ← Save and exit
        </button>
        <div
          className="h-2 w-32 overflow-hidden rounded-full border border-primary/20 bg-primary/5 sm:w-72"
          role="progressbar"
          aria-label="Verification step 1 of 1"
          aria-valuemin={1}
          aria-valuemax={1}
          aria-valuenow={1}
        >
          <span className="block h-full w-full rounded-full bg-accent" />
        </div>
        <p className="justify-self-end font-body text-sm text-muted">
          Step 1 of 1
        </p>
      </div>
    </div>
  );

  const renderSetupStep = (): ReactElement => (
    <form onSubmit={submitStep} className="space-y-5 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-accent/10 text-accent">
        <Landmark size={27} />
      </span>
      <h1 className="mt-4 font-display text-2xl font-bold text-primary">
        Add your bank account
      </h1>
      <p className="mx-auto mt-2 max-w-sm font-body text-sm leading-6 text-muted">
        Use the account where Rello should send payouts after completed
        transactions close.
      </p>
      <div className="grid gap-4 text-left">
        <label className="block">
          <span className="font-body text-sm font-bold text-primary">Bank</span>
          <Select
            ariaLabel="Bank"
            placeholder="Select your bank"
            value={bankName}
            onValueChange={(nextBank) => {
              setBankName(nextBank);
              setFormError("");
            }}
            className="mt-2 w-full rounded-lg border border-border bg-white px-4 py-3 font-body text-base text-primary transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent/40"
            options={BANK_OPTIONS.map((bank) => ({
              label: bank.name,
              value: bank.name,
            }))}
          />
        </label>
        <label className="block">
          <span className="font-body text-sm font-bold text-primary">
            Account Number
          </span>
          <span className="relative mt-2 block">
            <input
              value={accountNumber}
              onChange={handleAccountNumberChange}
              inputMode="numeric"
              placeholder="0123456789"
              className={cn(
                "w-full rounded-lg border-2 bg-white px-4 py-4 font-body text-base tracking-widest text-primary transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent/40",
                isValidAccountNumber(accountNumber)
                  ? "border-accent"
                  : "border-border",
              )}
            />
            {isValidAccountNumber(accountNumber) ? (
              <Check className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-accent" />
            ) : null}
          </span>
        </label>
        {/* The name comes from the bank, never from the host, so it cannot be typed */}
        {resolved ? (
          <div className="rounded-lg bg-surface-soft p-4 text-left shadow-sm">
            <p className="font-body text-xs font-medium uppercase tracking-[0.14em] text-muted">
              Account name
            </p>
            <p className="mt-2 font-body text-lg font-bold text-primary">
              {resolved.accountName}
            </p>
            <p className="mt-2 font-body text-sm leading-6 text-muted">
              {resolved.matchesYou
                ? "This matches your verified name. Confirm to save it."
                : "This does not match your verified name. Payouts must go to an account in your own name."}
            </p>
          </div>
        ) : null}
      </div>
      {formError ? (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-left font-body text-sm font-bold text-red-700">
          {formError}
        </p>
      ) : null}
      {resolved ? (
        <button
          type="submit"
          disabled={isProcessing}
          className="w-full rounded-full bg-accent px-6 py-4 font-body text-sm font-medium text-primary transition-all duration-200 ease-in-out hover:scale-[1.01] hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isProcessing ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving your payout account...
            </span>
          ) : (
            "Yes, this is my account"
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => void lookUpAccount()}
          disabled={!isValidAccountNumber(accountNumber) || isProcessing}
          className="w-full rounded-full bg-accent px-6 py-4 font-body text-sm font-medium text-primary transition-all duration-200 ease-in-out hover:scale-[1.01] hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isProcessing ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking with your bank...
            </span>
          ) : (
            "Look up account"
          )}
        </button>
      )}
    </form>
  );

  const renderStep = (): ReactElement => (
    <main className="fixed inset-0 z-[100] overflow-y-auto bg-bg">
      {renderTopBar()}
      <div className="mx-auto flex min-h-screen w-full max-w-lg items-center justify-center px-5 py-28">
        <AnimatePresence mode="wait">
          <motion.div
            key={screen}
            className="w-full"
            initial={reduceMotion ? false : { opacity: 0, x: 24 }}
            animate={reduceMotion ? undefined : { opacity: 1, x: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, x: -24 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            {renderSetupStep()}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );

  const renderComplete = (): ReactElement => (
    <main className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-primary px-5 py-16 text-white">
      <motion.div
        className="w-full max-w-lg text-center"
        initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
        animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="flex justify-center">
          <span className="scale-125">
            <VerifiedBadge size="md" />
          </span>
        </div>
        <h1 className="mt-6 font-display text-4xl font-bold text-white">
          Payouts are active.
        </h1>
        <p className="mx-auto mt-3 max-w-sm font-body text-base leading-7 text-white/70">
          Your bank account is verified and ready to receive Rello payouts.
        </p>
        <button
          type="button"
          onClick={exitFlow}
          className="mt-10 rounded-full bg-accent px-10 py-4 font-body text-sm font-medium text-primary transition-all duration-200 ease-in-out hover:scale-[1.02] hover:bg-primary hover:text-white hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Back to Verification Center
        </button>
      </motion.div>
    </main>
  );

  if (screen === "overview") {
    return renderOverview();
  }

  if (screen === "loading") {
    return <VerificationFlowSkeleton />;
  }

  if (screen === "complete") {
    return renderComplete();
  }

  return renderStep();
}

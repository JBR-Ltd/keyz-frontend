"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Banknote,
  Check,
  Clock,
  CreditCard,
  Landmark,
  Loader2,
  Lock,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChangeEvent, FormEvent, ReactElement, useMemo, useState } from "react";
import { Select } from "@/components/ui/select";
import VerifiedBadge from "@/components/ui/VerifiedBadge";
import {
  approveHostPayout,
  getHostVerificationSnapshot,
  saveHostPayoutVerification,
  HostVerificationRole,
  setupHostPayout,
} from "@/lib/hostVerification";
import { cn } from "@/lib/utils";

interface HostPayoutVerificationFlowProps {
  role: HostVerificationRole;
}

interface BankOption {
  name: string;
  code: string;
}

interface MockPayoutSetupResponse {
  success: boolean;
  status: "pending" | "failed";
  message?: string;
}

interface MockPayoutConfirmResponse {
  success: boolean;
  status: "approved" | "failed";
  message?: string;
}

type PayoutScreen = "overview" | "setup" | "confirm" | "pending" | "complete";

const BANK_OPTIONS: BankOption[] = [
  { name: "Access Bank", code: "044" },
  { name: "First Bank", code: "011" },
  { name: "GTBank", code: "058" },
  { name: "UBA", code: "033" },
  { name: "Zenith Bank", code: "057" },
];

function delay(durationMs: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, durationMs);
  });
}

function isValidAccountNumber(value: string): boolean {
  return /^\d{10}$/.test(value);
}

function isValidDeposit(value: string): boolean {
  return /^\d+(\.\d{1,2})?$/.test(value) && Number(value) > 0;
}

async function simulatePayoutSetup(
  accountNumber: string,
): Promise<MockPayoutSetupResponse> {
  await delay(1300);

  // ASSUMED SHAPE: confirm exact payout setup response fields before production wiring.
  if (accountNumber === "0000000000") {
    return {
      success: false,
      status: "failed",
      message:
        "We could not set up this account. Check the details and try again.",
    };
  }

  return {
    success: true,
    status: "pending",
    message: "Micro-deposits dispatched.",
  };
}

async function simulatePayoutConfirm(
  depositOne: string,
  depositTwo: string,
): Promise<MockPayoutConfirmResponse> {
  await delay(1100);

  // ASSUMED SHAPE: confirm exact payout confirm response fields before production wiring.
  if (!isValidDeposit(depositOne) || !isValidDeposit(depositTwo)) {
    return {
      success: false,
      status: "failed",
      message: "Enter the two deposit amounts exactly as they appear.",
    };
  }

  return {
    success: true,
    status: "approved",
    message: "Micro-deposits confirmed.",
  };
}

export default function HostPayoutVerificationFlow({
  role,
}: HostPayoutVerificationFlowProps): ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reduceMotion = useReducedMotion();
  const centerHref = `/${role}/verify`;
  const snapshot = useMemo(() => getHostVerificationSnapshot(role), [role]);
  const initialMode =
    searchParams.get("mode") === "confirm" ? "confirm" : "overview";
  const [screen, setScreen] = useState<PayoutScreen>(() => {
    if (snapshot.payout.status === "approved") {
      return "complete";
    }

    return initialMode;
  });
  const [bankName, setBankName] = useState(BANK_OPTIONS[0].name);
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [depositOne, setDepositOne] = useState("");
  const [depositTwo, setDepositTwo] = useState("");
  const [formError, setFormError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const setupReady =
    Boolean(bankName) &&
    isValidAccountNumber(accountNumber) &&
    accountName.trim().length > 2;
  const confirmReady = isValidDeposit(depositOne) && isValidDeposit(depositTwo);

  const exitFlow = (): void => {
    router.push(centerHref);
  };

  const handleAccountNumberChange = (
    event: ChangeEvent<HTMLInputElement>,
  ): void => {
    setAccountNumber(event.target.value.replace(/\D/g, "").slice(0, 10));
    setFormError("");
  };

  const submitSetup = async (): Promise<void> => {
    setFormError("");

    if (!setupReady) {
      setFormError("Enter valid bank details before setting up payout.");
      return;
    }

    setIsProcessing(true);

    try {
      const response = await simulatePayoutSetup(accountNumber);

      if (!response.success || response.status === "failed") {
        saveHostPayoutVerification(role, {
          status: "failed",
          setupAt: new Date().toISOString(),
          approvedAt: null,
          bankName,
          accountNumber,
          accountName: accountName.trim(),
          payoutId: null,
        });
        setFormError(response.message ?? "Payout setup failed. Try again.");
        return;
      }

      setupHostPayout(role, {
        bankName,
        accountNumber,
        accountName: accountName.trim(),
      });
      setScreen("pending");
    } finally {
      setIsProcessing(false);
    }
  };

  const submitConfirm = async (): Promise<void> => {
    setFormError("");

    if (!confirmReady) {
      setFormError("Enter both micro-deposit amounts before confirming.");
      return;
    }

    setIsProcessing(true);

    try {
      const response = await simulatePayoutConfirm(depositOne, depositTwo);

      if (!response.success || response.status === "failed") {
        setFormError(
          response.message ?? "Deposit confirmation failed. Try again.",
        );
        return;
      }

      approveHostPayout(role);
      setScreen("complete");
    } finally {
      setIsProcessing(false);
    }
  };

  const submitStep = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    if (screen === "confirm") {
      void submitConfirm();
      return;
    }

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
          We will send two small deposits to your account. You will confirm the
          amounts in 1 to 2 business days to activate payouts.
        </p>
        <div className="mx-auto mt-12 max-w-xl rounded-lg border border-white/10 bg-primary p-6 text-left">
          <div className="flex items-center gap-3">
            <Lock className="h-5 w-5 text-accent" />
            <p className="font-body text-sm font-bold text-white/80">
              Micro-deposit verification
            </p>
          </div>
          <p className="mt-3 font-body text-xs leading-6 text-white/70">
            This protects your payout account by confirming you control the bank
            account before money moves.
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
        <label className="block">
          <span className="font-body text-sm font-bold text-primary">
            Account Name
          </span>
          <input
            value={accountName}
            onChange={(event) => {
              setAccountName(event.target.value);
              setFormError("");
            }}
            placeholder="Chinedu Okafor"
            className="mt-2 w-full rounded-lg border border-border bg-white px-4 py-3 font-body text-base text-primary transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
        </label>
      </div>
      {formError ? (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-left font-body text-sm font-bold text-red-700">
          {formError}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={!setupReady || isProcessing}
        className="w-full rounded-full bg-accent px-6 py-4 font-body text-sm font-medium text-primary transition-all duration-200 ease-in-out hover:scale-[1.01] hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isProcessing ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Setting up your payout account...
          </span>
        ) : (
          "Set Up Payout"
        )}
      </button>
    </form>
  );

  const renderConfirmStep = (): ReactElement => (
    <form onSubmit={submitStep} className="space-y-5 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-accent/10 text-accent">
        <CreditCard size={27} />
      </span>
      <h1 className="mt-4 font-display text-2xl font-bold text-primary">
        Confirm deposit amounts
      </h1>
      <p className="mx-auto mt-2 max-w-sm font-body text-sm leading-6 text-muted">
        Enter the two small deposits from your bank statement. The order does
        not matter.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-left">
          <span className="font-body text-sm font-bold text-primary">
            Deposit 1
          </span>
          <input
            value={depositOne}
            onChange={(event) => {
              setDepositOne(event.target.value.replace(/[^\d.]/g, ""));
              setFormError("");
            }}
            inputMode="decimal"
            placeholder="12.50"
            className="mt-2 w-full rounded-lg border-2 border-border bg-white px-4 py-4 text-center font-body text-lg text-primary transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
        </label>
        <label className="block text-left">
          <span className="font-body text-sm font-bold text-primary">
            Deposit 2
          </span>
          <input
            value={depositTwo}
            onChange={(event) => {
              setDepositTwo(event.target.value.replace(/[^\d.]/g, ""));
              setFormError("");
            }}
            inputMode="decimal"
            placeholder="8.75"
            className="mt-2 w-full rounded-lg border-2 border-border bg-white px-4 py-4 text-center font-body text-lg text-primary transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
        </label>
      </div>
      {formError ? (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-left font-body text-sm font-bold text-red-700">
          {formError}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={!confirmReady || isProcessing}
        className="w-full rounded-full bg-accent px-6 py-4 font-body text-sm font-medium text-primary transition-all duration-200 ease-in-out hover:scale-[1.01] hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isProcessing ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Confirming deposits...
          </span>
        ) : (
          "Confirm Amounts"
        )}
      </button>
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
            {screen === "confirm" ? renderConfirmStep() : renderSetupStep()}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );

  const renderPending = (): ReactElement => (
    <main className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-primary px-5 py-16 text-white">
      <motion.div
        className="w-full max-w-lg text-center"
        initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
        animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent/15 text-accent">
          <Clock size={30} />
        </span>
        <h1 className="mt-6 font-display text-4xl font-bold text-white">
          Check your bank account.
        </h1>
        <p className="mx-auto mt-3 max-w-sm font-body text-base leading-7 text-white/70">
          We have sent two small deposits. Come back in 1 to 2 business days to
          confirm the amounts and activate payouts.
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

  if (screen === "pending") {
    return renderPending();
  }

  if (screen === "complete") {
    return renderComplete();
  }

  return renderStep();
}

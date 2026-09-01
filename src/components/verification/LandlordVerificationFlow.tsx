"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Banknote,
  Building2,
  Check,
  Clock,
  FileText,
  Loader2,
  Lock,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChangeEvent,
  DragEvent,
  FormEvent,
  ReactElement,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  approveHostPayout,
  getHostVerificationSnapshot,
  HostVerificationSnapshot,
  setupHostPayout,
  submitLandlordIdentityReview,
} from "@/lib/hostVerification";
import { cn } from "@/lib/utils";

interface BankOption {
  code: string;
  name: string;
}

interface DocumentField {
  description: string;
  id: "business" | "address";
  title: string;
}

interface UploadedDocument {
  fieldId: DocumentField["id"];
  file: File;
  previewUrl: string | null;
}

interface MockResponse {
  message: string;
  success: boolean;
}

// ASSUMED FIELDS — confirm against real POST /api/verification/kyb payload requirements once the backend team defines the accepted schema.
interface KybSubmissionPayload {
  businessType: BusinessType;
  legalName: string;
  registrationNumber?: string;
  address: string;
  documents: {
    primaryDocument: File;
    proofOfAddress: File;
  };
}

type BusinessField =
  | "legalBusinessName"
  | "registrationNumber"
  | "businessAddress"
  | "fullLegalName"
  | "residentialAddress";

type BusinessType = "REGISTERED" | "INDIVIDUAL";

type JourneyScreen =
  | "overview"
  | "kyb"
  | "payout"
  | "complete"
  | "confirm"
  | "confirm-success"
  | "redirecting";

const BANK_OPTIONS: BankOption[] = [
  { name: "Access Bank", code: "044" },
  { name: "First Bank of Nigeria", code: "011" },
  { name: "Guaranty Trust Bank", code: "058" },
  { name: "United Bank for Africa", code: "033" },
  { name: "Zenith Bank", code: "057" },
  { name: "Fidelity Bank", code: "070" },
  { name: "Stanbic IBTC Bank", code: "221" },
  { name: "Sterling Bank", code: "232" },
];

// ASSUMED: confirm these two document requirements against the real KYB requirements once available.
const DOCUMENT_FIELDS: DocumentField[] = [
  {
    id: "business",
    title: "Business Registration Document",
    description: "CAC document or a valid means of identification",
  },
  {
    id: "address",
    title: "Proof of Address",
    description: "Utility bill or bank statement",
  },
];

function delay(durationMs: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, durationMs));
}

function isIdentitySubmitted(snapshot: HostVerificationSnapshot): boolean {
  return (
    snapshot.identity.status === "pending" ||
    snapshot.identity.status === "approved"
  );
}

function isPayoutSubmitted(snapshot: HostVerificationSnapshot): boolean {
  return (
    snapshot.payout.status === "pending" ||
    snapshot.payout.status === "approved"
  );
}

function getInitialScreen(
  snapshot: HostVerificationSnapshot,
  confirmationMode: boolean,
): JourneyScreen {
  if (
    snapshot.identity.status === "approved" &&
    snapshot.payout.status === "approved"
  ) {
    return "redirecting";
  }

  if (confirmationMode && snapshot.payout.status === "pending") {
    return "confirm";
  }

  return isIdentitySubmitted(snapshot) && isPayoutSubmitted(snapshot)
    ? "redirecting"
    : "overview";
}

function isValidAccountNumber(value: string): boolean {
  return /^\d{10}$/.test(value);
}

function isValidDeposit(value: string): boolean {
  return /^\d+(\.\d{1,2})?$/.test(value) && Number(value) > 0;
}

async function simulateKybSubmission(
  payload: KybSubmissionPayload,
): Promise<MockResponse> {
  await delay(1300);

  console.info("Simulated POST /api/verification/kyb", payload);

  return { success: true, message: "KYB submitted successfully." };
}

async function simulatePayoutSetup(
  accountNumber: string,
): Promise<MockResponse> {
  await delay(1300);

  // ASSUMED: confirm the exact payout setup response fields before production wiring.
  return accountNumber === "0000000000"
    ? {
        success: false,
        message:
          "We could not set up this account. Check the details and try again.",
      }
    : { success: true, message: "Micro-deposits dispatched." };
}

async function simulatePayoutConfirmation(
  depositOne: string,
  depositTwo: string,
): Promise<MockResponse> {
  await delay(1000);

  // ASSUMED: use fixed preview values until the payout confirmation endpoint is connected.
  const values = [Number(depositOne), Number(depositTwo)].sort(
    (first, second) => first - second,
  );
  const matches = values[0] === 8.75 && values[1] === 12.5;

  return matches
    ? { success: true, message: "Micro-deposits confirmed." }
    : {
        success: false,
        message:
          "Those amounts do not match. Check your statement and try again.",
      };
}

export default function LandlordVerificationFlow(): ReactElement | null {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reduceMotion = useReducedMotion();
  const initialSnapshot = useMemo(
    () => getHostVerificationSnapshot("landlord"),
    [],
  );
  const previewUrlsRef = useRef<string[]>([]);
  const [screen, setScreen] = useState<JourneyScreen>(() =>
    getInitialScreen(initialSnapshot, searchParams.get("mode") === "confirm"),
  );
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [businessType, setBusinessType] = useState<BusinessType | "">("");
  const [legalBusinessName, setLegalBusinessName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [fullLegalName, setFullLegalName] = useState("");
  const [residentialAddress, setResidentialAddress] = useState("");
  const [touchedBusinessFields, setTouchedBusinessFields] = useState<
    BusinessField[]
  >([]);
  const [hasAttemptedKybSubmit, setHasAttemptedKybSubmit] = useState(false);
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [depositOne, setDepositOne] = useState("");
  const [depositTwo, setDepositTwo] = useState("");
  const [formError, setFormError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const identitySubmitted = isIdentitySubmitted(initialSnapshot);
  const hasJourneyProgress =
    identitySubmitted || isPayoutSubmitted(initialSnapshot);
  const hasAllDocuments = DOCUMENT_FIELDS.every((field) =>
    documents.some((document) => document.fieldId === field.id),
  );
  const registeredDetailsValid =
    legalBusinessName.trim().length > 0 &&
    registrationNumber.trim().length > 0 &&
    businessAddress.trim().length > 0;
  const individualDetailsValid =
    fullLegalName.trim().length > 0 && residentialAddress.trim().length > 0;
  const businessDetailsValid =
    businessType === "REGISTERED"
      ? registeredDetailsValid
      : businessType === "INDIVIDUAL" && individualDetailsValid;
  const kybReady =
    Boolean(businessType) && businessDetailsValid && hasAllDocuments;
  const selectedLegalName =
    businessType === "REGISTERED" ? legalBusinessName : fullLegalName;
  const documentFields = DOCUMENT_FIELDS.map((field): DocumentField => {
    if (field.id === "address" && businessType) {
      return {
        ...field,
        title: "Proof of Address (utility bill or bank statement)",
      };
    }

    if (field.id === "business" && businessType === "REGISTERED") {
      return {
        ...field,
        title: "Business Registration Document (CAC Certificate)",
      };
    }

    return field.id === "business" && businessType === "INDIVIDUAL"
      ? { ...field, title: "Valid Government-Issued ID" }
      : field;
  });
  const payoutReady =
    Boolean(bankCode) &&
    isValidAccountNumber(accountNumber) &&
    accountName.trim().length >= 3;
  const depositsValid =
    isValidDeposit(depositOne) && isValidDeposit(depositTwo);

  useEffect(() => {
    if (screen === "redirecting") {
      router.replace("/landlord/dashboard");
    }
  }, [router, screen]);

  useEffect(() => {
    if (screen !== "confirm-success") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      router.replace("/landlord/dashboard");
    }, 900);

    return () => window.clearTimeout(timeoutId);
  }, [router, screen]);

  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const exitFlow = (): void => {
    router.push("/landlord/dashboard");
  };

  const beginJourney = (): void => {
    setFormError("");
    setScreen(identitySubmitted ? "payout" : "kyb");
  };

  const addDocument = (fieldId: DocumentField["id"], file: File): void => {
    const current = documents.find((document) => document.fieldId === fieldId);

    if (current?.previewUrl) {
      URL.revokeObjectURL(current.previewUrl);
      previewUrlsRef.current = previewUrlsRef.current.filter(
        (url) => url !== current.previewUrl,
      );
    }

    const previewUrl = file.type.startsWith("image/")
      ? URL.createObjectURL(file)
      : null;

    if (previewUrl) {
      previewUrlsRef.current.push(previewUrl);
    }

    setDocuments((currentDocuments) => [
      ...currentDocuments.filter((document) => document.fieldId !== fieldId),
      { fieldId, file, previewUrl },
    ]);
    setFormError("");
  };

  const removeDocument = (fieldId: DocumentField["id"]): void => {
    const current = documents.find((document) => document.fieldId === fieldId);

    if (current?.previewUrl) {
      URL.revokeObjectURL(current.previewUrl);
      previewUrlsRef.current = previewUrlsRef.current.filter(
        (url) => url !== current.previewUrl,
      );
    }

    setDocuments((currentDocuments) =>
      currentDocuments.filter((document) => document.fieldId !== fieldId),
    );
  };

  const handleDocumentChange = (
    fieldId: DocumentField["id"],
    event: ChangeEvent<HTMLInputElement>,
  ): void => {
    const file = event.target.files?.[0];

    if (file) {
      addDocument(fieldId, file);
    }

    event.target.value = "";
  };

  const handleDocumentDrop = (
    fieldId: DocumentField["id"],
    event: DragEvent<HTMLLabelElement>,
  ): void => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];

    if (file) {
      addDocument(fieldId, file);
    }
  };

  const markBusinessFieldTouched = (field: BusinessField): void => {
    setTouchedBusinessFields((currentFields) =>
      currentFields.includes(field) ? currentFields : [...currentFields, field],
    );
  };

  const showBusinessFieldError = (
    field: BusinessField,
    value: string,
  ): boolean => {
    return (
      value.trim().length === 0 &&
      (hasAttemptedKybSubmit || touchedBusinessFields.includes(field))
    );
  };

  const submitKyb = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();
    setFormError("");
    setHasAttemptedKybSubmit(true);

    if (!businessType) {
      setFormError("Choose a business type before submitting.");
      return;
    }

    if (!businessDetailsValid) {
      setFormError("Complete all required business details before submitting.");
      return;
    }

    const primaryDocument = documents.find(
      (document) => document.fieldId === "business",
    )?.file;
    const proofOfAddress = documents.find(
      (document) => document.fieldId === "address",
    )?.file;

    if (!primaryDocument || !proofOfAddress) {
      setFormError("Upload both documents before submitting.");
      return;
    }

    const payload: KybSubmissionPayload =
      businessType === "REGISTERED"
        ? {
            businessType,
            legalName: legalBusinessName.trim(),
            registrationNumber: registrationNumber.trim(),
            address: businessAddress.trim(),
            documents: { primaryDocument, proofOfAddress },
          }
        : {
            businessType,
            legalName: fullLegalName.trim(),
            address: residentialAddress.trim(),
            documents: { primaryDocument, proofOfAddress },
          };

    setIsProcessing(true);

    try {
      const response = await simulateKybSubmission(payload);

      if (!response.success) {
        setFormError(response.message);
        return;
      }

      submitLandlordIdentityReview("landlord");
      setScreen("payout");
    } finally {
      setIsProcessing(false);
    }
  };

  const submitPayout = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();
    setFormError("");

    if (!payoutReady) {
      setFormError("Enter valid bank details before setting up payout.");
      return;
    }

    setIsProcessing(true);

    try {
      const response = await simulatePayoutSetup(accountNumber);

      if (!response.success) {
        setFormError(response.message);
        return;
      }

      const bank = BANK_OPTIONS.find((option) => option.code === bankCode);

      setupHostPayout("landlord", {
        bankName: bank?.name ?? "Bank",
        accountNumber,
        accountName: accountName.trim(),
      });
      setScreen("complete");
    } finally {
      setIsProcessing(false);
    }
  };

  const submitConfirmation = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();
    setFormError("");

    if (!depositsValid) {
      setFormError("Enter both deposit amounts exactly as they appear.");
      return;
    }

    setIsProcessing(true);

    try {
      const response = await simulatePayoutConfirmation(depositOne, depositTwo);

      if (!response.success) {
        setFormError(response.message);
        return;
      }

      approveHostPayout("landlord");
      setScreen("confirm-success");
    } finally {
      setIsProcessing(false);
    }
  };

  const renderOverview = (): ReactElement => (
    <main className="fixed inset-0 z-[120] overflow-x-hidden overflow-y-auto bg-primary px-5 py-12 text-white sm:px-8 lg:py-16">
      <motion.section
        className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-2xl flex-col items-center justify-center text-center"
        initial={reduceMotion ? false : { opacity: 0, y: 20 }}
        animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <ShieldCheck className="h-12 w-12 text-accent" aria-hidden="true" />
        <p className="mt-6 font-accent text-xs font-bold uppercase tracking-[0.3em] text-accent">
          Verification
        </p>
        <h1 className="mt-4 font-display text-4xl font-bold leading-tight text-white">
          Let&apos;s get you verified as a host.
        </h1>
        <p className="mt-4 max-w-xl font-body text-base leading-7 text-white/70">
          This takes about 5 minutes and unlocks listing creation and payouts on
          Rello.
        </p>

        <div className="mt-10 grid w-full max-w-lg grid-cols-[1fr_5rem_1fr] items-start">
          {["Business Verification", "Payout Setup"].map((label, index) => (
            <div
              key={label}
              className={cn(
                "flex flex-col items-center",
                index === 1 ? "col-start-3" : "",
              )}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-accent font-body text-sm font-bold text-accent">
                {index + 1}
              </span>
              <span className="mt-3 font-body text-sm font-bold text-white">
                {label}
              </span>
            </div>
          ))}
          <span className="col-start-2 row-start-1 mt-5 border-t border-dashed border-white/30" />
        </div>

        <div className="mt-10 grid w-full gap-3 rounded-xl border border-white/20 bg-white/[0.06] p-5 text-left sm:grid-cols-2">
          <p className="flex items-center gap-3 font-body text-sm text-white/80">
            <Lock className="h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
            Bank-level encryption
          </p>
          <p className="flex items-center gap-3 font-body text-sm text-white/80">
            <ShieldCheck
              className="h-5 w-5 shrink-0 text-accent"
              aria-hidden="true"
            />
            Reviewed securely by our team
          </p>
        </div>

        <button
          type="button"
          onClick={beginJourney}
          className="mt-10 min-h-12 rounded-full bg-accent px-9 py-3 font-body text-sm font-bold text-primary shadow-md transition-all duration-200 ease-in-out hover:scale-[1.02] hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {hasJourneyProgress ? "Continue Verification" : "Begin Verification"}
        </button>
      </motion.section>
    </main>
  );

  const renderTopBar = (step: 1 | 2): ReactElement => (
    <header className="fixed inset-x-0 top-0 z-[121] border-b border-border bg-bg px-4 py-4 shadow-sm sm:px-8">
      <div className="mx-auto grid max-w-5xl grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-5">
        <button
          type="button"
          onClick={exitFlow}
          className="justify-self-start font-body text-xs font-medium text-muted transition-colors hover:text-primary sm:text-sm"
        >
          Save and exit
        </button>
        <div
          className="h-2 w-32 overflow-hidden rounded-full border border-primary/20 bg-primary/5 sm:w-72"
          role="progressbar"
          aria-label={`Verification step ${step} of 2`}
          aria-valuemin={1}
          aria-valuemax={2}
          aria-valuenow={step}
        >
          <span
            className="block h-full rounded-full bg-accent transition-[width] duration-300 ease-in-out"
            style={{ width: `${(step / 2) * 100}%` }}
          />
        </div>
        <p className="justify-self-end whitespace-nowrap font-body text-xs text-muted sm:text-sm">
          Step {step} of 2
        </p>
      </div>
    </header>
  );

  const renderDocumentField = (field: DocumentField): ReactElement => {
    const document = documents.find((item) => item.fieldId === field.id);

    if (document) {
      return (
        <div className="rounded-xl border border-accent/40 bg-transparent shadow-sm">
          <div className="flex flex-wrap items-center gap-4 p-4">
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-primary/15">
              {document.previewUrl ? (
                <div
                  role="img"
                  aria-label={`${document.file.name} preview`}
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${document.previewUrl})`,
                  }}
                />
              ) : (
                <FileText className="h-6 w-6 text-accent" aria-hidden="true" />
              )}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="font-body text-sm font-medium text-primary">
                {field.title}
              </p>
              <p className="mt-1 truncate font-body text-xs text-muted">
                {document.file.name}
              </p>
            </div>
            <div className="flex w-full items-center gap-4 border-t border-primary/10 pt-3 sm:ml-auto sm:w-auto sm:border-0 sm:pt-0">
              <label className="cursor-pointer font-body text-xs font-medium text-primary underline underline-offset-4 focus-within:ring-2 focus-within:ring-accent">
                Replace
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="sr-only"
                  onChange={(event) => handleDocumentChange(field.id, event)}
                />
              </label>
              <button
                type="button"
                onClick={() => removeDocument(field.id)}
                className="inline-flex items-center gap-1 font-body text-xs font-medium text-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <X size={14} aria-hidden="true" />
                Remove
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <label
        className="flex min-h-24 cursor-pointer items-center gap-4 rounded-xl border border-dashed border-primary/25 bg-transparent p-4 text-left transition-all duration-200 hover:border-accent hover:shadow-sm focus-within:ring-2 focus-within:ring-accent"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => handleDocumentDrop(field.id, event)}
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-primary/15 text-accent">
          <FileText size={21} aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-body text-sm font-medium text-primary">
            {field.title}
          </span>
          <span className="mt-1 block font-body text-xs leading-5 text-muted">
            {field.description}
          </span>
        </span>
        <span className="hidden shrink-0 items-center gap-2 font-body text-xs font-medium text-primary sm:inline-flex">
          <Upload size={16} aria-hidden="true" />
          Upload
        </span>
        <input
          type="file"
          accept="image/*,.pdf"
          className="sr-only"
          onChange={(event) => handleDocumentChange(field.id, event)}
        />
      </label>
    );
  };

  const renderKybStep = (): ReactElement => (
    <main className="fixed inset-0 z-[120] overflow-x-hidden overflow-y-auto bg-bg">
      {renderTopBar(1)}
      <div className="mx-auto min-h-screen w-full max-w-5xl px-5 pb-14 pt-28 sm:px-8">
        <div className="flex max-w-2xl items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-accent/40 text-accent">
            <Building2 size={23} aria-hidden="true" />
          </span>
          <div>
            <p className="font-body text-xs font-medium uppercase tracking-wide text-muted">
              Landlord verification
            </p>
            <h1 className="mt-1 font-display text-3xl font-bold text-primary">
              Verify your business
            </h1>
            <p className="mt-2 max-w-xl font-body text-sm leading-6 text-muted">
              We review a few documents to confirm you&apos;re a legitimate
              host. Our team typically completes this within 1-2 business days.
            </p>
          </div>
        </div>

        <div className="mt-8 grid items-start gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-8">
          <aside
            className="rounded-xl border border-primary/10 bg-white p-6 shadow-md lg:sticky lg:top-28"
            aria-label="Verified landlord credential preview"
          >
            <div className="flex items-center justify-between gap-4">
              <p className="font-body text-xs font-medium uppercase tracking-wide text-muted">
                Credential preview
              </p>
              <span className="rounded-full border border-accent/30 px-2.5 py-1 font-body text-[10px] font-medium uppercase tracking-wide text-accent">
                Pending
              </span>
            </div>
            <div className="mt-8 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-accent/40 text-accent">
                <ShieldCheck size={26} aria-hidden="true" />
              </span>
              <p className="mt-4 font-display text-xl font-bold text-primary">
                Verified Landlord
              </p>
              <p className="mt-1 truncate font-body text-sm text-muted">
                {selectedLegalName.trim() || "Your legal name"}
              </p>
            </div>
            <div className="mt-7 border-t border-primary/10 pt-4">
              <p className="flex items-center justify-between gap-4 font-body text-xs text-muted">
                <span>Profile type</span>
                <span className="font-medium text-primary">
                  {businessType === "REGISTERED"
                    ? "Registered business"
                    : businessType === "INDIVIDUAL"
                      ? "Individual"
                      : "Not selected"}
                </span>
              </p>
              <p className="mt-3 flex items-center justify-between gap-4 font-body text-xs text-muted">
                <span>Review status</span>
                <span className="font-medium text-primary">Not submitted</span>
              </p>
            </div>
          </aside>

          <form
            onSubmit={(event) => void submitKyb(event)}
            className="min-w-0 rounded-xl border border-primary/10 bg-white p-5 shadow-sm sm:p-8"
          >
            <section className="text-left" aria-labelledby="business-details">
              <h2
                id="business-details"
                className="font-body text-sm font-medium uppercase tracking-wide text-muted"
              >
                Business Profile
              </h2>
              <p className="mt-2 font-body text-sm leading-6 text-muted">
                Select the profile that matches how you operate as a landlord.
              </p>

              <fieldset className="mt-6">
                <legend className="font-body text-sm font-medium text-primary">
                  Business Type
                </legend>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {(
                    [
                      ["REGISTERED", "Registered Business"],
                      ["INDIVIDUAL", "Individual Landlord"],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={businessType === value}
                      onClick={() => {
                        setBusinessType(value);
                        setFormError("");
                        setHasAttemptedKybSubmit(false);
                      }}
                      className={cn(
                        "flex min-h-14 items-center gap-3 rounded-xl border bg-transparent px-4 py-3 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                        businessType === value
                          ? "border-accent shadow-sm"
                          : "border-primary/20 hover:border-accent/70",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                          businessType === value
                            ? "border-accent"
                            : "border-primary/30",
                        )}
                      >
                        {businessType === value ? (
                          <span className="h-2 w-2 rounded-full bg-accent" />
                        ) : null}
                      </span>
                      <span className="font-body text-sm font-medium text-primary">
                        {label}
                      </span>
                    </button>
                  ))}
                </div>
                {hasAttemptedKybSubmit && !businessType ? (
                  <p className="mt-2 font-body text-xs text-red-700">
                    Choose a business type.
                  </p>
                ) : null}
              </fieldset>

              <AnimatePresence initial={false} mode="wait">
                {businessType ? (
                  <motion.div
                    key={businessType}
                    className="overflow-hidden"
                    initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
                    transition={{ duration: reduceMotion ? 0 : 0.2 }}
                  >
                    {businessType === "REGISTERED" ? (
                      <div className="mt-6 grid gap-x-4 gap-y-5 sm:grid-cols-2">
                        <label>
                          <span className="font-body text-sm font-medium text-primary">
                            Legal Business Name
                          </span>
                          <input
                            required
                            value={legalBusinessName}
                            onChange={(event) => {
                              setLegalBusinessName(event.target.value);
                              setFormError("");
                            }}
                            onBlur={() =>
                              markBusinessFieldTouched("legalBusinessName")
                            }
                            aria-invalid={showBusinessFieldError(
                              "legalBusinessName",
                              legalBusinessName,
                            )}
                            className={cn(
                              "mt-2 min-h-12 w-full rounded-xl border bg-transparent px-4 py-3 font-body text-base text-primary outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/30",
                              showBusinessFieldError(
                                "legalBusinessName",
                                legalBusinessName,
                              )
                                ? "border-red-500"
                                : "border-primary/20",
                            )}
                          />
                          {showBusinessFieldError(
                            "legalBusinessName",
                            legalBusinessName,
                          ) ? (
                            <span className="mt-2 block font-body text-xs text-red-700">
                              Enter the legal business name.
                            </span>
                          ) : null}
                        </label>

                        <label>
                          <span className="font-body text-sm font-medium text-primary">
                            Business Registration Number (RC Number)
                          </span>
                          <input
                            required
                            value={registrationNumber}
                            onChange={(event) => {
                              setRegistrationNumber(event.target.value);
                              setFormError("");
                            }}
                            onBlur={() =>
                              markBusinessFieldTouched("registrationNumber")
                            }
                            aria-invalid={showBusinessFieldError(
                              "registrationNumber",
                              registrationNumber,
                            )}
                            className={cn(
                              "mt-2 min-h-12 w-full rounded-xl border bg-transparent px-4 py-3 font-body text-base text-primary outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/30",
                              showBusinessFieldError(
                                "registrationNumber",
                                registrationNumber,
                              )
                                ? "border-red-500"
                                : "border-primary/20",
                            )}
                          />
                          <span className="mt-2 block font-body text-xs text-muted">
                            Your CAC registration number.
                          </span>
                          {showBusinessFieldError(
                            "registrationNumber",
                            registrationNumber,
                          ) ? (
                            <span className="mt-1 block font-body text-xs text-red-700">
                              Enter the business registration number.
                            </span>
                          ) : null}
                        </label>

                        <label className="sm:col-span-2">
                          <span className="font-body text-sm font-medium text-primary">
                            Business Address
                          </span>
                          <input
                            required
                            value={businessAddress}
                            onChange={(event) => {
                              setBusinessAddress(event.target.value);
                              setFormError("");
                            }}
                            onBlur={() =>
                              markBusinessFieldTouched("businessAddress")
                            }
                            aria-invalid={showBusinessFieldError(
                              "businessAddress",
                              businessAddress,
                            )}
                            className={cn(
                              "mt-2 min-h-12 w-full rounded-xl border bg-transparent px-4 py-3 font-body text-base text-primary outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/30",
                              showBusinessFieldError(
                                "businessAddress",
                                businessAddress,
                              )
                                ? "border-red-500"
                                : "border-primary/20",
                            )}
                          />
                          {showBusinessFieldError(
                            "businessAddress",
                            businessAddress,
                          ) ? (
                            <span className="mt-2 block font-body text-xs text-red-700">
                              Enter the business address.
                            </span>
                          ) : null}
                        </label>
                      </div>
                    ) : (
                      <div className="mt-6 grid gap-x-4 gap-y-5 sm:grid-cols-2">
                        <label>
                          <span className="font-body text-sm font-medium text-primary">
                            Full Legal Name
                          </span>
                          <input
                            required
                            value={fullLegalName}
                            onChange={(event) => {
                              setFullLegalName(event.target.value);
                              setFormError("");
                            }}
                            onBlur={() =>
                              markBusinessFieldTouched("fullLegalName")
                            }
                            aria-invalid={showBusinessFieldError(
                              "fullLegalName",
                              fullLegalName,
                            )}
                            className={cn(
                              "mt-2 min-h-12 w-full rounded-xl border bg-transparent px-4 py-3 font-body text-base text-primary outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/30",
                              showBusinessFieldError(
                                "fullLegalName",
                                fullLegalName,
                              )
                                ? "border-red-500"
                                : "border-primary/20",
                            )}
                          />
                          {showBusinessFieldError(
                            "fullLegalName",
                            fullLegalName,
                          ) ? (
                            <span className="mt-2 block font-body text-xs text-red-700">
                              Enter your full legal name.
                            </span>
                          ) : null}
                        </label>

                        <label>
                          <span className="font-body text-sm font-medium text-primary">
                            Residential Address
                          </span>
                          <input
                            required
                            value={residentialAddress}
                            onChange={(event) => {
                              setResidentialAddress(event.target.value);
                              setFormError("");
                            }}
                            onBlur={() =>
                              markBusinessFieldTouched("residentialAddress")
                            }
                            aria-invalid={showBusinessFieldError(
                              "residentialAddress",
                              residentialAddress,
                            )}
                            className={cn(
                              "mt-2 min-h-12 w-full rounded-xl border bg-transparent px-4 py-3 font-body text-base text-primary outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/30",
                              showBusinessFieldError(
                                "residentialAddress",
                                residentialAddress,
                              )
                                ? "border-red-500"
                                : "border-primary/20",
                            )}
                          />
                          {showBusinessFieldError(
                            "residentialAddress",
                            residentialAddress,
                          ) ? (
                            <span className="mt-2 block font-body text-xs text-red-700">
                              Enter your residential address.
                            </span>
                          ) : null}
                        </label>
                      </div>
                    )}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </section>

            <section
              className="mt-8 border-t border-primary/10 pt-8 text-left"
              aria-labelledby="supporting-documents"
            >
              <h2
                id="supporting-documents"
                className="font-body text-sm font-medium uppercase tracking-wide text-muted"
              >
                Supporting Documents
              </h2>
              <p className="mt-2 font-body text-sm leading-6 text-muted">
                {businessType === "REGISTERED"
                  ? "Upload your CAC certificate and a recent proof of address."
                  : businessType === "INDIVIDUAL"
                    ? "Upload a valid government-issued ID and a recent proof of address."
                    : "Choose a business type to confirm the documents required for your application."}
              </p>
              <div className="mt-4 grid gap-3">
                {documentFields.map((field) => renderDocumentField(field))}
              </div>
            </section>

            {formError ? (
              <p className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 font-body text-sm font-bold text-red-700">
                {formError}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={!kybReady || isProcessing}
              className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 font-body text-sm font-bold text-primary shadow-sm transition-all duration-200 ease-in-out hover:scale-[1.01] hover:bg-primary hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                  Uploading documents...
                </>
              ) : (
                "Submit for Review"
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );

  const renderPayoutStep = (): ReactElement => (
    <main className="fixed inset-0 z-[120] overflow-x-hidden overflow-y-auto bg-bg">
      {renderTopBar(2)}
      <div className="mx-auto flex min-h-screen w-full max-w-lg items-center px-5 py-28 sm:px-8">
        <form
          onSubmit={(event) => void submitPayout(event)}
          className="w-full text-center"
        >
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <Banknote size={27} aria-hidden="true" />
          </span>
          <h1 className="mt-4 font-display text-2xl font-bold text-primary">
            Set up how you get paid
          </h1>
          <p className="mx-auto mt-3 max-w-md font-body text-sm leading-6 text-muted">
            We verify your bank account with two small deposits. You&apos;ll
            confirm the amounts in 1-2 business days to activate payouts.
          </p>

          <div className="mt-7 grid gap-4 text-left">
            <label>
              <span className="font-body text-sm font-bold text-primary">
                Account Number
              </span>
              <span className="relative mt-2 block">
                <input
                  value={accountNumber}
                  onChange={(event) => {
                    setAccountNumber(
                      event.target.value.replace(/\D/g, "").slice(0, 10),
                    );
                    setFormError("");
                  }}
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="0123456789"
                  aria-invalid={
                    accountNumber.length > 0 &&
                    !isValidAccountNumber(accountNumber)
                  }
                  className={cn(
                    "min-h-12 w-full rounded-xl border bg-surface-soft px-4 py-3 font-body text-base tracking-widest text-primary outline-none transition-colors focus:ring-2 focus:ring-accent/30",
                    isValidAccountNumber(accountNumber)
                      ? "border-accent"
                      : "border-primary/20 focus:border-accent",
                  )}
                />
                {isValidAccountNumber(accountNumber) ? (
                  <Check
                    className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-accent"
                    aria-hidden="true"
                  />
                ) : null}
              </span>
              {accountNumber.length > 0 &&
              !isValidAccountNumber(accountNumber) ? (
                <span className="mt-2 block font-body text-xs text-red-700">
                  Account number must be 10 digits.
                </span>
              ) : null}
            </label>
            <label>
              <span className="font-body text-sm font-bold text-primary">
                Bank
              </span>
              <select
                value={bankCode}
                onChange={(event) => {
                  setBankCode(event.target.value);
                  setFormError("");
                }}
                className="mt-2 min-h-12 w-full rounded-xl border border-primary/20 bg-surface-soft px-4 py-3 font-body text-base text-primary outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/30"
              >
                <option value="">Select a bank</option>
                {BANK_OPTIONS.map((bank) => (
                  <option key={bank.code} value={bank.code}>
                    {bank.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
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
                className="mt-2 min-h-12 w-full rounded-xl border border-primary/20 bg-surface-soft px-4 py-3 font-body text-base text-primary outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/30"
              />
            </label>
          </div>

          {formError ? (
            <p className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-left font-body text-sm font-bold text-red-700">
              {formError}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={!payoutReady || isProcessing}
            className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 font-body text-sm font-bold text-primary shadow-sm transition-all duration-200 ease-in-out hover:scale-[1.01] hover:bg-primary hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Setting up your payout account...
              </>
            ) : (
              "Set Up Payout"
            )}
          </button>
        </form>
      </div>
    </main>
  );

  const renderComplete = (): ReactElement => (
    <main className="fixed inset-0 z-[120] overflow-x-hidden overflow-y-auto bg-primary px-5 py-12 text-white sm:px-8 lg:py-16">
      <motion.section
        className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-2xl flex-col items-center justify-center text-center"
        initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
        animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <Clock className="h-14 w-14 text-accent" aria-hidden="true" />
        <h1 className="mt-6 font-display text-4xl font-bold leading-tight text-white">
          You&apos;re all set for now.
        </h1>
        <p className="mt-4 max-w-xl font-body text-base leading-7 text-white/70">
          Your business documents are under review, and your payout deposits are
          on their way. We&apos;ll let you know as soon as everything&apos;s
          confirmed. This usually takes 1-2 business days.
        </p>
        <p className="mt-8 max-w-lg font-body text-sm leading-6 text-white/50">
          Once you&apos;re verified, you can list your first property and
          we&apos;ll help you get it verified too.
        </p>
        <button
          type="button"
          onClick={exitFlow}
          className="mt-10 min-h-12 rounded-full bg-accent px-9 py-3 font-body text-sm font-bold text-primary shadow-md transition-all duration-200 ease-in-out hover:scale-[1.02] hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Back to Dashboard
        </button>
      </motion.section>
    </main>
  );

  const renderConfirmation = (): ReactElement => (
    <main className="min-h-screen overflow-x-hidden bg-bg px-5 py-12 sm:px-8 lg:px-10 lg:py-16">
      <section className="mx-auto w-full max-w-lg rounded-xl border border-primary/15 bg-surface-soft p-6 shadow-sm sm:p-8">
        <button
          type="button"
          onClick={exitFlow}
          className="font-body text-sm font-bold text-muted transition-colors hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Back to Dashboard
        </button>
        <div className="mt-10 text-center">
          <Banknote
            className="mx-auto h-10 w-10 text-accent"
            aria-hidden="true"
          />
          <h1 className="mt-4 font-display text-3xl font-bold text-primary">
            Confirm deposit amounts
          </h1>
          <p className="mt-3 font-body text-sm leading-6 text-muted">
            Enter the two small deposits from your bank statement. The order
            does not matter.
          </p>
        </div>

        <form
          onSubmit={(event) => void submitConfirmation(event)}
          className="mt-7"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                id: "deposit-one",
                label: "Deposit 1",
                value: depositOne,
                setter: setDepositOne,
              },
              {
                id: "deposit-two",
                label: "Deposit 2",
                value: depositTwo,
                setter: setDepositTwo,
              },
            ].map((field) => (
              <label key={field.id} htmlFor={field.id}>
                <span className="font-body text-sm font-bold text-primary">
                  {field.label}
                </span>
                <span className="relative mt-2 block">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-body text-sm text-muted">
                    ₦
                  </span>
                  <input
                    id={field.id}
                    value={field.value}
                    onChange={(event) => {
                      field.setter(event.target.value.replace(/[^\d.]/g, ""));
                      setFormError("");
                    }}
                    inputMode="decimal"
                    placeholder={field.id === "deposit-one" ? "12.50" : "8.75"}
                    className="min-h-12 w-full rounded-xl border border-primary/20 bg-bg py-3 pl-8 pr-4 font-body text-base text-primary outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/30"
                  />
                </span>
              </label>
            ))}
          </div>

          {formError ? (
            <p className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 font-body text-sm font-bold text-red-700">
              {formError}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={!depositsValid || isProcessing}
            className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 font-body text-sm font-bold text-primary shadow-sm transition-all duration-200 ease-in-out hover:scale-[1.01] hover:bg-primary hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Confirming amounts...
              </>
            ) : (
              "Confirm Amounts"
            )}
          </button>
        </form>
      </section>
    </main>
  );

  const renderConfirmationSuccess = (): ReactElement => (
    <main className="min-h-screen bg-bg px-5 py-16">
      <motion.section
        className="mx-auto max-w-md rounded-xl border border-accent/40 bg-surface-soft p-8 text-center shadow-sm"
        initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
        animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
      >
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
          <Check size={24} aria-hidden="true" />
        </span>
        <h1 className="mt-5 font-display text-3xl font-bold text-primary">
          Payouts are active.
        </h1>
        <p className="mt-3 font-body text-sm text-muted">
          Returning to your dashboard...
        </p>
      </motion.section>
    </main>
  );

  if (screen === "redirecting") {
    return null;
  }

  if (screen === "overview") {
    return renderOverview();
  }

  if (screen === "kyb") {
    return renderKybStep();
  }

  if (screen === "payout") {
    return renderPayoutStep();
  }

  if (screen === "complete") {
    return renderComplete();
  }

  if (screen === "confirm-success") {
    return renderConfirmationSuccess();
  }

  return renderConfirmation();
}

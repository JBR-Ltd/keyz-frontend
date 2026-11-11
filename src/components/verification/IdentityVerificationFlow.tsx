"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  Camera,
  Check,
  CheckCircle2,
  ChevronLeft,
  Eye,
  EyeOff,
  FileCheck2,
  FileText,
  IdCard,
  Landmark,
  Loader2,
  LockKeyhole,
  RefreshCw,
  ScanFace,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChangeEvent,
  FormEvent,
  ReactElement,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import VerifiedBadge from "@/components/ui/VerifiedBadge";
import VerificationFlowSkeleton from "@/components/verification/VerificationFlowSkeleton";
import {
  IdentityCheck,
  submitAgentVerification,
  submitTenantVerification,
  verifyIdentityNumber,
  verifySelfie,
} from "@/lib/identityVerification";
import {
  getHostVerification,
  HostVerificationRole,
  submitKybDocuments,
} from "@/lib/hostVerification";
import { saveTenantVerificationState } from "@/lib/tenantVerification";
import { cn } from "@/lib/utils";

// === Types

interface IdentityVerificationFlowProps {
  role: HostVerificationRole | "tenant";
}

interface UploadField {
  description: string;
  id: "registration" | "address";
  title: string;
}

interface UploadedDocument {
  file: File;
  id: UploadField["id"];
  name: string;
}

type BusinessStep = "registration" | "address" | "review";
type CameraState = "idle" | "requesting" | "ready" | "captured" | "error";
type FlowScreen = "loading" | "journey" | "complete" | "submitted" | "error";
type IdentityField = "nin" | "bvn";
type PersonalStep = "numbers" | "selfie" | "review";
type ProcessingStage =
  | "nin"
  | "bvn"
  | "selfie"
  | "identity"
  | "documents"
  | null;
type VerificationIntent = "booking" | "offer";

// === Constants

const DOCUMENT_MAX_BYTES = 10 * 1024 * 1024;
const DOCUMENT_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const UPLOAD_FIELDS: UploadField[] = [
  {
    id: "registration",
    title: "Business registration document",
    description:
      "CAC certificate, incorporation document, or equivalent business record.",
  },
  {
    id: "address",
    title: "Proof of business address",
    description:
      "A recent utility bill, bank statement, or official address document.",
  },
];

// === Helpers

function isValidIdentityNumber(value: string): boolean {
  return /^\d{11}$/.test(value);
}

function maskIdentityNumber(value: string): string {
  return value ? `•••••••${value.slice(-4)}` : "Confirmed by Dojah";
}

function formatFileSize(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function getCameraError(error: unknown): string {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError") {
      return "Camera permission was blocked. Allow camera access in your browser settings, then try again.";
    }

    if (error.name === "NotFoundError") {
      return "No camera was found on this device. Continue on a device with a working front camera.";
    }

    if (error.name === "NotReadableError") {
      return "Your camera is being used by another application. Close it there, then try again.";
    }
  }

  return "We could not start your camera. Check your browser permission and try again.";
}

function getSafeReturnPath(value: string | null): string {
  const isAllowedPath =
    value?.startsWith("/tenant/") || value?.startsWith("/property/");

  return isAllowedPath && value ? value : "/tenant/settings";
}

function getPersonalStepNumber(step: PersonalStep, isTenant: boolean): number {
  if (isTenant) {
    return step === "numbers" ? 1 : 2;
  }

  return { numbers: 1, selfie: 2, review: 3 }[step];
}

function getBusinessStepNumber(step: BusinessStep): number {
  return { registration: 1, address: 2, review: 3 }[step];
}

export default function IdentityVerificationFlow({
  role,
}: IdentityVerificationFlowProps): ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reduceMotion = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);
  const isAgent = role === "agent";
  const isTenant = role === "tenant";
  const source = searchParams.get("source");
  const intent: VerificationIntent =
    searchParams.get("intent") === "offer" ? "offer" : "booking";
  const fromGate = isTenant && source === "gate";
  const tenantReturnPath = getSafeReturnPath(searchParams.get("returnTo"));
  const dashboardHref = `/${role}/dashboard`;
  const exitHref = isTenant ? tenantReturnPath : dashboardHref;
  const privacyPolicyHref = "/policies/privacy-and-data";
  const [screen, setScreen] = useState<FlowScreen>("loading");
  const [reloadKey, setReloadKey] = useState(0);
  const [identityDone, setIdentityDone] = useState(false);
  const [completedChecks, setCompletedChecks] = useState<IdentityCheck[]>([]);
  const [personalStep, setPersonalStep] = useState<PersonalStep>("numbers");
  const [businessStep, setBusinessStep] =
    useState<BusinessStep>("registration");
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [nin, setNin] = useState("");
  const [bvn, setBvn] = useState("");
  const [showNin, setShowNin] = useState(false);
  const [showBvn, setShowBvn] = useState(false);
  const [touchedFields, setTouchedFields] = useState<IdentityField[]>([]);
  const [selfiePreview, setSelfiePreview] = useState("");
  const [cameraState, setCameraState] = useState<CameraState>("idle");
  const [cameraError, setCameraError] = useState("");
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [documentErrors, setDocumentErrors] = useState<
    Partial<Record<UploadField["id"], string>>
  >({});
  const [formError, setFormError] = useState("");
  const [processingStage, setProcessingStage] = useState<ProcessingStage>(null);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);

  const tenantNumbersComplete =
    completedChecks.includes("NIN") && completedChecks.includes("BVN");
  const needsNin = isTenant
    ? !tenantNumbersComplete
    : !completedChecks.includes("NIN");
  const needsBvn = isTenant
    ? !tenantNumbersComplete
    : !completedChecks.includes("BVN");
  const needsSelfie = !isTenant && !completedChecks.includes("SELFIE");
  const ninReady = !needsNin || isValidIdentityNumber(nin);
  const bvnReady = !needsBvn || isValidIdentityNumber(bvn);
  const selfieReady = !needsSelfie || Boolean(selfiePreview);
  const hasUnsavedProgress = Boolean(
    nin || bvn || selfiePreview || documents.length,
  );
  const isBusinessPhase = isAgent && identityDone;
  const personalStepCount = isTenant ? 2 : 3;
  const currentStepCount = isBusinessPhase ? 3 : personalStepCount;
  const currentStep = isBusinessPhase
    ? getBusinessStepNumber(businessStep)
    : getPersonalStepNumber(personalStep, isTenant);
  const isProcessing = processingStage !== null;

  const stopCamera = useCallback((): void => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  useEffect(() => {
    if (!hasUnsavedProgress || screen !== "journey") return;

    const warnBeforeLeaving = (event: BeforeUnloadEvent): void => {
      event.preventDefault();
    };

    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [hasUnsavedProgress, screen]);

  useEffect(() => {
    if (formError) errorRef.current?.focus();
  }, [formError]);

  useEffect(() => {
    if (screen !== "journey") return;

    const frame = window.requestAnimationFrame(() => {
      stepHeadingRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [businessStep, personalStep, screen]);

  useEffect(() => {
    let active = true;

    void getHostVerification().then((result) => {
      if (!active) return;

      if (!result.data) {
        setFormError(
          result.message ?? "Your verification status could not be loaded.",
        );
        setScreen("error");
        return;
      }

      const { identity, kyb } = result.data;
      setCompletedChecks(identity.completed);
      setRejectionReason(kyb.rejectionReason);

      if (isTenant) {
        saveTenantVerificationState({
          nin: identity.completed.includes("NIN") ? "verified" : "not_started",
          bvn: identity.completed.includes("BVN") ? "verified" : "not_started",
        });
      }

      if (identity.status === "approved") {
        setIdentityDone(true);

        if (!isAgent || kyb.status === "approved") {
          setScreen("complete");
          return;
        }

        if (kyb.status === "pending") {
          setScreen("submitted");
          return;
        }

        setBusinessStep("registration");
        setScreen("journey");
        return;
      }

      setIdentityDone(false);

      if (
        identity.outstanding.includes("NIN") ||
        identity.outstanding.includes("BVN")
      ) {
        setPersonalStep("numbers");
      } else if (!isTenant && identity.outstanding.includes("SELFIE")) {
        setPersonalStep("selfie");
      } else {
        setPersonalStep("review");
      }

      setScreen("journey");
    });

    return () => {
      active = false;
    };
  }, [isAgent, isTenant, reloadKey]);

  const exitFlow = (): void => {
    stopCamera();
    router.push(exitHref);
  };

  const requestExit = (): void => {
    if (hasUnsavedProgress) {
      setShowExitConfirmation(true);
      return;
    }

    exitFlow();
  };

  const startCamera = async (): Promise<void> => {
    stopCamera();
    setCameraError("");
    setFormError("");
    setCameraState("requesting");

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new DOMException("Camera unavailable", "NotFoundError");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: "user",
          height: { ideal: 720 },
          width: { ideal: 960 },
        },
      });

      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (error) {
      setCameraError(getCameraError(error));
      setCameraState("error");
    }
  };

  const captureSelfie = (): void => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (
      !video ||
      !canvas ||
      cameraState !== "ready" ||
      video.videoWidth === 0
    ) {
      setCameraError(
        "The camera is still getting ready. Try again in a moment.",
      );
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    context?.translate(canvas.width, 0);
    context?.scale(-1, 1);
    context?.drawImage(video, 0, 0);
    setSelfiePreview(canvas.toDataURL("image/jpeg", 0.9));
    setCameraState("captured");
    setCameraError("");
    stopCamera();
  };

  const retakeSelfie = (): void => {
    setSelfiePreview("");
    setCameraState("idle");
    setCameraError("");
  };

  const handleNumberChange = (
    event: ChangeEvent<HTMLInputElement>,
    field: IdentityField,
  ): void => {
    const value = event.target.value.replace(/\D/g, "").slice(0, 11);
    if (field === "nin") setNin(value);
    else setBvn(value);
    setFormError("");
  };

  const validateDocument = (file: File): string | null => {
    if (file.size > DOCUMENT_MAX_BYTES) {
      return "Choose a file smaller than 10 MB.";
    }

    if (!DOCUMENT_TYPES.has(file.type)) {
      return "Choose a PDF, JPEG, PNG, or WebP file.";
    }

    return null;
  };

  const handleDocumentUpload = (
    event: ChangeEvent<HTMLInputElement>,
    id: UploadField["id"],
  ): void => {
    const file = event.target.files?.[0];
    if (!file) return;

    const error = validateDocument(file);
    if (error) {
      setDocumentErrors((current) => ({ ...current, [id]: error }));
      event.target.value = "";
      return;
    }

    setDocuments((current) => [
      ...current.filter((document) => document.id !== id),
      { file, id, name: file.name },
    ]);
    setDocumentErrors((current) => ({ ...current, [id]: undefined }));
    setFormError("");
  };

  const removeDocument = (id: UploadField["id"]): void => {
    setDocuments((current) => current.filter((document) => document.id !== id));
  };

  const continueFromNumbers = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setTouchedFields(["nin", "bvn"]);

    if (!ninReady || !bvnReady) {
      setFormError("Check the highlighted identity number before continuing.");
      return;
    }

    setFormError("");
    setPersonalStep(isTenant ? "review" : needsSelfie ? "selfie" : "review");
  };

  const continueFromSelfie = (): void => {
    if (!selfieReady) {
      setFormError("Take your live selfie before continuing.");
      return;
    }

    stopCamera();
    setFormError("");
    setPersonalStep("review");
  };

  const submitPersonalIdentity = async (): Promise<void> => {
    setFormError("");

    if (!ninReady || !bvnReady || (!isTenant && !selfieReady)) {
      setFormError("Complete each identity step before verification.");
      return;
    }

    if (isTenant) {
      setProcessingStage("identity");
      const result = await submitTenantVerification(nin, bvn);

      if (!result.data) {
        setProcessingStage(null);
        setFormError(
          result.message ??
            "Verification did not pass. Review your details and try again.",
        );
        return;
      }

      setCompletedChecks(["NIN", "BVN"]);
      saveTenantVerificationState({
        nin: "verified",
        bvn: "verified",
      });
      setIdentityDone(true);
      setProcessingStage(null);
      setNin("");
      setBvn("");
      setScreen("complete");
      return;
    }

    if (isAgent) {
      setProcessingStage("identity");
      const result = await submitAgentVerification(nin, bvn, selfiePreview);

      if (!result.data) {
        setProcessingStage(null);
        setFormError(
          result.message ??
            "Verification did not pass. Review your details and try again.",
        );
        return;
      }

      setCompletedChecks(["NIN", "BVN", "SELFIE"]);
      setIdentityDone(true);
      setProcessingStage(null);
      setBusinessStep("registration");
      setNin("");
      setBvn("");
      setSelfiePreview("");
      return;
    }

    const newlyCompleted = new Set(completedChecks);

    if (needsNin) {
      setProcessingStage("nin");
      const result = await verifyIdentityNumber("nin", nin);
      if (!result.data) {
        setProcessingStage(null);
        setFormError(result.message ?? "Your NIN could not be confirmed.");
        setPersonalStep("numbers");
        return;
      }
      newlyCompleted.add("NIN");
      setCompletedChecks(Array.from(newlyCompleted));
    }

    if (needsBvn) {
      setProcessingStage("bvn");
      const result = await verifyIdentityNumber("bvn", bvn);
      if (!result.data) {
        setProcessingStage(null);
        setFormError(result.message ?? "Your BVN could not be confirmed.");
        setPersonalStep("numbers");
        return;
      }
      newlyCompleted.add("BVN");
      setCompletedChecks(Array.from(newlyCompleted));
    }

    if (needsSelfie) {
      setProcessingStage("selfie");
      const result = await verifySelfie(selfiePreview);
      if (!result.data) {
        setProcessingStage(null);
        setFormError(
          result.message ?? "Your live selfie could not be confirmed.",
        );
        setPersonalStep("selfie");
        return;
      }
      newlyCompleted.add("SELFIE");
      setCompletedChecks(Array.from(newlyCompleted));
    }

    setProcessingStage(null);
    setIdentityDone(true);
    setScreen("complete");
  };

  const submitBusinessDocuments = async (): Promise<void> => {
    const business = documents.find(
      (document) => document.id === "registration",
    );
    const address = documents.find((document) => document.id === "address");

    if (!business || !address) {
      setFormError("Add both business documents before submitting.");
      return;
    }

    setFormError("");
    setProcessingStage("documents");
    const result = await submitKybDocuments(business.file, address.file);
    setProcessingStage(null);

    if (!result.data) {
      setFormError(result.message ?? "Your documents could not be submitted.");
      return;
    }

    setDocuments([]);
    setScreen("submitted");
  };

  const processingLabel = (): string => {
    switch (processingStage) {
      case "nin":
        return "Checking your NIN...";
      case "bvn":
        return "Checking your BVN...";
      case "selfie":
        return "Checking your selfie...";
      case "identity":
        return "Checking your identity...";
      case "documents":
        return "Submitting documents...";
      default:
        return "Continue";
    }
  };

  const renderTopBar = (): ReactElement => (
    <header className="fixed inset-x-0 top-0 z-[101] border-b border-border bg-bg/95 px-4 py-4 backdrop-blur-sm sm:px-6">
      <div className="mx-auto grid max-w-5xl grid-cols-[1fr_auto] items-center gap-4 sm:grid-cols-[1fr_auto_1fr]">
        <button
          type="button"
          onClick={requestExit}
          className="inline-flex min-h-11 items-center gap-2 justify-self-start rounded-full px-2 font-body text-sm font-bold text-primary transition-colors hover:bg-primary/5"
        >
          <ArrowLeft size={17} aria-hidden="true" />
          Exit verification
        </button>
        <div className="hidden min-w-60 sm:block">
          <p className="text-center font-body text-xs font-bold uppercase tracking-[0.18em] text-muted">
            {isBusinessPhase ? "Business documents" : "Personal identity"}
          </p>
          <div
            className="mt-2 h-1.5 overflow-hidden rounded-full bg-border"
            role="progressbar"
            aria-label={`Step ${currentStep} of ${currentStepCount}`}
            aria-valuemin={1}
            aria-valuemax={currentStepCount}
            aria-valuenow={currentStep}
          >
            <motion.span
              className="block h-full rounded-full bg-accent"
              initial={false}
              animate={{ width: `${(currentStep / currentStepCount) * 100}%` }}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.25 }}
            />
          </div>
        </div>
        <p className="justify-self-end font-body text-sm font-bold text-muted">
          Step {currentStep} of {currentStepCount}
        </p>
      </div>
    </header>
  );

  const renderError = (): ReactElement | null =>
    formError ? (
      <div
        ref={errorRef}
        tabIndex={-1}
        role="alert"
        className="mb-6 border-l-4 border-red-600 bg-red-50 px-4 py-3 font-body text-sm leading-6 text-red-800 outline-none"
      >
        {formError}
      </div>
    ) : null;

  const renderTrustPanel = (): ReactElement => (
    <aside className="border-t border-border pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-1">
      <LockKeyhole className="h-6 w-6 text-accent" aria-hidden="true" />
      <h2 className="mt-4 font-display text-xl font-bold text-primary">
        Your information stays private
      </h2>
      <p className="mt-3 font-body text-sm leading-6 text-muted">
        We collect these details to confirm your identity and protect people
        using Rello. Dojah securely performs the check, and your verification
        information is never shown publicly.
      </p>
      <Link
        href={privacyPolicyHref}
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-flex min-h-11 items-center font-body text-sm font-bold text-primary underline decoration-accent underline-offset-4"
      >
        Read our privacy and data policy
      </Link>
    </aside>
  );

  const renderNumberField = (
    field: IdentityField,
    label: string,
    description: string,
    value: string,
    visible: boolean,
    setVisible: (visible: boolean) => void,
    Icon: typeof IdCard,
    completed: boolean,
  ): ReactElement => {
    const touched = touchedFields.includes(field);
    const invalid = touched && !isValidIdentityNumber(value);
    const inputId = `identity-${field}`;
    const descriptionId = `${inputId}-description`;
    const errorId = `${inputId}-error`;

    if (completed) {
      return (
        <div className="border-b border-border py-5">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
              <Check size={18} aria-hidden="true" />
            </span>
            <div>
              <p className="font-body text-sm font-bold text-primary">
                {label}
              </p>
              <p className="mt-1 font-body text-sm text-muted">
                Confirmed by Dojah
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="border-b border-border py-5 first:pt-0">
        <label
          htmlFor={inputId}
          className="flex items-center gap-2 font-body text-sm font-bold text-primary"
        >
          <Icon className="h-5 w-5 text-accent" aria-hidden="true" />
          {label}
        </label>
        <p
          id={descriptionId}
          className="mt-2 font-body text-sm leading-6 text-muted"
        >
          {description} Enter all 11 digits.
        </p>
        <div className="relative mt-3">
          <input
            id={inputId}
            name={field}
            type={visible ? "text" : "password"}
            value={value}
            onChange={(event) => handleNumberChange(event, field)}
            onBlur={() =>
              setTouchedFields((current) =>
                current.includes(field) ? current : [...current, field],
              )
            }
            inputMode="numeric"
            autoComplete="off"
            placeholder="Enter 11 digits"
            aria-describedby={
              invalid ? `${descriptionId} ${errorId}` : descriptionId
            }
            aria-invalid={invalid}
            className={cn(
              "min-h-14 w-full rounded-lg border-2 bg-white px-4 pr-28 font-body text-base tracking-[0.08em] text-primary transition-colors placeholder:tracking-normal placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-accent/30",
              invalid ? "border-red-600" : "border-border focus:border-accent",
            )}
          />
          <button
            type="button"
            onClick={() => setVisible(!visible)}
            className="absolute inset-y-0 right-2 inline-flex min-h-11 items-center gap-2 rounded-md px-3 font-body text-sm font-bold text-primary hover:bg-primary/5"
            aria-label={`${visible ? "Hide" : "Show"} ${label}`}
          >
            {visible ? (
              <EyeOff size={17} aria-hidden="true" />
            ) : (
              <Eye size={17} aria-hidden="true" />
            )}
            {visible ? "Hide" : "Show"}
          </button>
        </div>
        {invalid ? (
          <p
            id={errorId}
            className="mt-2 font-body text-sm font-bold text-red-700"
          >
            Enter an 11-digit {label}.
          </p>
        ) : value.length === 11 ? (
          <p className="mt-2 inline-flex items-center gap-2 font-body text-sm font-bold text-emerald-700">
            <Check size={16} aria-hidden="true" /> Ready to check
          </p>
        ) : null}
      </div>
    );
  };

  const renderNumbersStep = (): ReactElement => (
    <form onSubmit={continueFromNumbers} noValidate>
      <p className="font-body text-xs font-bold uppercase tracking-[0.2em] text-accent">
        Personal identity
      </p>
      <h1
        ref={stepHeadingRef}
        tabIndex={-1}
        className="mt-3 font-display text-3xl font-bold text-primary outline-none sm:text-4xl"
      >
        Enter your identity details
      </h1>
      <p className="mt-3 max-w-xl font-body text-base leading-7 text-muted">
        We use your government and banking identity numbers to make sure your
        account belongs to you.
      </p>
      <div className="mt-8">
        {renderNumberField(
          "nin",
          "National Identification Number (NIN)",
          "You can find this on your NIN slip or NIMC record.",
          nin,
          showNin,
          setShowNin,
          IdCard,
          !needsNin,
        )}
        {renderNumberField(
          "bvn",
          "Bank Verification Number (BVN)",
          "Use the BVN connected to your personal bank account.",
          bvn,
          showBvn,
          setShowBvn,
          Landmark,
          !needsBvn,
        )}
      </div>
      {renderError()}
      <div className="mt-7 flex justify-end">
        <button
          type="submit"
          className="min-h-12 rounded-full bg-accent px-8 font-body text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-white"
        >
          {isTenant ? "Review your details" : "Continue to selfie"}
        </button>
      </div>
    </form>
  );

  const renderSelfieStep = (): ReactElement => (
    <div>
      <button
        type="button"
        onClick={() => {
          stopCamera();
          setCameraState(selfiePreview ? "captured" : "idle");
          setFormError("");
          setPersonalStep("numbers");
        }}
        className="mb-6 inline-flex min-h-11 items-center gap-2 rounded-full px-2 font-body text-sm font-bold text-primary hover:bg-primary/5"
      >
        <ChevronLeft size={18} aria-hidden="true" /> Back
      </button>
      <p className="font-body text-xs font-bold uppercase tracking-[0.2em] text-accent">
        Live selfie
      </p>
      <h1
        ref={stepHeadingRef}
        tabIndex={-1}
        className="mt-3 font-display text-3xl font-bold text-primary outline-none sm:text-4xl"
      >
        Take a clear live selfie
      </h1>
      <p className="mt-3 max-w-xl font-body text-base leading-7 text-muted">
        Face the camera in even lighting, remove hats or dark glasses, and keep
        your device steady.
      </p>
      <div className="mt-7 overflow-hidden rounded-2xl border border-border bg-surface-soft">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-primary/5">
          {cameraState === "idle" ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-accent shadow-sm">
                <ScanFace size={28} aria-hidden="true" />
              </span>
              <p className="mt-4 font-body text-sm font-bold text-primary">
                Your browser will ask for camera permission
              </p>
              <p className="mt-2 max-w-sm font-body text-sm leading-6 text-muted">
                Your selfie is used only for identity verification and is not
                added to your public profile.
              </p>
              <button
                type="button"
                onClick={() => void startCamera()}
                className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-full bg-primary px-7 font-body text-sm font-bold text-white transition-colors hover:bg-accent hover:text-primary"
              >
                <Camera size={18} aria-hidden="true" /> Use camera
              </button>
            </div>
          ) : null}
          {cameraState === "requesting" ? (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center text-center"
              role="status"
            >
              <Loader2
                className="h-8 w-8 animate-spin text-accent"
                aria-hidden="true"
              />
              <p className="mt-4 font-body text-sm font-bold text-primary">
                Waiting for camera permission...
              </p>
            </div>
          ) : null}
          {cameraState === "ready" || cameraState === "requesting" ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                onLoadedMetadata={() => setCameraState("ready")}
                className={cn(
                  "absolute inset-0 h-full w-full -scale-x-100 object-cover",
                  cameraState === "ready" ? "opacity-100" : "opacity-0",
                )}
              />
              {cameraState === "ready" ? (
                <div className="pointer-events-none absolute inset-[10%_28%] rounded-[48%] border-2 border-white/90 shadow-[0_0_0_999px_rgba(4,52,76,0.25)]" />
              ) : null}
            </>
          ) : null}
          {cameraState === "captured" && selfiePreview ? (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${selfiePreview})` }}
              aria-label="Captured selfie preview"
              role="img"
            />
          ) : null}
          {cameraState === "error" ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-700">
                <X size={26} aria-hidden="true" />
              </span>
              <p className="mt-4 font-body text-base font-bold text-primary">
                Camera could not start
              </p>
              <p className="mt-2 max-w-md font-body text-sm leading-6 text-muted">
                {cameraError}
              </p>
              <button
                type="button"
                onClick={() => void startCamera()}
                className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-full bg-primary px-7 font-body text-sm font-bold text-white hover:bg-accent hover:text-primary"
              >
                <RefreshCw size={17} aria-hidden="true" /> Try camera again
              </button>
            </div>
          ) : null}
        </div>
        {cameraState === "ready" ? (
          <div className="flex items-center justify-between gap-4 border-t border-border bg-bg px-5 py-4">
            <p className="font-body text-sm text-muted">
              Center your face inside the guide.
            </p>
            <button
              type="button"
              onClick={captureSelfie}
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-4 border-primary bg-white text-primary shadow-sm hover:scale-[1.03]"
              aria-label="Take selfie"
            >
              <Camera size={22} aria-hidden="true" />
            </button>
          </div>
        ) : null}
        {cameraState === "captured" ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-bg px-5 py-4">
            <p className="inline-flex items-center gap-2 font-body text-sm font-bold text-emerald-700">
              <Check size={17} aria-hidden="true" /> Selfie ready
            </p>
            <button
              type="button"
              onClick={retakeSelfie}
              className="min-h-11 rounded-full border border-border px-5 font-body text-sm font-bold text-primary hover:bg-primary/5"
            >
              Retake
            </button>
          </div>
        ) : null}
      </div>
      <canvas ref={canvasRef} className="hidden" />
      {renderError()}
      <div className="mt-7 flex justify-end">
        <button
          type="button"
          onClick={continueFromSelfie}
          disabled={!selfieReady}
          className="min-h-12 rounded-full bg-accent px-8 font-body text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Review your details
        </button>
      </div>
    </div>
  );

  const renderReviewRow = (
    title: string,
    value: string,
    onEdit?: () => void,
  ): ReactElement => (
    <div className="flex min-h-20 items-center justify-between gap-4 border-b border-border py-4 last:border-b-0">
      <div>
        <p className="font-body text-sm font-bold text-primary">{title}</p>
        <p className="mt-1 font-body text-sm text-muted">{value}</p>
      </div>
      {onEdit ? (
        <button
          type="button"
          onClick={onEdit}
          disabled={isProcessing}
          className="min-h-11 rounded-full px-4 font-body text-sm font-bold text-primary underline decoration-accent underline-offset-4 disabled:opacity-50"
        >
          Edit
        </button>
      ) : (
        <CheckCircle2
          className="h-5 w-5 shrink-0 text-emerald-700"
          aria-label="Confirmed"
        />
      )}
    </div>
  );

  const renderPersonalReview = (): ReactElement => (
    <div>
      <button
        type="button"
        onClick={() =>
          setPersonalStep(
            isTenant ? "numbers" : needsSelfie ? "selfie" : "numbers",
          )
        }
        disabled={isProcessing}
        className="mb-6 inline-flex min-h-11 items-center gap-2 rounded-full px-2 font-body text-sm font-bold text-primary hover:bg-primary/5 disabled:opacity-50"
      >
        <ChevronLeft size={18} aria-hidden="true" /> Back
      </button>
      <p className="font-body text-xs font-bold uppercase tracking-[0.2em] text-accent">
        Review
      </p>
      <h1
        ref={stepHeadingRef}
        tabIndex={-1}
        className="mt-3 font-display text-3xl font-bold text-primary outline-none sm:text-4xl"
      >
        Check your details
      </h1>
      <p className="mt-3 max-w-xl font-body text-base leading-7 text-muted">
        Make sure everything is correct before we securely send it to Dojah.
      </p>
      <div className="mt-8 border-y border-border">
        {renderReviewRow(
          "National Identification Number",
          maskIdentityNumber(nin),
          needsNin ? () => setPersonalStep("numbers") : undefined,
        )}
        {renderReviewRow(
          "Bank Verification Number",
          maskIdentityNumber(bvn),
          needsBvn ? () => setPersonalStep("numbers") : undefined,
        )}
        {!isTenant
          ? renderReviewRow(
              "Live selfie",
              needsSelfie ? "Ready to check" : "Confirmed by Dojah",
              needsSelfie ? () => setPersonalStep("selfie") : undefined,
            )
          : null}
      </div>
      {renderError()}
      <button
        type="button"
        onClick={() => void submitPersonalIdentity()}
        disabled={isProcessing}
        className="mt-7 inline-flex min-h-12 min-w-52 items-center justify-center gap-2 rounded-full bg-accent px-8 font-body text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            <span role="status">{processingLabel()}</span>
          </>
        ) : (
          "Verify identity"
        )}
      </button>
    </div>
  );

  const renderDocumentPicker = (field: UploadField): ReactElement => {
    const uploaded = documents.find((document) => document.id === field.id);
    const error = documentErrors[field.id];

    return (
      <div>
        <p className="font-body text-xs font-bold uppercase tracking-[0.2em] text-accent">
          Business verification
        </p>
        <h1
          ref={stepHeadingRef}
          tabIndex={-1}
          className="mt-3 font-display text-3xl font-bold text-primary outline-none sm:text-4xl"
        >
          Add your{" "}
          {field.id === "registration" ? "business record" : "proof of address"}
        </h1>
        <p className="mt-3 max-w-xl font-body text-base leading-7 text-muted">
          {field.description}
        </p>
        {rejectionReason ? (
          <div className="mt-6 border-l-4 border-red-600 bg-red-50 px-4 py-3">
            <p className="font-body text-sm font-bold text-red-800">
              Your previous submission needs changes
            </p>
            <p className="mt-1 font-body text-sm leading-6 text-red-800">
              {rejectionReason}
            </p>
          </div>
        ) : null}
        <div className="mt-8">
          {uploaded ? (
            <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-white p-5">
              <div className="flex min-w-0 items-center gap-3">
                <FileCheck2
                  className="h-6 w-6 shrink-0 text-emerald-700"
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className="truncate font-body text-sm font-bold text-primary">
                    {uploaded.name}
                  </p>
                  <p className="mt-1 font-body text-xs text-muted">
                    {formatFileSize(uploaded.file.size)} · Ready to submit
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeDocument(field.id)}
                className="min-h-11 shrink-0 rounded-full px-4 font-body text-sm font-bold text-primary underline decoration-accent underline-offset-4"
              >
                Replace
              </button>
            </div>
          ) : (
            <label
              htmlFor={`document-${field.id}`}
              className="flex min-h-52 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-white px-6 text-center transition-colors hover:border-accent hover:bg-accent/5 focus-within:border-accent"
            >
              <Upload className="h-7 w-7 text-accent" aria-hidden="true" />
              <span className="mt-4 font-body text-sm font-bold text-primary">
                Choose a document
              </span>
              <span className="mt-2 font-body text-sm text-muted">
                PDF, JPEG, PNG, or WebP · Maximum 10 MB
              </span>
              <input
                id={`document-${field.id}`}
                type="file"
                accept="application/pdf,image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(event) => handleDocumentUpload(event, field.id)}
                aria-describedby={
                  error ? `document-${field.id}-error` : undefined
                }
                aria-invalid={Boolean(error)}
              />
            </label>
          )}
          {error ? (
            <p
              id={`document-${field.id}-error`}
              role="alert"
              className="mt-3 font-body text-sm font-bold text-red-700"
            >
              {error}
            </p>
          ) : null}
        </div>
        {renderError()}
        <div className="mt-7 flex items-center justify-between gap-4">
          {field.id === "address" ? (
            <button
              type="button"
              onClick={() => {
                setFormError("");
                setBusinessStep("registration");
              }}
              className="inline-flex min-h-11 items-center gap-2 rounded-full px-2 font-body text-sm font-bold text-primary hover:bg-primary/5"
            >
              <ChevronLeft size={18} aria-hidden="true" /> Back
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            disabled={!uploaded}
            onClick={() =>
              setBusinessStep(
                field.id === "registration" ? "address" : "review",
              )
            }
            className="min-h-12 rounded-full bg-accent px-8 font-body text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continue
          </button>
        </div>
      </div>
    );
  };

  const renderBusinessReview = (): ReactElement => (
    <div>
      <button
        type="button"
        onClick={() => setBusinessStep("address")}
        disabled={isProcessing}
        className="mb-6 inline-flex min-h-11 items-center gap-2 rounded-full px-2 font-body text-sm font-bold text-primary hover:bg-primary/5 disabled:opacity-50"
      >
        <ChevronLeft size={18} aria-hidden="true" /> Back
      </button>
      <p className="font-body text-xs font-bold uppercase tracking-[0.2em] text-accent">
        Business verification
      </p>
      <h1
        ref={stepHeadingRef}
        tabIndex={-1}
        className="mt-3 font-display text-3xl font-bold text-primary outline-none sm:text-4xl"
      >
        Review your documents
      </h1>
      <p className="mt-3 max-w-xl font-body text-base leading-7 text-muted">
        Our review team will use these documents to confirm your agent profile.
      </p>
      <div className="mt-8 border-y border-border">
        {UPLOAD_FIELDS.map((field) => {
          const uploaded = documents.find(
            (document) => document.id === field.id,
          );
          return (
            <div
              key={field.id}
              className="flex min-h-20 items-center justify-between gap-4 border-b border-border py-4 last:border-b-0"
            >
              <div className="min-w-0">
                <p className="font-body text-sm font-bold text-primary">
                  {field.title}
                </p>
                <p className="mt-1 truncate font-body text-sm text-muted">
                  {uploaded?.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBusinessStep(field.id)}
                disabled={isProcessing}
                className="min-h-11 rounded-full px-4 font-body text-sm font-bold text-primary underline decoration-accent underline-offset-4 disabled:opacity-50"
              >
                Replace
              </button>
            </div>
          );
        })}
      </div>
      {renderError()}
      <button
        type="button"
        onClick={() => void submitBusinessDocuments()}
        disabled={isProcessing}
        className="mt-7 inline-flex min-h-12 min-w-56 items-center justify-center gap-2 rounded-full bg-accent px-8 font-body text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            <span role="status">{processingLabel()}</span>
          </>
        ) : (
          "Submit documents"
        )}
      </button>
    </div>
  );

  const renderCurrentStep = (): ReactElement => {
    if (isBusinessPhase) {
      if (businessStep === "registration") {
        return renderDocumentPicker(UPLOAD_FIELDS[0]);
      }
      if (businessStep === "address") {
        return renderDocumentPicker(UPLOAD_FIELDS[1]);
      }
      return renderBusinessReview();
    }

    if (personalStep === "numbers") return renderNumbersStep();
    if (personalStep === "selfie") return renderSelfieStep();
    return renderPersonalReview();
  };

  const renderJourney = (): ReactElement => (
    <main className="fixed inset-0 z-[100] overflow-y-auto bg-bg">
      {renderTopBar()}
      <div className="mx-auto w-full max-w-5xl px-5 pb-[max(4rem,env(safe-area-inset-bottom))] pt-28 sm:px-8 sm:pt-32">
        <div className="mb-8 sm:hidden">
          <p className="font-body text-xs font-bold uppercase tracking-[0.18em] text-muted">
            {isBusinessPhase ? "Business documents" : "Personal identity"}
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
            <span
              className="block h-full rounded-full bg-accent"
              style={{ width: `${(currentStep / currentStepCount) * 100}%` }}
            />
          </div>
        </div>
        <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,640px)_minmax(220px,1fr)]">
          <AnimatePresence mode="wait">
            <motion.section
              key={`${isBusinessPhase ? "business" : "identity"}-${isBusinessPhase ? businessStep : personalStep}`}
              initial={reduceMotion ? false : { opacity: 0, x: 18 }}
              animate={reduceMotion ? undefined : { opacity: 1, x: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, x: -18 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              {renderCurrentStep()}
            </motion.section>
          </AnimatePresence>
          {renderTrustPanel()}
        </div>
      </div>
      <ConfirmDialog
        open={showExitConfirmation}
        title="Exit verification?"
        description={
          isTenant
            ? "Your unfinished identity details will be cleared for your privacy. Checks already confirmed by the server will remain complete."
            : "Your unfinished identity details and captured selfie will be cleared for your privacy. Checks already confirmed by the server will remain complete."
        }
        confirmLabel="Exit verification"
        cancelLabel="Keep going"
        tone="danger"
        onConfirm={exitFlow}
        onCancel={() => setShowExitConfirmation(false)}
      />
    </main>
  );

  const renderComplete = (): ReactElement => (
    <main className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-primary px-5 py-16 text-white">
      <motion.div
        className="w-full max-w-lg text-center"
        initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
        animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <div className="flex justify-center">
          {screen === "complete" ? (
            <span className="scale-125">
              <VerifiedBadge size="md" />
            </span>
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/15 text-accent">
              <FileText size={29} aria-hidden="true" />
            </span>
          )}
        </div>
        <p className="mt-7 font-body text-xs font-bold uppercase tracking-[0.2em] text-accent">
          {screen === "complete"
            ? "Verification complete"
            : "Documents received"}
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold text-white">
          {screen === "complete"
            ? isAgent
              ? "Your agent profile is verified"
              : "Your identity is confirmed"
            : "Your documents are under review"}
        </h1>
        <p className="mx-auto mt-4 max-w-md font-body text-base leading-7 text-white/75">
          {screen === "complete"
            ? isAgent
              ? "Your personal identity and business documents are approved."
              : isTenant
                ? "You can now book homes and continue with your request."
                : "You can now continue setting up your first home."
            : "Our team normally reviews agent documents within 1 to 2 business days. We will email you when a decision is ready."}
        </p>
        <button
          type="button"
          onClick={exitFlow}
          className="mt-9 min-h-12 rounded-full bg-accent px-9 font-body text-sm font-bold text-primary transition-colors hover:bg-white"
        >
          {isTenant
            ? fromGate && intent === "offer"
              ? "Continue to offer"
              : fromGate
                ? "Continue to booking"
                : "Back to settings"
            : "Back to dashboard"}
        </button>
      </motion.div>
    </main>
  );

  if (screen === "loading") return <VerificationFlowSkeleton />;

  if (screen === "error") {
    return (
      <main className="fixed inset-0 z-[100] flex items-center justify-center bg-bg px-5 py-16 text-center">
        <div className="max-w-md">
          <ShieldCheck
            className="mx-auto h-10 w-10 text-accent"
            aria-hidden="true"
          />
          <h1 className="mt-5 font-display text-3xl font-bold text-primary">
            Verification could not load
          </h1>
          <p className="mt-3 font-body text-sm leading-6 text-muted">
            {formError}
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setScreen("loading");
                setFormError("");
                setReloadKey((current) => current + 1);
              }}
              className="inline-flex min-h-12 items-center gap-2 rounded-full bg-accent px-7 font-body text-sm font-bold text-primary hover:bg-primary hover:text-white"
            >
              <RefreshCw size={17} aria-hidden="true" /> Try again
            </button>
            <button
              type="button"
              onClick={exitFlow}
              className="min-h-12 rounded-full border border-border px-7 font-body text-sm font-bold text-primary hover:bg-primary/5"
            >
              {isTenant ? "Back" : "Back to dashboard"}
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (screen === "journey") return renderJourney();
  return renderComplete();
}

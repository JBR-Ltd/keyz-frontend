"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  Camera,
  Check,
  CheckCircle2,
  IdCard,
  Landmark,
  Loader2,
  Lock,
  ScanFace,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChangeEvent,
  CSSProperties,
  FormEvent,
  ReactElement,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import VerifiedBadge from "@/components/ui/VerifiedBadge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  countVerifiedTenantSteps,
  getFirstIncompleteTenantVerificationStep,
  isTenantVerified,
  saveTenantVerificationStep,
  TenantVerificationStep,
  useTenantVerificationSnapshot,
} from "@/lib/tenantVerification";

interface VerificationApiResponse {
  data: unknown;
  message: string;
  success: boolean;
}

interface StepCopy {
  label: string;
  heading: string;
  explanation: string;
  helper: string;
  button: string;
  icon: typeof IdCard;
}

type FlowScreen = "overview" | TenantVerificationStep | "complete";
type SelfieSource = "camera" | "upload" | null;
type VerificationIntent = "booking" | "offer";

function getSafeReturnPath(value: string | null): string {
  const isAllowedPath =
    value?.startsWith("/tenant/") || value?.startsWith("/property/");

  return isAllowedPath && value ? value : "/tenant/settings";
}

const STEP_ORDER: TenantVerificationStep[] = ["nin", "bvn", "selfie"];

const DOSSIER_BACKGROUND_STYLE = {
  backgroundImage:
    "radial-gradient(circle at 1px 1px, rgb(255 255 255 / 0.07) 1px, transparent 0), repeating-linear-gradient(135deg, transparent 0 31px, rgb(201 145 58 / 0.05) 31px 32px)",
  backgroundSize: "28px 28px, 64px 64px",
} satisfies CSSProperties;

const STEP_COPY: Record<TenantVerificationStep, StepCopy> = {
  nin: {
    label: "NIN",
    heading: "Verify your NIN",
    explanation:
      "Your National Identification Number confirms your identity before high-trust actions like bookings and offers.",
    helper:
      "Your NIN is only used to confirm your identity and is never stored in full.",
    button: "Verify NIN",
    icon: IdCard,
  },
  bvn: {
    label: "BVN",
    heading: "Verify your BVN",
    explanation:
      "Your Bank Verification Number helps us confirm your financial identity for secure transactions.",
    helper:
      "Your BVN helps protect payments and is only used for identity checks.",
    button: "Verify BVN",
    icon: Landmark,
  },
  selfie: {
    label: "Selfie",
    heading: "Take a quick selfie",
    explanation:
      "This confirms you are a real person and helps match your identity details securely.",
    helper: "Use a clear photo in good light with your face centered.",
    button: "Verify Selfie",
    icon: ScanFace,
  },
};

function delay(durationMs: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, durationMs);
  });
}

function getStepIndex(step: TenantVerificationStep): number {
  return STEP_ORDER.indexOf(step);
}

function getNextStep(step: TenantVerificationStep): FlowScreen {
  if (step === "selfie") {
    return "complete";
  }

  return STEP_ORDER[getStepIndex(step) + 1];
}

function isValidIdentityNumber(value: string): boolean {
  return /^\d{11}$/.test(value);
}

function isVerificationApiResponse(
  value: unknown,
): value is VerificationApiResponse {
  return (
    value !== null &&
    typeof value === "object" &&
    "success" in value &&
    typeof value.success === "boolean" &&
    "message" in value &&
    typeof value.message === "string" &&
    "data" in value
  );
}

async function parseVerificationResponse(
  response: Response,
): Promise<VerificationApiResponse> {
  const data: unknown = await response.json().catch(() => null);

  if (!isVerificationApiResponse(data)) {
    if (response.status === 401 || response.status === 403) {
      throw new Error("Your session has expired. Log in again.");
    }

    throw new Error("The verification server returned an invalid response.");
  }

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Verification failed. Try again.");
  }

  return data;
}

function getAccessToken(): string {
  const token = localStorage.getItem("rello_token") ?? "";

  if (!token) {
    throw new Error("Your session has expired. Log in again.");
  }

  return token;
}

async function verifyIdentityNumber(
  step: "nin" | "bvn",
  value: string,
): Promise<VerificationApiResponse> {
  const query = new URLSearchParams({ [step]: value });
  const response = await fetch(
    `/api/verification/dojah/${step}?${query.toString()}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
      },
    },
  );

  return parseVerificationResponse(response);
}

async function verifySelfie(
  selfiePreview: string,
): Promise<VerificationApiResponse> {
  const imageResponse = await fetch(selfiePreview);

  if (!imageResponse.ok) {
    throw new Error("The selected selfie could not be prepared for upload.");
  }

  const image = await imageResponse.blob();
  const extension = image.type === "image/png" ? "png" : "jpg";
  const formData = new FormData();
  formData.append("selfie", image, `tenant-selfie.${extension}`);

  const response = await fetch("/api/verification/dojah/selfie", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
    },
    body: formData,
  });

  return parseVerificationResponse(response);
}

export default function TenantVerificationFlow(): ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reduceMotion = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { state, verifiedAt } = useTenantVerificationSnapshot();
  const verifiedStepCount = countVerifiedTenantSteps(state);
  const tenantVerified = isTenantVerified(state);
  const source = searchParams.get("source");
  const intent: VerificationIntent =
    searchParams.get("intent") === "offer" ? "offer" : "booking";
  const returnTo = getSafeReturnPath(searchParams.get("returnTo"));
  const fromGate = source === "gate";
  const [screen, setScreen] = useState<FlowScreen>(() =>
    tenantVerified ? "complete" : "overview",
  );
  const [nin, setNin] = useState("");
  const [bvn, setBvn] = useState("");
  const [selfiePreview, setSelfiePreview] = useState("");
  const [selfieSource, setSelfieSource] = useState<SelfieSource>(null);
  const [cameraError, setCameraError] = useState("");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [stepError, setStepError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [successStep, setSuccessStep] = useState<TenantVerificationStep | null>(
    null,
  );

  const firstIncompleteStep = useMemo(
    () => getFirstIncompleteTenantVerificationStep(state),
    [state],
  );

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    return () => {
      if (selfiePreview.startsWith("blob:")) {
        URL.revokeObjectURL(selfiePreview);
      }
    };
  }, [selfiePreview]);

  const exitFlow = (): void => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setIsCameraActive(false);
    router.push(returnTo);
  };

  const startFlow = (): void => {
    setStepError("");
    setSuccessStep(null);
    setScreen(firstIncompleteStep);
  };

  const goBack = (): void => {
    if (isProcessing) {
      return;
    }

    if (screen === "overview" || screen === "complete") {
      exitFlow();
      return;
    }

    if (screen === "selfie") {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setIsCameraActive(false);
    }

    const stepIndex = getStepIndex(screen);
    setStepError("");
    setSuccessStep(null);
    setScreen(stepIndex === 0 ? "overview" : STEP_ORDER[stepIndex - 1]);
  };

  const completePrimaryAction = (): void => {
    router.push(returnTo);
  };

  const completeSecondaryAction = (): void => {
    router.push("/tenant/saved-listings");
  };

  const stopCamera = (): void => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setIsCameraActive(false);
  };

  const startCamera = async (): Promise<void> => {
    setCameraError("");

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera is not available in this browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });

      streamRef.current = stream;
      setIsCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Camera access failed. Upload a photo instead.";

      setIsCameraActive(false);
      setCameraError(message);
    }
  };

  const captureSelfie = (): void => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.videoWidth === 0) {
      setCameraError("Camera preview is not ready yet.");
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    setSelfiePreview(canvas.toDataURL("image/png"));
    setSelfieSource("camera");
    stopCamera();
  };

  const handleSelfieUpload = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setSelfiePreview(URL.createObjectURL(file));
    setSelfieSource("upload");
    stopCamera();
  };

  const handleNumberChange = (
    event: ChangeEvent<HTMLInputElement>,
    setter: (value: string) => void,
  ): void => {
    setter(event.target.value.replace(/\D/g, "").slice(0, 11));
    setStepError("");
  };

  const advanceAfterSuccess = async (
    step: TenantVerificationStep,
  ): Promise<void> => {
    setSuccessStep(step);
    await delay(700);
    setSuccessStep(null);
    setStepError("");
    setScreen(getNextStep(step));
  };

  const verifyNumberStep = async (step: "nin" | "bvn"): Promise<void> => {
    const value = step === "nin" ? nin : bvn;

    setStepError("");

    if (!isValidIdentityNumber(value)) {
      saveTenantVerificationStep(step, "failed");
      setStepError(`${STEP_COPY[step].label} must be 11 digits.`);
      return;
    }

    setIsProcessing(true);
    saveTenantVerificationStep(step, "pending");

    try {
      await verifyIdentityNumber(step, value);

      saveTenantVerificationStep(step, "verified");
      await advanceAfterSuccess(step);
    } catch (error) {
      saveTenantVerificationStep(step, "failed");
      setStepError(
        error instanceof Error
          ? error.message
          : "Verification failed. Try again.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const verifySelfieStep = async (): Promise<void> => {
    setStepError("");

    if (!selfiePreview) {
      saveTenantVerificationStep("selfie", "failed");
      setStepError("Capture or upload a selfie before verifying.");
      return;
    }

    setIsProcessing(true);
    saveTenantVerificationStep("selfie", "pending");

    try {
      await verifySelfie(selfiePreview);

      saveTenantVerificationStep("selfie", "verified");
      await advanceAfterSuccess("selfie");
    } catch (error) {
      saveTenantVerificationStep("selfie", "failed");
      setStepError(
        error instanceof Error ? error.message : "Selfie verification failed.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const submitStep = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    if (screen === "nin") {
      void verifyNumberStep("nin");
      return;
    }

    if (screen === "bvn") {
      void verifyNumberStep("bvn");
      return;
    }

    if (screen === "selfie") {
      void verifySelfieStep();
    }
  };

  const renderStepFeedback = (): ReactElement | null => {
    if (successStep) {
      return (
        <motion.p
          className="mt-4 font-body text-sm font-bold text-accent"
          initial={reduceMotion ? false : { opacity: 0, scale: 0.95 }}
          animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          Verified
        </motion.p>
      );
    }

    if (!stepError) {
      return null;
    }

    return (
      <p className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 font-body text-sm font-bold text-red-700">
        {stepError}
      </p>
    );
  };

  const renderOverview = (): ReactElement => {
    const hasProgress = verifiedStepCount > 0 && !tenantVerified;

    return (
      <main
        className="fixed inset-0 z-[120] min-h-screen overflow-x-hidden overflow-y-auto bg-primary px-5 py-12 text-white sm:px-8 lg:py-16"
        style={DOSSIER_BACKGROUND_STYLE}
      >
        <motion.div
          className="mx-auto grid min-h-[calc(100vh-6rem)] w-full max-w-6xl items-center gap-12 lg:grid-cols-[minmax(0,1fr)_28rem]"
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <section>
            <div className="flex items-center gap-3 text-accent">
              <ShieldCheck className="h-9 w-9" />
              <span className="h-px w-14 bg-accent" />
              <p className="font-accent text-xs font-bold uppercase tracking-[0.3em]">
                Rello identity desk
              </p>
            </div>
            <p className="mt-10 font-body text-xs font-bold uppercase tracking-[0.22em] text-white/50">
              Document REL-ID / TENANT / 001
            </p>
            <h1 className="mt-4 max-w-3xl font-display text-5xl font-bold leading-[0.9] text-white sm:text-6xl lg:text-7xl">
              {hasProgress
                ? "Finish your identity file."
                : "Build your trusted identity."}
            </h1>
            <p className="mt-6 max-w-xl font-body text-base leading-7 text-white/70">
              Three secure checks create the credential used for bookings and
              offers. Have your 11-digit NIN and BVN ready.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={startFlow}
                className="rounded-full bg-accent px-8 py-4 font-body text-sm font-medium text-primary shadow-md transition-all duration-200 ease-in-out hover:scale-[1.02] hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {hasProgress ? "Continue verification" : "Open identity file"}
              </button>
              {fromGate ? (
                <button
                  type="button"
                  onClick={exitFlow}
                  className="font-body text-sm text-white/65 transition-colors hover:text-white"
                >
                  I will do this later
                </button>
              ) : null}
            </div>
          </section>

          <section className="relative overflow-hidden rounded-xl bg-bg p-6 text-primary shadow-xl sm:p-8">
            <div className="relative flex items-start justify-between gap-6 border-b border-border pb-5">
              <div>
                <p className="font-accent text-[10px] font-bold uppercase tracking-[0.24em] text-accent-alt">
                  Tenant verification passport
                </p>
                <p className="mt-2 font-body text-xs text-muted">
                  Issued securely by Rello
                </p>
              </div>
              <Lock className="h-5 w-5 text-accent-alt" />
            </div>
            <div className="relative mt-6 space-y-3">
              {STEP_ORDER.map((step, index) => {
                const StepIcon = STEP_COPY[step].icon;
                const isComplete = state[step] === "verified";

                return (
                  <div
                    key={step}
                    className="grid grid-cols-[2.75rem_1fr_auto] items-center gap-4 rounded-lg bg-surface-soft p-4 shadow-sm"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/5 text-primary">
                      <StepIcon size={20} />
                    </span>
                    <div>
                      <p className="font-body text-sm font-bold text-primary">
                        {STEP_COPY[step].heading}
                      </p>
                      <p className="mt-1 font-body text-xs text-muted">
                        Check {index + 1} of {STEP_ORDER.length}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "font-accent text-[10px] font-bold uppercase tracking-[0.16em]",
                        isComplete ? "text-accent-alt" : "text-muted",
                      )}
                    >
                      {isComplete ? "Cleared" : "Required"}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="relative mt-6 font-body text-xs leading-5 text-muted">
              Identity checks are processed securely through the verification
              service. Identity numbers are not stored in full.
            </p>
          </section>
        </motion.div>
      </main>
    );
  };

  const renderProgressSegments = (
    activeStep: TenantVerificationStep,
  ): ReactElement => {
    const currentStep = getStepIndex(activeStep) + 1;

    return (
      <div
        className="h-2 w-full max-w-xs overflow-hidden rounded-full border border-white/30 bg-white/10"
        role="progressbar"
        aria-label={`Verification step ${currentStep} of ${STEP_ORDER.length}`}
        aria-valuemin={1}
        aria-valuemax={STEP_ORDER.length}
        aria-valuenow={currentStep}
      >
        <span
          className="block h-full rounded-full bg-accent transition-[width] duration-300 ease-in-out"
          style={{ width: `${(currentStep / STEP_ORDER.length) * 100}%` }}
        />
      </div>
    );
  };

  const renderNumberStep = (step: "nin" | "bvn"): ReactElement => {
    const value = step === "nin" ? nin : bvn;
    const setter = step === "nin" ? setNin : setBvn;
    const valid = isValidIdentityNumber(value);
    const copy = STEP_COPY[step];
    const StepIcon = copy.icon;

    return (
      <form onSubmit={submitStep} className="text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <StepIcon size={27} />
        </span>
        <h1 className="mt-4 font-display text-2xl font-bold text-primary">
          {copy.heading}
        </h1>
        <p className="mx-auto mt-2 max-w-sm font-body text-sm leading-6 text-muted">
          {copy.explanation}
        </p>

        <motion.div
          className="mx-auto mt-8 max-w-xs"
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15, ease: "easeOut" }}
        >
          <label htmlFor={`tenant-${step}`} className="sr-only">
            {copy.label}
          </label>
          <div className="relative">
            <input
              id={`tenant-${step}`}
              type="text"
              inputMode="numeric"
              maxLength={11}
              value={value}
              onChange={(event) => handleNumberChange(event, setter)}
              className={cn(
                "min-h-14 w-full rounded-lg border-2 bg-[var(--color-bg)] px-4 py-4 text-center font-accent text-xl font-bold tracking-[0.28em] text-primary outline-none transition-all duration-200 ease-in-out focus:ring-2 focus:ring-accent/30",
                stepError
                  ? "border-red-500"
                  : valid
                    ? "border-accent"
                    : "border-border focus:border-accent",
              )}
              placeholder="12345678901"
            />
            {valid ? (
              <CheckCircle2 className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-accent" />
            ) : null}
          </div>
          <p className="mt-3 font-body text-xs leading-5 text-muted">
            {copy.helper}
          </p>
          {renderStepFeedback()}
          <button
            type="submit"
            disabled={!valid || isProcessing}
            className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 font-body text-sm font-medium text-primary transition-all duration-200 ease-in-out hover:scale-[1.02] hover:bg-primary hover:text-white hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Verifying your details...
              </>
            ) : (
              copy.button
            )}
          </button>
        </motion.div>
      </form>
    );
  };

  const renderSelfieStep = (): ReactElement => (
    <form onSubmit={submitStep} className="text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-accent/10 text-accent">
        <ScanFace size={27} />
      </span>
      <h1 className="mt-4 font-display text-2xl font-bold text-primary">
        {STEP_COPY.selfie.heading}
      </h1>
      <p className="mx-auto mt-2 max-w-sm font-body text-sm leading-6 text-muted">
        {STEP_COPY.selfie.explanation}
      </p>

      <motion.div
        className="mx-auto mt-8 max-w-sm"
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15, ease: "easeOut" }}
      >
        <div className="relative aspect-square overflow-hidden rounded-xl border-2 border-border bg-primary/5">
          {selfiePreview ? (
            <div
              role="img"
              aria-label="Captured selfie preview"
              className="h-full w-full bg-cover bg-center"
              style={{ backgroundImage: `url(${selfiePreview})` }}
            />
          ) : cameraError ? (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center">
              <Upload className="h-9 w-9 text-accent" />
              <p className="mt-4 font-body text-sm font-bold text-primary">
                Camera unavailable
              </p>
              <p className="mt-2 font-body text-xs leading-5 text-muted">
                {cameraError}
              </p>
              <label className="mt-5 inline-flex cursor-pointer items-center justify-center rounded-full bg-accent px-5 py-3 font-body text-sm font-medium text-primary transition-all duration-200 ease-in-out hover:scale-[1.02] hover:bg-primary hover:text-white">
                Upload a photo instead
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleSelfieUpload}
                />
              </label>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="h-full w-full bg-primary object-cover"
              />
              <div className="pointer-events-none absolute inset-5">
                <span className="absolute left-0 top-0 h-8 w-8 border-l-2 border-t-2 border-accent" />
                <span className="absolute right-0 top-0 h-8 w-8 border-r-2 border-t-2 border-accent" />
                <span className="absolute bottom-0 left-0 h-8 w-8 border-b-2 border-l-2 border-accent" />
                <span className="absolute bottom-0 right-0 h-8 w-8 border-b-2 border-r-2 border-accent" />
                <span className="absolute left-1/2 top-1/2 h-52 w-40 -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-accent/30" />
              </div>
              {!isCameraActive ? (
                <button
                  type="button"
                  onClick={() => void startCamera()}
                  className="absolute inset-x-6 bottom-6 rounded-full bg-white/90 px-5 py-3 font-body text-sm font-medium text-primary shadow-md transition-all duration-200 ease-in-out hover:scale-[1.02]"
                >
                  Start camera
                </button>
              ) : null}
            </>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {isCameraActive && !cameraError && !selfiePreview ? (
          <button
            type="button"
            onClick={captureSelfie}
            aria-label="Capture selfie"
            className="mx-auto mt-6 flex h-16 w-16 items-center justify-center rounded-full border-4 border-primary bg-white shadow-md transition-all duration-200 ease-in-out hover:scale-[1.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <Camera className="h-6 w-6 text-primary" />
          </button>
        ) : null}

        {!selfiePreview && !cameraError ? (
          <label className="mx-auto mt-5 inline-flex cursor-pointer items-center gap-2 font-body text-sm font-medium text-primary transition-colors hover:text-accent-alt">
            <Upload size={16} aria-hidden="true" />
            Upload a photo instead
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleSelfieUpload}
            />
          </label>
        ) : null}

        {selfiePreview ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Button
              type="button"
              variant="utility-secondary"
              size="utility"
              onClick={() => {
                setSelfiePreview("");
                setSelfieSource(null);
                setStepError("");
              }}
            >
              Retake
            </Button>
            <button
              type="submit"
              disabled={isProcessing}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-accent px-5 py-3 font-body text-sm font-medium text-primary transition-all duration-200 ease-in-out hover:scale-[1.02] hover:bg-primary hover:text-white hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Use this photo"
              )}
            </button>
          </div>
        ) : null}

        <p className="mt-4 font-body text-xs leading-5 text-muted">
          {selfiePreview
            ? `Selfie ready from ${selfieSource === "camera" ? "camera" : "upload"}.`
            : STEP_COPY.selfie.helper}
        </p>
        {renderStepFeedback()}
      </motion.div>
    </form>
  );

  const renderStepScreen = (
    activeStep: TenantVerificationStep,
  ): ReactElement => {
    const activeIndex = getStepIndex(activeStep);

    return (
      <main
        className="fixed inset-0 z-[120] min-h-screen overflow-x-hidden overflow-y-auto bg-primary text-white"
        style={DOSSIER_BACKGROUND_STYLE}
      >
        <div className="sticky top-0 z-20 bg-primary/95 px-5 py-4 shadow-md">
          <div className="mx-auto grid max-w-6xl grid-cols-[auto_1fr_auto] items-center gap-4">
            <button
              type="button"
              onClick={goBack}
              disabled={isProcessing}
              className="inline-flex min-h-10 items-center gap-2 justify-self-start rounded-full bg-white/10 px-3 font-body text-sm font-medium text-white shadow-sm transition-all duration-200 ease-in-out hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              Back
            </button>
            {renderProgressSegments(activeStep)}
            <button
              type="button"
              onClick={exitFlow}
              disabled={isProcessing}
              className="justify-self-end font-body text-xs font-medium text-white/70 transition-all duration-200 ease-in-out hover:text-white disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
            >
              Save and exit
            </button>
          </div>
        </div>

        <div className="mx-auto grid min-h-[calc(100vh-4.5rem)] w-full max-w-6xl items-center gap-8 px-5 py-10 sm:px-8 lg:grid-cols-[20rem_minmax(0,1fr)] lg:gap-14 lg:py-14">
          <aside className="self-stretch rounded-xl bg-white/5 p-6 shadow-md lg:flex lg:flex-col lg:justify-between lg:p-8">
            <div>
              <p className="font-accent text-[10px] font-bold uppercase tracking-[0.28em] text-accent">
                Verification itinerary
              </p>
              <p className="mt-3 font-display text-3xl font-bold leading-tight text-white">
                Identity file
              </p>
              <p className="mt-3 font-body text-sm leading-6 text-white/60">
                Complete each registered check to issue your Tenant credential.
              </p>
            </div>
            <div className="mt-7 space-y-2 lg:mt-10">
              {STEP_ORDER.map((step, index) => {
                const StepIcon = STEP_COPY[step].icon;
                const isComplete = state[step] === "verified";
                const isActive = step === activeStep;

                return (
                  <div
                    key={step}
                    className={cn(
                      "grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 rounded-lg px-3 py-3 transition-colors",
                      isActive ? "bg-white/10" : "bg-transparent",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg",
                        isActive
                          ? "bg-accent text-primary"
                          : "bg-white/10 text-white/70",
                      )}
                    >
                      {isComplete ? (
                        <Check size={17} />
                      ) : (
                        <StepIcon size={17} />
                      )}
                    </span>
                    <div>
                      <p
                        className={cn(
                          "font-body text-sm font-bold",
                          isActive ? "text-white" : "text-white/65",
                        )}
                      >
                        {STEP_COPY[step].label}
                      </p>
                      <p className="mt-0.5 font-body text-[11px] text-white/45">
                        Registry 0{index + 1}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full",
                        isComplete
                          ? "bg-accent"
                          : isActive
                            ? "bg-white"
                            : "bg-white/20",
                      )}
                    />
                  </div>
                );
              })}
            </div>
            <div className="mt-7 hidden border-t border-white/10 pt-5 lg:block">
              <p className="font-body text-xs leading-5 text-white/50">
                Encrypted session / REL-ID-
                {String(activeIndex + 1).padStart(2, "0")}
              </p>
            </div>
          </aside>

          <AnimatePresence mode="wait">
            <motion.section
              key={successStep ?? activeStep}
              className="relative w-full overflow-hidden rounded-xl bg-bg p-6 text-primary shadow-xl sm:p-10 lg:p-12"
              initial={reduceMotion ? false : { opacity: 0, x: 28 }}
              animate={reduceMotion ? undefined : { opacity: 1, x: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, x: -28 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              <div className="relative mb-8 flex items-center justify-between gap-4 border-b border-border pb-4">
                <p className="font-accent text-[10px] font-bold uppercase tracking-[0.24em] text-accent-alt">
                  RELLO ID / TENANT / CHECK 0{activeIndex + 1}
                </p>
                <p className="font-body text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
                  Secure entry
                </p>
              </div>
              <div className="relative">
                {activeStep === "nin" ? renderNumberStep("nin") : null}
                {activeStep === "bvn" ? renderNumberStep("bvn") : null}
                {activeStep === "selfie" ? renderSelfieStep() : null}
              </div>
            </motion.section>
          </AnimatePresence>
        </div>
      </main>
    );
  };

  const renderComplete = (): ReactElement => {
    const primaryLabel =
      fromGate && intent === "offer"
        ? "Continue to Offer"
        : fromGate
          ? "Continue to Booking"
          : "Back to Settings";
    const issuedDate = new Intl.DateTimeFormat("en-NG", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(verifiedAt ? new Date(verifiedAt) : new Date());

    return (
      <main
        className="fixed inset-0 z-[120] min-h-screen overflow-x-hidden overflow-y-auto bg-primary px-5 py-12 text-white sm:px-8 lg:py-16"
        style={DOSSIER_BACKGROUND_STYLE}
      >
        <motion.div
          className="mx-auto grid min-h-[calc(100vh-6rem)] w-full max-w-5xl items-center gap-10 lg:grid-cols-[minmax(0,1fr)_27rem]"
          initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
          animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <section>
            <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-accent">
              Credential issued
            </p>
            <h1 className="mt-5 font-display text-5xl font-bold leading-[0.9] text-white sm:text-6xl">
              Your identity file is cleared.
            </h1>
            <p className="mt-6 max-w-xl font-body text-base leading-7 text-white/70">
              Your Tenant credential is ready for trusted bookings and offers
              across Rello.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={completePrimaryAction}
                className="rounded-full bg-accent px-8 py-4 font-body text-sm font-medium text-primary shadow-md transition-all duration-200 ease-in-out hover:scale-[1.02] hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {primaryLabel}
              </button>
              {!fromGate ? (
                <Button
                  type="button"
                  variant="utility-secondary"
                  size="utility"
                  onClick={completeSecondaryAction}
                  className="px-8"
                >
                  Browse Listings
                </Button>
              ) : null}
            </div>
          </section>

          <section className="relative overflow-hidden rounded-xl bg-bg p-7 text-primary shadow-xl sm:p-8">
            <div className="relative flex items-start justify-between gap-5 border-b border-border pb-6">
              <div>
                <p className="font-accent text-[10px] font-bold uppercase tracking-[0.24em] text-accent-alt">
                  Rello verified tenant
                </p>
                <p className="mt-2 font-body text-xs text-muted">
                  REL-ID / ACTIVE
                </p>
              </div>
              <VerifiedBadge size="md" />
            </div>
            <div className="relative mt-8">
              <p className="font-body text-[10px] font-bold uppercase tracking-[0.18em] text-muted">
                Credential holder
              </p>
              <p className="mt-2 font-display text-4xl font-bold text-primary">
                Jemimah Okafor
              </p>
              <div className="mt-7 space-y-3">
                {STEP_ORDER.map((step) => {
                  const StepIcon = STEP_COPY[step].icon;

                  return (
                    <div
                      key={step}
                      className="flex items-center justify-between rounded-lg bg-surface-soft px-4 py-3 shadow-sm"
                    >
                      <span className="flex items-center gap-3 font-body text-sm font-bold text-primary">
                        <StepIcon size={17} className="text-accent-alt" />
                        {STEP_COPY[step].label} check
                      </span>
                      <span className="font-accent text-[10px] font-bold uppercase tracking-[0.16em] text-accent-alt">
                        Cleared
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="relative mt-7 grid grid-cols-2 gap-4 border-t border-border pt-5">
              <div>
                <p className="font-body text-[10px] uppercase tracking-[0.14em] text-muted">
                  Issued
                </p>
                <p className="mt-1 font-body text-xs font-bold text-primary">
                  {issuedDate}
                </p>
              </div>
              <div className="text-right">
                <p className="font-body text-[10px] uppercase tracking-[0.14em] text-muted">
                  Status
                </p>
                <p className="mt-1 font-body text-xs font-bold text-accent-alt">
                  Active
                </p>
              </div>
            </div>
          </section>
        </motion.div>
      </main>
    );
  };

  if (screen === "overview") {
    return renderOverview();
  }

  if (screen === "complete") {
    return renderComplete();
  }

  return renderStepScreen(screen);
}

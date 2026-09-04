"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Camera,
  Check,
  IdCard,
  Landmark,
  Loader2,
  Lock,
  ScanFace,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  ChangeEvent,
  FormEvent,
  ReactElement,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import VerifiedBadge from "@/components/ui/VerifiedBadge";
import {
  approveAgentIdentity,
  getHostIdentityStatus,
  getHostVerificationSnapshot,
  saveHostIdentityVerification,
  HostVerificationRole,
  verifyHostNin,
  verifyHostSelfie,
} from "@/lib/hostVerification";
import { cn } from "@/lib/utils";

interface HostIdentityVerificationFlowProps {
  role: HostVerificationRole;
}

interface MockAgentVerificationResponse {
  success: boolean;
  status: "approved" | "failed";
  message?: string;
}

type IdentityScreen = "overview" | "step" | "complete";
type SelfieSource = "camera" | "upload" | null;

function delay(durationMs: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, durationMs);
  });
}

function isValidIdentityNumber(value: string): boolean {
  return /^\d{11}$/.test(value);
}

async function simulateAgentVerification(
  nin: string,
  bvn: string,
  hasSelfie: boolean,
): Promise<MockAgentVerificationResponse> {
  await delay(1400);

  // ASSUMED SHAPE: confirm against the real compound Agent Smile ID response before production wiring.
  if (nin === "00000000000" || bvn === "00000000000" || !hasSelfie) {
    return {
      success: false,
      status: "failed",
      message: "We could not verify these details. Check them and try again.",
    };
  }

  return {
    success: true,
    status: "approved",
    message: "Agent identity checks passed.",
  };
}

export default function HostIdentityVerificationFlow({
  role,
}: HostIdentityVerificationFlowProps): ReactElement {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isAgent = role === "agent";
  const centerHref = `/${role}/verify`;
  const snapshot = useMemo(() => getHostVerificationSnapshot(role), [role]);
  const [screen, setScreen] = useState<IdentityScreen>(() => {
    if (snapshot.identity.status === "approved") {
      return "complete";
    }

    return "overview";
  });
  const [nin, setNin] = useState("");
  const [bvn, setBvn] = useState("");
  const [selfiePreview, setSelfiePreview] = useState("");
  const [selfieSource, setSelfieSource] = useState<SelfieSource>(null);
  const [cameraError, setCameraError] = useState("");
  const [formError, setFormError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const ninValid = isValidIdentityNumber(nin);
  const bvnValid = isValidIdentityNumber(bvn);
  const agentReady = ninValid && bvnValid && Boolean(selfiePreview);
  const landlordReady = ninValid && Boolean(selfiePreview);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (isAgent) {
      return;
    }

    let active = true;

    void getHostIdentityStatus().then((result) => {
      if (!active || !result.data || result.data.role !== "LANDLORD") {
        return;
      }

      const current = getHostVerificationSnapshot(role);
      const hasStarted =
        result.data.ninVerified || result.data.selfieVerified;
      const verifiedAt = result.data.identityVerified
        ? current.identity.approvedAt ?? new Date().toISOString()
        : null;

      saveHostIdentityVerification(role, {
        status: result.data.identityVerified
          ? "approved"
          : hasStarted
            ? "pending"
            : "not_started",
        submittedAt: hasStarted
          ? current.identity.submittedAt ?? new Date().toISOString()
          : null,
        approvedAt: verifiedAt,
        rejectedReason: null,
      });
      setScreen(result.data.identityVerified ? "complete" : "overview");
    });

    return () => {
      active = false;
    };
  }, [isAgent, role]);

  const exitFlow = (): void => {
    router.push(centerHref);
  };

  const stopCamera = (): void => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
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

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Camera access failed. Upload a photo instead.";

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
    setFormError("");
  };

  const submitAgentIdentity = async (): Promise<void> => {
    setFormError("");

    if (!agentReady) {
      setFormError("Enter a valid NIN, BVN, and selfie before submitting.");
      return;
    }

    setIsProcessing(true);

    try {
      const response = await simulateAgentVerification(
        nin,
        bvn,
        Boolean(selfiePreview),
      );

      if (!response.success || response.status === "failed") {
        saveHostIdentityVerification(role, {
          status: "failed",
          submittedAt: new Date().toISOString(),
          approvedAt: null,
          rejectedReason: response.message ?? "Verification failed.",
        });
        setFormError(response.message ?? "Verification failed. Try again.");
        return;
      }

      approveAgentIdentity(role);
      setScreen("complete");
    } finally {
      setIsProcessing(false);
    }
  };

  const submitLandlordIdentity = async (): Promise<void> => {
    setFormError("");

    if (!landlordReady) {
      setFormError("Enter a valid NIN and add a selfie before submitting.");
      return;
    }

    setIsProcessing(true);

    try {
      await verifyHostNin(nin);
      await verifyHostSelfie(selfiePreview);

      const status = await getHostIdentityStatus();

      if (!status.success || !status.data?.identityVerified) {
        throw new Error(
          status.message || "Your verification status could not be confirmed.",
        );
      }

      const verifiedAt = new Date().toISOString();
      saveHostIdentityVerification(role, {
        status: "approved",
        submittedAt: verifiedAt,
        approvedAt: verifiedAt,
        rejectedReason: null,
      });
      setScreen("complete");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Verification failed. Try again.";

      saveHostIdentityVerification(role, {
        status: "failed",
        submittedAt: new Date().toISOString(),
        approvedAt: null,
        rejectedReason: message,
      });
      setFormError(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const submitStep = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    if (isAgent) {
      void submitAgentIdentity();
      return;
    }

    void submitLandlordIdentity();
  };

  const renderOverview = (): ReactElement => (
    <main className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-primary px-5 py-16 text-white">
      <motion.div
        className="w-full max-w-2xl text-center"
        initial={reduceMotion ? false : { opacity: 0, y: 20 }}
        animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <ShieldCheck className="mx-auto mb-6 h-12 w-12 text-accent" />
        <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-accent">
          Identity Verification
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold leading-tight text-white">
          {isAgent
            ? "Let's verify your identity as an agent."
            : "Let's verify your landlord identity."}
        </h1>
        <p className="mx-auto mt-4 max-w-md font-body text-base leading-7 text-white/70">
          {isAgent
            ? "We will check your NIN, BVN, and selfie together through Smile ID so residents know they are working with a trusted agent."
            : "Confirm your NIN and complete a selfie liveness check to unlock listing creation."}
        </p>

        <div className="mx-auto mt-12 max-w-xl rounded-lg border border-white/10 bg-primary p-6 text-left">
          <div className="flex items-center gap-3">
            <Lock className="h-5 w-5 text-accent" />
            <p className="font-body text-sm font-bold text-white/80">
              {isAgent ? "Compound Smile ID check" : "NIN and selfie check"}
            </p>
          </div>
          <p className="mt-3 font-body text-xs leading-6 text-white/70">
            {isAgent
              ? "Your identity details are submitted once and verified together for a faster approval decision."
              : "These identity checks are required before the backend allows a property listing to be created."}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setScreen("step")}
          className="mt-10 rounded-full bg-accent px-10 py-4 font-body text-sm font-medium text-primary transition-all duration-200 ease-in-out hover:scale-[1.02] hover:bg-primary hover:text-white hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {isAgent ? "Begin Verification" : "Verify Identity"}
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

  const renderNumberField = (
    label: string,
    value: string,
    setter: (value: string) => void,
    Icon: typeof IdCard,
  ): ReactElement => {
    const valid = isValidIdentityNumber(value);

    return (
      <label className="block rounded-xl border border-primary/10 bg-[var(--color-bg)] p-5 shadow-sm">
        <span className="flex items-center gap-3 font-body text-sm font-bold text-primary">
          <Icon className="h-5 w-5 text-accent" />
          {label}
        </span>
        <span className="relative mt-4 block">
          <input
            value={value}
            onChange={(event) => handleNumberChange(event, setter)}
            inputMode="numeric"
            placeholder="00000000000"
            className={cn(
              "w-full rounded-lg border-2 bg-white px-4 py-4 text-center font-body text-lg tracking-widest text-primary transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent/40",
              valid ? "border-accent" : "border-border",
            )}
          />
          {valid ? (
            <Check className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-accent" />
          ) : null}
        </span>
      </label>
    );
  };

  const renderSelfieField = (): ReactElement => (
    <section className="rounded-xl border border-primary/10 bg-[var(--color-bg)] p-5 shadow-sm">
      <div className="flex items-center gap-3 font-body text-sm font-bold text-primary">
        <ScanFace className="h-5 w-5 text-accent" />
        Selfie liveness
      </div>
      <div className="relative mx-auto mt-4 aspect-square max-w-sm overflow-hidden rounded-xl border-2 border-border bg-surface-soft">
        {selfiePreview ? (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${selfiePreview})` }}
          />
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-8 rounded-full border-2 border-accent/40" />
            {cameraError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-bg p-6 text-center">
                <Upload className="h-8 w-8 text-accent" />
                <p className="mt-3 font-body text-sm font-bold text-primary">
                  Camera unavailable
                </p>
                <p className="mt-2 font-body text-xs leading-5 text-muted">
                  {cameraError}
                </p>
                <label className="mt-4 cursor-pointer rounded-full bg-accent px-5 py-3 font-body text-sm font-medium text-primary transition-all duration-200 ease-in-out hover:scale-[1.02] hover:bg-primary hover:text-white">
                  Upload a photo instead
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={handleSelfieUpload}
                  />
                </label>
              </div>
            ) : null}
          </>
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />
      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        {selfiePreview ? (
          <>
            <button
              type="button"
              onClick={() => {
                setSelfiePreview("");
                setSelfieSource(null);
              }}
              className="rounded-full border border-primary/30 px-5 py-3 font-body text-sm font-medium text-primary transition-all duration-200 ease-in-out hover:bg-primary/10"
            >
              Retake
            </button>
            <p className="font-body text-xs text-muted">
              Ready from {selfieSource === "camera" ? "camera" : "upload"}
            </p>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => void startCamera()}
              className="rounded-full border border-primary/30 px-5 py-3 font-body text-sm font-medium text-primary transition-all duration-200 ease-in-out hover:bg-primary/10"
            >
              Start camera
            </button>
            <button
              type="button"
              onClick={captureSelfie}
              className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-primary bg-white text-primary shadow-md transition-all duration-200 ease-in-out hover:scale-[1.03]"
              aria-label="Capture selfie"
            >
              <Camera size={24} />
            </button>
            <label className="cursor-pointer rounded-full bg-accent px-5 py-3 font-body text-sm font-medium text-primary transition-all duration-200 ease-in-out hover:scale-[1.02] hover:bg-primary hover:text-white">
              Upload photo
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleSelfieUpload}
              />
            </label>
          </>
        )}
      </div>
    </section>
  );

  const renderAgentStep = (): ReactElement => (
    <form onSubmit={submitStep} className="space-y-5">
      <div className="text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <ShieldCheck size={27} />
        </span>
        <h1 className="mt-4 font-display text-2xl font-bold text-primary">
          Submit your agent identity check
        </h1>
        <p className="mx-auto mt-2 max-w-sm font-body text-sm leading-6 text-muted">
          Enter your NIN, BVN, and selfie together. We submit them as one Smile
          ID verification request.
        </p>
      </div>
      {renderNumberField("NIN", nin, setNin, IdCard)}
      {renderNumberField("BVN", bvn, setBvn, Landmark)}
      {renderSelfieField()}
      {formError ? (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 font-body text-sm font-bold text-red-700">
          {formError}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={!agentReady || isProcessing}
        className="w-full rounded-full bg-accent px-6 py-4 font-body text-sm font-medium text-primary transition-all duration-200 ease-in-out hover:scale-[1.01] hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isProcessing ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Verifying your details...
          </span>
        ) : (
          "Submit for Verification"
        )}
      </button>
    </form>
  );

  const renderLandlordStep = (): ReactElement => (
    <form onSubmit={submitStep} className="space-y-5">
      <div className="text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <ShieldCheck size={27} />
        </span>
        <h1 className="mt-4 font-display text-2xl font-bold text-primary">
          Verify your landlord identity
        </h1>
        <p className="mx-auto mt-2 max-w-sm font-body text-sm leading-6 text-muted">
          Enter your NIN and submit a clear selfie. Both checks must pass before
          you can create a listing.
        </p>
      </div>
      {renderNumberField("NIN", nin, setNin, IdCard)}
      {renderSelfieField()}
      {formError ? (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 font-body text-sm font-bold text-red-700">
          {formError}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={!landlordReady || isProcessing}
        className="w-full rounded-full bg-accent px-6 py-4 font-body text-sm font-medium text-primary transition-all duration-200 ease-in-out hover:scale-[1.01] hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isProcessing ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Verifying your identity...
          </span>
        ) : (
          "Verify Identity"
        )}
      </button>
    </form>
  );

  const renderStep = (): ReactElement => (
    <main className="fixed inset-0 z-[100] overflow-y-auto bg-bg">
      {renderTopBar()}
      <div className="mx-auto flex min-h-screen w-full max-w-2xl items-center justify-center px-5 py-28">
        <AnimatePresence mode="wait">
          <motion.div
            key={role}
            className="w-full"
            initial={reduceMotion ? false : { opacity: 0, x: 24 }}
            animate={reduceMotion ? undefined : { opacity: 1, x: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, x: -24 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            {isAgent ? renderAgentStep() : renderLandlordStep()}
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
          You&apos;re verified.
        </h1>
        <p className="mx-auto mt-3 max-w-sm font-body text-base leading-7 text-white/70">
          {isAgent
            ? "You can now list properties on Rello with full agent trust signals."
            : "Your landlord identity is verified. You can now create and submit property listings."}
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

  if (screen === "step") {
    return renderStep();
  }

  if (screen === "complete") {
    return renderComplete();
  }

  return renderOverview();
}

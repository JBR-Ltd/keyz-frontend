"use client";

import { BadgeCheck, Camera, Fingerprint, IdCard } from "lucide-react";
import { ChangeEvent, FormEvent, useState } from "react";
import AuthBanner from "@/components/auth/AuthBanner";
import { useToast } from "@/components/ui/toast";

interface ApiEnvelope<TData> {
  success: boolean;
  message: string;
  data: TData;
}

interface VerificationResult {
  success?: boolean;
  status?: string;
  message?: string;
  smileTxId?: string;
  fullName?: string;
  dob?: string;
  databaseMatched?: string;
  livenessScore?: number;
}

type VerificationStepId = "nin" | "bvn" | "selfie";

interface VerificationStep {
  id: VerificationStepId;
  title: string;
  description: string;
  icon: typeof IdCard;
}

const VERIFICATION_STEPS: VerificationStep[] = [
  {
    id: "nin",
    title: "NIN verification",
    description: "Verify your 11-digit National Identification Number.",
    icon: IdCard,
  },
  {
    id: "bvn",
    title: "BVN verification",
    description: "Confirm your 11-digit Bank Verification Number.",
    icon: Fingerprint,
  },
  {
    id: "selfie",
    title: "Selfie liveness",
    description: "Upload a live selfie image for physical liveness checks.",
    icon: Camera,
  },
];

function isApiEnvelope(value: unknown): value is ApiEnvelope<unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    "message" in value &&
    typeof value.message === "string"
  );
}

function isVerificationResult(value: unknown): value is VerificationResult {
  return value !== null && typeof value === "object";
}

function getApiMessage(value: unknown, fallback: string): string {
  return isApiEnvelope(value) ? value.message : fallback;
}

function getStoredValue(key: string): string {
  if (typeof window === "undefined") {
    return "";
  }

  return localStorage.getItem(key) ?? "";
}

function getAuthorizationHeader(): string {
  const token = getStoredValue("rello_token");

  return token ? `Bearer ${token}` : "";
}

export default function VerificationSection() {
  const { notify } = useToast();
  const [nin, setNin] = useState("");
  const [bvn, setBvn] = useState("");
  const [userId, setUserId] = useState(() => getStoredValue("rello_user_id"));
  const [selfie, setSelfie] = useState<File | null>(null);
  const [activeStep, setActiveStep] = useState<VerificationStepId | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [results, setResults] = useState<
    Partial<Record<VerificationStepId, VerificationResult>>
  >({});

  const parseVerificationResponse = async (
    response: Response,
    fallback: string,
  ): Promise<VerificationResult> => {
    const data: unknown = await response.json().catch(() => null);

    if (!response.ok || (isApiEnvelope(data) && !data.success)) {
      throw new Error(getApiMessage(data, fallback));
    }

    if (isApiEnvelope(data) && isVerificationResult(data.data)) {
      return data.data;
    }

    return { status: "VERIFIED", message: getApiMessage(data, fallback) };
  };

  const ensureReady = (): string => {
    const authorization = getAuthorizationHeader();

    if (!authorization) {
      throw new Error("Log in again before starting tenant verification.");
    }

    if (!userId.trim()) {
      throw new Error("Enter your account ID before verification.");
    }

    return authorization;
  };

  const verifyNumber = async (
    step: "nin" | "bvn",
    value: string,
  ): Promise<void> => {
    setErrorMessage("");
    setActiveStep(step);

    try {
      const authorization = ensureReady();
      const trimmedValue = value.trim();

      if (!/^\d{11}$/.test(trimmedValue)) {
        throw new Error(`${step.toUpperCase()} must be 11 digits.`);
      }

      const query = new URLSearchParams({
        [step]: trimmedValue,
        userId: userId.trim(),
      });
      const response = await fetch(
        `/api/verification/smileid/${step}?${query.toString()}`,
        {
          method: "POST",
          headers: {
            Authorization: authorization,
          },
        },
      );
      const result = await parseVerificationResponse(
        response,
        `${step.toUpperCase()} verification failed`,
      );

      setResults((current) => ({ ...current, [step]: result }));
      notify({
        title: `${step.toUpperCase()} verified`,
        description: result.message ?? `${step.toUpperCase()} check completed.`,
        variant: "success",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : `${step.toUpperCase()} failed`;

      setErrorMessage(message);
      notify({
        title: `${step.toUpperCase()} failed`,
        description: message,
        variant: "error",
      });
    } finally {
      setActiveStep(null);
    }
  };

  const verifySelfie = async (): Promise<void> => {
    setErrorMessage("");
    setActiveStep("selfie");

    try {
      const authorization = ensureReady();

      if (!selfie) {
        throw new Error("Upload a selfie image before running liveness.");
      }

      const formData = new FormData();
      formData.append("selfie", selfie);
      formData.append("userId", userId.trim());

      const response = await fetch("/api/verification/smileid/selfie", {
        method: "POST",
        headers: {
          Authorization: authorization,
        },
        body: formData,
      });
      const result = await parseVerificationResponse(
        response,
        "Selfie liveness check failed",
      );

      setResults((current) => ({ ...current, selfie: result }));
      notify({
        title: "Selfie verified",
        description: result.message ?? "Selfie liveness check completed.",
        variant: "success",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Selfie liveness check failed";

      setErrorMessage(message);
      notify({
        title: "Selfie failed",
        description: message,
        variant: "error",
      });
    } finally {
      setActiveStep(null);
    }
  };

  const handleSelfieChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setSelfie(event.target.files?.[0] ?? null);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
  };

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-bg shadow-sm">
      <div className="border-b border-border bg-surface-soft p-6 sm:p-8">
        <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-accent-alt">
          Smile ID checks
        </p>
        <h2 className="mt-3 font-display text-3xl font-bold leading-none text-primary sm:text-4xl">
          Tenant Verification
        </h2>
        <p className="mt-4 max-w-2xl font-body text-sm leading-6 text-muted">
          Verify your identity with the standalone NIN, BVN, and selfie liveness
          checks documented by the backend.
        </p>
      </div>

      <form className="grid gap-5 p-5 sm:p-7" onSubmit={handleSubmit}>
        {errorMessage ? (
          <AuthBanner key={errorMessage} message={errorMessage} type="error" />
        ) : null}

        <div className="rounded-lg border border-primary/15 bg-surface-soft p-5">
          <label className="block" htmlFor="verification-user-id">
            <span className="font-body text-sm font-bold text-primary">
              Account ID
            </span>
            <input
              id="verification-user-id"
              type="text"
              inputMode="numeric"
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              placeholder="Stored after login"
              className="mt-2 min-h-12 w-full rounded-lg border border-border bg-bg px-4 py-3 font-body text-base text-primary outline-none transition-all duration-200 ease-in-out placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/30"
            />
          </label>
          <p className="mt-2 font-body text-xs leading-5 text-muted">
            This is filled automatically after login when the backend returns
            `userId`. Existing sessions may need to enter it once.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {VERIFICATION_STEPS.map(({ id, title, description, icon: Icon }) => {
            const result = results[id];
            const isLoading = activeStep === id;

            return (
              <article
                key={id}
                className="flex min-w-0 flex-col rounded-lg border border-primary/15 bg-[var(--color-bg)] p-5 shadow-sm transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:bg-surface-soft hover:shadow-md"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white">
                  <Icon size={22} strokeWidth={1.8} />
                </span>
                <h3 className="mt-4 font-body text-lg font-bold text-primary">
                  {title}
                </h3>
                <p className="mt-2 font-body text-sm leading-6 text-muted">
                  {description}
                </p>

                {id === "nin" ? (
                  <input
                    type="text"
                    inputMode="numeric"
                    value={nin}
                    onChange={(event) => setNin(event.target.value)}
                    placeholder="48291560321"
                    className="mt-5 min-h-12 rounded-lg border border-border bg-bg px-4 py-3 font-body text-base text-primary outline-none transition-all duration-200 ease-in-out placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/30"
                  />
                ) : null}

                {id === "bvn" ? (
                  <input
                    type="text"
                    inputMode="numeric"
                    value={bvn}
                    onChange={(event) => setBvn(event.target.value)}
                    placeholder="98765432109"
                    className="mt-5 min-h-12 rounded-lg border border-border bg-bg px-4 py-3 font-body text-base text-primary outline-none transition-all duration-200 ease-in-out placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/30"
                  />
                ) : null}

                {id === "selfie" ? (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleSelfieChange}
                    className="mt-5 block w-full rounded-lg border border-border bg-bg px-4 py-3 font-body text-sm text-primary file:mr-4 file:rounded-full file:border-0 file:bg-accent file:px-4 file:py-2 file:font-body file:text-sm file:font-medium file:text-white"
                  />
                ) : null}

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => {
                    if (id === "nin") {
                      void verifyNumber("nin", nin);
                      return;
                    }

                    if (id === "bvn") {
                      void verifyNumber("bvn", bvn);
                      return;
                    }

                    void verifySelfie();
                  }}
                  className="mt-5 min-h-12 rounded-full bg-accent px-5 py-3 font-body text-sm font-medium text-white transition-all duration-200 ease-in-out hover:scale-[1.02] hover:bg-accent-alt hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isLoading ? "Checking..." : "Run check"}
                </button>

                {result ? (
                  <div className="mt-5 rounded-lg border border-accent/30 bg-accent/10 p-4">
                    <p className="flex items-center gap-2 font-body text-sm font-bold text-primary">
                      <BadgeCheck size={17} className="text-accent-alt" />
                      {result.status ?? "VERIFIED"}
                    </p>
                    {result.fullName ? (
                      <p className="mt-2 font-body text-sm text-muted">
                        {result.fullName}
                      </p>
                    ) : null}
                    {result.smileTxId ? (
                      <p className="mt-2 break-all font-body text-xs text-muted">
                        {result.smileTxId}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </form>
    </section>
  );
}

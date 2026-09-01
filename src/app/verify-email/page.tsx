"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChangeEvent,
  ClipboardEvent,
  KeyboardEvent,
  useRef,
  useState,
} from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import AuthBanner from "@/components/auth/AuthBanner";
import AuthInput from "@/components/auth/AuthInput";
import AuthSplitLayout from "@/components/auth/AuthSplitLayout";
import { useToast } from "@/components/ui/toast";

interface VerifyEmailFormValues {
  email: string;
}

interface ApiEnvelope<TData> {
  success: boolean;
  message: string;
  data: TData;
}

const VERIFY_EMAIL_STORAGE_KEY = "rello_verify_email";
const OTP_LENGTH = 6;

function isApiEnvelope(value: unknown): value is ApiEnvelope<unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    "message" in value &&
    typeof value.message === "string"
  );
}

function getApiMessage(value: unknown, fallback: string): string {
  return isApiEnvelope(value) ? value.message : fallback;
}

export default function VerifyEmailPage() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const { notify } = useToast();
  const [errorMessage, setErrorMessage] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpDigits, setOtpDigits] = useState(() =>
    Array.from({ length: OTP_LENGTH }, (): string => ""),
  );
  const otpInputRefs = useRef<HTMLInputElement[]>([]);
  const [initialEmail] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return (
      sessionStorage.getItem(VERIFY_EMAIL_STORAGE_KEY) ??
      new URLSearchParams(window.location.search).get("email") ??
      ""
    );
  });
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<VerifyEmailFormValues>({
    defaultValues: {
      email: initialEmail,
    },
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  });

  function focusOtpInput(index: number): void {
    otpInputRefs.current[index]?.focus();
  }

  function setOtpInputRef(
    element: HTMLInputElement | null,
    index: number,
  ): void {
    if (element) {
      otpInputRefs.current[index] = element;
    }
  }

  function handleOtpChange(
    index: number,
    event: ChangeEvent<HTMLInputElement>,
  ): void {
    const nextDigit = event.target.value.replace(/\D/g, "").slice(-1);

    setOtpDigits((current) => {
      const next = [...current];
      next[index] = nextDigit;
      return next;
    });
    setOtpError("");

    if (nextDigit && index < OTP_LENGTH - 1) {
      focusOtpInput(index + 1);
    }
  }

  function handleOtpKeyDown(
    index: number,
    event: KeyboardEvent<HTMLInputElement>,
  ): void {
    if (event.key !== "Backspace" || otpDigits[index] || index === 0) {
      return;
    }

    focusOtpInput(index - 1);
  }

  function handleOtpPaste(event: ClipboardEvent<HTMLInputElement>): void {
    const pastedDigits = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);

    if (!pastedDigits) {
      return;
    }

    event.preventDefault();

    setOtpDigits((current) =>
      current.map((digit, index) => pastedDigits[index] ?? digit),
    );
    setOtpError("");
    focusOtpInput(Math.min(pastedDigits.length, OTP_LENGTH - 1));
  }

  const onSubmit: SubmitHandler<VerifyEmailFormValues> = async (values) => {
    setErrorMessage("");
    setOtpError("");

    const token = otpDigits.join("");

    if (token.length !== OTP_LENGTH) {
      setOtpError("Enter the 6-digit verification code");
      return;
    }

    try {
      const query = new URLSearchParams({
        email: values.email,
        token,
      });
      const response = await fetch(
        `/api/auth/verify-email?${query.toString()}`,
        {
          method: "POST",
        },
      );

      const data: unknown = await response.json().catch(() => null);

      if (!response.ok || (isApiEnvelope(data) && !data.success)) {
        throw new Error(getApiMessage(data, "Email verification failed"));
      }

      const message = getApiMessage(
        data,
        "Email verified successfully! You can now log in.",
      );

      notify({
        title: "Email verified",
        description: message,
        variant: "success",
      });
      sessionStorage.removeItem(VERIFY_EMAIL_STORAGE_KEY);
      router.push(`/login?message=${encodeURIComponent(message)}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Email verification failed";

      setErrorMessage(message);
      notify({
        title: "Verification failed",
        description: message,
        variant: "error",
      });
    }
  };

  return (
    <main className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <AuthSplitLayout
        leftContent={
          <div className="max-w-xl">
            <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-accent">
              Rello
            </p>
            <h1 className="mt-5 font-display text-6xl font-bold leading-[0.92] text-white">
              Confirm your Rello email.
            </h1>
            <p className="mt-6 font-body text-lg leading-8 text-white/70">
              Enter the 6-digit code sent to your inbox to activate your
              account.
            </p>
          </div>
        }
        rightContent={
          <>
            <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-primary">
              Verify Email
            </p>
            <h1 className="mt-5 font-display text-5xl font-bold leading-[0.95] text-primary sm:text-6xl">
              Activate your account
            </h1>

            <form
              className="mt-10 grid gap-5"
              onSubmit={handleSubmit(onSubmit)}
            >
              {errorMessage ? (
                <AuthBanner
                  key={errorMessage}
                  message={errorMessage}
                  type="error"
                />
              ) : null}

              {initialEmail ? (
                <input type="hidden" {...register("email")} />
              ) : (
                <AuthInput
                  label="Email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  error={errors.email?.message}
                  register={register}
                  rules={{
                    required: "Email is required",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Enter a valid email address",
                    },
                  }}
                />
              )}

              <fieldset>
                <legend className="font-body text-sm font-bold text-primary">
                  Verification Code
                </legend>
                <div className="mt-2 grid grid-cols-6 gap-2 sm:gap-3">
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(element) => setOtpInputRef(element, index)}
                      type="text"
                      inputMode="numeric"
                      autoComplete={index === 0 ? "one-time-code" : "off"}
                      aria-label={`Verification code digit ${index + 1}`}
                      aria-invalid={otpError ? "true" : "false"}
                      aria-describedby={
                        otpError ? "auth-token-error" : undefined
                      }
                      maxLength={1}
                      value={digit}
                      onChange={(event) => handleOtpChange(index, event)}
                      onKeyDown={(event) => handleOtpKeyDown(index, event)}
                      onPaste={handleOtpPaste}
                      className="aspect-square min-h-12 w-full border border-surface bg-[var(--color-bg)] text-center font-body text-xl font-bold text-[var(--color-text)] outline-none transition-all duration-200 ease-in-out focus:border-primary focus:ring-2 focus:ring-accent/30 sm:min-h-14"
                    />
                  ))}
                </div>
                <AnimatePresence>
                  {otpError ? (
                    <motion.p
                      id="auth-token-error"
                      className="mt-2 font-body text-sm font-bold text-red-500"
                      initial={reduceMotion ? false : { opacity: 0, y: -4 }}
                      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                      exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                      {otpError}
                    </motion.p>
                  ) : null}
                </AnimatePresence>
              </fieldset>

              <motion.button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex min-h-14 w-full items-center justify-center bg-primary px-5 py-4 font-body text-base font-bold text-white transition-all duration-200 ease-in-out hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-70"
                whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                animate={
                  isSubmitting && !reduceMotion
                    ? { opacity: [1, 0.6, 1] }
                    : { opacity: 1 }
                }
                transition={
                  isSubmitting && !reduceMotion
                    ? { duration: 1, repeat: Infinity, ease: "easeInOut" }
                    : { duration: 0.2 }
                }
              >
                {isSubmitting ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2
                      className="h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                    Please wait...
                  </span>
                ) : (
                  "Verify Email"
                )}
              </motion.button>
            </form>

            <p className="mt-6 font-body text-sm text-muted">
              Already verified?{" "}
              <Link
                href="/login"
                className="font-accent font-bold uppercase tracking-[0.22em] text-primary transition-all duration-200 ease-in-out hover:text-accent focus:outline-none focus-visible:text-accent"
              >
                Log in
              </Link>
            </p>
          </>
        }
      />
    </main>
  );
}

"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import AuthInput from "@/components/auth/AuthInput";
import AuthSplitLayout from "@/components/auth/AuthSplitLayout";
import { AsyncButtonContent } from "@/components/ui/async-button-content";
import { apiRequest } from "@/lib/apiRequest";
import { resolveApiError } from "@/lib/errors";

interface ForgotPasswordFormValues {
  email: string;
}

const RESEND_SECONDS = 60;

export default function ForgotPasswordPage() {
  const reduceMotion = useReducedMotion();
  const [requestedEmail, setRequestedEmail] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<ForgotPasswordFormValues>({ defaultValues: { email: "" } });

  useEffect(() => {
    if (cooldown === 0) return;
    const timer = globalThis.setInterval(
      () => setCooldown((value) => Math.max(0, value - 1)),
      1000,
    );
    return () => globalThis.clearInterval(timer);
  }, [cooldown]);

  async function requestCode(email: string): Promise<boolean> {
    setSubmitError("");
    try {
      const response = await apiRequest("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setSubmitError(
          resolveApiError(data, "A reset code could not be sent. Try again."),
        );
        return false;
      }
      setCooldown(RESEND_SECONDS);
      return true;
    } catch {
      setSubmitError("A reset code could not be sent. Try again.");
      return false;
    }
  }

  const onSubmit: SubmitHandler<ForgotPasswordFormValues> = async ({
    email,
  }) => {
    if (await requestCode(email)) setRequestedEmail(email);
  };

  function useAnotherEmail(): void {
    setRequestedEmail("");
    setCooldown(0);
    setSubmitError("");
    reset({ email: "" });
  }

  return (
    <main className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <AuthSplitLayout
        leftContent={
          <div className="max-w-lg">
            <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-accent">
              Rello account recovery
            </p>
            <h2 className="mt-5 font-display text-5xl font-bold leading-tight text-white">
              A secure way back into your account.
            </h2>
            <p className="mt-6 font-body text-lg leading-8 text-white/70">
              We use a short-lived code so your password never needs to travel
              through email.
            </p>
          </div>
        }
        rightContent={
          requestedEmail ? (
            <section aria-live="polite">
              <p className="font-accent text-xs font-bold uppercase tracking-[0.25em] text-accent">
                Password help
              </p>
              <h1 className="mt-4 font-display text-4xl font-bold leading-tight text-primary sm:text-5xl">
                Check your email
              </h1>
              <p className="mt-4 font-body leading-7 text-muted">
                If an account exists for{" "}
                <strong className="break-all text-primary">
                  {requestedEmail}
                </strong>
                , a six-digit code is on its way. It expires in 15 minutes.
              </p>
              {submitError ? (
                <p
                  role="alert"
                  className="mt-5 rounded-xl bg-red-50 p-4 font-body text-sm text-red-700"
                >
                  {submitError}
                </p>
              ) : null}
              <div className="mt-8 grid gap-3">
                <Link
                  href={`/reset-password?email=${encodeURIComponent(requestedEmail)}`}
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-6 py-3 font-body font-bold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  Enter the code
                </Link>
                <button
                  type="button"
                  disabled={cooldown > 0}
                  onClick={() => void requestCode(requestedEmail)}
                  className="min-h-12 rounded-full border border-primary px-6 py-3 font-body font-bold text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {cooldown > 0
                    ? `Send another code in ${cooldown}s`
                    : "Send another code"}
                </button>
                <button
                  type="button"
                  onClick={useAnotherEmail}
                  className="min-h-11 font-body text-sm font-medium text-muted underline-offset-4 hover:text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  Use another email
                </button>
              </div>
            </section>
          ) : (
            <>
              <p className="font-accent text-xs font-bold uppercase tracking-[0.25em] text-accent">
                Password help
              </p>
              <h1 className="mt-4 font-display text-4xl font-bold leading-tight text-primary sm:text-5xl">
                Forgot your password?
              </h1>
              <p className="mt-4 font-body leading-7 text-muted">
                Enter your account email and we will send a six-digit reset
                code.
              </p>
              {submitError ? (
                <p
                  role="alert"
                  className="mt-5 rounded-xl bg-red-50 p-4 font-body text-sm text-red-700"
                >
                  {submitError}
                </p>
              ) : null}
              <form
                className="mt-8 grid gap-5"
                onSubmit={handleSubmit(onSubmit)}
              >
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
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  aria-busy={isSubmitting}
                  className="inline-flex min-h-14 items-center justify-center rounded-full bg-primary px-6 py-4 font-body font-bold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-70"
                  whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                >
                  <AsyncButtonContent
                    isPending={isSubmitting}
                    pendingLabel="Sending code…"
                  >
                    Send reset code
                  </AsyncButtonContent>
                </motion.button>
              </form>
              <p className="mt-6 font-body text-sm text-muted">
                Remember your password?{" "}
                <Link
                  href="/login"
                  className="font-bold text-primary underline-offset-4 hover:underline"
                >
                  Log in
                </Link>
              </p>
            </>
          )
        }
      />
    </main>
  );
}

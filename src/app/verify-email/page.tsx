"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { SubmitHandler, useForm, useWatch } from "react-hook-form";
import AuthInput from "@/components/auth/AuthInput";
import AuthSplitLayout from "@/components/auth/AuthSplitLayout";
import OtpInput from "@/components/auth/OtpInput";
import { isAccountRole } from "@/components/auth/RoleGuard";
import { AsyncButtonContent } from "@/components/ui/async-button-content";
import { apiRequest } from "@/lib/apiRequest";
import { establishAuthentication } from "@/lib/authSession";
import { resolveApiError } from "@/lib/errors";

interface VerifyEmailFormValues {
  email: string;
}

interface AuthEnvelope {
  data?: unknown;
}

const RESEND_SECONDS = 60;

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reduceMotion = useReducedMotion();
  const [token, setToken] = useState("");
  const [tokenError, setTokenError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [editingEmail, setEditingEmail] = useState(false);
  const {
    formState: { errors, isSubmitting },
    control,
    getValues,
    handleSubmit,
    register,
    reset,
  } = useForm<VerifyEmailFormValues>({ defaultValues: { email: "" } });
  const destinationEmail = useWatch({ control, name: "email" });

  useEffect(() => {
    reset({ email: searchParams.get("email") ?? "" });
  }, [reset, searchParams]);

  useEffect(() => {
    if (cooldown === 0) return;
    const timer = globalThis.setInterval(
      () => setCooldown((value) => Math.max(0, value - 1)),
      1000,
    );
    return () => globalThis.clearInterval(timer);
  }, [cooldown]);

  const onSubmit: SubmitHandler<VerifyEmailFormValues> = async ({ email }) => {
    setSubmitError("");
    if (!/^\d{6}$/.test(token)) {
      setTokenError("Enter the complete six-digit verification code");
      return;
    }
    try {
      const response = await apiRequest("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token }),
      });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setSubmitError(
          resolveApiError(data, "That code is invalid or has expired."),
        );
        return;
      }
      const session =
        data !== null && typeof data === "object" && "data" in data
          ? (data as AuthEnvelope).data
          : null;
      if (
        session !== null &&
        typeof session === "object" &&
        "role" in session &&
        isAccountRole(session.role) &&
        establishAuthentication(session)
      ) {
        const role = session.role.toUpperCase();
        router.replace(
          role === "TENANT"
            ? "/tenant/browse"
            : `/${role.toLowerCase()}/dashboard`,
        );
        return;
      }
      router.replace("/login?message=Email%20verified");
    } catch {
      setSubmitError("Email verification could not be completed. Try again.");
    }
  };

  async function resend(): Promise<void> {
    const email = getValues("email");
    if (!email) {
      setEditingEmail(true);
      setSubmitError("Enter your email address first.");
      return;
    }
    setIsResending(true);
    setSubmitError("");
    try {
      const response = await apiRequest("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setSubmitError(resolveApiError(data, "A new code could not be sent."));
        return;
      }
      setToken("");
      setTokenError("");
      setCooldown(RESEND_SECONDS);
    } catch {
      setSubmitError("A new code could not be sent. Try again.");
    } finally {
      setIsResending(false);
    }
  }

  return (
    <AuthSplitLayout
      leftContent={
        <div className="max-w-lg">
          <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-accent">
            One final step
          </p>
          <h2 className="mt-5 font-display text-5xl font-bold leading-tight text-white">
            Confirm the email behind your Rello account.
          </h2>
          <p className="mt-6 font-body text-lg leading-8 text-white/70">
            Verification keeps account notifications and rental activity tied to
            the right person.
          </p>
        </div>
      }
      rightContent={
        <>
          <p className="font-accent text-xs font-bold uppercase tracking-[0.25em] text-accent">
            Verify email
          </p>
          <h1 className="mt-4 font-display text-4xl font-bold leading-tight text-primary sm:text-5xl">
            Activate your account
          </h1>
          <p className="mt-4 font-body leading-7 text-muted">
            Enter the six-digit code sent to{" "}
            <strong className="break-all text-primary">
              {destinationEmail || "your email"}
            </strong>
            . It expires in one hour.
          </p>
          <form className="mt-8 grid gap-5" onSubmit={handleSubmit(onSubmit)}>
            {editingEmail || !destinationEmail ? (
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
            ) : (
              <input type="hidden" {...register("email")} />
            )}
            {!editingEmail && destinationEmail ? (
              <button
                type="button"
                onClick={() => setEditingEmail(true)}
                className="min-h-11 justify-self-start font-body text-sm font-bold text-primary underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Change email
              </button>
            ) : null}
            <OtpInput
              id="verification-code"
              label="Verification code"
              value={token}
              error={tokenError}
              onChange={(value) => {
                setToken(value);
                setTokenError("");
              }}
            />
            {submitError ? (
              <p
                role="alert"
                className="rounded-xl bg-red-50 p-4 font-body text-sm text-red-700"
              >
                {submitError}
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => void resend()}
              disabled={isResending || cooldown > 0}
              className="min-h-11 justify-self-start font-body text-sm font-bold text-muted underline-offset-4 hover:text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-60"
            >
              <AsyncButtonContent
                isPending={isResending}
                pendingLabel="Sending code…"
              >
                {cooldown > 0
                  ? `Send another code in ${cooldown}s`
                  : "Send another code"}
              </AsyncButtonContent>
            </button>
            <motion.button
              type="submit"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
              className="inline-flex min-h-14 items-center justify-center rounded-full bg-primary px-6 py-4 font-body font-bold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-70"
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
            >
              <AsyncButtonContent
                isPending={isSubmitting}
                pendingLabel="Verifying email…"
              >
                Verify email
              </AsyncButtonContent>
            </motion.button>
          </form>
          <p className="mt-6 font-body text-sm text-muted">
            Already verified?{" "}
            <Link
              href="/login"
              className="font-bold text-primary underline-offset-4 hover:underline"
            >
              Log in
            </Link>
          </p>
        </>
      }
    />
  );
}

export default function VerifyEmailPage() {
  return (
    <main className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <Suspense
        fallback={
          <div className="min-h-screen animate-pulse bg-[var(--color-bg)]" />
        }
      >
        <VerifyEmailForm />
      </Suspense>
    </main>
  );
}

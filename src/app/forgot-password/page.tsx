"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import AuthBanner from "@/components/auth/AuthBanner";
import AuthInput from "@/components/auth/AuthInput";
import AuthSplitLayout from "@/components/auth/AuthSplitLayout";
import { useToast } from "@/components/ui/toast";
import { resolveApiError } from "@/lib/errors";

interface ForgotPasswordFormValues {
  email: string;
}

interface ApiEnvelope<TData> {
  success: boolean;
  message: string;
  data: TData;
}

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

export default function ForgotPasswordPage() {
  const reduceMotion = useReducedMotion();
  const { notify } = useToast();
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [requestedEmail, setRequestedEmail] = useState("");
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<ForgotPasswordFormValues>({
    defaultValues: {
      email: "",
    },
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  });

  const onSubmit: SubmitHandler<ForgotPasswordFormValues> = async (values) => {
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data: unknown = await response.json().catch(() => null);

      if (!response.ok || (isApiEnvelope(data) && !data.success)) {
        throw new Error(resolveApiError(data, "Password reset request failed"));
      }

      const message = getApiMessage(
        data,
        "If the email exists, a reset code has been sent.",
      );

      setSuccessMessage(message);
      setRequestedEmail(values.email);
      notify({
        title: "Reset code sent",
        description: message,
        variant: "success",
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Password reset request failed";

      setErrorMessage(message);
      notify({
        title: "Reset request failed",
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
              Get back into Rello.
            </h1>
            <p className="mt-6 font-body text-lg leading-8 text-white/70">
              Request a secure 6-digit reset code and continue your search for a
              verified home.
            </p>
          </div>
        }
        rightContent={
          <>
            <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-primary">
              Password Help
            </p>
            <h1 className="mt-5 font-display text-5xl font-bold leading-[0.95] text-primary sm:text-6xl">
              Reset your password
            </h1>

            <form
              className="mt-10 grid gap-5"
              onSubmit={handleSubmit(onSubmit)}
            >
              {successMessage ? (
                <AuthBanner
                  key={successMessage}
                  message={successMessage}
                  type="success"
                />
              ) : null}

              {errorMessage ? (
                <AuthBanner
                  key={errorMessage}
                  message={errorMessage}
                  type="error"
                />
              ) : null}

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

              {successMessage ? (
                <Link
                  href={`/reset-password?email=${encodeURIComponent(requestedEmail)}`}
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-primary px-5 py-3 font-body text-sm font-medium text-primary transition-all duration-200 ease-in-out hover:bg-primary hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  Enter reset code
                </Link>
              ) : null}

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
                  "Send Reset Code"
                )}
              </motion.button>
            </form>

            <p className="mt-6 font-body text-sm text-muted">
              Remember your password?{" "}
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

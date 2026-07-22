"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import AuthBanner from "@/components/auth/AuthBanner";
import AuthInput from "@/components/auth/AuthInput";
import AuthSplitLayout from "@/components/auth/AuthSplitLayout";
import { useToast } from "@/components/ui/toast";

interface ResetPasswordFormValues {
  token: string;
  newPassword: string;
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

export default function ResetPasswordPage() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const { notify } = useToast();
  const [errorMessage, setErrorMessage] = useState("");
  const [initialToken] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return new URLSearchParams(window.location.search).get("token") ?? "";
  });
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<ResetPasswordFormValues>({
    defaultValues: {
      token: initialToken,
      newPassword: "",
    },
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  });

  const onSubmit: SubmitHandler<ResetPasswordFormValues> = async (values) => {
    setErrorMessage("");

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data: unknown = await response.json().catch(() => null);

      if (!response.ok || (isApiEnvelope(data) && !data.success)) {
        throw new Error(getApiMessage(data, "Password reset failed"));
      }

      const message = getApiMessage(data, "Password reset successfully");

      notify({
        title: "Password reset",
        description: message,
        variant: "success",
      });
      router.push(`/login?message=${encodeURIComponent(message)}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Password reset failed";

      setErrorMessage(message);
      notify({
        title: "Password reset failed",
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
              Set a new Rello password.
            </h1>
            <p className="mt-6 font-body text-lg leading-8 text-white/70">
              Use the 6-digit code from your reset email and choose a new
              password for your account.
            </p>
          </div>
        }
        rightContent={
          <>
            <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-primary">
              New Password
            </p>
            <h1 className="mt-5 font-display text-5xl font-bold leading-[0.95] text-primary sm:text-6xl">
              Reset your password
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

              <AuthInput
                label="Reset Code"
                name="token"
                type="text"
                placeholder="482915"
                autoComplete="one-time-code"
                error={errors.token?.message}
                register={register}
                rules={{ required: "Reset code is required" }}
              />

              <AuthInput
                label="New Password"
                name="newPassword"
                type="password"
                placeholder="NewSecurePassword456!"
                autoComplete="new-password"
                error={errors.newPassword?.message}
                register={register}
                rules={{ required: "New password is required" }}
                showToggle
              />

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
                {isSubmitting ? "Please wait..." : "Reset Password"}
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

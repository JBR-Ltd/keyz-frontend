"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { SubmitHandler, useForm, useWatch } from "react-hook-form";
import AuthInput from "@/components/auth/AuthInput";
import AuthSplitLayout from "@/components/auth/AuthSplitLayout";
import OtpInput from "@/components/auth/OtpInput";
import PasswordRequirements from "@/components/auth/PasswordRequirements";
import { AsyncButtonContent } from "@/components/ui/async-button-content";
import { apiRequest } from "@/lib/apiRequest";
import { resolveApiError } from "@/lib/errors";
import { validatePassword } from "@/lib/passwordPolicy";

interface ResetPasswordFormValues {
  email: string;
  newPassword: string;
  confirmPassword: string;
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reduceMotion = useReducedMotion();
  const [token, setToken] = useState("");
  const [tokenError, setTokenError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const {
    formState: { errors, isSubmitting },
    control,
    handleSubmit,
    register,
    reset,
  } = useForm<ResetPasswordFormValues>({
    defaultValues: { email: "", newPassword: "", confirmPassword: "" },
  });
  const password = useWatch({ control, name: "newPassword" });

  useEffect(() => {
    reset({
      email: searchParams.get("email") ?? "",
      newPassword: "",
      confirmPassword: "",
    });
  }, [reset, searchParams]);

  const onSubmit: SubmitHandler<ResetPasswordFormValues> = async (values) => {
    setSubmitError("");
    if (!/^\d{6}$/.test(token)) {
      setTokenError("Enter the complete six-digit reset code");
      return;
    }
    try {
      const response = await apiRequest("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: values.email,
          token,
          newPassword: values.newPassword,
        }),
      });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setSubmitError(
          resolveApiError(data, "That code is invalid or has expired."),
        );
        return;
      }
      router.replace("/login?message=Password%20reset%20successfully");
    } catch {
      setSubmitError("Password reset could not be completed. Try again.");
    }
  };

  return (
    <AuthSplitLayout
      leftContent={
        <div className="max-w-lg">
          <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-accent">
            Secure recovery
          </p>
          <h2 className="mt-5 font-display text-5xl font-bold leading-tight text-white">
            Choose a password built to last.
          </h2>
          <p className="mt-6 font-body text-lg leading-8 text-white/70">
            Your reset code is single-use and expires 15 minutes after it is
            sent.
          </p>
        </div>
      }
      rightContent={
        <>
          <p className="font-accent text-xs font-bold uppercase tracking-[0.25em] text-accent">
            New password
          </p>
          <h1 className="mt-4 font-display text-4xl font-bold leading-tight text-primary sm:text-5xl">
            Reset your password
          </h1>
          <p className="mt-4 font-body leading-7 text-muted">
            Enter the email and code from your recovery message.
          </p>
          {submitError ? (
            <div
              role="alert"
              className="mt-5 rounded-xl bg-red-50 p-4 font-body text-sm text-red-700"
            >
              <p>{submitError}</p>
              <Link
                href="/forgot-password"
                className="mt-2 inline-flex min-h-11 items-center font-bold underline"
              >
                Request another code
              </Link>
            </div>
          ) : null}
          <form className="mt-8 grid gap-5" onSubmit={handleSubmit(onSubmit)}>
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
            <OtpInput
              id="reset-code"
              label="Reset code"
              value={token}
              error={tokenError}
              onChange={(value) => {
                setToken(value);
                setTokenError("");
              }}
            />
            <AuthInput
              label="New password"
              name="newPassword"
              type="password"
              placeholder="Enter a new password"
              autoComplete="new-password"
              error={errors.newPassword?.message}
              register={register}
              rules={{
                required: "New password is required",
                validate: validatePassword,
              }}
              showToggle
            />
            <PasswordRequirements password={password} />
            <AuthInput
              label="Confirm password"
              name="confirmPassword"
              type="password"
              placeholder="Enter it again"
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              register={register}
              rules={{
                required: "Confirm your new password",
                validate: (value, form) =>
                  value === form.newPassword || "Passwords do not match",
              }}
              showToggle
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
                pendingLabel="Resetting password…"
              >
                Reset password
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
      }
    />
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <Suspense
        fallback={
          <div className="min-h-screen animate-pulse bg-[var(--color-bg)]" />
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}

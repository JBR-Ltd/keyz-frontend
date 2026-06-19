"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import AuthBanner from "@/components/auth/AuthBanner";
import AuthInput from "@/components/auth/AuthInput";
import AuthSplitLayout from "@/components/auth/AuthSplitLayout";
import { useToast } from "@/components/ui/toast";

type UserRole = "LANDLORD" | "AGENT" | "TENANT";

const VERIFY_EMAIL_STORAGE_KEY = "rello_verify_email";

interface RegisterFormValues {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
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

function createDeviceFingerprint(): string {
  if (typeof window === "undefined") {
    return "rello-server";
  }

  const source = [
    window.navigator.userAgent,
    window.navigator.language,
    window.screen.width,
    window.screen.height,
    window.screen.colorDepth,
    window.devicePixelRatio,
  ].join("|");

  let hash = 0;

  for (let index = 0; index < source.length; index += 1) {
    hash = (hash << 5) - hash + source.charCodeAt(index);
    hash |= 0;
  }

  return `rello-${Math.abs(hash).toString(36)}`;
}

export default function RegisterPage() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const { notify } = useToast();
  const [bannerMessage, setBannerMessage] = useState("");
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<RegisterFormValues>({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      role: "LANDLORD",
    },
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  });

  const onSubmit: SubmitHandler<RegisterFormValues> = async (values) => {
    setBannerMessage("");

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Device-Fingerprint": createDeviceFingerprint(),
        },
        body: JSON.stringify(values),
      });

      const data: unknown = await response.json().catch(() => null);

      if (!response.ok || (isApiEnvelope(data) && !data.success)) {
        throw new Error(getApiMessage(data, "Registration failed"));
      }

      sessionStorage.setItem(VERIFY_EMAIL_STORAGE_KEY, values.email);
      router.push(`/verify-email?email=${encodeURIComponent(values.email)}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Registration failed";

      setBannerMessage(message);
      notify({
        title: "Registration failed",
        description: message,
        variant: "error",
      });
    }
  };

  return (
    <main className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <AuthSplitLayout
        showWatermark
        leftContent={
          <div className="max-w-xl">
            <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-accent">
              Rello
            </p>
            <h1 className="mt-5 font-display text-6xl font-bold leading-[0.92] text-white">
              Find your next home with Rello.
            </h1>
            <p className="mt-6 font-body text-lg leading-8 text-white/70">
              Verified rentals, clear costs, and confident moves across
              Nigerian cities.
            </p>
          </div>
        }
        rightContent={
          <>
            <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-accent">
              Get Started
            </p>
            <h1 className="mt-5 font-display text-5xl font-bold leading-[0.95] text-primary sm:text-6xl">
              Create your account
            </h1>

            <form className="mt-10 grid gap-5" onSubmit={handleSubmit(onSubmit)}>
              {bannerMessage ? (
                <AuthBanner
                  key={bannerMessage}
                  message={bannerMessage}
                  type="error"
                />
              ) : null}

              <AuthInput
                label="First Name"
                name="firstName"
                type="text"
                placeholder="Tunde"
                autoComplete="given-name"
                error={errors.firstName?.message}
                register={register}
                rules={{ required: "First name is required" }}
              />

              <AuthInput
                label="Last Name"
                name="lastName"
                type="text"
                placeholder="Musa"
                autoComplete="family-name"
                error={errors.lastName?.message}
                register={register}
                rules={{ required: "Last name is required" }}
              />

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

              <AuthInput
                label="Password"
                name="password"
                type="password"
                placeholder="SecurePassword123!"
                autoComplete="new-password"
                error={errors.password?.message}
                register={register}
                rules={{ required: "Password is required" }}
                showToggle
              />

              <label className="block" htmlFor="auth-role">
                <span className="font-body text-sm font-bold text-primary">
                  Role
                </span>
                <select
                  id="auth-role"
                  aria-invalid={errors.role ? "true" : "false"}
                  aria-describedby={errors.role ? "auth-role-error" : undefined}
                  className="mt-2 min-h-14 w-full border border-surface bg-[var(--color-bg)] px-4 py-3 font-body text-base text-[var(--color-text)] outline-none transition-all duration-200 ease-in-out focus:border-primary focus:ring-2 focus:ring-accent/30"
                  {...register("role", { required: "Role is required" })}
                >
                  <option value="LANDLORD">Landlord</option>
                  <option value="AGENT">Agent</option>
                  <option value="TENANT">Tenant</option>
                </select>
                <AnimatePresence>
                  {errors.role?.message ? (
                    <motion.p
                      id="auth-role-error"
                      className="mt-2 font-body text-sm font-bold text-red-500"
                      initial={reduceMotion ? false : { opacity: 0, y: -4 }}
                      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                      exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                      {errors.role.message}
                    </motion.p>
                  ) : null}
                </AnimatePresence>
              </label>

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
                {isSubmitting ? "Please wait..." : "Create Account"}
              </motion.button>
            </form>

            <p className="mt-6 font-body text-sm text-muted">
              Already have an account?{" "}
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

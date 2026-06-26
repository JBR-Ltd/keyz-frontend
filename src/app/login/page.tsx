"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import AuthBanner from "@/components/auth/AuthBanner";
import AuthInput from "@/components/auth/AuthInput";
import { isAccountRole } from "@/components/auth/RoleGuard";
import AuthSplitLayout from "@/components/auth/AuthSplitLayout";
import { useToast } from "@/components/ui/toast";

interface LoginFormValues {
  email: string;
  password: string;
}

interface LoginResponseData {
  accessToken: string;
  role: unknown;
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

function isLoginData(value: unknown): value is LoginResponseData {
  return (
    value !== null &&
    typeof value === "object" &&
    "accessToken" in value &&
    typeof value.accessToken === "string" &&
    "role" in value
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

export default function LoginPage() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const { notify } = useToast();
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return new URLSearchParams(window.location.search).get("message") ?? "";
  });
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  });

  useEffect(() => {
    if (successMessage) {
      notify({
        title: "Success",
        description: successMessage,
        variant: "success",
      });
      window.history.replaceState(null, "", "/login");
    }
  }, [notify, successMessage]);

  const onSubmit: SubmitHandler<LoginFormValues> = async (values) => {
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Device-Fingerprint": createDeviceFingerprint(),
        },
        body: JSON.stringify(values),
      });

      const data: unknown = await response.json().catch(() => null);

      if (!response.ok || (isApiEnvelope(data) && !data.success)) {
        throw new Error(getApiMessage(data, "Login failed"));
      }

      if (isApiEnvelope(data) && isLoginData(data.data)) {
        if (!isAccountRole(data.data.role)) {
          throw new Error(
            "Unable to determine account type, please contact support",
          );
        }

        const role = data.data.role.toUpperCase();
        const rolePath = role.toLowerCase();

        localStorage.setItem("rello_token", data.data.accessToken);
        localStorage.setItem("rello_role", role);
        notify({
          title: "Logged in",
          description: getApiMessage(data, "Login successful"),
          variant: "success",
        });
        router.replace(`/${rolePath}/dashboard`);
        return;
      }

      throw new Error(
        isApiEnvelope(data) && data.success
          ? "Unable to determine account type, please contact support"
          : getApiMessage(data, "Login failed"),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed";

      setErrorMessage(message);
      notify({
        title: "Login failed",
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
              Come home to Rello.
            </h1>
            <p className="mt-6 font-body text-lg leading-8 text-white/70">
              Continue your search with verified homes and cleaner rental
              decisions.
            </p>
          </div>
        }
        rightContent={
          <>
            <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-accent">
              Welcome Back
            </p>
            <h1 className="mt-5 font-display text-5xl font-bold leading-[0.95] text-primary sm:text-6xl">
              Log in to your account
            </h1>

            <form className="mt-10 grid gap-5" onSubmit={handleSubmit(onSubmit)}>
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

              <AuthInput
                label="Password"
                name="password"
                type="password"
                placeholder="SecurePassword123!"
                autoComplete="current-password"
                error={errors.password?.message}
                register={register}
                rules={{ required: "Password is required" }}
                showToggle
              />

              <div className="-mt-2 flex justify-end">
                <Link
                  href="/forgot-password"
                  className="font-accent text-xs font-bold uppercase tracking-[0.22em] text-primary transition-all duration-200 ease-in-out hover:text-accent focus:outline-none focus-visible:text-accent"
                >
                  Forgot password?
                </Link>
              </div>

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
                {isSubmitting ? "Please wait..." : "Log In"}
              </motion.button>
            </form>

            <p className="mt-6 font-body text-sm text-muted">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-accent font-bold uppercase tracking-[0.22em] text-primary transition-all duration-200 ease-in-out hover:text-accent focus:outline-none focus-visible:text-accent"
              >
                Register
              </Link>
            </p>
          </>
        }
      />
    </main>
  );
}

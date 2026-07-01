"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { EyeIcon, EyeOffIcon, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { isAccountRole } from "@/components/auth/RoleGuard";
import { useToast } from "@/components/ui/toast";

const loginPhotoUrl =
  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&h=1400&fit=crop&auto=format&q=80";

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
  const [showPassword, setShowPassword] = useState(false);
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
  const fieldInitial = reduceMotion ? false : { opacity: 0, y: 16 };
  const fieldAnimate = reduceMotion ? undefined : { opacity: 1, y: 0 };

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
    <main className="min-h-screen bg-bg text-[var(--color-text)]">
      <section className="grid min-h-screen lg:grid-cols-[55fr_45fr]">
        <motion.div
          className="relative hidden min-h-screen overflow-hidden bg-primary lg:block"
          initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
          animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <Image
            src={loginPhotoUrl}
            alt="Premium Nigerian apartment interior"
            fill
            priority
            style={{ objectFit: "cover" }}
            sizes="(max-width: 1024px) 0vw, 55vw"
          />
          <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-primary/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          <div className="absolute bottom-0 left-0 max-w-sm p-10">
            <h2 className="font-display text-3xl font-bold text-white">
              Welcome back.
            </h2>
            <p className="mt-2 max-w-xs font-body text-sm leading-6 text-white/80">
              Your next home is one search away.
            </p>
          </div>
        </motion.div>

        <div className="flex min-h-screen items-center bg-bg px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
          <motion.div
            className="mx-auto w-full max-w-md"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={reduceMotion ? undefined : { opacity: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <motion.div
              className="mb-8 lg:hidden"
              initial={fieldInitial}
              animate={fieldAnimate}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <h1 className="font-display text-2xl font-bold text-primary">
                Welcome back.
              </h1>
              <p className="mt-2 font-body text-sm leading-6 text-muted">
                Your next home is one search away.
              </p>
            </motion.div>

            <motion.p
              className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-accent"
              initial={fieldInitial}
              animate={fieldAnimate}
              transition={{ duration: 0.4, delay: 0.08, ease: "easeOut" }}
            >
              Welcome Back
            </motion.p>
            <motion.h1
              className="mt-2 font-display text-3xl font-bold text-primary"
              initial={fieldInitial}
              animate={fieldAnimate}
              transition={{ duration: 0.4, delay: 0.16, ease: "easeOut" }}
            >
              Log in to your account
            </motion.h1>
            <motion.p
              className="mt-2 font-body text-sm text-muted"
              initial={fieldInitial}
              animate={fieldAnimate}
              transition={{ duration: 0.4, delay: 0.24, ease: "easeOut" }}
            >
              Pick up right where you left off.
            </motion.p>

            <form className="mt-8 grid gap-5" onSubmit={handleSubmit(onSubmit)}>
              <AnimatePresence>
                {successMessage ? (
                  <motion.div
                    className="flex items-start justify-between gap-4 rounded-lg border-l-4 border-accent bg-accent/10 p-4 font-body text-sm font-medium text-primary"
                    initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                    animate={reduceMotion ? undefined : { height: "auto", opacity: 1 }}
                    exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    role="status"
                  >
                    <p>{successMessage}</p>
                    <button
                      type="button"
                      aria-label="Dismiss message"
                      onClick={() => setSuccessMessage("")}
                      className="flex h-6 w-6 shrink-0 items-center justify-center transition-all duration-200 ease-in-out hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      <X size={16} />
                    </button>
                  </motion.div>
                ) : null}
              </AnimatePresence>

              <AnimatePresence>
                {errorMessage ? (
                  <motion.div
                    className="flex items-start justify-between gap-4 rounded-lg border-l-4 border-red-500 bg-red-500/10 p-4 font-body text-sm font-medium text-red-500"
                    initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                    animate={reduceMotion ? undefined : { height: "auto", opacity: 1 }}
                    exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    role="alert"
                  >
                    <p>{errorMessage}</p>
                    <button
                      type="button"
                      aria-label="Dismiss message"
                      onClick={() => setErrorMessage("")}
                      className="flex h-6 w-6 shrink-0 items-center justify-center transition-all duration-200 ease-in-out hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      <X size={16} />
                    </button>
                  </motion.div>
                ) : null}
              </AnimatePresence>

              <motion.label
                className="block"
                htmlFor="auth-email"
                initial={fieldInitial}
                animate={fieldAnimate}
                transition={{ duration: 0.4, delay: 0.32, ease: "easeOut" }}
              >
                <span className="font-body text-sm font-medium text-primary">
                  Email
                </span>
                <input
                  id="auth-email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  aria-invalid={errors.email ? "true" : "false"}
                  aria-describedby={errors.email ? "auth-email-error" : undefined}
                  className="mt-1 min-h-14 w-full rounded-xl border border-border bg-bg px-4 py-3 font-body text-base text-[var(--color-text)] outline-none transition-all duration-200 ease-in-out placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/50"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Enter a valid email address",
                    },
                  })}
                />
                <AnimatePresence>
                  {errors.email?.message ? (
                    <motion.p
                      id="auth-email-error"
                      className="mt-2 font-body text-sm font-medium text-red-500"
                      initial={reduceMotion ? false : { opacity: 0, y: -4 }}
                      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                      exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                      {errors.email.message}
                    </motion.p>
                  ) : null}
                </AnimatePresence>
              </motion.label>

              <motion.label
                className="block"
                htmlFor="auth-password"
                initial={fieldInitial}
                animate={fieldAnimate}
                transition={{ duration: 0.4, delay: 0.4, ease: "easeOut" }}
              >
                <span className="font-body text-sm font-medium text-primary">
                  Password
                </span>
                <span className="relative mt-1 block">
                  <input
                    id="auth-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="SecurePassword123!"
                    autoComplete="current-password"
                    aria-invalid={errors.password ? "true" : "false"}
                    aria-describedby={errors.password ? "auth-password-error" : undefined}
                    className="min-h-14 w-full rounded-xl border border-border bg-bg px-4 py-3 pr-14 font-body text-base text-[var(--color-text)] outline-none transition-all duration-200 ease-in-out placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/50"
                    {...register("password", { required: "Password is required" })}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-muted transition-all duration-200 ease-in-out hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    {showPassword ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
                  </button>
                </span>
                <AnimatePresence>
                  {errors.password?.message ? (
                    <motion.p
                      id="auth-password-error"
                      className="mt-2 font-body text-sm font-medium text-red-500"
                      initial={reduceMotion ? false : { opacity: 0, y: -4 }}
                      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                      exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                      {errors.password.message}
                    </motion.p>
                  ) : null}
                </AnimatePresence>
              </motion.label>

              <motion.div
                className="-mt-2 flex justify-end"
                initial={fieldInitial}
                animate={fieldAnimate}
                transition={{ duration: 0.4, delay: 0.48, ease: "easeOut" }}
              >
                <Link
                  href="/forgot-password"
                  className="font-body text-sm font-medium text-accent transition-all duration-200 ease-in-out hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  Forgot password?
                </Link>
              </motion.div>

              <motion.button
                type="submit"
                disabled={isSubmitting}
                className="mt-3 inline-flex min-h-14 w-full items-center justify-center rounded-full bg-accent px-5 py-4 font-body text-base font-medium text-white transition-all duration-200 ease-in-out hover:scale-[1.01] hover:bg-accent-alt focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-70"
                initial={fieldInitial}
                animate={
                  isSubmitting && !reduceMotion
                    ? { opacity: [1, 0.7, 1], y: 0 }
                    : fieldAnimate
                }
                transition={
                  isSubmitting && !reduceMotion
                    ? { duration: 1, repeat: Infinity, ease: "easeInOut" }
                    : { duration: 0.4, delay: 0.56, ease: "easeOut" }
                }
              >
                {isSubmitting ? "Logging in..." : "Log in"}
              </motion.button>
            </form>

            <motion.p
              className="mt-6 text-center font-body text-sm text-muted"
              initial={fieldInitial}
              animate={fieldAnimate}
              transition={{ duration: 0.4, delay: 0.64, ease: "easeOut" }}
            >
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-body font-medium text-accent transition-all duration-200 ease-in-out hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Register
              </Link>
            </motion.p>
          </motion.div>
        </div>
      </section>
    </main>
  );
}

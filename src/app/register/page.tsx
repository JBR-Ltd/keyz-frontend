"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { EyeIcon, EyeOffIcon, Loader2, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import GoogleAuthButton from "@/components/auth/GoogleAuthButton";
import { useToast } from "@/components/ui/toast";
import { resolveApiError } from "@/lib/errors";

type UserRole = "LANDLORD" | "AGENT" | "TENANT";

const VERIFY_EMAIL_STORAGE_KEY = "rello_verify_email";
const registerPhotoUrl =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&h=1400&fit=crop&auto=format&q=80";

const roleOptions: Array<{
  label: string;
  value: UserRole;
  description: string;
}> = [
  {
    label: "Tenant",
    value: "TENANT",
    description: "Find verified homes to rent without agent stress.",
  },
  {
    label: "Landlord",
    value: "LANDLORD",
    description: "List and manage rental properties for verified tenants.",
  },
  {
    label: "Agent",
    value: "AGENT",
    description:
      "List and manage properties. Verified agents connect tenants with quality homes.",
  },
];

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
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>("LANDLORD");
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setValue,
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
  const fieldInitial = reduceMotion ? false : { opacity: 0, y: 16 };
  const fieldAnimate = reduceMotion ? undefined : { opacity: 1, y: 0 };
  const selectedRoleDescription =
    roleOptions.find((role) => role.value === selectedRole)?.description ?? "";

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
        throw new Error(resolveApiError(data, "Registration failed"));
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
    <main className="min-h-screen bg-bg text-[var(--color-text)]">
      <section className="grid min-h-screen lg:grid-cols-[55fr_45fr]">
        <motion.div
          className="relative hidden min-h-screen overflow-hidden bg-primary lg:block"
          initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
          animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <Image
            src={registerPhotoUrl}
            alt="Modern Nigerian rental home exterior"
            fill
            priority
            style={{ objectFit: "cover" }}
            sizes="(max-width: 1024px) 0vw, 55vw"
          />
          <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-primary/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          <div className="absolute bottom-0 left-0 max-w-sm p-10">
            <h2 className="font-display text-3xl font-bold text-white">
              Start your search.
            </h2>
            <p className="mt-2 max-w-xs font-body text-sm leading-6 text-white/80">
              Join thousands of Nigerians finding verified homes without the
              stress.
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
                Start your search.
              </h1>
              <p className="mt-2 font-body text-sm leading-6 text-muted">
                Join thousands of Nigerians finding verified homes without the
                stress.
              </p>
            </motion.div>

            <motion.p
              className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-primary"
              initial={fieldInitial}
              animate={fieldAnimate}
              transition={{ duration: 0.4, delay: 0.08, ease: "easeOut" }}
            >
              Get Started
            </motion.p>
            <motion.h1
              className="mt-2 font-display text-3xl font-bold text-primary"
              initial={fieldInitial}
              animate={fieldAnimate}
              transition={{ duration: 0.4, delay: 0.16, ease: "easeOut" }}
            >
              Create your account
            </motion.h1>
            <motion.p
              className="mt-2 font-body text-sm text-muted"
              initial={fieldInitial}
              animate={fieldAnimate}
              transition={{ duration: 0.4, delay: 0.24, ease: "easeOut" }}
            >
              Free to join. No credit card required.
            </motion.p>

            <form className="mt-8 grid gap-5" onSubmit={handleSubmit(onSubmit)}>
              <AnimatePresence>
                {bannerMessage ? (
                  <motion.div
                    className="flex items-start justify-between gap-4 rounded-lg border-l-4 border-red-500 bg-red-500/10 p-4 font-body text-sm font-medium text-red-500"
                    initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                    animate={
                      reduceMotion ? undefined : { height: "auto", opacity: 1 }
                    }
                    exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    role="alert"
                  >
                    <p>{bannerMessage}</p>
                    <button
                      type="button"
                      aria-label="Dismiss message"
                      onClick={() => setBannerMessage("")}
                      className="flex h-6 w-6 shrink-0 items-center justify-center transition-all duration-200 ease-in-out hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      <X size={16} />
                    </button>
                  </motion.div>
                ) : null}
              </AnimatePresence>

              <motion.label
                className="block"
                htmlFor="auth-firstName"
                initial={fieldInitial}
                animate={fieldAnimate}
                transition={{ duration: 0.4, delay: 0.32, ease: "easeOut" }}
              >
                <span className="font-body text-sm font-medium text-primary">
                  First Name
                </span>
                <input
                  id="auth-firstName"
                  type="text"
                  placeholder="Tunde"
                  autoComplete="given-name"
                  aria-invalid={errors.firstName ? "true" : "false"}
                  aria-describedby={
                    errors.firstName ? "auth-firstName-error" : undefined
                  }
                  className="mt-1 min-h-14 w-full rounded-xl border border-border bg-bg px-4 py-3 font-body text-base text-[var(--color-text)] outline-none transition-all duration-200 ease-in-out placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/50"
                  {...register("firstName", {
                    required: "First name is required",
                  })}
                />
                <AnimatePresence>
                  {errors.firstName?.message ? (
                    <motion.p
                      id="auth-firstName-error"
                      className="mt-2 font-body text-sm font-medium text-red-500"
                      initial={reduceMotion ? false : { opacity: 0, y: -4 }}
                      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                      exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                      {errors.firstName.message}
                    </motion.p>
                  ) : null}
                </AnimatePresence>
              </motion.label>

              <motion.label
                className="block"
                htmlFor="auth-lastName"
                initial={fieldInitial}
                animate={fieldAnimate}
                transition={{ duration: 0.4, delay: 0.4, ease: "easeOut" }}
              >
                <span className="font-body text-sm font-medium text-primary">
                  Last Name
                </span>
                <input
                  id="auth-lastName"
                  type="text"
                  placeholder="Musa"
                  autoComplete="family-name"
                  aria-invalid={errors.lastName ? "true" : "false"}
                  aria-describedby={
                    errors.lastName ? "auth-lastName-error" : undefined
                  }
                  className="mt-1 min-h-14 w-full rounded-xl border border-border bg-bg px-4 py-3 font-body text-base text-[var(--color-text)] outline-none transition-all duration-200 ease-in-out placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/50"
                  {...register("lastName", {
                    required: "Last name is required",
                  })}
                />
                <AnimatePresence>
                  {errors.lastName?.message ? (
                    <motion.p
                      id="auth-lastName-error"
                      className="mt-2 font-body text-sm font-medium text-red-500"
                      initial={reduceMotion ? false : { opacity: 0, y: -4 }}
                      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                      exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                      {errors.lastName.message}
                    </motion.p>
                  ) : null}
                </AnimatePresence>
              </motion.label>

              <motion.label
                className="block"
                htmlFor="auth-email"
                initial={fieldInitial}
                animate={fieldAnimate}
                transition={{ duration: 0.4, delay: 0.48, ease: "easeOut" }}
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
                  aria-describedby={
                    errors.email ? "auth-email-error" : undefined
                  }
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
                transition={{ duration: 0.4, delay: 0.56, ease: "easeOut" }}
              >
                <span className="font-body text-sm font-medium text-primary">
                  Password
                </span>
                <span className="relative mt-1 block">
                  <input
                    id="auth-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="SecurePassword123!"
                    autoComplete="new-password"
                    aria-invalid={errors.password ? "true" : "false"}
                    aria-describedby={
                      errors.password ? "auth-password-error" : undefined
                    }
                    className="min-h-14 w-full rounded-xl border border-border bg-bg px-4 py-3 pr-14 font-body text-base text-[var(--color-text)] outline-none transition-all duration-200 ease-in-out placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/50"
                    {...register("password", {
                      required: "Password is required",
                    })}
                  />
                  <button
                    type="button"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-muted transition-all duration-200 ease-in-out hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    {showPassword ? (
                      <EyeOffIcon size={20} />
                    ) : (
                      <EyeIcon size={20} />
                    )}
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
                initial={fieldInitial}
                animate={fieldAnimate}
                transition={{ duration: 0.4, delay: 0.64, ease: "easeOut" }}
              >
                <input
                  type="hidden"
                  {...register("role", { required: "Role is required" })}
                />
                <p className="font-body text-sm font-medium text-primary">
                  Role
                </p>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {roleOptions.map((role) => {
                    const selected = selectedRole === role.value;

                    return (
                      <button
                        key={role.value}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => {
                          setSelectedRole(role.value);
                          setValue("role", role.value, {
                            shouldValidate: true,
                          });
                        }}
                        className={`min-h-11 rounded-full px-3 py-2 font-body text-sm font-medium transition-all duration-150 ease-in-out hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                          selected
                            ? "bg-primary text-white"
                            : "border border-border text-muted hover:border-accent hover:text-primary"
                        }`}
                      >
                        {role.label}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-3 font-body text-sm leading-6 text-muted">
                  {selectedRoleDescription}
                </p>
                <AnimatePresence>
                  {errors.role?.message ? (
                    <motion.p
                      id="auth-role-error"
                      className="mt-2 font-body text-sm font-medium text-red-500"
                      initial={reduceMotion ? false : { opacity: 0, y: -4 }}
                      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                      exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                      {errors.role.message}
                    </motion.p>
                  ) : null}
                </AnimatePresence>
              </motion.div>

              <motion.button
                type="submit"
                disabled={isSubmitting}
                className="mt-3 inline-flex min-h-14 w-full items-center justify-center rounded-full bg-accent px-5 py-4 font-body text-base font-medium text-primary transition-all duration-200 ease-in-out hover:scale-[1.01] hover:bg-primary hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-70"
                initial={fieldInitial}
                animate={
                  isSubmitting && !reduceMotion
                    ? { opacity: [1, 0.7, 1], y: 0 }
                    : fieldAnimate
                }
                transition={
                  isSubmitting && !reduceMotion
                    ? { duration: 1, repeat: Infinity, ease: "easeInOut" }
                    : { duration: 0.4, delay: 0.72, ease: "easeOut" }
                }
              >
                {isSubmitting ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2
                      className="h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                    Creating account...
                  </span>
                ) : (
                  "Create account"
                )}
              </motion.button>
            </form>

            <div className="mt-6 flex items-center gap-4">
              <span className="h-px flex-1 bg-border" />
              <span className="font-accent text-xs font-bold uppercase tracking-[0.22em] text-muted">
                or
              </span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <div className="mt-6">
              {/* Role is already chosen above, so Google sign-up always has one to send */}
              <GoogleAuthButton
                label="Sign up with Google"
                role={selectedRole}
              />
            </div>

            <p className="mt-3 text-center font-body text-xs text-muted">
              You are signing up as a {selectedRole.toLowerCase()}.
            </p>

            <motion.p
              className="mt-6 text-center font-body text-sm text-muted"
              initial={fieldInitial}
              animate={fieldAnimate}
              transition={{ duration: 0.4, delay: 0.8, ease: "easeOut" }}
            >
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-body font-medium text-primary transition-all duration-200 ease-in-out hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Log in
              </Link>
            </motion.p>
          </motion.div>
        </div>
      </section>
    </main>
  );
}

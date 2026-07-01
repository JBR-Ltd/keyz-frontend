"use client";

import type { FormEvent, ReactElement } from "react";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check, CheckCircle2, ShieldCheck } from "lucide-react";
import { useToast } from "@/components/ui/toast";

type FormStatus = "idle" | "submitting" | "success" | "error";

const trustPoints = [
  { label: "Verified listings only", Icon: ShieldCheck },
  { label: "Zero agent fees", Icon: Check },
  { label: "Secure escrow protection", Icon: ShieldCheck },
];

function getResponseMessage(value: unknown): string | null {
  if (!value || typeof value !== "object" || !("message" in value)) {
    return null;
  }

  const message = value.message;

  return typeof message === "string" ? message : null;
}

function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const firstName = parts[0] ?? "";
  const lastName = parts.slice(1).join(" ") || "Not provided";

  return { firstName, lastName };
}

export default function WaitlistPage(): ReactElement {
  const [status, setStatus] = useState<FormStatus>("idle");
  const [message, setMessage] = useState("");
  const reduceMotion = useReducedMotion();
  const { notify } = useToast();

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const form = event.currentTarget;
    setStatus("submitting");
    setMessage("");

    const formData = new FormData(form);
    const { firstName, lastName } = splitFullName(String(formData.get("fullName") ?? ""));
    const payload = {
      firstName,
      lastName,
      email: String(formData.get("email") ?? ""),
      phone: "Not provided",
      city: String(formData.get("city") ?? ""),
    };

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          getResponseMessage(data) ?? "We could not join the waitlist right now.",
        );
      }

      setStatus("success");
      setMessage("We'll be in touch when we launch in your city.");
      notify({
        title: "Joined the waitlist",
        description: "We'll be in touch when we launch in your city.",
        variant: "success",
      });
      form.reset();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "We could not join the waitlist right now.";

      setStatus("error");
      setMessage(errorMessage);
      notify({
        title: "Could not join waitlist",
        description: errorMessage,
        variant: "error",
      });
    }
  }

  return (
    <main className="min-h-screen bg-[var(--color-bg)] text-primary">
      <section className="grid min-h-screen lg:grid-cols-2">
        <div className="flex flex-col justify-center bg-primary px-6 py-16 pt-28 sm:px-10 lg:p-16">
          <motion.div
            className="max-w-md"
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <p className="font-accent text-xs font-bold uppercase tracking-widest text-accent">
              Early Access
            </p>
            <h1 className="mt-3 font-display text-4xl font-bold leading-tight text-white sm:text-5xl">
              Be first through the door.
            </h1>
            <p className="mt-4 max-w-sm font-body text-base leading-7 text-white/70">
              Join thousands of Nigerians finding verified homes without the stress. Get early access before we launch.
            </p>
            <div className="mt-8 grid gap-4">
              {trustPoints.map(({ label, Icon }) => (
                <div key={label} className="flex items-center gap-3 font-body text-sm text-white/80">
                  <Icon size={18} className="text-accent" aria-hidden="true" />
                  {label}
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="flex flex-col justify-center bg-[var(--color-bg)] px-6 py-16 sm:px-10 lg:p-16">
          <motion.div
            className="mx-auto w-full max-w-lg"
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
          >
            {status === "success" ? (
              <motion.div
                className="flex min-h-[24rem] flex-col items-center justify-center text-center"
                initial={reduceMotion ? false : { opacity: 0, scale: 0.8 }}
                animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                role="status"
              >
                <CheckCircle2 className="h-16 w-16 text-accent" aria-hidden="true" />
                <h2 className="mt-4 font-display text-2xl font-bold text-primary">
                  You&apos;re on the list!
                </h2>
                <p className="mt-2 max-w-xs font-body text-sm leading-6 text-muted">
                  {message || "We'll be in touch when we launch in your city."}
                </p>
              </motion.div>
            ) : (
              <>
                <h2 className="font-display text-3xl font-bold text-primary">Join the waitlist</h2>
                <p className="mb-8 mt-2 font-body text-sm text-muted">
                  We&apos;ll notify you the moment we launch in your city.
                </p>

                <form className="grid gap-6" onSubmit={handleSubmit}>
                  <label className="block">
                    <span className="mb-1 block font-body text-sm font-medium text-primary">Full Name</span>
                    <input
                      type="text"
                      name="fullName"
                      placeholder="Tunde Musa"
                      autoComplete="name"
                      required
                      className="w-full rounded-xl border border-surface bg-[var(--color-bg)] px-4 py-3 font-body text-base text-primary outline-none transition-all duration-200 ease-in-out placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-accent)_50%,transparent)]"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1 block font-body text-sm font-medium text-primary">Email Address</span>
                    <input
                      type="email"
                      name="email"
                      placeholder="you@example.com"
                      autoComplete="email"
                      required
                      className="w-full rounded-xl border border-surface bg-[var(--color-bg)] px-4 py-3 font-body text-base text-primary outline-none transition-all duration-200 ease-in-out placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-accent)_50%,transparent)]"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1 block font-body text-sm font-medium text-primary">City</span>
                    <select
                      name="city"
                      defaultValue=""
                      required
                      className="w-full rounded-xl border border-surface bg-[var(--color-bg)] px-4 py-3 font-body text-base text-primary outline-none transition-all duration-200 ease-in-out focus:border-accent focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-accent)_50%,transparent)]"
                    >
                      <option value="" disabled>
                        Select your city
                      </option>
                      <option value="Lagos">Lagos</option>
                      <option value="Abuja">Abuja</option>
                      <option value="Port Harcourt">Port Harcourt</option>
                      <option value="Other">Other</option>
                    </select>
                  </label>

                  {status === "error" && message ? (
                    <motion.p
                      className="rounded-xl bg-[color-mix(in_srgb,var(--color-accent)_12%,var(--color-bg))] px-4 py-3 font-body text-sm font-medium text-primary"
                      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      role="status"
                    >
                      {message}
                    </motion.p>
                  ) : null}

                  <motion.button
                    type="submit"
                    disabled={status === "submitting"}
                    className="mt-2 w-full rounded-full bg-accent py-4 font-body text-base font-medium text-white transition-all duration-200 ease-in-out hover:scale-[1.01] hover:bg-accent-alt focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-70"
                    whileTap={reduceMotion ? undefined : { scale: 0.99 }}
                  >
                    {status === "submitting" ? "Joining..." : "Join the Waitlist"}
                  </motion.button>
                </form>
              </>
            )}
          </motion.div>
        </div>
      </section>

    </main>
  );
}

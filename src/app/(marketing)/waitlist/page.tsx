"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent, type ReactElement } from "react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Select, toSelectOptions } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { apiRequest } from "@/lib/apiRequest";

const cities = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
];

const roles = ["Tenant", "Agent", "Landlord"];

type FormStatus = "idle" | "submitting" | "success" | "error";

const FIELD_CLASS_NAME =
  "mt-2 min-h-12 w-full rounded-xl border border-border bg-white px-4 py-3 font-body text-base text-primary outline-none transition-colors placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-accent/35";

function getResponseMessage(value: unknown): string | null {
  if (!value || typeof value !== "object" || !("message" in value)) {
    return null;
  }

  const message = value.message;

  return typeof message === "string" ? message : null;
}

export default function WaitlistPage(): ReactElement {
  const [status, setStatus] = useState<FormStatus>("idle");
  const [message, setMessage] = useState("");
  const reduceMotion = useReducedMotion();
  const { notify } = useToast();

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    const form = event.currentTarget;
    setStatus("submitting");
    setMessage("");

    const formData = new FormData(form);
    const payload = {
      firstName: String(formData.get("firstName") ?? ""),
      lastName: String(formData.get("lastName") ?? ""),
      email: String(formData.get("email") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      city: String(formData.get("city") ?? ""),
      role: String(formData.get("role") ?? ""),
    };

    try {
      const response = await apiRequest("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          getResponseMessage(data) ??
            "We could not join the waitlist right now.",
        );
      }

      const successMessage =
        getResponseMessage(data) ??
        "You're on the list. We'll send city updates soon.";

      setStatus("success");
      setMessage(successMessage);
      notify({
        title: "Joined the waitlist",
        description: successMessage,
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
    <main className="min-h-screen bg-bg text-primary">
      <Navbar />

      <section className="px-5 py-8 sm:px-8 sm:py-12 lg:px-10 lg:py-16">
        <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[1.75rem] border border-border bg-white shadow-[0_24px_70px_-54px_rgba(4,52,76,0.55)] lg:grid-cols-[0.9fr_1.1fr]">
          <div className="relative min-h-[22rem] overflow-hidden sm:min-h-[28rem] lg:min-h-full">
            <Image
              src="/images/newsletter-house.jpg"
              alt="A modern home illuminated in the evening"
              fill
              priority
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="object-cover object-center"
            />
            <div
              className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,29,43,0.08),rgba(3,29,43,0.82))]"
              aria-hidden="true"
            />
            <div className="absolute inset-x-0 bottom-0 p-7 text-white sm:p-10 lg:p-12">
              <p className="font-accent text-xs font-bold uppercase tracking-[0.26em] text-accent">
                Early access
              </p>
              <h1 className="mt-4 max-w-lg font-display text-4xl font-bold leading-[0.95] sm:text-5xl lg:text-6xl">
                Be first through the door.
              </h1>
              <p className="mt-5 max-w-lg font-body text-sm leading-6 text-white/75 sm:text-base sm:leading-7">
                Join renters waiting for verified homes, clear costs, and early
                launch access in Nigerian cities.
              </p>
            </div>
          </div>

          <motion.div
            className="flex min-h-[38rem] items-center bg-bg p-6 sm:p-10 lg:p-12"
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.4, ease: "easeOut" }}
          >
            <div className="mx-auto w-full max-w-2xl">
              {status === "success" ? (
                <motion.div
                  initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                  animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                  transition={{ duration: reduceMotion ? 0 : 0.35 }}
                  role="status"
                  aria-live="polite"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-primary">
                    <Check size={26} strokeWidth={2.5} aria-hidden="true" />
                  </span>
                  <h2 className="mt-6 font-display text-4xl font-bold leading-tight text-primary sm:text-5xl">
                    You&apos;re on the list.
                  </h2>
                  <p className="mt-4 max-w-lg font-body text-base leading-7 text-muted">
                    {message}
                  </p>
                  <Link
                    href="/browse"
                    className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-primary px-6 font-body text-sm font-bold text-white transition-colors hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                  >
                    Browse available homes
                    <ArrowRight size={17} aria-hidden="true" />
                  </Link>
                </motion.div>
              ) : (
                <>
                  <p className="font-accent text-xs font-bold uppercase tracking-[0.22em] text-accent-alt">
                    Join the waitlist
                  </p>
                  <h2 className="mt-3 font-display text-3xl font-bold leading-tight text-primary sm:text-4xl">
                    Tell us where you want to move.
                  </h2>
                  <p className="mt-3 max-w-xl font-body text-sm leading-6 text-muted">
                    Share a few details so we can keep you informed about early
                    access in your city.
                  </p>

                  <form
                    className="mt-8 grid gap-x-4 gap-y-5 sm:grid-cols-2"
                    onSubmit={handleSubmit}
                    aria-busy={status === "submitting"}
                  >
                    <label className="block">
                      <span className="font-body text-sm font-bold text-primary">
                        First name
                      </span>
                      <input
                        type="text"
                        name="firstName"
                        placeholder="Tunde"
                        autoComplete="given-name"
                        required
                        className={FIELD_CLASS_NAME}
                      />
                    </label>

                    <label className="block">
                      <span className="font-body text-sm font-bold text-primary">
                        Last name
                      </span>
                      <input
                        type="text"
                        name="lastName"
                        placeholder="Musa"
                        autoComplete="family-name"
                        required
                        className={FIELD_CLASS_NAME}
                      />
                    </label>

                    <label className="block">
                      <span className="font-body text-sm font-bold text-primary">
                        Email
                      </span>
                      <input
                        type="email"
                        name="email"
                        placeholder="you@example.com"
                        autoComplete="email"
                        required
                        className={FIELD_CLASS_NAME}
                      />
                    </label>

                    <label className="block">
                      <span className="font-body text-sm font-bold text-primary">
                        Phone
                      </span>
                      <input
                        type="tel"
                        name="phone"
                        placeholder="+2341234567890"
                        autoComplete="tel"
                        required
                        className={FIELD_CLASS_NAME}
                      />
                    </label>

                    <label className="block">
                      <span className="font-body text-sm font-bold text-primary">
                        City
                      </span>
                      <input
                        list="waitlist-city-options"
                        name="city"
                        placeholder="Start typing or select a city"
                        autoComplete="address-level2"
                        required
                        className={FIELD_CLASS_NAME}
                      />
                      <datalist id="waitlist-city-options">
                        {cities.map((city) => (
                          <option key={city} value={city}>
                            {city}
                          </option>
                        ))}
                      </datalist>
                    </label>

                    <label className="block">
                      <span className="font-body text-sm font-bold text-primary">
                        Role
                      </span>
                      <Select
                        name="role"
                        required
                        ariaLabel="Role"
                        placeholder="Select your role"
                        className={FIELD_CLASS_NAME}
                        options={toSelectOptions([...roles])}
                      />
                    </label>

                    {status === "error" && message ? (
                      <motion.p
                        className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-body text-sm font-semibold text-red-700 sm:col-span-2"
                        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                        animate={
                          reduceMotion ? undefined : { opacity: 1, y: 0 }
                        }
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        role="alert"
                      >
                        {message}
                      </motion.p>
                    ) : null}

                    <motion.button
                      type="submit"
                      disabled={status === "submitting"}
                      className="inline-flex min-h-14 w-full items-center justify-center rounded-full bg-primary px-6 py-4 font-body text-base font-bold text-white transition-colors hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-65 sm:col-span-2"
                      whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                    >
                      {status === "submitting" ? (
                        <span className="inline-flex items-center gap-2">
                          <Loader2
                            className="h-4 w-4 animate-spin"
                            aria-hidden="true"
                          />
                          Joining...
                        </span>
                      ) : (
                        "Join Waitlist"
                      )}
                    </motion.button>
                  </form>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

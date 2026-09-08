"use client";

import { FormEvent, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Loader2 } from "lucide-react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Select, toSelectOptions } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";

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

const waitlistImage =
  "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1800&q=85";

type FormStatus = "idle" | "submitting" | "success" | "error";

function getResponseMessage(value: unknown): string | null {
  if (!value || typeof value !== "object" || !("message" in value)) {
    return null;
  }

  const message = value.message;

  return typeof message === "string" ? message : null;
}

export default function WaitlistPage() {
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
    <main className="min-h-screen bg-[var(--color-bg)] text-slate-950">
      <Navbar />

      <section className="grid min-h-[calc(100vh-73px)] lg:grid-cols-2">
        <div className="relative hidden min-h-full overflow-hidden border-r border-primary lg:block">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${waitlistImage})` }}
          />
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute bottom-10 left-10 h-56 w-56 border-2 border-accent" />
        </div>

        <div className="flex min-h-[calc(100vh-73px)] items-center bg-[var(--color-bg)] px-4 py-16 sm:px-6 lg:px-12">
          <motion.div
            className="mx-auto w-full max-w-xl"
            initial={reduceMotion ? false : { opacity: 0, y: 28 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {status === "success" ? (
              <motion.div
                className="flex min-h-[32rem] flex-col justify-center border-2 border-primary bg-white p-8"
                initial={reduceMotion ? false : { opacity: 0, y: 20 }}
                animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                role="status"
              >
                <motion.svg
                  width="128"
                  height="128"
                  viewBox="0 0 128 128"
                  fill="none"
                  className="text-accent"
                  aria-hidden="true"
                >
                  <motion.path
                    d="M28 67L53 91L101 37"
                    stroke="currentColor"
                    strokeWidth="9"
                    strokeLinecap="square"
                    strokeLinejoin="miter"
                    initial={reduceMotion ? false : { pathLength: 0 }}
                    animate={reduceMotion ? undefined : { pathLength: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </motion.svg>
                <h1 className="mt-10 font-display text-5xl font-bold leading-tight text-primary sm:text-6xl">
                  You&apos;re on the list.
                </h1>
                <p className="mt-5 max-w-md font-body text-lg leading-8 text-slate-600">
                  {message}
                </p>
              </motion.div>
            ) : (
              <>
                <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-accent">
                  Early Access
                </p>
                <h1 className="mt-5 font-display text-5xl font-bold leading-[0.95] text-primary sm:text-6xl">
                  Be first through the door.
                </h1>
                <p className="mt-6 font-body text-lg leading-8 text-slate-600">
                  Join renters waiting for verified homes, clear costs, and
                  early launch access in Nigerian cities.
                </p>

                <form className="mt-10 grid gap-5" onSubmit={handleSubmit}>
                  <label className="block">
                    <span className="font-body text-sm font-bold text-primary">
                      First Name
                    </span>
                    <input
                      type="text"
                      name="firstName"
                      placeholder="Tunde"
                      autoComplete="given-name"
                      required
                      className="mt-2 min-h-14 w-full border border-primary bg-white px-4 py-3 font-body text-base text-slate-950 outline-none transition-all duration-200 ease-in-out placeholder:text-slate-400 focus:border-accent focus:ring-2 focus:ring-accent/30"
                    />
                  </label>

                  <label className="block">
                    <span className="font-body text-sm font-bold text-primary">
                      Last Name
                    </span>
                    <input
                      type="text"
                      name="lastName"
                      placeholder="Musa"
                      autoComplete="family-name"
                      required
                      className="mt-2 min-h-14 w-full border border-primary bg-white px-4 py-3 font-body text-base text-slate-950 outline-none transition-all duration-200 ease-in-out placeholder:text-slate-400 focus:border-accent focus:ring-2 focus:ring-accent/30"
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
                      className="mt-2 min-h-14 w-full border border-primary bg-white px-4 py-3 font-body text-base text-slate-950 outline-none transition-all duration-200 ease-in-out placeholder:text-slate-400 focus:border-accent focus:ring-2 focus:ring-accent/30"
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
                      className="mt-2 min-h-14 w-full border border-primary bg-white px-4 py-3 font-body text-base text-slate-950 outline-none transition-all duration-200 ease-in-out placeholder:text-slate-400 focus:border-accent focus:ring-2 focus:ring-accent/30"
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
                      className="mt-2 min-h-14 w-full border border-primary bg-white px-4 py-3 font-body text-base text-slate-950 outline-none transition-all duration-200 ease-in-out focus:border-accent focus:ring-2 focus:ring-accent/30"
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
                      className="mt-2 min-h-14 w-full border border-primary bg-white px-4 py-3 font-body text-base text-slate-950 outline-none transition-all duration-200 ease-in-out focus:border-accent focus:ring-2 focus:ring-accent/30"
                      options={toSelectOptions([...roles])}
                    />
                  </label>

                  {status === "error" && message ? (
                    <motion.p
                      className="border border-red-700 bg-red-50 px-4 py-3 font-body text-sm font-bold text-red-700"
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
                    className="inline-flex min-h-14 w-full items-center justify-center bg-primary px-5 py-4 font-body text-base font-bold text-white transition-all duration-200 ease-in-out hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-70"
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
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

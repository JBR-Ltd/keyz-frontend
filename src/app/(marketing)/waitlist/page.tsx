"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { useToast } from "@/components/ui/toast";

const roles = ["Tenant", "Agent", "Landlord"];

const waitlistImage =
  "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1800&q=85";

const labelClassName = "font-body text-sm font-bold text-primary";
const controlClassName =
  "mt-2 min-h-14 w-full border-0 border-b-2 border-primary/30 bg-transparent px-0 py-3 font-body text-base text-slate-950 outline-none transition-colors duration-200 ease-in-out placeholder:text-slate-400 focus:border-accent focus:ring-0 disabled:cursor-not-allowed disabled:opacity-50 autofill:bg-transparent autofill:text-slate-950";

const roleRequiredMessage = "Choose the role that best describes you.";

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
  const [selectedRole, setSelectedRole] = useState("");
  const [roleOpen, setRoleOpen] = useState(false);
  const [activeRoleIndex, setActiveRoleIndex] = useState(0);
  const [roleError, setRoleError] = useState("");
  const reduceMotion = useReducedMotion();
  const { notify } = useToast();
  const roleFieldRef = useRef<HTMLDivElement>(null);
  const roleButtonRef = useRef<HTMLButtonElement>(null);
  const roleOptionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const feedbackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!roleOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent): void {
      if (
        event.target instanceof Node &&
        !roleFieldRef.current?.contains(event.target)
      ) {
        setRoleOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [roleOpen]);

  useEffect(() => {
    if (!roleOpen) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      roleOptionRefs.current[activeRoleIndex]?.focus();
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [activeRoleIndex, roleOpen]);

  function openRoleMenu(index: number): void {
    setActiveRoleIndex(index);
    setRoleOpen(true);
  }

  function selectRole(role: string): void {
    setSelectedRole(role);
    setRoleError("");
    setRoleOpen(false);
    window.requestAnimationFrame(() => roleButtonRef.current?.focus());
  }

  function handleRoleTriggerKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
  ): void {
    const selectedIndex = roles.indexOf(selectedRole);

    if (event.key === "ArrowDown") {
      event.preventDefault();
      openRoleMenu(selectedIndex >= 0 ? selectedIndex : 0);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      openRoleMenu(selectedIndex >= 0 ? selectedIndex : roles.length - 1);
    } else if (event.key === "Escape") {
      setRoleOpen(false);
    }
  }

  function handleRoleOptionKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ): void {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveRoleIndex((index + 1) % roles.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveRoleIndex((index - 1 + roles.length) % roles.length);
    } else if (event.key === "Home") {
      event.preventDefault();
      setActiveRoleIndex(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setActiveRoleIndex(roles.length - 1);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectRole(roles[index]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setRoleOpen(false);
      roleButtonRef.current?.focus();
    } else if (event.key === "Tab") {
      setRoleOpen(false);
    }
  }

  function revealSubmissionFeedback(): void {
    window.requestAnimationFrame(() => {
      window.scrollTo({
        top: 0,
        behavior: reduceMotion ? "auto" : "smooth",
      });
      feedbackRef.current?.focus({ preventScroll: true });
    });
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      firstName: String(formData.get("firstName") ?? ""),
      lastName: String(formData.get("lastName") ?? ""),
      email: String(formData.get("email") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      city: String(formData.get("city") ?? ""),
      role: String(formData.get("role") ?? ""),
    };

    if (!payload.role) {
      setRoleError(roleRequiredMessage);
      roleButtonRef.current?.focus();
      return;
    }

    setRoleError("");
    setRoleOpen(false);
    setStatus("submitting");
    setMessage("");

    try {
      const response = await fetch("/api/subscribe", {
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
      revealSubmissionFeedback();
      notify({
        title: "Joined the waitlist",
        description: successMessage,
        variant: "success",
      });
      form.reset();
      setSelectedRole("");
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "We could not join the waitlist right now.";

      setStatus("error");
      setMessage(errorMessage);
      revealSubmissionFeedback();
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
                ref={feedbackRef}
                className="flex min-h-[32rem] flex-col justify-center border-2 border-primary bg-white p-8 focus:outline-none"
                initial={reduceMotion ? false : { opacity: 0, y: 20 }}
                animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                tabIndex={-1}
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

                {status === "error" && message ? (
                  <motion.div
                    ref={feedbackRef}
                    className="mt-8 border-l-2 border-red-700 py-1 pl-4 font-body text-sm font-bold text-red-700 focus:outline-none"
                    initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                    animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    tabIndex={-1}
                    role="alert"
                  >
                    {message}
                  </motion.div>
                ) : null}

                <form className="mt-10 grid gap-7" onSubmit={handleSubmit}>
                  <div className="grid gap-7 sm:grid-cols-2">
                    <label className="block" htmlFor="waitlist-first-name">
                      <span className={labelClassName}>First Name</span>
                      <input
                        id="waitlist-first-name"
                        type="text"
                        name="firstName"
                        placeholder="Tunde"
                        autoComplete="given-name"
                        required
                        className={controlClassName}
                      />
                    </label>

                    <label className="block" htmlFor="waitlist-last-name">
                      <span className={labelClassName}>Last Name</span>
                      <input
                        id="waitlist-last-name"
                        type="text"
                        name="lastName"
                        placeholder="Musa"
                        autoComplete="family-name"
                        required
                        className={controlClassName}
                      />
                    </label>
                  </div>

                  <label className="block" htmlFor="waitlist-email">
                    <span className={labelClassName}>Email</span>
                    <input
                      id="waitlist-email"
                      type="email"
                      name="email"
                      placeholder="you@example.com"
                      autoComplete="email"
                      required
                      className={controlClassName}
                    />
                  </label>

                  <label className="block" htmlFor="waitlist-phone">
                    <span className={labelClassName}>Phone</span>
                    <input
                      id="waitlist-phone"
                      type="tel"
                      name="phone"
                      placeholder="+234 800 000 0000"
                      autoComplete="tel"
                      inputMode="tel"
                      required
                      className={controlClassName}
                    />
                  </label>

                  <label className="block" htmlFor="waitlist-location">
                    <span className={labelClassName}>State</span>
                    <input
                      id="waitlist-location"
                      type="text"
                      name="city"
                      placeholder="Lagos, Rivers, FCT..."
                      autoComplete="address-level1"
                      required
                      className={controlClassName}
                    />
                  </label>

                  <div ref={roleFieldRef}>
                    <label
                      className={labelClassName}
                      htmlFor="waitlist-role-trigger"
                    >
                      Role
                    </label>
                    <div className="relative mt-2">
                      <input type="hidden" name="role" value={selectedRole} />
                      <button
                        ref={roleButtonRef}
                        id="waitlist-role-trigger"
                        type="button"
                        role="combobox"
                        aria-controls="waitlist-role-options"
                        aria-expanded={roleOpen}
                        aria-haspopup="listbox"
                        aria-invalid={Boolean(roleError)}
                        aria-required="true"
                        aria-describedby={
                          roleError ? "waitlist-role-error" : undefined
                        }
                        disabled={status === "submitting"}
                        onClick={() => {
                          if (roleOpen) {
                            setRoleOpen(false);
                            return;
                          }

                          const selectedIndex = roles.indexOf(selectedRole);
                          openRoleMenu(selectedIndex >= 0 ? selectedIndex : 0);
                        }}
                        onKeyDown={handleRoleTriggerKeyDown}
                        className={`flex min-h-14 w-full items-center justify-between border-0 border-b-2 bg-transparent px-0 py-3 text-left font-body text-base outline-none transition-colors focus:ring-0 disabled:cursor-not-allowed disabled:opacity-50 ${
                          roleError
                            ? "border-red-700"
                            : "border-primary/30 focus:border-accent"
                        }`}
                      >
                        <span
                          className={
                            selectedRole ? "text-slate-950" : "text-slate-400"
                          }
                        >
                          {selectedRole || "Select your role"}
                        </span>
                        <ChevronDown
                          size={18}
                          className={`shrink-0 text-primary/60 transition-transform duration-200 ${
                            roleOpen ? "rotate-180" : ""
                          }`}
                          aria-hidden="true"
                        />
                      </button>

                      {roleOpen ? (
                        <div
                          id="waitlist-role-options"
                          role="listbox"
                          aria-label="Role"
                          className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 overflow-hidden border border-primary/20 bg-white py-2 shadow-[0_18px_45px_rgba(0,47,73,0.16)]"
                        >
                          {roles.map((role, index) => (
                            <button
                              key={role}
                              ref={(element) => {
                                roleOptionRefs.current[index] = element;
                              }}
                              type="button"
                              role="option"
                              aria-selected={selectedRole === role}
                              tabIndex={activeRoleIndex === index ? 0 : -1}
                              onClick={() => selectRole(role)}
                              onKeyDown={(event) =>
                                handleRoleOptionKeyDown(event, index)
                              }
                              className={`flex min-h-12 w-full items-center px-4 text-left font-body text-base font-semibold outline-none transition-colors hover:bg-accent/15 focus:bg-accent/15 ${
                                selectedRole === role
                                  ? "bg-primary text-white hover:bg-primary focus:bg-primary"
                                  : "text-primary"
                              }`}
                            >
                              {role}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    {roleError ? (
                      <p
                        id="waitlist-role-error"
                        className="mt-2 font-body text-sm font-semibold text-red-700"
                        role="alert"
                      >
                        {roleError}
                      </p>
                    ) : null}
                  </div>

                  <motion.button
                    type="submit"
                    disabled={status === "submitting"}
                    className="mt-1 inline-flex min-h-14 w-full items-center justify-center bg-primary px-5 py-4 font-body text-base font-bold text-white transition-all duration-200 ease-in-out hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-70"
                    whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                  >
                    {status === "submitting" ? "Joining..." : "Join Waitlist"}
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

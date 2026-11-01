"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Search } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactElement } from "react";

export default function HeroSection(): ReactElement {
  const reduceMotion = useReducedMotion();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const still = reduceMotion === true;

  function submitSearch(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const trimmedQuery = query.trim();

    router.push(
      trimmedQuery
        ? `/browse?query=${encodeURIComponent(trimmedQuery)}`
        : "/browse",
    );
  }

  return (
    <section
      aria-labelledby="landing-hero-heading"
      className="border-b border-border bg-bg"
    >
      <div className="relative min-h-[22rem] overflow-hidden sm:min-h-[25rem] lg:min-h-[28rem]">
        <Image
          src="/images/about-interior.jpg"
          alt=""
          aria-hidden="true"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[48%_center] sm:object-center"
        />
        <div
          className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,52,76,0.08),rgba(4,52,76,0.02)_48%,rgba(4,52,76,0.22))]"
          aria-hidden="true"
        />

        <div className="absolute inset-0 flex items-center justify-center px-5 sm:px-8 lg:px-10">
          <div className="flex w-full flex-col items-center gap-6 sm:gap-7">
            <motion.h1
              id="landing-hero-heading"
              className="text-center font-display text-4xl font-bold leading-none text-primary [text-shadow:0_2px_20px_rgba(255,255,255,0.95)] sm:text-5xl lg:text-6xl"
              initial={still ? false : { opacity: 0, y: 12 }}
              animate={still ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: still ? 0 : 0.4, ease: "easeOut" }}
            >
              Find your next home.
            </motion.h1>

            <motion.form
              action="/browse"
              method="get"
              onSubmit={submitSearch}
              className="flex w-full max-w-5xl flex-col gap-2 rounded-[1.4rem] border-2 border-primary bg-white/95 p-2 shadow-[0_18px_50px_rgba(4,52,76,0.24)] backdrop-blur-sm sm:flex-row sm:rounded-full"
              initial={still ? false : { opacity: 0, y: 14 }}
              animate={still ? undefined : { opacity: 1, y: 0 }}
              transition={{
                duration: still ? 0 : 0.45,
                delay: still ? 0 : 0.06,
                ease: "easeOut",
              }}
            >
              <label htmlFor="landing-search" className="sr-only">
                Search by location or describe your ideal home
              </label>
              <span className="flex min-h-14 min-w-0 flex-1 items-center gap-3 px-4 sm:px-5">
                <Search
                  size={20}
                  className="shrink-0 text-muted"
                  aria-hidden="true"
                />
                <input
                  id="landing-search"
                  name="query"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  maxLength={300}
                  autoComplete="off"
                  placeholder="Where would you like to live?"
                  className="min-w-0 flex-1 bg-transparent font-body text-base text-primary outline-none placeholder:text-muted"
                />
              </span>
              <button
                type="submit"
                className="inline-flex min-h-14 shrink-0 items-center justify-center gap-2 rounded-full bg-accent px-8 font-body text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                Search homes
                <ArrowRight size={17} aria-hidden="true" />
              </button>
            </motion.form>
          </div>
        </div>
      </div>
    </section>
  );
}

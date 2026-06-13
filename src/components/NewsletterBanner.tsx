"use client";

import { useState } from "react";
import Image from "next/image";

export default function NewsletterBanner() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <section className="relative py-20 md:py-28 px-4 overflow-hidden bg-primary-dark">
      {/* Background house image */}
      <div className="absolute inset-0 md:left-0 md:top-0 md:w-1/3 md:h-full z-0">
        <Image
          src="/images/newsletter-house.jpg"
          alt="Luxury property"
          fill
          className="object-cover object-center opacity-25 md:opacity-80"
          sizes="(min-width: 768px) 33vw, 100vw"
        />
        <div className="absolute inset-0 bg-primary-dark/70 md:hidden" />
        <div className="absolute inset-0 hidden md:block newsletter-overlay" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto flex items-center justify-start lg:pl-[38%]">
        <div className="max-w-xl lg:max-w-sm">
          <h2 className="font-display text-white font-bold text-4xl md:text-5xl mb-4 leading-tight">
            STAY UPDATED ON
            <br />
            PREMIUM LISTINGS
          </h2>
          <p className="text-white/70 text-lg md:text-xl leading-relaxed mb-5">
            Subscribe to our newsletter to receive property offers, market
            insights, investment opportunities and newly listed luxury homes
            before anyone else
          </p>

          {sent ? (
            <p className="text-accent font-semibold text-base md:text-lg">
              You&apos;re subscribed! We&apos;ll be in touch soon.
            </p>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full flex-1 bg-white/95 rounded-full px-5 py-3 text-base outline-none transition-all duration-200 ease-in-out focus:-translate-y-0.5 focus:ring-2 focus:ring-[var(--color-accent)]"
              />
              {/* Icon button */}
              <button
                onClick={() => email && setSent(true)}
                className="premium-hover hidden sm:flex w-11 h-11 bg-primary-soft rounded-full items-center justify-center hover:bg-accent flex-shrink-0"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M22 2L11 13"
                    stroke="currentColor"
                    className="stroke-accent"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                  <path
                    d="M22 2L15 22L11 13L2 9L22 2Z"
                    stroke="currentColor"
                    className="stroke-accent"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <button
                onClick={() => email && setSent(true)}
                className="premium-hover bg-gradient-to-r from-accent to-accent-alt text-white text-base font-semibold px-6 py-3 rounded-full whitespace-nowrap"
              >
                Subscribe Now
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

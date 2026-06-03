"use client";

import { useState } from "react";
import Image from "next/image";

export default function NewsletterBanner() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <section className="relative py-14 px-4 overflow-hidden bg-primary-dark">
      {/* Background house image — left side */}
      <div className="absolute left-0 top-0 w-1/3 h-full z-0">
        <Image
          src="/images/newsletter-house.jpg"
          alt="Luxury property"
          fill
          className="object-cover object-center opacity-80"
        />
        <div className="absolute inset-0 newsletter-overlay" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto flex items-center justify-end lg:justify-start lg:pl-[38%]">
        <div className="max-w-sm">
          <h2 className="text-white font-bold text-2xl md:text-3xl mb-4 tracking-tight">
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
              You're subscribed! We'll be in touch soon.
            </p>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-white rounded px-4 py-3 text-base outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              />
              {/* Icon button */}
              <button
                onClick={() => email && setSent(true)}
                className="w-11 h-11 bg-primary-soft rounded flex items-center justify-center hover:bg-accent transition-colors flex-shrink-0"
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
                className="bg-accent hover:bg-accent-alt transition-colors text-white text-base font-semibold px-5 py-3 rounded whitespace-nowrap"
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

"use client";

import { useState } from "react";

const FAQS = [
  { q: "Are all properties verified?" },
  { q: "Can I schedule inspections online?" },
  { q: "Do you offer payment plans?" },
  { q: "Is the platform available outside Nigeria?" },
  { q: "Can I list my own property?" },
  { q: "How do I contact an agent?" },
  { q: "Are there luxury-only listings?" },
  { q: "Is my payment secure?" },
];

const ANSWERS: Record<string, string> = {
  "Are all properties verified?":
    "Yes. Every listing on Rello goes through a manual verification process before it goes live, including document checks and site confirmations.",
  "Can I schedule inspections online?":
    "Absolutely. You can request a physical or virtual inspection directly from any listing page, and our team will coordinate with the agent.",
  "Do you offer payment plans?":
    "We partner with select financial institutions to offer flexible payment plans on qualifying properties. Reach out to us for details.",
  "Is the platform available outside Nigeria?":
    "Currently we focus on the Nigerian market, but we're actively expanding. Sign up to be notified when we launch in your region.",
  "Can I list my own property?":
    "Yes. Landlords and agents can create an account and list properties directly. Listings are reviewed before going live.",
  "How do I contact an agent?":
    "Each property page has a direct message and call button connected to the listing agent. You can also use our Agent Directory.",
  "Are there luxury-only listings?":
    "We have a curated Luxury collection featuring penthouses, smart homes, and premium estates. You can filter for them in search.",
  "Is my payment secure?":
    "All transactions go through our escrow system, meaning funds are held securely until both parties fulfil their commitments.",
};

function FAQItem({ number, question }: { number: number; question: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="premium-hover border border-gray-100 rounded-2xl overflow-hidden bg-white/[0.85] backdrop-blur">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-50 transition-all duration-200 ease-in-out"
      >
        {/* Number badge */}
        <div className="w-10 h-10 rounded-lg bg-primary-soft text-white text-base font-bold flex items-center justify-center flex-shrink-0">
          {number}
        </div>
        <span className="flex-1 text-base md:text-lg text-gray-800 font-semibold leading-snug">
          {question}
        </span>
        <svg
          width="18"
          height="18"
          viewBox="0 0 16 16"
          fill="none"
          className={`flex-shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        >
          <path
            d="M4 6l4 4 4-4"
            stroke="currentColor"
            className="stroke-accent"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>

      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: open ? "200px" : "0px",
        }}
      >
        <div className="px-5 pb-4 sm:pl-[3.75rem]">
          <p className="text-gray-600 text-base md:text-lg leading-relaxed">
            {ANSWERS[question]}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function FAQSection() {
  const left = FAQS.slice(0, 4);
  const right = FAQS.slice(4);

  return (
    <section className="py-24 md:py-32 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <h2 className="font-display mx-auto mb-12 max-w-3xl text-center text-4xl font-bold leading-tight text-gray-900 md:text-5xl">
          Questions before you join Rello?
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-4">
            {left.map((faq, i) => (
              <FAQItem key={faq.q} number={i + 1} question={faq.q} />
            ))}
          </div>
          <div className="flex flex-col gap-4">
            {right.map((faq, i) => (
              <FAQItem key={faq.q} number={i + 5} question={faq.q} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

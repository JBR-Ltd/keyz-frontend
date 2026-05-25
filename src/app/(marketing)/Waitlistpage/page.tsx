"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

// ─── Minimal Navbar for waitlist page ────────────────────────────────────────
function WaitlistNavbar() {
  return (
    <nav className="w-full flex items-center justify-between px-8 py-4 bg-white absolute top-0 left-0 z-20">
      <Link href="/" className="flex items-center gap-2">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path
            d="M16 3L3 13V29H12V20H20V29H29V13L16 3Z"
            stroke="#C9A84C"
            strokeWidth="2"
            fill="none"
          />
        </svg>
        <div className="leading-tight">
          <p className="font-bold text-[#1a237e] text-lg tracking-wide">KEYZ</p>
          <p className="text-xs text-gray-500">Real Estate</p>
        </div>
      </Link>

      <div className="flex items-center gap-2 border border-[#C9A84C] text-[#C9A84C] text-sm font-medium px-4 py-2 rounded-full">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path
            d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
            stroke="#C9A84C"
            strokeWidth="1.8"
          />
          <path
            d="M13.73 21a2 2 0 0 1-3.46 0"
            stroke="#C9A84C"
            strokeWidth="1.8"
          />
        </svg>
        Launching Soon
      </div>
    </nav>
  );
}

// ─── Hero + Form ──────────────────────────────────────────────────────────────
const PERKS = [
  {
    label: "Early Launch Access",
    desc: "Be the first to explore and use our platform before anyone else",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
          stroke="#C9A84C"
          strokeWidth="1.8"
        />
        <path
          d="M13.73 21a2 2 0 0 1-3.46 0"
          stroke="#C9A84C"
          strokeWidth="1.8"
        />
      </svg>
    ),
  },
  {
    label: "Exclusive Offers",
    desc: "Get early bird deals and discounts on premium properties",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"
          stroke="#C9A84C"
          strokeWidth="1.8"
        />
        <line
          x1="7"
          y1="7"
          x2="7.01"
          y2="7"
          stroke="#C9A84C"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    label: "Product Updates",
    desc: "Stay in the loop with important updates and new features",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
          stroke="#C9A84C"
          strokeWidth="1.8"
        />
        <polyline points="22,6 12,13 2,6" stroke="#C9A84C" strokeWidth="1.8" />
      </svg>
    ),
  },
];

const TRUST_ICONS = [
  {
    label: "Verified\nProperties",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="#888" strokeWidth="1.5" />
        <path
          d="M9 12l2 2 4-4"
          stroke="#888"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: "Secure\nTransactions",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.5C16.5 22.15 20 17.25 20 12V6l-8-4z"
          stroke="#888"
          strokeWidth="1.5"
        />
        <path
          d="M9 12l2 2 4-4"
          stroke="#888"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: "Quality\nSupport system",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M3 18v-6a9 9 0 0 1 18 0v6" stroke="#888" strokeWidth="1.5" />
        <path
          d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"
          stroke="#888"
          strokeWidth="1.5"
        />
      </svg>
    ),
  },
];

function WaitlistForm() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    consent: false,
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!form.email || !form.consent) return;
    setSubmitted(true);
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-md mx-auto">
      {/* Lock icon */}
      <div className="flex justify-center mb-4">
        <div className="w-20 h-20 rounded-full bg-[#b5a898] flex items-center justify-center">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
            <rect
              x="3"
              y="11"
              width="18"
              height="11"
              rx="2"
              stroke="white"
              strokeWidth="1.8"
            />
            <path
              d="M7 11V7a5 5 0 0 1 10 0v4"
              stroke="white"
              strokeWidth="1.8"
            />
          </svg>
        </div>
      </div>

      {submitted ? (
        <div className="text-center py-6">
          <p className="text-2xl font-bold text-gray-900 mb-2">
            You're on the list! 🎉
          </p>
          <p className="text-gray-500 text-sm">
            We'll notify you when Keyz launches.
          </p>
        </div>
      ) : (
        <>
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-1">
            Join the Waitlist
          </h2>
          <p className="text-gray-400 text-sm text-center mb-6">
            Be the first to know when we launch
          </p>

          <div className="flex gap-3 mb-4">
            <input
              type="text"
              placeholder="First Name"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#1a237e] transition-colors"
            />
            <input
              type="text"
              placeholder="Last Name"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#1a237e] transition-colors"
            />
          </div>

          <input
            type="email"
            placeholder="Email Address"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#1a237e] transition-colors mb-4"
          />

          {/* Phone with Nigeria flag */}
          <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden mb-4 focus-within:border-[#1a237e] transition-colors">
            <div className="flex items-center gap-2 px-3 py-3 border-r border-gray-200 bg-gray-50">
              {/* Nigerian flag */}
              <span className="flex h-4 w-6 overflow-hidden rounded-sm">
                <span className="flex-1 bg-[#008751]" />
                <span className="flex-1 bg-white" />
                <span className="flex-1 bg-[#008751]" />
              </span>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M2 4l4 4 4-4"
                  stroke="#888"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <input
              type="tel"
              placeholder="Phone Number"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="flex-1 px-4 py-3 text-sm outline-none bg-transparent"
            />
          </div>

          {/* Consent */}
          <label className="flex items-start gap-3 mb-6 cursor-pointer">
            <input
              type="checkbox"
              checked={form.consent}
              onChange={(e) => setForm({ ...form, consent: e.target.checked })}
              className="mt-0.5 accent-[#1a237e]"
            />
            <span className="text-xs text-gray-500 leading-relaxed">
              I agree to receive updates about KEYZ Real Estate. You can
              unsubscribe anytime.
            </span>
          </label>

          <button
            onClick={handleSubmit}
            disabled={!form.email || !form.consent}
            className="w-full bg-[#3d4f2e] hover:bg-[#2e3c22] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-white font-semibold py-4 rounded-xl text-base"
          >
            Join Waitlist
          </button>

          {/* Social proof */}
          <div className="flex items-center justify-center gap-3 mt-5">
            <div className="flex -space-x-2">
              {["bg-amber-400", "bg-rose-400", "bg-sky-400"].map((c, i) => (
                <div
                  key={i}
                  className={`w-8 h-8 rounded-full ${c} border-2 border-white flex items-center justify-center text-white text-xs font-bold`}
                >
                  {["A", "B", "C"][i]}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 font-medium">
              Join 200+ others on the waitlist
            </p>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Features strip ───────────────────────────────────────────────────────────
const FEATURES = [
  {
    label: "Easy to Use",
    desc: "A seamless platform designed with you in mind",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <rect
          x="5"
          y="2"
          width="14"
          height="20"
          rx="2"
          stroke="#333"
          strokeWidth="1.5"
        />
        <line
          x1="9"
          y1="7"
          x2="15"
          y2="7"
          stroke="#333"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <line
          x1="9"
          y1="11"
          x2="15"
          y2="11"
          stroke="#333"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    label: "Verified Listings",
    desc: "All properties are verified for your peace of mind.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.5C16.5 22.15 20 17.25 20 12V6l-8-4z"
          stroke="#333"
          strokeWidth="1.5"
        />
        <path
          d="M9 12l2 2 4-4"
          stroke="#333"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: "Secure & Transparent",
    desc: "Safe transactions with complete transparency",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <rect
          x="3"
          y="11"
          width="18"
          height="11"
          rx="2"
          stroke="#333"
          strokeWidth="1.5"
        />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#333" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    label: "Expert Support",
    desc: "Our team is here to help you every step of the way",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <path d="M3 18v-6a9 9 0 0 1 18 0v6" stroke="#333" strokeWidth="1.5" />
        <path
          d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"
          stroke="#333"
          strokeWidth="1.5"
        />
      </svg>
    ),
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function WaitlistPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero + Form section */}
      <section className="relative min-h-[680px] bg-white overflow-hidden">
        <WaitlistNavbar />

        {/* Background property image — right half */}
        <div className="absolute top-0 right-0 w-1/2 h-full z-0">
          <Image
            src="/images/waitlist-hero.jpg"
            alt="Modern building"
            fill
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-l from-transparent to-white" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-8 pt-32 pb-20 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left: copy */}
          <div>
            <p className="text-[#C9A84C] font-semibold text-xs tracking-widest uppercase mb-4">
              A better way to buy, sell &amp; rent
            </p>
            <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-5">
              The future of
              <br />
              real estate
              <br />
              is coming.
            </h1>
            <p className="text-gray-600 text-base leading-relaxed mb-8 max-w-sm">
              Join the waitlist and be the first to access a smarter, simpler
              and more transparent way to buy, sell and rent in real estate.
            </p>

            {/* Trust badges */}
            <div className="flex items-center gap-6">
              {TRUST_ICONS.map(({ label, icon }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-1 text-center"
                >
                  {icon}
                  <span className="text-[10px] text-gray-500 leading-tight whitespace-pre-line">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: form */}
          <WaitlistForm />
        </div>
      </section>

      {/* Early access perks */}
      <section className="bg-[#f7f5f2] py-16 px-8">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-[#C9A84C] font-semibold text-xs tracking-widest uppercase mb-6">
              You'll get early access to:
            </p>
            <div className="flex flex-col gap-6">
              {PERKS.map(({ label, desc, icon }) => (
                <div key={label} className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#ede8e0] flex items-center justify-center flex-shrink-0">
                    {icon}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm mb-1">
                      {label}
                    </p>
                    <p className="text-gray-500 text-xs leading-relaxed">
                      {desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Placeholder for right-side illustration / property image */}
          <div className="hidden md:block rounded-2xl overflow-hidden h-64 bg-gray-200 relative">
            <Image
              src="/images/waitlist-interior.jpg"
              alt="Property interior"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* Features strip */}
      <section className="py-20 px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-14">
            Built for&nbsp; Smooth real estate experience
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {FEATURES.map(({ label, desc, icon }) => (
              <div key={label} className="flex flex-col gap-3">
                {icon}
                <p className="font-bold text-gray-900 text-sm">{label}</p>
                <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-6 text-center">
        <p className="text-gray-400 text-xs">
          © 2026 Keyz Real Estate. All rights reserved
        </p>
      </footer>
    </main>
  );
}

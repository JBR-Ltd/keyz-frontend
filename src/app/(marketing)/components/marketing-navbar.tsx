"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

const navLinks = [
  { label: "Listings", href: "#listings" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "For Landlords", href: "#for-landlords" },
];

export function MarketingNavbar() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const closeDrawer = () => setIsOpen(false);

    window.addEventListener("resize", closeDrawer);

    return () => window.removeEventListener("resize", closeDrawer);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 shadow-[0_10px_30px_rgba(10,22,40,0.06)] backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link
          href="#hero"
          className="font-display text-3xl font-semibold tracking-tight text-[#0A1628]"
        >
          Keyz
        </Link>

        <div className="hidden items-center gap-8 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-base font-semibold text-slate-700 transition hover:text-[#0A1628]"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="#cta"
            className="rounded-full border border-[#0A1628] px-5 py-3 text-sm font-bold text-[#0A1628] transition hover:bg-[#0A1628] hover:text-white"
          >
            Sign In
          </Link>
          <Link
            href="#cta"
            className="rounded-full bg-[#F5A623] px-5 py-3 text-sm font-bold text-[#0A1628] transition hover:bg-[#e89a1f]"
          >
            Get Started
          </Link>
        </div>

        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls="mobile-nav"
          aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
          onClick={() => setIsOpen((open) => !open)}
          className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 text-[#0A1628] lg:hidden"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      <div
        id="mobile-nav"
        className={`overflow-hidden border-t border-slate-200/80 bg-white transition-[max-height,opacity] duration-300 lg:hidden ${
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className="rounded-[24px] bg-[#F9F6F0] px-4 py-3 text-base font-semibold text-[#0A1628]"
            >
              {link.label}
            </Link>
          ))}

          <div className="mt-2 flex flex-col gap-3">
            <Link
              href="#cta"
              onClick={() => setIsOpen(false)}
              className="rounded-full border border-[#0A1628] px-5 py-3 text-center text-sm font-bold text-[#0A1628]"
            >
              Sign In
            </Link>
            <Link
              href="#cta"
              onClick={() => setIsOpen(false)}
              className="rounded-full bg-[#F5A623] px-5 py-3 text-center text-sm font-bold text-[#0A1628]"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

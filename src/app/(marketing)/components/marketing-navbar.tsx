"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
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
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 shadow-[0_10px_30px_rgba(10,22,40,0.06)] backdrop-blur"
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link
          href="#hero"
          className="font-display text-3xl font-semibold tracking-tight text-[#0A1628]"
        >
          Keyz
        </Link>

        <div className="hidden items-center gap-8 lg:flex">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <motion.a
                className="text-base font-semibold text-slate-700 transition hover:text-[#0A1628]"
                whileHover={{ opacity: 0.75 }}
                whileTap={{ scale: 0.97 }}
              >
                {link.label}
              </motion.a>
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <Link href="#cta">
            <motion.a
              className="rounded-full border border-[#0A1628] px-5 py-3 text-sm font-bold text-[#0A1628] transition hover:bg-[#0A1628] hover:text-white"
              whileHover={{ opacity: 0.75 }}
              whileTap={{ scale: 0.97 }}
            >
              Sign In
            </motion.a>
          </Link>
          <Link href="#cta">
            <motion.a
              className="rounded-full bg-[#F5A623] px-5 py-3 text-sm font-bold text-[#0A1628] transition hover:bg-[#e89a1f]"
              whileHover={{ opacity: 0.75 }}
              whileTap={{ scale: 0.97 }}
            >
              Get Started
            </motion.a>
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

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="mobile-nav"
            id="mobile-nav"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden border-t border-slate-200/80 bg-white lg:hidden"
          >
            <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <motion.a
                    className="rounded-[24px] bg-[#F9F6F0] px-4 py-3 text-base font-semibold text-[#0A1628]"
                    whileHover={{ opacity: 0.75 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setIsOpen(false)}
                  >
                    {link.label}
                  </motion.a>
                </Link>
              ))}

              <div className="mt-2 flex flex-col gap-3">
                <Link href="#cta">
                  <motion.a
                    className="rounded-full border border-[#0A1628] px-5 py-3 text-center text-sm font-bold text-[#0A1628]"
                    whileHover={{ opacity: 0.75 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setIsOpen(false)}
                  >
                    Sign In
                  </motion.a>
                </Link>
                <Link href="#cta">
                  <motion.a
                    className="rounded-full bg-[#F5A623] px-5 py-3 text-center text-sm font-bold text-[#0A1628]"
                    whileHover={{ opacity: 0.75 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setIsOpen(false)}
                  >
                    Get Started
                  </motion.a>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

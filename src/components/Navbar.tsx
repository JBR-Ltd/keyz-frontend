"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import relloLogo from "../../public/rello-logo.svg";

const NAV_LINKS = [
  { label: "Why Rello", href: "/#why-rello" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Cities", href: "/#cities" },
  { label: "Contact", href: "/#footer" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-primary bg-[var(--color-bg)]">
      <div className="flex w-full items-center justify-between py-0.5 pl-0 pr-4 sm:pr-4 lg:pr-8 ">
        <Link
          href="/"
          className="flex items-center gap-3 transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          onClick={() => setMenuOpen(false)}
        >
          <Image
            src={relloLogo}
            alt="Rello"
            priority
            className="h-24 w-60 -translate-x-15 object-contain sm:w-64"
          />
        </Link>

        <div className="hidden items-center gap-10 lg:flex">
          <ul className="flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="font-accent text-xs font-bold uppercase tracking-[0.22em] text-primary transition-all duration-200 ease-in-out hover:text-accent focus:outline-none focus-visible:text-accent"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <Link
            href="/waitlist"
            className="inline-flex min-h-11 items-center justify-center bg-primary px-5 py-3 font-body text-sm font-bold text-white transition-all duration-200 ease-in-out hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Join Waitlist
          </Link>
        </div>

        <button
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
          className="flex h-11 w-11 items-center justify-center border border-primary text-primary transition-all duration-200 ease-in-out hover:bg-primary hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent lg:hidden"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <AnimatePresence>
        {menuOpen ? (
          <motion.div
            className="absolute left-0 top-full w-full border-b border-primary bg-[var(--color-bg)] lg:hidden"
            initial={{ opacity: 0, x: -32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -32 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <ul className="flex flex-col border-t border-primary">
              {NAV_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="block border-b border-primary px-4 py-5 font-accent text-sm font-bold uppercase tracking-[0.22em] text-primary transition-all duration-200 ease-in-out hover:bg-primary hover:text-white focus:outline-none focus-visible:bg-primary focus-visible:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="px-4 py-5">
              <Link
                href="/waitlist"
                onClick={() => setMenuOpen(false)}
                className="inline-flex min-h-12 w-full items-center justify-center bg-primary px-5 py-3 font-body text-base font-bold text-white transition-all duration-200 ease-in-out hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Join Waitlist
              </Link>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </nav>
  );
}

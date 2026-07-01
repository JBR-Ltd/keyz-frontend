"use client";

import type { ReactElement } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import relloLogo from "../../public/rello-logo.svg";

const NAV_LINKS = [
  { label: "Why Rello", href: "/#why-rello" },
  { label: "Cities", href: "/#cities" },
  { label: "How it Works", href: "/#how-it-works" },
  { label: "Contact", href: "/#footer" },
];

export default function Navbar(): ReactElement {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function handleScroll(): void {
      setScrolled(window.scrollY > 80);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navSurface = scrolled || menuOpen
    ? "bg-[color-mix(in_srgb,var(--color-primary)_90%,transparent)] backdrop-blur-md"
    : "bg-transparent";

  return (
    <nav className={`fixed left-0 top-0 z-50 w-full transition-all duration-300 ease-in-out ${navSurface}`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center transition-all duration-200 ease-in-out hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
          onClick={() => setMenuOpen(false)}
        >
          <Image src={relloLogo} alt="Rello" width={128} height={48} priority className="h-12 w-32 object-contain brightness-0 invert" />
        </Link>

        <ul className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.label}>
              <Link
                href={link.href}
                className="font-body text-sm font-medium text-white transition-all duration-200 ease-in-out hover:opacity-70 focus:outline-none focus-visible:opacity-70"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-5 lg:flex">
          <Link
            href="/login"
            className="font-body text-sm font-medium text-white transition-all duration-200 ease-in-out hover:opacity-70 focus:outline-none focus-visible:opacity-70"
          >
            Sign in
          </Link>
          <Link
            href="/waitlist"
            className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-2 font-body text-sm font-medium text-white transition-all duration-200 ease-in-out hover:scale-[1.03] hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
          >
            List your property
          </Link>
        </div>

        <button
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
          className="flex h-11 w-11 items-center justify-center rounded-full text-white transition-all duration-200 ease-in-out hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] lg:hidden"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <AnimatePresence>
        {menuOpen ? (
          <motion.div
            className="absolute left-0 top-full w-full bg-[color-mix(in_srgb,var(--color-primary)_90%,transparent)] px-4 pb-6 backdrop-blur-md lg:hidden"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <ul className="flex flex-col gap-1 py-3">
              {NAV_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="block rounded-xl px-3 py-4 font-body text-base font-medium text-white transition-all duration-200 ease-in-out hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="grid gap-3">
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/30 px-5 py-3 font-body text-base font-medium text-white transition-all duration-200 ease-in-out hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
              >
                Sign in
              </Link>
              <Link
                href="/waitlist"
                onClick={() => setMenuOpen(false)}
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-accent px-5 py-3 font-body text-base font-medium text-white transition-all duration-200 ease-in-out hover:scale-[1.01] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
              >
                List your property
              </Link>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </nav>
  );
}

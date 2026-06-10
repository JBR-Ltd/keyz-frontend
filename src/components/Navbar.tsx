"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const NAV_LINKS = [
  "Home",
  "Agents",
  "Landlords",
  "Properties",
  "About Us",
  "Contact",
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="relative z-50 w-full bg-surface border-b border-white/10">
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3">
        {/* Logo badge */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-primary-soft flex items-center justify-center border-2 border-accent">
            <svg
              width="24"
              height="24"
              viewBox="0 0 32 32"
              fill="none"
              className="fill-accent"
            >
              <path
                d="M16 4L4 13V28H12V20H20V28H28V13L16 4Z"
                fill="currentColor"
              />
            </svg>
          </div>
          <div className="leading-none">
            <p className="text-sm font-bold tracking-[0.2em] text-primary-soft uppercase">
              KEYZ
            </p>
            <p className="text-[11px] tracking-[0.15em] text-gray-400 uppercase">
              Estate
            </p>
          </div>
        </Link>

        {/* Nav Links */}
        <ul className="hidden lg:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <li key={link}>
              <Link
                href="#"
                className={`nav-link text-base font-medium transition-colors hover:text-white focus-visible:text-white ${
                  link === "Home" ? "text-white font-semibold" : "text-white/70"
                }`}
              >
                {link}
              </Link>
            </li>
          ))}
        </ul>

        {/* CTAs */}
        <div className="hidden lg:flex items-center gap-3">
          {/* <Link
            href="#"
            className="button-fill-hover inline-flex items-center justify-center border border-accent text-accent text-base font-semibold px-5 py-2.5 rounded-lg hover:text-white focus-visible:text-white"
          >
            <span className="relative z-10">Sign In</span>
          </Link> */}
          <Link
            href="/marketing/join-waitlist"
            className="bg-accent text-white text-base font-semibold px-5 py-2.5 rounded-lg hover:bg-accent-alt transition-colors"
          >
            Join Waitlist
          </Link>
        </div>

        <button
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
          className="lg:hidden w-11 h-11 rounded-lg border border-white/15 text-white flex items-center justify-center hover:border-accent hover:text-accent transition-colors"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {menuOpen && (
        <div className="lg:hidden border-t border-white/10 bg-surface px-4 pb-5">
          <ul className="flex flex-col py-3">
            {NAV_LINKS.map((link) => (
              <li key={link}>
                <Link
                  href="#"
                  onClick={() => setMenuOpen(false)}
                  className="block border-b border-white/10 py-4 text-base font-medium text-white/80 hover:text-accent transition-colors"
                >
                  {link}
                </Link>
              </li>
            ))}
          </ul>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* <Link
              href="#"
              onClick={() => setMenuOpen(false)}
              className="button-fill-hover inline-flex items-center justify-center border border-accent text-accent text-base font-semibold px-5 py-3 rounded-lg hover:text-white focus-visible:text-white"
            >
              <span className="relative z-10">Sign In</span>
            </Link> */}
            <Link
              href="/marketing/join-waitlist"
              onClick={() => setMenuOpen(false)}
              className="inline-flex items-center justify-center bg-accent text-white text-base font-semibold px-5 py-3 rounded-lg hover:bg-accent-alt transition-colors"
            >
              Join Waitlist
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

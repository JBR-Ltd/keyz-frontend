"use client";

import Link from "next/link";

const NAV_LINKS = [
  "Home",
  "Agents",
  "Landlords",
  "Properties",
  "About Us",
  "Contact",
];

export default function Navbar() {
  return (
    <nav className="w-full flex items-center justify-between px-8 py-2 bg-surface border-b border-surface">
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
      <ul className="hidden md:flex items-center gap-8">
        {NAV_LINKS.map((link) => (
          <li key={link}>
            <Link
              href="#"
              className={`nav-link text-base font-medium transition-colors hover:text-white focus-visible:text-white ${
                link === "Home"
                  ? "text-white font-semibold"
                  : "text-white/70"
              }`}
            >
              {link}
            </Link>
          </li>
        ))}
      </ul>

      {/* CTAs */}
      <div className="flex items-center gap-3">
        <Link
          href="#"
          className="button-fill-hover inline-flex items-center justify-center border border-accent text-accent text-base font-semibold px-5 py-2.5 rounded-lg hover:text-white focus-visible:text-white"
        >
          <span className="relative z-10">Sign In</span>
        </Link>
        <Link
          href="#"
          className="bg-accent text-white text-base font-semibold px-5 py-2.5 rounded-lg hover:bg-accent-alt transition-colors"
        >
          Join Waitlist
        </Link>
      </div>
    </nav>
  );
}

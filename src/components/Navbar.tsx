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
    <nav className="w-full flex items-center justify-between px-8 py-3 bg-surface border-b border-surface">
      {/* Logo badge */}
      <Link href="/" className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-primary-soft flex items-center justify-center border-2 border-accent">
          <svg
            width="26"
            height="26"
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
          <p className="text-[11px] font-bold tracking-[0.2em] text-primary-soft uppercase">
            KEYZ
          </p>
          <p className="text-[9px] tracking-[0.15em] text-gray-400 uppercase">
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
              className={`text-sm font-medium transition-colors ${
                link === "Home"
                  ? "text-primary-soft font-semibold border-b-2 border-accent pb-0.5"
                  : "text-gray-600 hover:text-primary-soft"
              }`}
            >
              {link}
            </Link>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Link
        href="#"
        className="border border-accent text-accent text-sm font-semibold px-5 py-2.5 rounded hover:bg-accent hover:text-white transition-colors"
      >
        Sign In / Register
      </Link>
    </nav>
  );
}

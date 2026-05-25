"use client";

import Link from "next/link";

const NAV_LINKS = [
  "Buy",
  "Rent",
  "ListProperty",
  "How it Works",
  "About Us",
  "Contact",
];

export default function Navbar() {
  return (
    <nav className="w-full flex items-center justify-between px-8 py-4 bg-white border-b border-gray-100">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2">
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M16 3L3 13V29H12V20H20V29H29V13L16 3Z"
            stroke="#C9A84C"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M16 3L3 13"
            stroke="#C9A84C"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        <div className="leading-tight">
          <p className="font-bold text-[#1a237e] text-lg tracking-wide">KEYZ</p>
          <p className="text-xs text-gray-500">Real Estate</p>
        </div>
      </Link>

      {/* Nav Links */}
      <ul className="hidden md:flex items-center gap-8">
        {NAV_LINKS.map((link) => (
          <li key={link}>
            <Link
              href="#"
              className="text-sm text-gray-700 hover:text-[#1a237e] transition-colors font-medium"
            >
              {link}
            </Link>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Link
        href="/join-waitlist"
        className="bg-[#1a237e] text-white text-sm font-semibold px-6 py-3 rounded-lg hover:bg-[#151c6b] transition-colors"
      >
        Sign Up
      </Link>
    </nav>
  );
}

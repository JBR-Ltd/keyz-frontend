"use client";

import Link from "next/link";
import { useState } from "react";

const FOOTER_LINKS = {
  Company: ["About Us", "Careers", "Blog", "Contact Us"],
  Explore: ["Buy", "Rent", "List Property", "How It Works"],
  Support: [
    "Help Center",
    "Dispute Resolution",
    "Terms of Service",
    "Privacy Policy",
  ],
};

const SOCIALS = [
  {
    label: "LinkedIn",
    href: "#",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
        <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" />
        <circle cx="4" cy="4" r="2" />
      </svg>
    ),
    bg: "bg-[#0077b5]",
  },
  {
    label: "Instagram",
    href: "#",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="2"
      >
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="white" stroke="none" />
      </svg>
    ),
    bg: "bg-gradient-to-br from-[#f09433] via-[#e6683c] to-[#dc2743]",
  },
  {
    label: "Facebook",
    href: "#",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
        <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
      </svg>
    ),
    bg: "bg-[#1877f2]",
  },
  {
    label: "X / Twitter",
    href: "#",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    bg: "bg-black",
  },
];

export default function Footer() {
  return (
    <footer className="bg-footer pt-16 pb-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-3 mb-5">
              <div className="w-14 h-14 rounded-full bg-primary-soft border-2 border-accent flex items-center justify-center">
                <svg
                  width="28"
                  height="28"
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
              <div>
                <p className="text-white font-bold text-base tracking-[0.2em] uppercase">
                  KEYZ
                </p>
                <p className="text-white/40 text-xs tracking-widest uppercase">
                  Estate
                </p>
              </div>
            </Link>

            {/* Social icons */}
            <div className="flex items-center gap-2 mt-4">
              {SOCIALS.map(({ label, href, icon, bg }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className={`w-8 h-8 rounded-full ${bg} flex items-center justify-center hover:opacity-80 transition-opacity`}
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Nav columns */}
          {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
            <div key={heading}>
              <p className="text-white font-bold text-base mb-4">{heading}</p>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    <Link
                      href="#"
                      className="text-white/50 text-base hover:text-accent transition-colors"
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 pt-6 text-center">
          <p className="text-white/30 text-sm">
            © 2026 Keyz Real Estate. All rights reserved
          </p>
        </div>
      </div>
    </footer>
  );
}

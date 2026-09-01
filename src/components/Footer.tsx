"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import relloLogo from "../../public/rello-logo-cropped.svg";

const FOOTER_LINKS = [
  { label: "Why Rello", href: "/#why-rello" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Cities", href: "/#cities" },
  { label: "Waitlist", href: "/waitlist" },
];

const SOCIALS = [
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/rello-jbr/",
    icon: "icon-[line-md--linkedin]",
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/rello.jbr?utm_source=qr",
    icon: "icon-[line-md--instagram]",
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/profile.php?id=61590472272578",
    icon: "icon-[line-md--facebook]",
  },
  {
    label: "X / Twitter",
    href: "https://x.com/rello_online",
    icon: "icon-[line-md--twitter-x]",
  },
];

export default function Footer() {
  const [iconReplayKey, setIconReplayKey] = useState<Record<string, number>>({});

  function replayIcon(label: string): void {
    setIconReplayKey((current) => ({
      ...current,
      [label]: (current[label] ?? 0) + 1,
    }));
  }

  return (
    <footer id="footer" className="bg-footer py-10 pl-2 pr-2 text-white sm:pr-3 lg:pr-4 lg:pl-4">
      <div className="mx-auto max-w-[calc(100vw-1rem)]">
        <div className="grid justify-items-center gap-8 border-b border-white/20 pb-8 text-center lg:grid-cols-[1fr_auto] lg:items-end lg:justify-items-stretch lg:text-left">
          <Link
            href="/"
            className="inline-flex w-fit justify-center transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-accent lg:justify-start"
          >
            <Image
              src={relloLogo}
              alt="Rello"
              className="h-44 w-[26rem] max-w-[calc(100vw-0.5rem)] object-contain sm:h-48 sm:w-[30rem]"
            />
          </Link>

          <nav aria-label="Footer navigation">
            <ul className="flex flex-wrap justify-center gap-x-7 gap-y-3 lg:justify-end">
              {FOOTER_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="font-accent text-xs font-bold uppercase tracking-[0.22em] text-white/65 transition-all duration-200 ease-in-out hover:text-accent focus:outline-none focus-visible:text-accent"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="grid gap-6 pt-6 text-sm text-white/50 sm:grid-cols-[1fr_auto] sm:items-center">
          <p>© 2026 Rello. All rights reserved.</p>

          <div className="flex items-center gap-2 sm:justify-end">
            {SOCIALS.map(({ label, href, icon }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                onMouseEnter={() => replayIcon(label)}
                onFocus={() => replayIcon(label)}
                className="flex h-10 w-10 items-center justify-center border border-white/20 text-white transition-all duration-200 ease-in-out hover:border-accent hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <span
                  key={`${label}-${iconReplayKey[label] ?? 0}`}
                  className={`${icon} h-5 w-5`}
                  aria-hidden="true"
                />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

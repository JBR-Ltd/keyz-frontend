"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type ReactElement } from "react";
import relloLogoMark from "../../public/rello-logo-cropped.svg";

interface FooterLink {
  href: string;
  label: string;
}

interface FooterProps {
  cityLinks?: FooterLink[];
}

const MARKETPLACE_LINKS = [
  { label: "Browse homes", href: "/browse" },
  { label: "List a property", href: "/register?role=LANDLORD" },
  { label: "Create account", href: "/register?role=TENANT" },
  { label: "Log in", href: "/login" },
];

const COMPANY_LINKS = [
  { label: "How it works", href: "/#how-it-works" },
  { label: "Waitlist", href: "/waitlist" },
  { label: "Policies", href: "/policies" },
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

export default function Footer({ cityLinks = [] }: FooterProps): ReactElement {
  const [iconReplayKey, setIconReplayKey] = useState<Record<string, number>>(
    {},
  );

  function replayIcon(label: string): void {
    setIconReplayKey((current) => ({
      ...current,
      [label]: (current[label] ?? 0) + 1,
    }));
  }

  return (
    <footer
      id="footer"
      className="bg-footer px-5 py-10 text-white sm:px-8 sm:py-12 lg:px-10"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-x-10 gap-y-8 border-b border-white/15 pb-9 sm:grid-cols-2 lg:grid-cols-[1.25fr_1fr_1fr_1fr]">
          <div className="max-w-sm sm:col-span-2 lg:col-span-1">
            <Link
              href="/"
              aria-label="Rello home"
              className="inline-flex items-center gap-3 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-lg bg-primary">
                <Image
                  src={relloLogoMark}
                  alt=""
                  aria-hidden="true"
                  className="h-9 w-9 object-contain"
                />
              </span>
              <span>
                <span className="block font-display text-2xl font-bold leading-none">
                  Rello
                </span>
                <span className="mt-1 block font-body text-[10px] font-medium uppercase tracking-[0.18em] text-white/55">
                  Find a home
                </span>
              </span>
            </Link>
            <p className="mt-4 font-body text-sm leading-6 text-white/60">
              Verified rentals, clearer terms, and one place to manage the move.
            </p>
          </div>

          <FooterSection title="Marketplace" links={MARKETPLACE_LINKS} />
          <FooterSection title="Rello" links={COMPANY_LINKS} />
          {cityLinks.length > 0 ? (
            <FooterSection title="Explore cities" links={cityLinks} />
          ) : (
            <div>
              <h2 className="font-accent text-xs font-bold uppercase tracking-[0.2em] text-white/45">
                Find your next home
              </h2>
              <Link
                href="/browse"
                className="mt-4 inline-flex min-h-11 items-center font-body text-sm font-semibold text-white/75 hover:text-accent focus:outline-none focus-visible:text-accent"
              >
                Open the catalogue
              </Link>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-5 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-body text-sm text-white/45">
            © 2026 Rello. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            {SOCIALS.map(({ label, href, icon }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                target="_blank"
                rel="noreferrer"
                onMouseEnter={() => replayIcon(label)}
                onFocus={() => replayIcon(label)}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:border-accent hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
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

function FooterSection({
  links,
  title,
}: {
  links: FooterLink[];
  title: string;
}): ReactElement {
  return (
    <nav aria-label={title}>
      <h2 className="font-accent text-xs font-bold uppercase tracking-[0.2em] text-white/45">
        {title}
      </h2>
      <ul className="mt-3 space-y-1">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="inline-flex min-h-11 items-center font-body text-sm font-semibold text-white/75 transition-colors hover:text-accent focus:outline-none focus-visible:text-accent"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

import type { ReactElement } from "react";
import { Briefcase, Camera, Send } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import relloLogo from "../../public/rello-logo-cropped.svg";

const FOOTER_LINKS = [
  { label: "Why Rello", href: "/#why-rello" },
  { label: "Cities", href: "/#cities" },
  { label: "How it Works", href: "/#how-it-works" },
  { label: "Contact", href: "/#footer" },
];

const SOCIALS = [
  { label: "Twitter/X", href: "https://x.com/rello_online", Icon: Send },
  { label: "Instagram", href: "https://www.instagram.com/rello.jbr?utm_source=qr", Icon: Camera },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/rello-jbr/", Icon: Briefcase },
];

export default function Footer(): ReactElement {
  return (
    <footer id="footer" className="bg-primary px-4 py-16 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-3">
          <div>
            <Link href="/" className="inline-flex transition-all duration-200 ease-in-out hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]">
              <Image src={relloLogo} alt="Rello" width={160} height={64} className="h-16 w-40 object-contain brightness-0 invert" />
            </Link>
            <p className="mt-3 max-w-xs font-body text-sm text-white/60">
              Nigeria&apos;s trusted rental platform
            </p>
          </div>

          <nav aria-label="Quick links">
            <p className="font-body text-sm font-medium text-white">Quick links</p>
            <ul className="mt-4 grid gap-3">
              {FOOTER_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="font-body text-sm text-white/70 transition-all duration-200 ease-in-out hover:text-white focus:outline-none focus-visible:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="lg:justify-self-end">
            <p className="font-body text-sm font-medium text-white">Social</p>
            <div className="mt-4 flex items-center gap-4">
              {SOCIALS.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="text-white/60 transition-all duration-200 ease-in-out hover:scale-[1.1] hover:text-white focus:outline-none focus-visible:text-white"
                >
                  <Icon size={20} aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-4 border-t border-white/10 pt-8 font-body text-sm text-white/40 sm:grid-cols-[1fr_auto] sm:items-center">
          <p>© 2026 Rello. All rights reserved.</p>
          <p>Made for Nigeria 🇳🇬</p>
        </div>
      </div>
    </footer>
  );
}

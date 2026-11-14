"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { LayoutDashboard, Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactElement } from "react";
import { useAuthentication } from "@/components/auth/AuthProvider";
import type { AccountRole } from "@/lib/authSession";
import relloLogoMark from "../../public/rello-logo-cropped.svg";

const NAV_LINKS = [
  { label: "Browse", href: "/browse", sectionId: null },
  {
    label: "How it works",
    href: "/#how-it-works",
    sectionId: "how-it-works",
  },
  { label: "For hosts", href: "/#for-hosts", sectionId: "for-hosts" },
  { label: "Waitlist", href: "/waitlist", sectionId: null },
] as const;

const LANDING_SECTION_IDS = ["how-it-works", "for-hosts"] as const;

type LandingSectionId = (typeof LANDING_SECTION_IDS)[number];

function dashboardPath(role: AccountRole): string {
  return role === "TENANT"
    ? "/tenant/bookings"
    : `/${role.toLowerCase()}/dashboard`;
}

export default function Navbar(): ReactElement {
  const authentication = useAuthentication();
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<LandingSectionId | null>(
    null,
  );
  const role = authentication.user?.role ?? null;
  const currentActiveSection = pathname === "/" ? activeSection : null;

  const closeMenu = (): void => setMenuOpen(false);
  const isActiveSection = (sectionId: LandingSectionId | null): boolean =>
    sectionId !== null && sectionId === currentActiveSection;
  const isActiveLink = (
    href: string,
    sectionId: LandingSectionId | null,
  ): boolean =>
    isActiveSection(sectionId) ||
    (href === "/waitlist" &&
      (pathname === "/waitlist" || pathname === "/marketing/waitlist"));
  const activeLinkCurrent = (
    href: string,
    sectionId: LandingSectionId | null,
  ): "location" | "page" | undefined => {
    if (!isActiveLink(href, sectionId)) return undefined;

    return href === "/waitlist" ? "page" : "location";
  };

  useEffect(() => {
    if (!menuOpen) return;

    function closeOnEscape(event: KeyboardEvent): void {
      if (event.key === "Escape") setMenuOpen(false);
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  useEffect(() => {
    if (pathname !== "/") return;

    const sections = LANDING_SECTION_IDS.map((sectionId) => ({
      element: document.getElementById(sectionId),
      sectionId,
    })).filter(
      (
        section,
      ): section is { element: HTMLElement; sectionId: LandingSectionId } =>
        section.element !== null,
    );
    const visibleSections = new Map<LandingSectionId, number>();

    function syncHash(): void {
      const hash = window.location.hash.slice(1);
      const sectionId = LANDING_SECTION_IDS.find((id) => id === hash) ?? null;

      if (sectionId) setActiveSection(sectionId);
    }

    syncHash();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const sectionId = entry.target.id as LandingSectionId;

          if (entry.isIntersecting) {
            visibleSections.set(sectionId, entry.intersectionRatio);
          } else {
            visibleSections.delete(sectionId);
          }
        }

        const mostVisibleSection = [...visibleSections.entries()].sort(
          ([, firstRatio], [, secondRatio]) => secondRatio - firstRatio,
        )[0]?.[0];

        if (mostVisibleSection) {
          setActiveSection(mostVisibleSection);
        } else if (
          window.scrollY <
          (sections[0]?.element.offsetTop ?? 0) - 64
        ) {
          setActiveSection(null);
        }
      },
      {
        rootMargin: "-64px 0px -45% 0px",
        threshold: [0, 0.25, 0.5, 0.75],
      },
    );

    for (const section of sections) observer.observe(section.element);
    window.addEventListener("hashchange", syncHash);
    window.addEventListener("popstate", syncHash);

    return () => {
      observer.disconnect();
      window.removeEventListener("hashchange", syncHash);
      window.removeEventListener("popstate", syncHash);
    };
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg shadow-[0_8px_24px_-24px_rgba(4,52,76,0.55)]">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-5 sm:px-8 lg:px-10">
        <Link
          href="/"
          aria-label="Rello home"
          className="flex shrink-0 items-center gap-3 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          onClick={closeMenu}
        >
          <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-primary">
            <Image
              src={relloLogoMark}
              alt=""
              aria-hidden="true"
              className="h-8 w-8 object-contain"
              priority
            />
          </span>
          <span className="hidden font-display text-2xl font-bold leading-none text-primary sm:block">
            Rello
          </span>
        </Link>

        <nav
          aria-label="Primary navigation"
          className="ml-auto hidden lg:block"
        >
          <ul className="flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  aria-current={activeLinkCurrent(link.href, link.sectionId)}
                  className={`inline-flex min-h-11 items-center border-b-2 px-3 font-body text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                    isActiveLink(link.href, link.sectionId)
                      ? "border-accent text-primary"
                      : "border-transparent text-muted hover:border-accent/50 hover:text-primary"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto hidden shrink-0 items-center gap-2 sm:flex lg:ml-4">
          {authentication.status === "checking" ? (
            <div
              className="h-11 w-36 animate-pulse rounded-full bg-skeleton motion-reduce:animate-none"
              role="status"
              aria-label="Loading account actions"
            />
          ) : role ? (
            <Link
              href={dashboardPath(role)}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 font-body text-sm font-bold text-white transition-colors hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <LayoutDashboard size={17} aria-hidden="true" />
              {role === "TENANT" ? "My home" : "Dashboard"}
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex min-h-11 items-center justify-center rounded-full px-4 font-body text-sm font-bold text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Log in
              </Link>
              <Link
                href="/register?role=TENANT"
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-5 font-body text-sm font-bold text-white transition-colors hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Create account
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="landing-mobile-navigation"
          onClick={() => setMenuOpen((open) => !open)}
          className="ml-auto flex h-11 w-11 items-center justify-center rounded-full border border-border text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:ml-0 lg:hidden"
        >
          {menuOpen ? (
            <X size={20} aria-hidden="true" />
          ) : (
            <Menu size={20} aria-hidden="true" />
          )}
        </button>
      </div>

      <AnimatePresence>
        {menuOpen ? (
          <motion.nav
            id="landing-mobile-navigation"
            aria-label="Mobile navigation"
            className="absolute inset-x-0 top-full border-b border-border bg-bg px-5 pb-6 pt-3 shadow-lg sm:px-8 lg:hidden"
            initial={reduceMotion ? false : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: reduceMotion ? 0 : 0.18 }}
          >
            <ul className="space-y-1">
              {NAV_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    onClick={closeMenu}
                    aria-current={activeLinkCurrent(link.href, link.sectionId)}
                    className={`flex min-h-12 items-center rounded-r-lg border-l-2 px-4 font-body text-base font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                      isActiveLink(link.href, link.sectionId)
                        ? "border-accent bg-accent/10 text-primary"
                        : "border-transparent text-primary hover:bg-surface-soft"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-4 grid gap-2 border-t border-border pt-4">
              {authentication.status === "checking" ? (
                <div className="h-11 animate-pulse rounded-full bg-skeleton motion-reduce:animate-none" />
              ) : role ? (
                <Link
                  href={dashboardPath(role)}
                  onClick={closeMenu}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 font-body text-sm font-bold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <LayoutDashboard size={17} aria-hidden="true" />
                  {role === "TENANT" ? "My home" : "Dashboard"}
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={closeMenu}
                    className="inline-flex min-h-11 items-center justify-center rounded-full border border-primary px-5 font-body text-sm font-bold text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/register?role=TENANT"
                    onClick={closeMenu}
                    className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-5 font-body text-sm font-bold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    Create account
                  </Link>
                </>
              )}
            </div>
          </motion.nav>
        ) : null}
      </AnimatePresence>
    </header>
  );
}

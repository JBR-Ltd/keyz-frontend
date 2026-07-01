"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Bookmark,
  CalendarDays,
  ChevronRight,
  Landmark,
  LayoutDashboard,
  Menu,
  Scale,
  Star,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import relloLogoMark from "../../../public/rello-logo-cropped.svg";

const TENANT_NAV_ITEMS = [
  { label: "Dashboard", href: "/tenant/dashboard", icon: LayoutDashboard },
  { label: "Bookings", href: "/tenant/bookings", icon: CalendarDays },
  { label: "Escrow", href: "/tenant/escrow", icon: Landmark },
  { label: "Disputes", href: "/tenant/disputes", icon: Scale },
  { label: "Ratings", href: "/tenant/ratings", icon: Star },
  { label: "Saved Listings", href: "/tenant/saved-listings", icon: Bookmark },
];

interface TenantSidebarProps {
  isCollapsed: boolean;
  onCollapseToggle: () => void;
}

interface TenantLogoProps {
  isCollapsed?: boolean;
  onCollapseToggle?: () => void;
}

function TenantLogoButton({
  isCollapsed = false,
  onCollapseToggle,
}: TenantLogoProps) {
  return (
    <button
      type="button"
      onClick={onCollapseToggle}
      className={`flex rounded-xl transition-all duration-200 ease-in-out hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
        isCollapsed
          ? "mx-auto h-12 w-12 items-center justify-center p-0"
          : "w-full items-center gap-3 p-2 text-left"
      }`}
      aria-label={
        isCollapsed ? "Expand tenant sidebar" : "Collapse tenant sidebar"
      }
    >
      <span
        className={`flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/10 ${
          isCollapsed ? "h-10 w-10" : "h-11 w-11"
        }`}
      >
        <Image
          src={relloLogoMark}
          alt=""
          aria-hidden="true"
          className={
            isCollapsed ? "h-8 w-8 object-contain" : "h-9 w-9 object-contain"
          }
          priority
        />
      </span>
      <span
        className={`min-w-0 overflow-hidden transition-all duration-300 ease-in-out ${
          isCollapsed ? "pointer-events-none w-0 opacity-0" : "w-40 opacity-100"
        }`}
      >
        <span className="block whitespace-nowrap font-display text-2xl font-bold leading-none text-white">
          Rello
        </span>
        <span className="mt-1 block whitespace-nowrap font-body text-xs font-medium uppercase tracking-[0.14em] text-white/55">
          Tenant portal
        </span>
      </span>
    </button>
  );
}

function TenantLogoLink() {
  return (
    <Link
      href="/tenant/dashboard"
      className="flex items-center gap-3 rounded-xl p-2 transition-all duration-200 ease-in-out hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      aria-label="Rello tenant dashboard"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/10">
        <Image
          src={relloLogoMark}
          alt=""
          aria-hidden="true"
          className="h-9 w-9 object-contain"
          priority
        />
      </span>
      <span className="min-w-0">
        <span className="block font-display text-2xl font-bold leading-none text-white">
          Rello
        </span>
        <span className="mt-1 block font-body text-xs font-medium uppercase tracking-[0.14em] text-white/55">
          Tenant portal
        </span>
      </span>
    </Link>
  );
}

interface TenantNavigationProps {
  isCollapsed?: boolean;
  onNavigate?: () => void;
}

function TenantNavigation({
  isCollapsed = false,
  onNavigate,
}: TenantNavigationProps) {
  const pathname = usePathname();

  return (
    <nav
      className={`flex-1 overflow-y-auto py-6 ${isCollapsed ? "px-3" : "px-4"}`}
      aria-label="Tenant navigation"
    >
      <ul className="space-y-1">
        {TENANT_NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href;

          return (
            <li key={href} className="relative">
              <Link
                href={href}
                onClick={onNavigate}
                aria-current={isActive ? "page" : undefined}
                aria-label={isCollapsed ? label : undefined}
                className={`group relative flex min-h-12 items-center rounded-xl font-body text-sm font-medium transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  isCollapsed ? "justify-center px-3 py-3" : "gap-3 px-4 py-3"
                } ${
                  isActive
                    ? "bg-accent text-white shadow-md"
                    : "text-white/80 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon
                  size={19}
                  strokeWidth={1.8}
                  className={
                    isActive
                      ? "shrink-0 text-white"
                      : "shrink-0 text-white/60 transition-colors duration-200 group-hover:text-white"
                  }
                />
                <span
                  className={`overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out ${
                    isCollapsed ? "w-0 opacity-0" : "w-40 opacity-100"
                  }`}
                >
                  {label}
                </span>
                {isCollapsed ? (
                  <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 rounded-lg bg-white px-3 py-2 font-body text-xs font-bold text-primary opacity-0 shadow-lg transition-all duration-200 ease-in-out group-hover:translate-x-1 group-hover:opacity-100">
                    {label}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

interface TenantProfileCardProps {
  isCollapsed?: boolean;
  onNavigate?: () => void;
}

function TenantProfileCard({
  isCollapsed = false,
  onNavigate,
}: TenantProfileCardProps) {
  const pathname = usePathname();
  const isSettingsActive = pathname.startsWith("/tenant/settings");

  return (
    <div
      className={`border-t border-white/10 p-4 ${isCollapsed ? "px-2" : ""}`}
    >
      <Link
        href="/tenant/settings"
        onClick={onNavigate}
        aria-current={isSettingsActive ? "page" : undefined}
        aria-label={isCollapsed ? "Tenant settings" : undefined}
        className={`group relative grid items-center rounded-2xl transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
          isCollapsed
            ? "mx-auto h-12 w-12 grid-cols-1 justify-items-center p-0"
            : "grid-cols-[3rem_1fr_auto] gap-3 p-3"
        } ${
          isSettingsActive
            ? "bg-accent text-white shadow-md"
            : "bg-white/5 text-white hover:bg-white/10 hover:shadow-sm"
        }`}
      >
        <span
          className={`flex items-center justify-center rounded-xl bg-white/15 font-body text-sm font-bold text-white ${
            isCollapsed ? "h-10 w-10" : "h-12 w-12"
          }`}
        >
          AO
        </span>
        <span
          className={`min-w-0 overflow-hidden transition-all duration-300 ease-in-out ${
            isCollapsed
              ? "pointer-events-none w-0 opacity-0"
              : "w-full opacity-100"
          }`}
        >
          <span className="block truncate font-body text-sm font-bold">
            Amara Okafor
          </span>
          <span className="mt-1 block font-body text-xs text-white/65">
            Tenant
          </span>
        </span>
        {!isCollapsed ? (
          <ChevronRight size={18} className="text-white/65" />
        ) : (
          <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 rounded-lg bg-white px-3 py-2 font-body text-xs font-bold text-primary opacity-0 shadow-lg transition-all duration-200 ease-in-out group-hover:translate-x-1 group-hover:opacity-100">
            Settings
          </span>
        )}
      </Link>
    </div>
  );
}

export default function TenantSidebar({
  isCollapsed,
  onCollapseToggle,
}: TenantSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden overflow-visible flex-col border-r border-white/10 bg-primary shadow-sm transition-all duration-300 ease-in-out lg:flex ${
          isCollapsed ? "w-20" : "w-72"
        }`}
      >
        <div
          className={`border-b border-white/10 py-6 ${isCollapsed ? "px-2" : "px-3"}`}
        >
          <TenantLogoButton
            isCollapsed={isCollapsed}
            onCollapseToggle={onCollapseToggle}
          />
        </div>
        <TenantNavigation isCollapsed={isCollapsed} />
        <TenantProfileCard isCollapsed={isCollapsed} />
      </aside>

      <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-white/10 bg-primary px-4 lg:hidden">
        <TenantLogoLink />
        <button
          type="button"
          aria-label={isOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={isOpen}
          onClick={() => setIsOpen((current) => !current)}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-white transition-all duration-200 ease-in-out hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {isOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </header>

      <AnimatePresence>
        {isOpen ? (
          <>
            <motion.button
              type="button"
              aria-label="Close navigation"
              className="fixed inset-0 z-40 bg-primary/40 backdrop-blur-sm lg:hidden"
              onClick={() => setIsOpen(false)}
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={reduceMotion ? undefined : { opacity: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0 }}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 flex w-[min(86vw,22rem)] flex-col rounded-r-2xl border-r border-white/10 bg-primary shadow-2xl lg:hidden"
              initial={reduceMotion ? false : { x: "-100%" }}
              animate={reduceMotion ? undefined : { x: 0 }}
              exit={reduceMotion ? undefined : { x: "-100%" }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <div className="flex h-20 items-center justify-between border-b border-white/10 px-5">
                <TenantLogoLink />
                <button
                  type="button"
                  aria-label="Close navigation"
                  onClick={() => setIsOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white transition-all duration-200 ease-in-out hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <X size={20} />
                </button>
              </div>
              <TenantNavigation onNavigate={() => setIsOpen(false)} />
              <TenantProfileCard onNavigate={() => setIsOpen(false)} />
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}

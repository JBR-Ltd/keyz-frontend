"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Menu,
  Settings,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import relloLogo from "../../../public/rello-logo.svg";

interface RoleSidebarProps {
  rolePath: "landlord" | "agent" | "admin";
  roleLabel: string;
  isCollapsed: boolean;
  onCollapseToggle: () => void;
}

export default function RoleSidebar({
  rolePath,
  roleLabel,
  isCollapsed,
  onCollapseToggle,
}: RoleSidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const dashboardHref = `/${rolePath}/dashboard`;
  const settingsHref = `/${rolePath}/settings`;
  const isSettingsActive = pathname.startsWith(settingsHref);

  const renderNavigation = (collapsed: boolean) => (
    <>
      <nav
        className={`flex-1 py-8 ${collapsed ? "px-3" : "px-5"}`}
        aria-label={`${roleLabel} navigation`}
      >
        {collapsed ? null : (
          <p className="mb-5 px-4 font-accent text-xs font-bold uppercase tracking-[0.3em] text-white/50">
            {roleLabel}
          </p>
        )}
        <Link
          href={dashboardHref}
          onClick={() => setIsOpen(false)}
          title={collapsed ? "Dashboard" : undefined}
          className={`flex items-center py-4 font-accent text-xs font-bold uppercase tracking-[0.18em] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
            collapsed ? "justify-center px-3" : "gap-4 px-4"
          } ${
            pathname === dashboardHref
              ? "bg-accent text-primary"
              : "text-white/65 hover:bg-white/[0.12] hover:text-white"
          }`}
        >
          <LayoutDashboard size={20} strokeWidth={1.8} />
          {collapsed ? <span className="sr-only">Dashboard</span> : "Dashboard"}
        </Link>
      </nav>

      <Link
        href={settingsHref}
        onClick={() => setIsOpen(false)}
        title={collapsed ? "Settings" : undefined}
        className={`items-center border-t border-white/20 py-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent ${
          collapsed
            ? "flex justify-center px-3"
            : "grid grid-cols-[3rem_1fr_auto] gap-3 px-5"
        } ${
          isSettingsActive
            ? "bg-accent text-primary"
            : "text-white hover:bg-white/[0.12]"
        }`}
      >
        <span
          className={`flex h-12 w-12 items-center justify-center border ${
            isSettingsActive
              ? "border-primary"
              : "border-white/30 bg-white/[0.12]"
          }`}
        >
          <Settings size={20} />
        </span>
        {collapsed ? (
          <span className="sr-only">Settings for Amara Okafor</span>
        ) : (
          <>
            <span>
              <span className="block font-body text-sm font-bold">
                Amara Okafor
              </span>
              <span
                className={`mt-1 block font-body text-xs ${
                  isSettingsActive ? "text-primary/70" : "text-white/50"
                }`}
              >
                {roleLabel}
              </span>
            </span>
            <ChevronRight size={18} />
          </>
        )}
      </Link>
    </>
  );

  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-accent bg-primary transition-[width] duration-200 ease-in-out lg:flex ${
          isCollapsed ? "w-24" : "w-72"
        }`}
      >
        <div
          className={`flex h-32 border-b border-white/20 ${
            isCollapsed
              ? "flex-col items-center justify-center gap-3 px-3"
              : "items-center justify-between gap-4 px-5"
          }`}
        >
          <Link
            href={dashboardHref}
            className={`flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              isCollapsed ? "justify-center" : "min-w-0 gap-3"
            }`}
            aria-label={`Rello ${roleLabel} dashboard`}
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center border border-accent bg-accent font-display text-2xl font-bold text-primary">
              R
            </span>
            {isCollapsed ? null : (
              <span className="min-w-0">
                <span className="block font-display text-2xl font-bold leading-none text-white">
                  Rello
                </span>
                <span className="mt-2 block font-accent text-[0.65rem] font-bold uppercase tracking-[0.24em] text-accent">
                  {roleLabel} portal
                </span>
              </span>
            )}
          </Link>
          <button
            type="button"
            onClick={onCollapseToggle}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="flex h-10 w-10 shrink-0 items-center justify-center border border-white/30 text-white hover:border-accent hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {isCollapsed ? (
              <ChevronRight size={18} />
            ) : (
              <ChevronLeft size={18} />
            )}
          </button>
        </div>
        {renderNavigation(isCollapsed)}
      </aside>

      <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-primary bg-[var(--color-bg)] px-4 lg:hidden">
        <Image src={relloLogo} alt="Rello" priority className="h-16 w-36" />
        <button
          type="button"
          aria-label={isOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={isOpen}
          onClick={() => setIsOpen((current) => !current)}
          className="flex h-12 w-12 items-center justify-center border border-primary text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      <AnimatePresence>
        {isOpen ? (
          <>
            <motion.button
              type="button"
              aria-label="Close navigation"
              className="fixed inset-0 z-40 bg-primary/70 lg:hidden"
              onClick={() => setIsOpen(false)}
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={reduceMotion ? undefined : { opacity: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0 }}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 flex w-[min(86vw,22rem)] flex-col border-r border-accent bg-primary lg:hidden"
              initial={reduceMotion ? false : { x: "-100%" }}
              animate={reduceMotion ? undefined : { x: 0 }}
              exit={reduceMotion ? undefined : { x: "-100%" }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <div className="flex h-20 items-center justify-between border-b border-white/20 px-5">
                <Image
                  src={relloLogo}
                  alt="Rello"
                  className="h-16 w-40 brightness-0 invert"
                />
                <button
                  type="button"
                  aria-label="Close navigation"
                  onClick={() => setIsOpen(false)}
                  className="flex h-11 w-11 items-center justify-center border border-white/40 text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <X size={20} />
                </button>
              </div>
              {renderNavigation(false)}
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}

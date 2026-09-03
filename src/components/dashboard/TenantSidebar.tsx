"use client";

import type { ReactElement, ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ChevronDown,
  House,
  LoaderCircle,
  LogOut,
  Menu,
  Search,
  Settings,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import OverlayPortal from "@/components/ui/OverlayPortal";
import { logOutAccount, useAuthenticatedUser } from "@/lib/account";
import { useDialogFocus } from "@/lib/useDialogFocus";
import relloLogoMark from "../../../public/rello-logo-cropped.svg";

const TENANT_NAV_ITEMS = [
  { label: "Browse", href: "/tenant/browse", icon: Search },
  { label: "My Home", href: "/tenant/bookings", icon: House },
];

interface TenantSidebarProps {
  actions: ReactNode;
}

interface TenantNavigationProps {
  onNavigate?: () => void;
  mobile?: boolean;
}

function TenantLogo(): ReactElement {
  return (
    <Link
      href="/tenant/browse"
      className="flex shrink-0 items-center gap-3 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      aria-label="Rello tenant portal"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary">
        <Image
          src={relloLogoMark}
          alt=""
          aria-hidden="true"
          className="h-9 w-9 object-contain"
          priority
        />
      </span>
      <span className="hidden min-w-0 sm:block">
        <span className="block font-display text-2xl font-bold leading-none text-primary">
          Rello
        </span>
        <span className="mt-1 block whitespace-nowrap font-body text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
          Tenant portal
        </span>
      </span>
    </Link>
  );
}

function TenantNavigation({
  onNavigate,
  mobile = false,
}: TenantNavigationProps): ReactElement {
  const pathname = usePathname();

  return (
    <nav aria-label="Tenant navigation">
      <ul
        className={
          mobile ? "space-y-2" : "flex h-20 items-stretch gap-1 xl:gap-3"
        }
      >
        {TENANT_NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href;

          return (
            <li key={href} className={mobile ? undefined : "flex"}>
              <Link
                href={href}
                onClick={onNavigate}
                aria-current={isActive ? "page" : undefined}
                className={
                  mobile
                    ? `flex min-h-12 items-center gap-3 rounded-xl px-4 py-3 font-body text-sm font-bold transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                        isActive
                          ? "bg-primary text-white"
                          : "text-primary hover:bg-primary/5"
                      }`
                    : `relative flex items-center gap-2 px-3 font-body text-sm font-bold transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent xl:px-4 ${
                        isActive
                          ? "text-primary after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-accent xl:after:inset-x-4"
                          : "text-muted hover:text-primary"
                      }`
                }
              >
                <Icon
                  size={18}
                  strokeWidth={1.8}
                  className={isActive ? "text-accent-alt" : "text-primary"}
                  aria-hidden="true"
                />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default function TenantSidebar({
  actions,
}: TenantSidebarProps): ReactElement {
  const pathname = usePathname();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const drawerRef = useDialogFocus<HTMLElement>(isMobileOpen);
  const { user } = useAuthenticatedUser();
  const profileName = user
    ? `${user.firstName} ${user.lastName}`.trim()
    : "Tenant";
  const profileInitials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    : "T";
  const isSettingsActive = pathname.startsWith("/tenant/settings");

  useEffect(() => {
    if (!isProfileOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent): void => {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      if (
        profileButtonRef.current?.contains(target) ||
        profileMenuRef.current?.contains(target)
      ) {
        return;
      }

      setIsProfileOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setIsProfileOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isProfileOpen]);

  useEffect(() => {
    if (!isMobileOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setIsMobileOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileOpen]);

  const handleLogout = async (): Promise<void> => {
    setIsLoggingOut(true);
    await logOutAccount();
    setIsProfileOpen(false);
    setIsMobileOpen(false);
    router.replace("/login");
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border bg-bg">
        <div className="mx-auto flex h-20 w-full max-w-[96rem] items-center gap-4 px-4 sm:px-6 lg:px-8">
          <TenantLogo />

          <div className="hidden min-w-0 flex-1 justify-center lg:flex">
            <TenantNavigation />
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
            {actions}

            <div className="relative hidden lg:block">
              <button
                ref={profileButtonRef}
                type="button"
                onClick={() => setIsProfileOpen((current) => !current)}
                aria-haspopup="menu"
                aria-expanded={isProfileOpen}
                className={`flex min-h-11 items-center gap-2 rounded-full p-1.5 pr-2 font-body text-sm text-primary transition-all duration-200 ease-in-out hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  isSettingsActive ? "bg-primary/5" : ""
                }`}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-body text-xs font-bold text-white">
                  {profileInitials}
                </span>
                <span className="hidden max-w-28 truncate font-bold xl:block">
                  {profileName}
                </span>
                <ChevronDown
                  size={16}
                  className={`text-muted transition-transform ${
                    isProfileOpen ? "rotate-180" : ""
                  }`}
                  aria-hidden="true"
                />
              </button>

              <AnimatePresence>
                {isProfileOpen ? (
                  <motion.div
                    ref={profileMenuRef}
                    role="menu"
                    className="absolute right-0 top-[calc(100%+0.75rem)] w-56 overflow-hidden rounded-xl border border-border bg-bg p-2 shadow-xl"
                    initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                    animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0, y: 8 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                  >
                    <Link
                      href="/tenant/settings"
                      role="menuitem"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-4 py-3 font-body text-sm font-medium text-primary transition-colors hover:bg-primary/5"
                    >
                      <Settings size={17} strokeWidth={1.9} />
                      Settings
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => void handleLogout()}
                      disabled={isLoggingOut}
                      className="mt-1 flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left font-body text-sm font-medium text-primary transition-colors hover:bg-primary/5 disabled:cursor-wait disabled:opacity-70"
                    >
                      {isLoggingOut ? (
                        <LoaderCircle className="animate-spin" size={17} />
                      ) : (
                        <LogOut size={17} strokeWidth={1.9} />
                      )}
                      {isLoggingOut ? "Logging out" : "Logout"}
                    </button>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            <button
              type="button"
              onClick={() => setIsMobileOpen(true)}
              aria-label="Open navigation"
              aria-expanded={isMobileOpen}
              className="flex h-10 w-10 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent lg:hidden"
            >
              <Menu size={21} aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <OverlayPortal>
        <AnimatePresence>
          {isMobileOpen ? (
            <>
              <motion.button
                type="button"
                aria-label="Close navigation"
                className="fixed inset-0 z-[100] bg-black/40 lg:hidden"
                onClick={() => setIsMobileOpen(false)}
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={reduceMotion ? undefined : { opacity: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0 }}
              />
              <motion.aside
                ref={drawerRef}
                role="dialog"
                aria-modal="true"
                aria-label="Tenant navigation"
                className="fixed inset-y-0 right-0 z-[110] flex w-[min(88vw,22rem)] flex-col border-l border-border bg-bg shadow-xl lg:hidden"
                initial={reduceMotion ? false : { x: "100%" }}
                animate={reduceMotion ? undefined : { x: 0 }}
                exit={reduceMotion ? undefined : { x: "100%" }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <div className="flex h-20 items-center justify-between border-b border-border px-5">
                  <TenantLogo />
                  <button
                    type="button"
                    onClick={() => setIsMobileOpen(false)}
                    aria-label="Close navigation"
                    className="flex h-10 w-10 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <X size={20} aria-hidden="true" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5">
                  <TenantNavigation
                    mobile
                    onNavigate={() => setIsMobileOpen(false)}
                  />
                </div>

                <div className="border-t border-border p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary font-body text-sm font-bold text-white">
                      {profileInitials}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-body text-sm font-bold text-primary">
                        {profileName}
                      </span>
                      <span className="mt-0.5 block font-body text-xs text-muted">
                        Tenant
                      </span>
                    </span>
                  </div>
                  <Link
                    href="/tenant/settings"
                    onClick={() => setIsMobileOpen(false)}
                    className="flex min-h-11 items-center gap-3 rounded-lg px-3 font-body text-sm font-medium text-primary transition-colors hover:bg-primary/5"
                  >
                    <Settings size={17} />
                    Settings
                  </Link>
                  <button
                    type="button"
                    onClick={() => void handleLogout()}
                    disabled={isLoggingOut}
                    className="mt-1 flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left font-body text-sm font-medium text-primary transition-colors hover:bg-primary/5 disabled:cursor-wait disabled:opacity-70"
                  >
                    {isLoggingOut ? (
                      <LoaderCircle className="animate-spin" size={17} />
                    ) : (
                      <LogOut size={17} />
                    )}
                    {isLoggingOut ? "Logging out" : "Logout"}
                  </button>
                </div>
              </motion.aside>
            </>
          ) : null}
        </AnimatePresence>
      </OverlayPortal>
    </>
  );
}

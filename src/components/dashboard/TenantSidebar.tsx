"use client";

import type { ReactElement, ReactNode } from "react";
import UserAvatar from "@/components/ui/user-avatar";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ChevronRight,
  CircleCheck,
  House,
  LifeBuoy,
  LoaderCircle,
  LogOut,
  Menu,
  Search,
  Settings,
  IdCard,
  UserRound,
  BellRing,
  ReceiptText,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import OverlayPortal from "@/components/ui/OverlayPortal";
import { PendingIconSwap, PendingLink } from "@/components/ui/pending-link";
import { logOutAccount, useAuthenticatedUser } from "@/lib/account";
import { subscribeTenantHeaderSearch } from "@/lib/tenantHeaderSearch";
import { useDialogFocus } from "@/lib/useDialogFocus";
import relloLogoMark from "../../../public/rello-logo-cropped.svg";

const TENANT_NAV_ITEMS = [
  { label: "Browse", href: "/browse", icon: Search },
  { label: "My Home", href: "/tenant/bookings", icon: House },
];

const TENANT_ACCOUNT_ITEMS = [
  { label: "Saved searches", href: "/tenant/saved-searches", icon: BellRing },
  { label: "Statement", href: "/tenant/statement", icon: ReceiptText },
  { label: "Settings", href: "/tenant/settings", icon: Settings },
  { label: "Help & support", href: "/tenant/support", icon: LifeBuoy },
];

function DrawerGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}): ReactElement {
  return (
    <section className="mb-6 last:mb-0">
      <h2 className="px-2 font-body text-xs font-bold uppercase tracking-[0.14em] text-muted">
        {title}
      </h2>
      <ul className="mt-2 grid gap-1">{children}</ul>
    </section>
  );
}

interface DrawerRowProps {
  href: string;
  icon: typeof Search;
  label: string;
  isActive: boolean;
  onNavigate: () => void;
}

function DrawerRow({
  href,
  icon: Icon,
  label,
  isActive,
  onNavigate,
}: DrawerRowProps): ReactElement {
  return (
    <li>
      <Link
        href={href}
        onClick={onNavigate}
        aria-current={isActive ? "page" : undefined}
        className={`flex min-h-13 items-center gap-3 rounded-xl px-2 py-1.5 font-body text-base font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
          isActive
            ? "bg-primary/5 text-primary"
            : "text-primary hover:bg-primary/5"
        }`}
      >
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            isActive ? "bg-primary text-accent" : "bg-surface-soft text-primary"
          }`}
        >
          <PendingIconSwap size={18}>
            <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
          </PendingIconSwap>
        </span>
        <span className="min-w-0 flex-1 truncate">{label}</span>
        <ChevronRight
          size={18}
          className="shrink-0 text-muted"
          aria-hidden="true"
        />
      </Link>
    </li>
  );
}

interface TenantSidebarProps {
  actions: ReactNode;
  showVerificationAction: boolean;
  verificationHref: string;
  verifiedStepCount: number;
}

function TenantLogo(): ReactElement {
  return (
    <Link
      href="/browse"
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

function TenantNavigation(): ReactElement {
  const pathname = usePathname();

  return (
    <nav aria-label="Tenant navigation">
      <ul className="flex h-20 items-stretch gap-1 xl:gap-3">
        {TENANT_NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href;

          return (
            <li key={href} className="flex">
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={`relative flex items-center gap-2 px-3 font-body text-sm font-bold transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent xl:px-4 ${
                  isActive
                    ? "text-primary after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-accent xl:after:inset-x-4"
                    : "text-muted hover:text-primary"
                }`}
              >
                <PendingIconSwap size={18}>
                  <Icon
                    size={18}
                    strokeWidth={1.8}
                    className={isActive ? "text-accent-alt" : "text-primary"}
                    aria-hidden="true"
                  />
                </PendingIconSwap>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

interface VerificationMenuCardProps {
  href: string;
  onNavigate: () => void;
  show: boolean;
  verifiedStepCount: number;
}

function VerificationMenuCard({
  href,
  onNavigate,
  show,
  verifiedStepCount,
}: VerificationMenuCardProps): ReactElement | null {
  if (!show) {
    return null;
  }

  return (
    <div className="mb-2 rounded-lg bg-accent/10 p-3">
      <div className="flex items-start gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
          <IdCard size={16} strokeWidth={2} aria-hidden="true" />
        </span>
        <span className="min-w-0">
          <span className="block font-body text-xs font-bold text-primary">
            Identity not verified
          </span>
          <span className="mt-1 block font-body text-[11px] leading-4 text-muted">
            {verifiedStepCount > 0
              ? `${verifiedStepCount} of 2 completed`
              : "Required to book"}
          </span>
        </span>
      </div>
      <PendingLink
        href={href}
        onClick={onNavigate}
        className="mt-3 flex min-h-9 items-center justify-center rounded-full bg-primary px-4 py-2 font-body text-xs font-bold text-white transition-colors hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        pendingLabel="Opening…"
        pendingClassName="min-h-9"
      >
        {verifiedStepCount > 0 ? "Continue verification" : "Verify identity"}
      </PendingLink>
    </div>
  );
}

export default function TenantSidebar({
  actions,
  showVerificationAction,
  verificationHref,
  verifiedStepCount,
}: TenantSidebarProps): ReactElement {
  const pathname = usePathname();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isHeaderSearchRequested, setIsHeaderSearchRequested] = useState(false);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const drawerRef = useDialogFocus<HTMLElement>(isMobileOpen);
  const { user } = useAuthenticatedUser();
  const isIdentityVerified = user?.identityVerified === true;
  const profileName = user
    ? `${user.firstName} ${user.lastName}`.trim()
    : "Tenant";
  const profileInitials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    : "T";
  const isAccountActive =
    pathname.startsWith("/tenant/profile") ||
    pathname.startsWith("/tenant/settings");
  const isHeaderSearchVisible =
    pathname === "/browse" && isHeaderSearchRequested;

  useEffect(() => {
    return subscribeTenantHeaderSearch(setIsHeaderSearchRequested);
  }, []);

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
        <div className="relative mx-auto flex h-20 w-full max-w-[96rem] items-center gap-4 px-4 sm:px-6 lg:px-8">
          <TenantLogo />

          <div className="hidden min-w-0 flex-1 lg:block" />
          <div className="absolute left-1/2 top-0 hidden h-20 -translate-x-1/2 lg:block">
            <motion.div
              className={`flex h-full items-stretch justify-center ${
                isHeaderSearchVisible ? "pointer-events-none" : ""
              }`}
              animate={{
                opacity: isHeaderSearchVisible ? 0 : 1,
                scale: isHeaderSearchVisible ? 0.96 : 1,
              }}
              transition={{
                duration: reduceMotion ? 0 : 0.2,
                ease: "easeOut",
              }}
              aria-hidden={isHeaderSearchVisible}
            >
              <TenantNavigation />
            </motion.div>
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-1">
            {actions}

            <div className="relative hidden lg:block">
              <button
                ref={profileButtonRef}
                type="button"
                onClick={() => setIsProfileOpen((current) => !current)}
                aria-haspopup="menu"
                aria-expanded={isProfileOpen}
                aria-label="Open account menu"
                title="Account menu"
                className={`flex h-10 w-10 items-center justify-center rounded-full text-primary transition-all duration-200 ease-in-out hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  isAccountActive ? "bg-primary/5" : ""
                }`}
              >
                <UserAvatar
                  avatarUrl={user?.avatarUrl}
                  className="h-8 w-8 text-xs"
                  initials={profileInitials}
                  sizes="32px"
                >
                  {showVerificationAction ? (
                    <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-accent ring-2 ring-bg" />
                  ) : null}
                </UserAvatar>
              </button>

              <AnimatePresence>
                {isProfileOpen ? (
                  <motion.div
                    ref={profileMenuRef}
                    role="menu"
                    className="absolute right-0 top-[calc(100%+0.75rem)] w-64 overflow-hidden rounded-xl border border-border bg-bg p-2 shadow-xl"
                    initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                    animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0, y: 8 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                  >
                    <VerificationMenuCard
                      href={verificationHref}
                      onNavigate={() => setIsProfileOpen(false)}
                      show={showVerificationAction}
                      verifiedStepCount={verifiedStepCount}
                    />
                    <Link
                      href="/tenant/saved-searches"
                      role="menuitem"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-4 py-3 font-body text-sm font-medium text-primary transition-colors hover:bg-primary/5"
                    >
                      <PendingIconSwap size={17}>
                        <BellRing size={17} strokeWidth={1.9} />
                      </PendingIconSwap>
                      Saved searches
                    </Link>
                    <Link
                      href="/tenant/statement"
                      role="menuitem"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-4 py-3 font-body text-sm font-medium text-primary transition-colors hover:bg-primary/5"
                    >
                      <PendingIconSwap size={17}>
                        <ReceiptText size={17} strokeWidth={1.9} />
                      </PendingIconSwap>
                      Statement
                    </Link>
                    <Link
                      href="/tenant/profile"
                      role="menuitem"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-4 py-3 font-body text-sm font-medium text-primary transition-colors hover:bg-primary/5"
                    >
                      <PendingIconSwap size={17}>
                        <UserRound size={17} strokeWidth={1.9} />
                      </PendingIconSwap>
                      Profile
                    </Link>
                    <Link
                      href="/tenant/settings"
                      role="menuitem"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-4 py-3 font-body text-sm font-medium text-primary transition-colors hover:bg-primary/5"
                    >
                      <PendingIconSwap size={17}>
                        <Settings size={17} strokeWidth={1.9} />
                      </PendingIconSwap>
                      Settings
                    </Link>
                    <Link
                      href="/tenant/support"
                      role="menuitem"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-4 py-3 font-body text-sm font-medium text-primary transition-colors hover:bg-primary/5"
                    >
                      <PendingIconSwap size={17}>
                        <LifeBuoy size={17} strokeWidth={1.9} />
                      </PendingIconSwap>
                      Help & support
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
                className="modal-backdrop fixed inset-0 z-[100] lg:hidden"
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
                <div className="flex items-center gap-3 border-b border-border px-5 py-5">
                  <Link
                    href="/tenant/profile"
                    onClick={() => setIsMobileOpen(false)}
                    className="flex min-w-0 flex-1 items-center gap-3 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <UserAvatar
                      avatarUrl={user?.avatarUrl}
                      className="h-12 w-12 text-sm"
                      initials={profileInitials}
                      sizes="48px"
                    />
                    <span className="min-w-0">
                      <span className="flex min-w-0 items-center gap-1.5">
                        <span className="truncate font-body text-base font-bold text-primary">
                          {profileName}
                        </span>
                        {isIdentityVerified ? (
                          <CircleCheck
                            size={18}
                            strokeWidth={2.2}
                            className="shrink-0 fill-emerald-600 text-white"
                            aria-label="Identity verified"
                          />
                        ) : null}
                      </span>
                      <span className="mt-0.5 block font-body text-xs text-muted">
                        View profile
                      </span>
                    </span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setIsMobileOpen(false)}
                    aria-label="Close navigation"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <X size={20} aria-hidden="true" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-5">
                  {showVerificationAction ? (
                    <PendingLink
                      href={verificationHref}
                      onClick={() => setIsMobileOpen(false)}
                      className="mb-6 flex items-center gap-3 rounded-2xl bg-accent/10 p-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      pendingLabel="Opening…"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                        <IdCard size={18} strokeWidth={2} aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-body text-sm font-bold text-primary">
                          {verifiedStepCount > 0
                            ? "Continue verification"
                            : "Verify your identity"}
                        </span>
                        <span className="block font-body text-xs text-muted">
                          {verifiedStepCount > 0
                            ? `${verifiedStepCount} of 2 completed`
                            : "You need this before you book"}
                        </span>
                      </span>
                      <ChevronRight
                        size={18}
                        className="shrink-0 text-primary"
                        aria-hidden="true"
                      />
                    </PendingLink>
                  ) : null}

                  <DrawerGroup title="Explore">
                    {TENANT_NAV_ITEMS.map(({ label, href, icon }) => (
                      <DrawerRow
                        key={href}
                        href={href}
                        icon={icon}
                        label={label}
                        isActive={pathname === href}
                        onNavigate={() => setIsMobileOpen(false)}
                      />
                    ))}
                  </DrawerGroup>

                  <DrawerGroup title="Account">
                    {TENANT_ACCOUNT_ITEMS.map(({ label, href, icon }) => (
                      <DrawerRow
                        key={href}
                        href={href}
                        icon={icon}
                        label={label}
                        isActive={pathname.startsWith(href)}
                        onNavigate={() => setIsMobileOpen(false)}
                      />
                    ))}
                  </DrawerGroup>
                </div>

                <div className="border-t border-border p-4">
                  <button
                    type="button"
                    onClick={() => void handleLogout()}
                    disabled={isLoggingOut}
                    className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-red-700/20 font-body text-sm font-bold text-red-700 transition-colors hover:bg-red-700/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-70"
                  >
                    {isLoggingOut ? (
                      <LoaderCircle className="animate-spin" size={17} />
                    ) : (
                      <LogOut size={17} aria-hidden="true" />
                    )}
                    {isLoggingOut ? "Logging out" : "Log out"}
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

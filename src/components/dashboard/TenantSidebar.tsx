"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Bookmark,
  CalendarDays,
  ChevronRight,
  Landmark,
  LoaderCircle,
  LogOut,
  Menu,
  Scale,
  Search,
  Settings,
  Star,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SyntheticEvent, useEffect, useRef, useState } from "react";
import OverlayPortal from "@/components/ui/OverlayPortal";
import { logOutAccount, useAuthenticatedUser } from "@/lib/account";
import { useDialogFocus } from "@/lib/useDialogFocus";
import relloLogoMark from "../../../public/rello-logo-cropped.svg";

const TENANT_NAV_ITEMS = [
  { label: "Browse", href: "/tenant/browse", icon: Search },
  { label: "Bookings", href: "/tenant/bookings", icon: CalendarDays },
  { label: "Escrow", href: "/tenant/escrow", icon: Landmark },
  { label: "Disputes", href: "/tenant/disputes", icon: Scale },
  { label: "Ratings", href: "/tenant/ratings", icon: Star },
  { label: "Saved Listings", href: "/tenant/saved-listings", icon: Bookmark },
];

const PROFILE_MENU_WIDTH = 224;
const PROFILE_MENU_HEIGHT = 120;
const PROFILE_MENU_GAP = 10;
const PROFILE_MENU_MARGIN = 12;

function getProfileMenuPosition(
  rect: DOMRect,
  isCollapsed: boolean,
): { left: number; top: number } {
  const maxLeft = window.innerWidth - PROFILE_MENU_WIDTH - PROFILE_MENU_MARGIN;
  const left = isCollapsed
    ? Math.min(rect.right + PROFILE_MENU_GAP, maxLeft)
    : Math.min(Math.max(rect.left, PROFILE_MENU_MARGIN), maxLeft);
  const topBesideIcon = rect.top + rect.height / 2 - PROFILE_MENU_HEIGHT / 2;
  const topAboveCard = rect.top - PROFILE_MENU_HEIGHT - PROFILE_MENU_GAP;
  const preferredTop = isCollapsed ? topBesideIcon : topAboveCard;
  const maxTop = window.innerHeight - PROFILE_MENU_HEIGHT - PROFILE_MENU_MARGIN;

  return {
    left: Math.max(PROFILE_MENU_MARGIN, left),
    top: Math.min(Math.max(preferredTop, PROFILE_MENU_MARGIN), maxTop),
  };
}

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
      className={`flex rounded-lg transition-all duration-200 ease-in-out hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
        isCollapsed
          ? "mx-auto h-12 w-12 items-center justify-center p-0"
          : "w-full items-center gap-3 p-2 text-left"
      }`}
      aria-label={
        isCollapsed ? "Expand tenant sidebar" : "Collapse tenant sidebar"
      }
    >
      <span
        className={`flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary ${
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
        <span className="block whitespace-nowrap font-display text-2xl font-bold leading-none text-primary">
          Rello
        </span>
        <span className="mt-1 block whitespace-nowrap font-body text-xs font-medium uppercase tracking-[0.14em] text-muted">
          Tenant portal
        </span>
      </span>
    </button>
  );
}

function TenantLogoLink() {
  return (
    <Link
      href="/tenant/browse"
      className="flex items-center gap-3 rounded-lg p-2 transition-all duration-200 ease-in-out hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      aria-label="Rello tenant browse"
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
      <span className="min-w-0">
        <span className="block font-display text-2xl font-bold leading-none text-primary">
          Rello
        </span>
        <span className="mt-1 block font-body text-xs font-medium uppercase tracking-[0.14em] text-muted">
          Tenant portal
        </span>
      </span>
    </Link>
  );
}

interface TenantNavigationProps {
  isCollapsed?: boolean;
  onNavigate?: () => void;
  onTooltipChange?: (tooltip: SidebarTooltip | null) => void;
}

function TenantNavigation({
  isCollapsed = false,
  onNavigate,
  onTooltipChange,
}: TenantNavigationProps) {
  const pathname = usePathname();

  const handleTooltipEnter = (
    event: SyntheticEvent<HTMLAnchorElement>,
    label: string,
  ) => {
    if (!isCollapsed) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();

    onTooltipChange?.({
      label,
      top: rect.top + rect.height / 2,
    });
  };

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
                onMouseEnter={(event) => handleTooltipEnter(event, label)}
                onMouseLeave={() => onTooltipChange?.(null)}
                onFocus={(event) => handleTooltipEnter(event, label)}
                onBlur={() => onTooltipChange?.(null)}
                aria-current={isActive ? "page" : undefined}
                aria-label={isCollapsed ? label : undefined}
                className={`group relative flex min-h-12 items-center rounded-lg font-body text-sm font-medium transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  isCollapsed ? "justify-center px-3 py-3" : "gap-3 px-4 py-3"
                } ${
                  isActive
                    ? "border-l-2 border-accent bg-primary/5 text-primary"
                    : "border-l-2 border-transparent text-muted hover:bg-primary/5 hover:text-primary"
                }`}
              >
                <Icon
                  size={19}
                  strokeWidth={1.8}
                  className={
                    isActive
                      ? "shrink-0 text-accent-alt"
                      : "shrink-0 text-primary transition-colors duration-200 group-hover:text-accent-alt"
                  }
                />
                <span
                  className={`overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out ${
                    isCollapsed ? "w-0 opacity-0" : "w-40 opacity-100"
                  }`}
                >
                  {label}
                </span>
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
  onTooltipChange?: (tooltip: SidebarTooltip | null) => void;
}

function TenantProfileCard({
  isCollapsed = false,
  onNavigate,
  onTooltipChange,
}: TenantProfileCardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ left: 96, top: 0 });
  const { user } = useAuthenticatedUser();
  const isSettingsActive = pathname.startsWith("/tenant/settings");
  const profileName = user
    ? `${user.firstName} ${user.lastName}`.trim()
    : "Tenant";
  const profileInitials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    : "T";

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      if (
        buttonRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }

      setIsMenuOpen(false);
    };

    window.addEventListener("pointerdown", handlePointerDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isMenuOpen]);

  const updateMenuPosition = () => {
    const rect = buttonRef.current?.getBoundingClientRect();

    if (!rect) {
      return;
    }

    setMenuPosition(getProfileMenuPosition(rect, isCollapsed));
  };

  const handleMenuToggle = () => {
    updateMenuPosition();
    onTooltipChange?.(null);
    setIsMenuOpen((current) => !current);
  };

  const handleLogout = async (): Promise<void> => {
    setIsLoggingOut(true);
    await logOutAccount();
    setIsMenuOpen(false);
    onNavigate?.();
    router.replace("/login");
  };

  const handleTooltipEnter = () => {
    if (!isCollapsed || isMenuOpen) {
      return;
    }

    const rect = buttonRef.current?.getBoundingClientRect();

    if (!rect) {
      return;
    }

    onTooltipChange?.({
      label: "Profile menu",
      top: rect.top + rect.height / 2,
    });
  };

  return (
    <div className={`border-t border-border p-4 ${isCollapsed ? "px-2" : ""}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleMenuToggle}
        onMouseEnter={handleTooltipEnter}
        onMouseLeave={() => onTooltipChange?.(null)}
        onFocus={handleTooltipEnter}
        onBlur={() => onTooltipChange?.(null)}
        aria-current={isSettingsActive ? "page" : undefined}
        aria-haspopup="menu"
        aria-expanded={isMenuOpen}
        aria-label={isCollapsed ? "Open profile menu" : undefined}
        className={`group relative grid items-center rounded-xl transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
          isCollapsed
            ? "mx-auto h-12 w-12 grid-cols-1 justify-items-center p-0"
            : "grid-cols-[3rem_1fr_auto] gap-3 p-3"
        } ${
          isSettingsActive
            ? "border-l-2 border-accent bg-primary/5 text-primary"
            : "border-l-2 border-transparent bg-bg text-primary hover:bg-primary/5 hover:shadow-sm"
        }`}
      >
        <span
          className={`flex items-center justify-center rounded-lg bg-primary font-body text-sm font-bold text-white ${
            isCollapsed ? "h-10 w-10" : "h-12 w-12"
          }`}
        >
          {profileInitials}
        </span>
        <span
          className={`min-w-0 overflow-hidden transition-all duration-300 ease-in-out ${
            isCollapsed
              ? "pointer-events-none w-0 opacity-0"
              : "w-full opacity-100"
          }`}
        >
          <span className="block truncate font-body text-sm font-bold">
            {profileName}
          </span>
          <span className="mt-1 block font-body text-xs text-muted">
            Tenant
          </span>
        </span>
        {!isCollapsed ? (
          <ChevronRight size={18} className="text-muted" />
        ) : null}
      </button>

      <AnimatePresence>
        {isMenuOpen ? (
          <motion.div
            ref={menuRef}
            role="menu"
            className="fixed z-[90] w-56 overflow-hidden rounded-xl bg-bg p-2 shadow-xl"
            style={{
              left: menuPosition.left,
              top: menuPosition.top,
            }}
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <Link
              href="/tenant/settings"
              role="menuitem"
              onClick={() => {
                setIsMenuOpen(false);
                onNavigate?.();
              }}
              className="flex items-center gap-3 rounded-lg px-4 py-3 font-body text-sm font-medium text-primary transition-all duration-200 ease-in-out hover:bg-primary/5"
            >
              <Settings size={17} strokeWidth={1.9} />
              Settings
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="mt-1 flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left font-body text-sm font-medium text-primary transition-all duration-200 ease-in-out hover:bg-primary/5 disabled:cursor-wait disabled:opacity-70"
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
  );
}

interface SidebarTooltip {
  label: string;
  top: number;
}

export default function TenantSidebar({
  isCollapsed,
  onCollapseToggle,
}: TenantSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tooltip, setTooltip] = useState<SidebarTooltip | null>(null);
  const reduceMotion = useReducedMotion();
  const drawerRef = useDialogFocus<HTMLElement>(isOpen);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden overflow-visible flex-col border-r border-border bg-bg shadow-sm transition-all duration-300 ease-in-out lg:flex ${
          isCollapsed ? "w-20" : "w-72"
        }`}
      >
        <div
          className={`border-b border-border py-6 ${isCollapsed ? "px-2" : "px-3"}`}
        >
          <TenantLogoButton
            isCollapsed={isCollapsed}
            onCollapseToggle={onCollapseToggle}
          />
        </div>
        <TenantNavigation
          isCollapsed={isCollapsed}
          onTooltipChange={setTooltip}
        />
        <TenantProfileCard
          isCollapsed={isCollapsed}
          onTooltipChange={setTooltip}
        />
      </aside>

      <AnimatePresence>
        {isCollapsed && tooltip ? (
          <motion.div
            className="pointer-events-none fixed left-24 z-[80] rounded-lg bg-white px-3 py-2 font-body text-xs font-bold text-primary shadow-md"
            style={{ top: tooltip.top }}
            initial={{ opacity: 0, x: -4, y: "-50%" }}
            animate={{ opacity: 1, x: 0, y: "-50%" }}
            exit={{ opacity: 0, x: -4, y: "-50%" }}
            transition={{ duration: 0.16, ease: "easeOut" }}
          >
            {tooltip.label}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-border bg-bg px-4 lg:hidden">
        <TenantLogoLink />
        <button
          type="button"
          aria-label={isOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={isOpen}
          onClick={() => setIsOpen((current) => !current)}
          className="flex h-11 w-11 items-center justify-center rounded-full text-primary shadow-sm transition-all duration-200 ease-in-out hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {isOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </header>

      <OverlayPortal>
        <AnimatePresence>
          {isOpen ? (
            <>
              <motion.button
                type="button"
                aria-label="Close navigation"
                className="fixed inset-0 z-[100] bg-black/40 lg:hidden"
                onClick={() => setIsOpen(false)}
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={reduceMotion ? undefined : { opacity: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0 }}
              />
              <motion.aside
                ref={drawerRef}
                role="dialog"
                aria-modal="true"
                aria-label="Navigation"
                className="fixed inset-y-0 left-0 z-[110] flex w-[min(86vw,22rem)] flex-col rounded-r-xl border-r border-border bg-bg shadow-xl lg:hidden"
                initial={reduceMotion ? false : { x: "-100%" }}
                animate={reduceMotion ? undefined : { x: 0 }}
                exit={reduceMotion ? undefined : { x: "-100%" }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <div className="flex h-20 items-center justify-between border-b border-border px-5">
                  <TenantLogoLink />
                  <button
                    type="button"
                    aria-label="Close navigation"
                    onClick={() => setIsOpen(false)}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-primary shadow-sm transition-all duration-200 ease-in-out hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
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
      </OverlayPortal>
    </>
  );
}

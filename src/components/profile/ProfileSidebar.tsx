"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  BadgeCheck,
  BarChart3,
  Building2,
  CalendarCheck,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  ShieldAlert,
  Users,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";

interface ProfileSidebarProps {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}

interface SidebarItem {
  label: string;
  icon: LucideIcon;
}

const PRIMARY_ITEMS: SidebarItem[] = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Properties", icon: Building2 },
  { label: "Bookings", icon: CalendarCheck },
  { label: "Disputes", icon: ShieldAlert },
  { label: "Verifications", icon: BadgeCheck },
  { label: "Users", icon: Users },
  { label: "Reports", icon: BarChart3 },
];

const FOOTER_ITEMS: SidebarItem[] = [{ label: "Settings", icon: Settings }];

function SidebarButton({
  item,
  active = false,
  collapsed = false,
  onClick,
}: {
  item: SidebarItem;
  active?: boolean;
  collapsed?: boolean;
  onClick?: () => void;
}) {
  const Icon = item.icon;

  return (
    <button
      type="button"
      aria-current={active ? "page" : undefined}
      aria-label={collapsed ? item.label : undefined}
      onClick={onClick}
      className={`flex min-h-14 w-full items-center gap-4 px-4 py-3 text-left font-body text-lg font-bold transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
        collapsed ? "justify-center" : ""
      } ${
        active
          ? "bg-accent text-primary"
          : "text-white hover:bg-white/10 hover:text-accent"
      }`}
    >
      <Icon size={24} />
      {collapsed ? null : <span>{item.label}</span>}
    </button>
  );
}

export default function ProfileSidebar({
  collapsed,
  onCollapsedChange,
}: ProfileSidebarProps) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const drawerRef = useRef<HTMLDivElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = (): void => {
    localStorage.removeItem("rello_token");
    localStorage.removeItem("rello_role");
    router.replace("/login?message=You%20have%20been%20logged%20out");
  };

  const closeMobileMenu = (): void => {
    setMobileOpen(false);
  };

  useEffect(() => {
    if (!mobileOpen) {
      return;
    }

    drawerRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        closeMobileMenu();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen]);

  return (
    <>
      <aside
        className={`fixed left-0 top-0 z-50 hidden h-screen border-r border-primary bg-primary text-white transition-all duration-200 ease-in-out lg:flex lg:flex-col ${
          collapsed ? "w-24" : "w-72"
        }`}
      >
        <div
          className={`shrink-0 border-b border-white/20 px-5 py-7 ${
            collapsed ? "text-center" : ""
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className={collapsed ? "sr-only" : ""}>
              <p className="font-display text-3xl font-bold leading-tight text-white">
                Rello
              </p>
              <p className="mt-2 font-accent text-xs font-bold uppercase tracking-[0.3em] text-accent">
                Account
              </p>
            </div>

            <button
              type="button"
              onClick={() => onCollapsedChange(!collapsed)}
              className={`flex h-11 w-11 shrink-0 items-center justify-center border border-white/30 text-white transition-all duration-200 ease-in-out hover:border-accent hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                collapsed ? "mx-auto" : ""
              }`}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-expanded={!collapsed}
            >
              {collapsed ? (
                <PanelLeftOpen size={20} />
              ) : (
                <PanelLeftClose size={20} />
              )}
            </button>
          </div>
        </div>

        <nav
          className="rello-scrollbar flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain px-4 py-5"
          aria-label="Account navigation"
        >
          {PRIMARY_ITEMS.map((item) => (
            <SidebarButton key={item.label} item={item} collapsed={collapsed} />
          ))}
        </nav>

        <div className="shrink-0 border-t border-white/20 px-4 py-5">
          {FOOTER_ITEMS.map((item) => (
            <SidebarButton
              key={item.label}
              item={item}
              active
              collapsed={collapsed}
            />
          ))}
          <button
            type="button"
            onClick={handleLogout}
            aria-label={collapsed ? "Logout" : undefined}
            className={`mt-2 flex min-h-14 w-full items-center gap-4 px-4 py-3 text-left font-body text-lg font-bold text-white transition-all duration-200 ease-in-out hover:bg-white/10 hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <LogOut size={24} />
            {collapsed ? null : <span>Logout</span>}
          </button>
        </div>
      </aside>

      <header className="sticky top-0 z-50 border-b border-primary bg-primary text-white lg:hidden">
        <div className="flex items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="font-display text-2xl font-bold leading-tight text-white">
              Rello
            </p>
            <p className="font-accent text-xs font-bold uppercase tracking-[0.22em] text-accent">
              Settings
            </p>
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex h-11 w-11 items-center justify-center border border-white/30 text-white transition-all duration-200 ease-in-out hover:border-accent hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label="Open navigation"
            aria-expanded={mobileOpen}
          >
            <Menu size={21} />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            className="fixed inset-0 z-[80] bg-black/50 lg:hidden"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={reduceMotion ? undefined : { opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                closeMobileMenu();
              }
            }}
          >
            <motion.div
              ref={drawerRef}
              className="flex h-full w-[min(20rem,calc(100vw-3rem))] flex-col border-r border-primary bg-primary text-white outline-none"
              initial={reduceMotion ? false : { x: "-100%" }}
              animate={reduceMotion ? undefined : { x: 0 }}
              exit={reduceMotion ? undefined : { x: "-100%" }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              role="dialog"
              aria-modal="true"
              aria-label="Account navigation"
              tabIndex={-1}
            >
              <div className="shrink-0 flex items-start justify-between gap-4 border-b border-white/20 px-5 py-6">
                <div>
                  <p className="font-display text-3xl font-bold leading-tight text-white">
                    Rello
                  </p>
                  <p className="mt-2 font-accent text-xs font-bold uppercase tracking-[0.3em] text-accent">
                    Account
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeMobileMenu}
                  className="flex h-11 w-11 shrink-0 items-center justify-center border border-white/30 text-white transition-all duration-200 ease-in-out hover:border-accent hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  aria-label="Close navigation"
                >
                  <X size={21} />
                </button>
              </div>

              <nav
                className="rello-scrollbar flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain px-4 py-5"
                aria-label="Account navigation"
              >
                {PRIMARY_ITEMS.map((item) => (
                  <SidebarButton
                    key={item.label}
                    item={item}
                    onClick={closeMobileMenu}
                  />
                ))}
              </nav>

              <div className="shrink-0 border-t border-white/20 px-4 py-5">
                {FOOTER_ITEMS.map((item) => (
                  <SidebarButton
                    key={item.label}
                    item={item}
                    active
                    onClick={closeMobileMenu}
                  />
                ))}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-2 flex min-h-14 w-full items-center gap-4 px-4 py-3 text-left font-body text-lg font-bold text-white transition-all duration-200 ease-in-out hover:bg-white/10 hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <LogOut size={24} />
                  Logout
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

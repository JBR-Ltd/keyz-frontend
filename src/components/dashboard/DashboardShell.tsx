"use client";

import { ReactNode, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { usePathname } from "next/navigation";
import MessagesDropdown from "@/components/chat/MessagesDropdown";
import RoleSidebar from "@/components/dashboard/RoleSidebar";
import {
  countVerifiedTenantSteps,
  isTenantVerified,
  useTenantVerificationSnapshot,
} from "@/lib/tenantVerification";
import TenantSidebar from "@/components/dashboard/TenantSidebar";

interface DashboardShellProps {
  children: ReactNode;
  rolePath: "tenant" | "landlord" | "agent" | "admin";
  roleLabel: string;
}

const SIDEBAR_STORAGE_KEY = "rello_sidebar_collapsed";
const SIDEBAR_EVENT = "rello-sidebar-change";

function subscribeToSidebar(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  window.addEventListener(SIDEBAR_EVENT, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(SIDEBAR_EVENT, callback);
  };
}

function getSidebarSnapshot(): boolean {
  return localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true";
}

export default function DashboardShell({
  children,
  rolePath,
  roleLabel,
}: DashboardShellProps) {
  const pathname = usePathname();
  const { state: tenantVerificationState } = useTenantVerificationSnapshot();
  const isCollapsed = useSyncExternalStore(
    subscribeToSidebar,
    getSidebarSnapshot,
    () => false,
  );
  const [isTenantCollapsed, setIsTenantCollapsed] = useState(false);
  const verifiedTenantStepCount = countVerifiedTenantSteps(
    tenantVerificationState,
  );
  const showTenantVerificationAction =
    rolePath === "tenant" && !isTenantVerified(tenantVerificationState);
  const verificationHref =
    "/tenant/verify?source=dashboard&returnTo=" + encodeURIComponent(pathname);

  const toggleSidebar = () => {
    const nextValue = !isCollapsed;

    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(nextValue));
    window.dispatchEvent(new Event(SIDEBAR_EVENT));
  };

  const sidebarOffset =
    rolePath === "tenant"
      ? isTenantCollapsed
        ? "lg:ml-20"
        : "lg:ml-72"
      : isCollapsed
        ? "lg:ml-20"
        : "lg:ml-72";
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {rolePath === "tenant" ? (
        <TenantSidebar
          isCollapsed={isTenantCollapsed}
          onCollapseToggle={() => setIsTenantCollapsed((current) => !current)}
        />
      ) : (
        <RoleSidebar
          rolePath={rolePath}
          roleLabel={roleLabel}
          isCollapsed={isCollapsed}
          onCollapseToggle={toggleSidebar}
        />
      )}
      <div
        className={`min-w-0 transition-[margin] duration-200 ease-in-out ${sidebarOffset}`}
      >
        <div className="fixed right-5 top-24 z-40 flex items-center gap-3 sm:right-8 lg:right-10 lg:top-5 xl:right-14">
          {showTenantVerificationAction ? (
            <Link
              href={verificationHref}
              className="group inline-flex min-h-12 items-center gap-3 rounded-full bg-bg py-1.5 pl-1.5 pr-4 text-primary shadow-md transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:bg-surface-soft hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent-alt">
                <ShieldCheck size={18} strokeWidth={2} aria-hidden="true" />
              </span>
              <span className="font-body text-sm font-bold sm:hidden">
                Verify identity
              </span>
              <span className="hidden text-left sm:block">
                <span className="block font-body text-sm font-bold leading-tight">
                  {verifiedTenantStepCount > 0
                    ? "Continue verification"
                    : "Start verification"}
                </span>
                <span className="mt-0.5 block font-accent text-[9px] font-bold uppercase tracking-[0.16em] text-accent-alt">
                  Action required
                </span>
              </span>
            </Link>
          ) : null}
          <MessagesDropdown />
        </div>
        {children}
      </div>
    </div>
  );
}

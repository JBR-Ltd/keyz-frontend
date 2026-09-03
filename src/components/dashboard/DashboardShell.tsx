"use client";

import type { ReactElement, ReactNode } from "react";
import { useSyncExternalStore } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { usePathname } from "next/navigation";
import MessagesDropdown from "@/components/chat/MessagesDropdown";
import RoleSidebar from "@/components/dashboard/RoleSidebar";
import TenantSidebar from "@/components/dashboard/TenantSidebar";
import {
  countVerifiedTenantSteps,
  isTenantVerified,
  useTenantVerificationSnapshot,
} from "@/lib/tenantVerification";

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
}: DashboardShellProps): ReactElement {
  const pathname = usePathname();
  const { state: tenantVerificationState } = useTenantVerificationSnapshot();
  const isCollapsed = useSyncExternalStore(
    subscribeToSidebar,
    getSidebarSnapshot,
    () => false,
  );
  const verifiedTenantStepCount = countVerifiedTenantSteps(
    tenantVerificationState,
  );
  const showTenantVerificationAction =
    rolePath === "tenant" && !isTenantVerified(tenantVerificationState);
  const verificationHref =
    "/tenant/verify?source=dashboard&returnTo=" + encodeURIComponent(pathname);

  const toggleSidebar = (): void => {
    const nextValue = !isCollapsed;

    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(nextValue));
    window.dispatchEvent(new Event(SIDEBAR_EVENT));
  };

  const sidebarOffset = isCollapsed ? "lg:ml-20" : "lg:ml-72";
  const tenantActions = (
    <>
      {showTenantVerificationAction ? (
        <Link
          href={verificationHref}
          aria-label={
            verifiedTenantStepCount > 0
              ? "Continue identity verification"
              : "Start identity verification"
          }
          className="group inline-flex min-h-10 items-center gap-2 rounded-full bg-surface-soft p-1.5 text-primary shadow-sm transition-all duration-200 ease-in-out hover:bg-primary/5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:pr-3"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent-alt">
            <ShieldCheck size={16} strokeWidth={2} aria-hidden="true" />
          </span>
          <span className="hidden text-left xl:block">
            <span className="block font-body text-xs font-bold leading-tight">
              {verifiedTenantStepCount > 0
                ? "Continue verification"
                : "Start verification"}
            </span>
            <span className="mt-0.5 block font-accent text-[8px] font-bold uppercase tracking-[0.14em] text-accent-alt">
              Action required
            </span>
          </span>
        </Link>
      ) : null}
      <MessagesDropdown />
    </>
  );

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {rolePath === "tenant" ? (
        <TenantSidebar actions={tenantActions} />
      ) : (
        <>
          <RoleSidebar
            rolePath={rolePath}
            roleLabel={roleLabel}
            isCollapsed={isCollapsed}
            onCollapseToggle={toggleSidebar}
          />
          <div className="fixed right-5 top-24 z-40 sm:right-8 lg:right-10 lg:top-5 xl:right-14">
            <MessagesDropdown />
          </div>
        </>
      )}

      <div
        className={
          rolePath === "tenant"
            ? "min-w-0"
            : `min-w-0 transition-[margin] duration-200 ease-in-out ${sidebarOffset}`
        }
      >
        {children}
      </div>
    </div>
  );
}

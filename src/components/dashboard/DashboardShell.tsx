"use client";

import type { ReactElement, ReactNode } from "react";
import { useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import MessagesDropdown from "@/components/chat/MessagesDropdown";
import AgentHeader from "@/components/dashboard/AgentHeader";
import LandlordHeader from "@/components/dashboard/LandlordHeader";
import RoleSidebar from "@/components/dashboard/RoleSidebar";
import TenantSidebar from "@/components/dashboard/TenantSidebar";
import {
  countVerifiedHostSteps,
  useHostVerification,
} from "@/lib/hostVerification";
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
  const { isLoading: isHostStatusLoading, snapshot: hostVerification } =
    useHostVerification();
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
  const verifiedHostStepCount = countVerifiedHostSteps(hostVerification);
  // Nothing is prompted until the status is known, so the banner cannot flash
  // "verify your account" at a host who is already verified
  const showHostVerificationAction =
    !isHostStatusLoading && verifiedHostStepCount < 3;

  const toggleSidebar = (): void => {
    const nextValue = !isCollapsed;

    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(nextValue));
    window.dispatchEvent(new Event(SIDEBAR_EVENT));
  };

  const sidebarOffset = isCollapsed ? "lg:ml-20" : "lg:ml-72";
  const tenantActions = <MessagesDropdown />;

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {rolePath === "tenant" ? (
        <TenantSidebar
          actions={tenantActions}
          showVerificationAction={showTenantVerificationAction}
          verificationHref={verificationHref}
          verifiedStepCount={verifiedTenantStepCount}
        />
      ) : rolePath === "landlord" ? (
        <LandlordHeader
          actions={<MessagesDropdown />}
          showVerificationAction={showHostVerificationAction}
          verificationHref="/landlord/verify"
          verifiedStepCount={verifiedHostStepCount}
        />
      ) : rolePath === "agent" ? (
        <AgentHeader
          actions={<MessagesDropdown />}
          showVerificationAction={showHostVerificationAction}
          verificationHref="/agent/verify"
          verifiedStepCount={verifiedHostStepCount}
        />
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
          rolePath === "tenant" ||
          rolePath === "landlord" ||
          rolePath === "agent"
            ? "min-w-0"
            : `min-w-0 transition-[margin] duration-200 ease-in-out ${sidebarOffset}`
        }
      >
        {children}
      </div>
    </div>
  );
}

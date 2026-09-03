"use client";

import type { ReactElement, ReactNode } from "react";
import { useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import MessagesDropdown from "@/components/chat/MessagesDropdown";
import LandlordHeader from "@/components/dashboard/LandlordHeader";
import RoleSidebar from "@/components/dashboard/RoleSidebar";
import TenantSidebar from "@/components/dashboard/TenantSidebar";
import { getHostVerificationSnapshot } from "@/lib/hostVerification";
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

function subscribeToLandlordVerification(callback: () => void): () => void {
  window.addEventListener("storage", callback);

  return () => window.removeEventListener("storage", callback);
}

function getLandlordVerificationStorageSnapshot(): string {
  const snapshot = getHostVerificationSnapshot("landlord");

  return `${snapshot.identity.status}:${snapshot.payout.status}`;
}

export default function DashboardShell({
  children,
  rolePath,
  roleLabel,
}: DashboardShellProps): ReactElement {
  const pathname = usePathname();
  const { state: tenantVerificationState } = useTenantVerificationSnapshot();
  const landlordVerificationStatus = useSyncExternalStore(
    subscribeToLandlordVerification,
    getLandlordVerificationStorageSnapshot,
    () => "",
  );
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
  const verifiedLandlordStepCount =
    Number(landlordVerificationStatus.startsWith("approved:")) +
    Number(landlordVerificationStatus.endsWith(":approved"));
  const showLandlordVerificationAction =
    rolePath === "landlord" && verifiedLandlordStepCount < 2;

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
          showVerificationAction={showLandlordVerificationAction}
          verificationHref="/landlord/verify"
          verifiedStepCount={verifiedLandlordStepCount}
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
          rolePath === "tenant" || rolePath === "landlord"
            ? "min-w-0"
            : `min-w-0 transition-[margin] duration-200 ease-in-out ${sidebarOffset}`
        }
      >
        {children}
      </div>
    </div>
  );
}

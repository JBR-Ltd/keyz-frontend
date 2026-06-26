"use client";

import { ReactNode, useSyncExternalStore } from "react";
import RoleSidebar from "@/components/dashboard/RoleSidebar";
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
  const isCollapsed = useSyncExternalStore(
    subscribeToSidebar,
    getSidebarSnapshot,
    () => false,
  );

  const toggleSidebar = () => {
    const nextValue = !isCollapsed;

    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(nextValue));
    window.dispatchEvent(new Event(SIDEBAR_EVENT));
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {rolePath === "tenant" ? (
        <TenantSidebar
          isCollapsed={isCollapsed}
          onCollapseToggle={toggleSidebar}
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
        className={`min-w-0 transition-[margin] duration-200 ease-in-out ${
          isCollapsed ? "lg:ml-24" : "lg:ml-72"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

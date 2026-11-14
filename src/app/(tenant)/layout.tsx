import type { Metadata } from "next";
import type { ReactNode } from "react";
import RoleGuard from "@/components/auth/RoleGuard";
import DashboardShell from "@/components/dashboard/DashboardShell";

export const metadata: Metadata = {
  robots: { follow: false, index: false },
};

export default function TenantLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard expectedRole="TENANT">
      <DashboardShell rolePath="tenant" roleLabel="Tenant">
        {children}
      </DashboardShell>
    </RoleGuard>
  );
}

import { ReactNode } from "react";
import RoleGuard from "@/components/auth/RoleGuard";
import DashboardShell from "@/components/dashboard/DashboardShell";

export default function TenantLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard expectedRole="TENANT">
      <DashboardShell rolePath="tenant" roleLabel="Tenant">
        {children}
      </DashboardShell>
    </RoleGuard>
  );
}

import { ReactNode } from "react";
import RoleGuard from "@/components/auth/RoleGuard";
import DashboardShell from "@/components/dashboard/DashboardShell";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard expectedRole="ADMIN">
      <DashboardShell rolePath="admin" roleLabel="Admin">
        {children}
      </DashboardShell>
    </RoleGuard>
  );
}

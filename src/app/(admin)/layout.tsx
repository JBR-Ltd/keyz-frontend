import { ReactNode } from "react";
import RoleGuard from "@/components/auth/RoleGuard";
import DashboardShell from "@/components/dashboard/DashboardShell";
import AdminPreviewBanner from "@/components/dashboard/AdminPreviewBanner";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard expectedRole="ADMIN">
      <DashboardShell rolePath="admin" roleLabel="Admin">
        <AdminPreviewBanner />
        {children}
      </DashboardShell>
    </RoleGuard>
  );
}

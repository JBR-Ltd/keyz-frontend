import type { Metadata } from "next";
import type { ReactNode } from "react";
import RoleGuard from "@/components/auth/RoleGuard";
import DashboardShell from "@/components/dashboard/DashboardShell";

export const metadata: Metadata = {
  robots: { follow: false, index: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard expectedRole="ADMIN">
      <DashboardShell rolePath="admin" roleLabel="Admin">
        {children}
      </DashboardShell>
    </RoleGuard>
  );
}

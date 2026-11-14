import type { Metadata } from "next";
import type { ReactNode } from "react";
import RoleGuard from "@/components/auth/RoleGuard";
import DashboardShell from "@/components/dashboard/DashboardShell";

export const metadata: Metadata = {
  robots: { follow: false, index: false },
};

export default function AgentLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard expectedRole="AGENT">
      <DashboardShell rolePath="agent" roleLabel="Agent">
        {children}
      </DashboardShell>
    </RoleGuard>
  );
}

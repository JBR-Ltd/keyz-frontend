import { ReactNode } from "react";
import RoleGuard from "@/components/auth/RoleGuard";
import DashboardShell from "@/components/dashboard/DashboardShell";

export default function LandlordLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard expectedRole="LANDLORD">
      <DashboardShell rolePath="landlord" roleLabel="Landlord">
        {children}
      </DashboardShell>
    </RoleGuard>
  );
}

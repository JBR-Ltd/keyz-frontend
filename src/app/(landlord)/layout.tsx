import type { Metadata } from "next";
import type { ReactNode } from "react";
import RoleGuard from "@/components/auth/RoleGuard";
import DashboardShell from "@/components/dashboard/DashboardShell";

export const metadata: Metadata = {
  robots: { follow: false, index: false },
};

export default function LandlordLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard expectedRole="LANDLORD">
      <DashboardShell rolePath="landlord" roleLabel="Landlord">
        {children}
      </DashboardShell>
    </RoleGuard>
  );
}

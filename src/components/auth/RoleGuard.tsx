"use client";

import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { useAuthentication } from "@/components/auth/AuthProvider";
import { type AccountRole } from "@/lib/authSession";

export { isAccountRole } from "@/lib/authSession";
export type { AccountRole } from "@/lib/authSession";

interface RoleGuardProps {
  children: ReactNode;
  expectedRole: AccountRole;
}

function getRoleHomePath(role: AccountRole): string {
  return role === "TENANT"
    ? "/tenant/browse"
    : "/" + role.toLowerCase() + "/dashboard";
}

export default function RoleGuard({ children, expectedRole }: RoleGuardProps) {
  const router = useRouter();
  const authentication = useAuthentication();
  const role = authentication.user?.role ?? null;
  const isAllowed =
    authentication.status === "authenticated" && role === expectedRole;

  useEffect(() => {
    if (authentication.status === "unauthenticated") {
      router.replace("/login");
      return;
    }

    if (
      authentication.status === "authenticated" &&
      role &&
      role !== expectedRole
    ) {
      // This client guard improves navigation UX. Authorization must also be enforced server-side.
      router.replace(getRoleHomePath(role));
    }
  }, [authentication.status, expectedRole, role, router]);

  if (!isAllowed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-primary px-5 text-white">
        <div className="border border-accent px-8 py-10 text-center">
          <p className="font-accent text-xs font-bold uppercase tracking-[0.3em] text-accent">
            Rello
          </p>
          <p className="mt-4 font-display text-4xl font-bold">
            Checking access
          </p>
        </div>
      </main>
    );
  }

  return children;
}

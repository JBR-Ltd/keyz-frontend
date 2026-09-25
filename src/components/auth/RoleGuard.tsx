"use client";

import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { Loader2 } from "lucide-react";
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
      <main className="flex min-h-screen items-center justify-center bg-bg">
        <Loader2
          className="h-8 w-8 animate-spin text-primary"
          aria-hidden="true"
        />
        <span className="sr-only">Loading</span>
      </main>
    );
  }

  return children;
}

"use client";

import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useAuthentication } from "@/components/auth/AuthProvider";
import { refreshAuthentication, type AccountRole } from "@/lib/authSession";

export { isAccountRole } from "@/lib/authSession";
export type { AccountRole } from "@/lib/authSession";

interface RoleGuardProps {
  children: ReactNode;
  expectedRole: AccountRole;
}

function getRoleHomePath(role: AccountRole): string {
  return role === "TENANT"
    ? "/browse"
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

  // A check that could not complete leaves the status at "checking" for good, which
  // used to be an endless spinner with nothing to act on and no way back.
  if (!isAllowed && authentication.error && !authentication.user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg px-6">
        <div className="max-w-sm text-center">
          <h1 className="font-display text-2xl font-bold text-primary">
            We cannot reach Rello
          </h1>
          <p className="mt-3 font-body text-sm leading-6 text-muted">
            Check your connection and try again. You are still signed in.
          </p>
          <button
            type="button"
            onClick={() => void refreshAuthentication()}
            className="mt-6 min-h-12 rounded-full bg-primary px-6 font-body text-sm font-bold text-white transition-colors hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

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

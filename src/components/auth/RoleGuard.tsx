"use client";

import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useSyncExternalStore } from "react";

export type AccountRole = "TENANT" | "LANDLORD" | "AGENT" | "ADMIN";

interface RoleGuardProps {
  children: ReactNode;
  expectedRole: AccountRole;
}

const ACCOUNT_ROLES: AccountRole[] = ["TENANT", "LANDLORD", "AGENT", "ADMIN"];

export function isAccountRole(value: unknown): value is AccountRole {
  return (
    typeof value === "string" &&
    ACCOUNT_ROLES.includes(value.toUpperCase() as AccountRole)
  );
}

function subscribeToAuth(): () => void {
  return () => undefined;
}

function getRoleHomePath(role: AccountRole): string {
  return role === "TENANT"
    ? "/tenant/browse"
    : "/" + role.toLowerCase() + "/dashboard";
}

function getAuthSnapshot(): string {
  const token = localStorage.getItem("rello_token") ?? "";
  const role = localStorage.getItem("rello_role") ?? "";

  return `${token}|${role}`;
}

export default function RoleGuard({ children, expectedRole }: RoleGuardProps) {
  const router = useRouter();
  const authSnapshot = useSyncExternalStore(
    subscribeToAuth,
    getAuthSnapshot,
    () => "",
  );
  const [token, storedRole] = authSnapshot.split("|");
  const normalizedRole = isAccountRole(storedRole)
    ? (storedRole.toUpperCase() as AccountRole)
    : null;
  const isAllowed = Boolean(token) && normalizedRole === expectedRole;

  useEffect(() => {
    if (!authSnapshot) {
      return;
    }

    if (!token || !normalizedRole) {
      router.replace("/login");
      return;
    }

    if (normalizedRole !== expectedRole) {
      // This client guard improves navigation UX. Authorization must also be enforced server-side.
      router.replace(getRoleHomePath(normalizedRole));
    }
  }, [authSnapshot, expectedRole, normalizedRole, router, token]);

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

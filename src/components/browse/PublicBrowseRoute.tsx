"use client";

import type { ReactElement } from "react";
import { useAuthentication } from "@/components/auth/AuthProvider";
import MarketplaceHeader from "@/components/browse/MarketplaceHeader";
import DashboardShell from "@/components/dashboard/DashboardShell";
import TenantBrowsePage from "@/app/(tenant)/tenant/browse/page";

function BrowseRouteSkeleton(): ReactElement {
  return (
    <div
      className="min-h-screen bg-bg"
      role="status"
      aria-label="Loading browse"
    >
      <div className="h-20 border-b border-border px-5 py-4 sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="h-11 w-40 animate-pulse rounded-lg bg-skeleton motion-reduce:animate-none" />
          <div className="h-11 w-32 animate-pulse rounded-full bg-skeleton motion-reduce:animate-none" />
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-10">
        <div className="h-16 animate-pulse rounded-full bg-skeleton motion-reduce:animate-none" />
        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div
              key={index}
              className="h-[28rem] animate-pulse rounded-xl bg-skeleton motion-reduce:animate-none"
            />
          ))}
        </div>
      </div>
      <span className="sr-only">Loading browse</span>
    </div>
  );
}

export default function PublicBrowseRoute(): ReactElement {
  const authentication = useAuthentication();

  if (authentication.status === "checking") return <BrowseRouteSkeleton />;

  if (
    authentication.status === "authenticated" &&
    authentication.user?.role === "TENANT"
  ) {
    return (
      <DashboardShell rolePath="tenant" roleLabel="Tenant">
        <TenantBrowsePage />
      </DashboardShell>
    );
  }

  return (
    <>
      <MarketplaceHeader role={authentication.user?.role ?? null} />
      <TenantBrowsePage />
    </>
  );
}

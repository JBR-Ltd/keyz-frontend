"use client";

import type { ReactElement } from "react";
import { useAuthentication } from "@/components/auth/AuthProvider";
import MarketplaceHeader from "@/components/browse/MarketplaceHeader";
import DashboardShell from "@/components/dashboard/DashboardShell";
import TenantBrowsePage from "@/app/(tenant)/tenant/browse/page";
import type { PropertyQueryResult } from "@/lib/propertyDetails";

interface PublicBrowseRouteProps {
  initialListings: PropertyQueryResult | null;
}

function BrowseHeaderSkeleton(): ReactElement {
  return (
    <div role="status" aria-label="Loading account navigation">
      <div className="h-20 border-b border-border px-5 py-4 sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="h-11 w-40 animate-pulse rounded-lg bg-skeleton motion-reduce:animate-none" />
          <div className="h-11 w-32 animate-pulse rounded-full bg-skeleton motion-reduce:animate-none" />
        </div>
      </div>
      <span className="sr-only">Loading account navigation</span>
    </div>
  );
}

export default function PublicBrowseRoute({
  initialListings,
}: PublicBrowseRouteProps): ReactElement {
  const authentication = useAuthentication();

  if (authentication.status === "checking") {
    return (
      <>
        <BrowseHeaderSkeleton />
        <TenantBrowsePage initialListings={initialListings} />
      </>
    );
  }

  if (
    authentication.status === "authenticated" &&
    authentication.user?.role === "TENANT"
  ) {
    return (
      <DashboardShell rolePath="tenant" roleLabel="Tenant">
        <TenantBrowsePage initialListings={initialListings} />
      </DashboardShell>
    );
  }

  return (
    <>
      <MarketplaceHeader role={authentication.user?.role ?? null} />
      <TenantBrowsePage initialListings={initialListings} />
    </>
  );
}

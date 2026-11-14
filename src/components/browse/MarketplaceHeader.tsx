"use client";

import type { ReactElement } from "react";
import Image from "next/image";
import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import type { AccountRole } from "@/lib/authSession";
import relloLogoMark from "../../../public/rello-logo-cropped.svg";

interface MarketplaceHeaderProps {
  role: AccountRole | null;
}

function dashboardPath(role: AccountRole): string {
  return role === "TENANT"
    ? "/tenant/bookings"
    : `/${role.toLowerCase()}/dashboard`;
}

export default function MarketplaceHeader({
  role,
}: MarketplaceHeaderProps): ReactElement {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg">
      <div className="relative mx-auto flex h-20 max-w-7xl items-center gap-4 px-5 sm:px-8 lg:px-10">
        <Link
          href="/"
          aria-label="Rello home"
          className="flex shrink-0 items-center gap-3 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-lg bg-primary">
            <Image
              src={relloLogoMark}
              alt=""
              aria-hidden="true"
              className="h-9 w-9 object-contain"
              priority
            />
          </span>
          <span className="hidden font-display text-2xl font-bold leading-none text-primary sm:block">
            Rello
          </span>
        </Link>

        <nav
          aria-label="Marketplace navigation"
          className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3"
        >
          {role ? (
            <Link
              href={dashboardPath(role)}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-4 font-body text-sm font-bold text-white transition-colors hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <LayoutDashboard size={17} aria-hidden="true" />
              {role === "TENANT" ? "My home" : "Dashboard"}
            </Link>
          ) : (
            <>
              <Link
                href="/login?returnTo=%2Fbrowse"
                className="inline-flex min-h-11 items-center justify-center rounded-full px-3 font-body text-sm font-bold text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:px-4"
              >
                Log in
              </Link>
              <Link
                href="/register?role=TENANT&returnTo=%2Fbrowse"
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-4 font-body text-sm font-bold text-white transition-colors hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Create account
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

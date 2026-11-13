"use client";

import type { ReactElement } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import UserAvatar from "@/components/ui/user-avatar";
import VerifiedBadge from "@/components/ui/VerifiedBadge";
import { useAuthenticatedUser } from "@/lib/account";
import { getInitials } from "@/lib/utils";

/** Who is signed in, at the top of settings: the photo, name, email and verification. */
export default function SettingsAccountCard(): ReactElement {
  const { user, isLoading } = useAuthenticatedUser();

  if (isLoading || !user) {
    return (
      <div className="flex items-center gap-4 rounded-2xl border border-border bg-bg p-4">
        <Skeleton className="h-14 w-14 shrink-0 rounded-full" />
        <div className="grid flex-1 gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-44" />
        </div>
      </div>
    );
  }

  const name = `${user.firstName} ${user.lastName}`.trim();

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-bg p-4">
      <UserAvatar
        avatarUrl={user.avatarUrl}
        initials={getInitials(name)}
        className="h-14 w-14 text-lg"
        sizes="56px"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-body text-base font-bold text-primary">
          {name}
        </p>
        <p className="truncate font-body text-sm text-muted">{user.email}</p>
        <div className="mt-2">
          {user.identityVerified ? (
            <VerifiedBadge size="sm" />
          ) : (
            <span className="inline-flex rounded-sm bg-surface-soft px-2 py-1 font-body text-[0.68rem] font-bold text-muted">
              Not verified yet
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useCallback, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AsyncButtonContent } from "@/components/ui/async-button-content";
import {
  getInternalBackDestination,
  peekInternalBackDestination,
} from "@/lib/internalNavigation";
import { getAuthenticationSnapshot } from "@/lib/authSession";

interface BackButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "onClick" | "type"
> {
  children: ReactNode;
  fallbackHref: string;
  pendingLabel?: string;
  roleFallbacks?: Partial<
    Record<"ADMIN" | "AGENT" | "LANDLORD" | "TENANT", string>
  >;
}

export default function BackButton({
  children,
  fallbackHref,
  pendingLabel,
  roleFallbacks,
  disabled,
  ...buttonProps
}: BackButtonProps): ReactNode {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const getFallbackHref = useCallback((): string => {
    const role = getAuthenticationSnapshot().user?.role ?? null;
    const roleFallback =
      role === "ADMIN" ||
      role === "AGENT" ||
      role === "LANDLORD" ||
      role === "TENANT"
        ? roleFallbacks?.[role]
        : undefined;

    return roleFallback ?? fallbackHref;
  }, [fallbackHref, roleFallbacks]);

  useEffect(() => {
    const currentHref = `${window.location.pathname}${window.location.search}`;

    router.prefetch(
      peekInternalBackDestination(currentHref, getFallbackHref()),
    );
  }, [getFallbackHref, router]);

  const handleClick = (): void => {
    const currentHref = `${window.location.pathname}${window.location.search}`;

    startTransition(() => {
      router.replace(
        getInternalBackDestination(currentHref, getFallbackHref()),
      );
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || isPending}
      aria-busy={isPending || undefined}
      {...buttonProps}
    >
      {pendingLabel ? (
        <AsyncButtonContent isPending={isPending} pendingLabel={pendingLabel}>
          {children}
        </AsyncButtonContent>
      ) : (
        children
      )}
    </button>
  );
}

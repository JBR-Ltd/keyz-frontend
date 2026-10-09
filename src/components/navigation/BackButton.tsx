"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { AsyncButtonContent } from "@/components/ui/async-button-content";
import { getInternalBackDestination } from "@/lib/internalNavigation";
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
  pendingLabel = "Loading…",
  roleFallbacks,
  disabled,
  ...buttonProps
}: BackButtonProps): ReactNode {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleClick = (): void => {
    const currentHref = `${window.location.pathname}${window.location.search}`;
    const role = getAuthenticationSnapshot().user?.role ?? null;
    const roleFallback =
      role === "ADMIN" ||
      role === "AGENT" ||
      role === "LANDLORD" ||
      role === "TENANT"
        ? roleFallbacks?.[role]
        : undefined;

    startTransition(() => {
      router.replace(
        getInternalBackDestination(currentHref, roleFallback ?? fallbackHref),
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
      <AsyncButtonContent isPending={isPending} pendingLabel={pendingLabel}>
        {children}
      </AsyncButtonContent>
    </button>
  );
}

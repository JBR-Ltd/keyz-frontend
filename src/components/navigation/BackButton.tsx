"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getInternalBackDestination } from "@/lib/internalNavigation";

interface BackButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "onClick" | "type"
> {
  children: ReactNode;
  fallbackHref: string;
  roleFallbacks?: Partial<
    Record<"ADMIN" | "AGENT" | "LANDLORD" | "TENANT", string>
  >;
}

export default function BackButton({
  children,
  fallbackHref,
  roleFallbacks,
  ...buttonProps
}: BackButtonProps): ReactNode {
  const router = useRouter();

  const handleClick = (): void => {
    const currentHref = `${window.location.pathname}${window.location.search}`;
    const role = window.localStorage.getItem("rello_role");
    const roleFallback =
      role === "ADMIN" ||
      role === "AGENT" ||
      role === "LANDLORD" ||
      role === "TENANT"
        ? roleFallbacks?.[role]
        : undefined;

    router.replace(
      getInternalBackDestination(currentHref, roleFallback ?? fallbackHref),
    );
  };

  return (
    <button type="button" onClick={handleClick} {...buttonProps}>
      {children}
    </button>
  );
}

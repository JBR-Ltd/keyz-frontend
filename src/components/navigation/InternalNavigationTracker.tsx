"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { recordInternalRoute } from "@/lib/internalNavigation";

export default function InternalNavigationTracker(): null {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();

  useEffect(() => {
    recordInternalRoute(`${pathname}${query ? `?${query}` : ""}`);
  }, [pathname, query]);

  return null;
}

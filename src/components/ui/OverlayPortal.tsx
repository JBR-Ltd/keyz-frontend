"use client";

import type { ReactElement, ReactNode } from "react";
import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

interface OverlayPortalProps {
  children: ReactNode;
}

function subscribe(): () => void {
  return () => undefined;
}

export default function OverlayPortal({
  children,
}: OverlayPortalProps): ReactElement | null {
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  return mounted ? createPortal(children, document.body) : null;
}

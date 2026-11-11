import type { ReactElement, ReactNode } from "react";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

interface AsyncButtonContentProps {
  children: ReactNode;
  className?: string;
  isPending: boolean;
  pendingLabel: string;
  spinnerClassName?: string;
}

export function AsyncButtonContent({
  children,
  className,
  isPending,
  pendingLabel,
  spinnerClassName,
}: AsyncButtonContentProps): ReactElement {
  return (
    <span
      className={cn(
        "grid min-w-0 grid-cols-1 grid-rows-1 place-items-center",
        className,
      )}
    >
      <span
        aria-hidden={isPending}
        className={cn(
          "col-start-1 row-start-1 inline-flex items-center justify-center gap-2",
          isPending && "invisible",
        )}
      >
        {children}
      </span>
      <span
        aria-hidden={!isPending}
        aria-live={isPending ? "polite" : undefined}
        className={cn(
          "col-start-1 row-start-1 inline-flex items-center justify-center gap-2",
          !isPending && "invisible",
        )}
        role={isPending ? "status" : undefined}
      >
        <Loader2
          aria-hidden="true"
          className={cn("size-4 animate-spin", spinnerClassName)}
        />
        <span>{pendingLabel}</span>
      </span>
    </span>
  );
}

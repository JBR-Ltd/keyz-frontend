import type { ComponentProps, ReactElement, ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statusBadgeVariants = cva(
  "inline-flex shrink-0 items-center font-body font-medium shadow-sm",
  {
    variants: {
      tone: {
        primary: "bg-primary/5 text-primary",
        accent: "bg-accent/10 text-primary",
        danger: "bg-red-700/10 text-red-700",
        neutral: "bg-surface-soft text-muted",
      },
      size: {
        sm: "gap-1.5 rounded-full px-3 py-1 text-xs",
        md: "gap-2 rounded-full px-3 py-1.5 text-xs",
      },
    },
    defaultVariants: {
      tone: "primary",
      size: "md",
    },
  },
);

export interface StatusBadgeProps
  extends ComponentProps<"span">, VariantProps<typeof statusBadgeVariants> {
  icon?: ReactNode;
}

export function StatusBadge({
  children,
  className,
  icon,
  size,
  tone,
  ...props
}: StatusBadgeProps): ReactElement {
  return (
    <span
      className={cn(statusBadgeVariants({ tone, size }), className)}
      {...props}
    >
      {icon}
      {children}
    </span>
  );
}

export { statusBadgeVariants };

import type { ComponentProps, ReactElement } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const iconTileVariants = cva(
  "inline-flex shrink-0 items-center justify-center shadow-sm",
  {
    variants: {
      tone: {
        primary: "bg-primary/5 text-primary",
        accent: "bg-accent/10 text-accent-alt",
        neutral: "bg-surface-soft text-muted",
      },
      size: {
        sm: "h-10 w-10",
        md: "h-11 w-11",
        lg: "h-12 w-12",
      },
      shape: {
        square: "rounded-lg",
        circle: "rounded-full",
      },
    },
    defaultVariants: {
      tone: "primary",
      size: "md",
      shape: "square",
    },
  },
);

export interface IconTileProps
  extends ComponentProps<"span">, VariantProps<typeof iconTileVariants> {}

export function IconTile({
  children,
  className,
  shape,
  size,
  tone,
  ...props
}: IconTileProps): ReactElement {
  return (
    <span
      className={cn(iconTileVariants({ tone, size, shape }), className)}
      {...props}
    >
      {children}
    </span>
  );
}

export { iconTileVariants };

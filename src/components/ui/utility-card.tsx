import type { ComponentProps, ReactElement } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const utilityCardVariants = cva("min-w-0 rounded-lg shadow-sm", {
  variants: {
    tone: {
      default: "bg-bg",
      soft: "bg-surface-soft",
      primaryTint: "bg-primary/5",
      accentTint: "bg-accent/10",
    },
    padding: {
      none: "",
      compact: "p-4",
      default: "p-5",
      spacious: "p-6",
    },
    interactive: {
      true: "transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:bg-surface-soft hover:shadow-md",
      false: "",
    },
  },
  defaultVariants: {
    tone: "default",
    padding: "default",
    interactive: false,
  },
});

export interface UtilityCardProps
  extends ComponentProps<"div">, VariantProps<typeof utilityCardVariants> {}

export function UtilityCard({
  className,
  interactive,
  padding,
  tone,
  ...props
}: UtilityCardProps): ReactElement {
  return (
    <div
      className={cn(
        utilityCardVariants({ tone, padding, interactive }),
        className,
      )}
      {...props}
    />
  );
}

export { utilityCardVariants };

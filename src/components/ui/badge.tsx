import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-deep-olive text-warm-ivory",
        secondary:
          "border-transparent bg-sand-beige text-warm-charcoal",
        outline:
          "border-border-subtle text-warm-charcoal",
        bronze:
          "border-transparent bg-muted-bronze text-warm-ivory",
        success:
          "border-transparent bg-status-success-bg text-status-success",
        warning:
          "border-transparent bg-status-warning-bg text-status-warning",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

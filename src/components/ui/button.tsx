import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 min-touch-target cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-deep-olive text-warm-ivory hover:bg-dark-olive shadow-sm",
        secondary:
          "bg-sand-beige text-warm-charcoal hover:bg-sand-beige/80",
        outline:
          "border border-border-subtle bg-soft-ivory text-warm-charcoal hover:bg-sand-beige/40",
        ghost:
          "text-warm-charcoal hover:bg-sand-beige/30",
        bronze:
          "bg-muted-bronze text-warm-ivory hover:bg-muted-bronze/90 shadow-sm",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-12 rounded-lg px-8 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

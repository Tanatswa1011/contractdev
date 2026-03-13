import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-full text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aiAccent focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // Primary: solid, high-emphasis
        primary:
          "bg-[#111111] text-white hover:bg-[#181818] dark:bg-white dark:text-[#111111] dark:hover:bg-[#e5e5e5] border border-transparent",
        // Secondary: bordered, transparent background
        secondary:
          "border border-[#e5e5e5] bg-transparent text-[#111111] hover:bg-[#f5f5f5] dark:border-[#2a2a2a] dark:text-white dark:hover:bg-[#1f1f1f]",
        // Ghost: low-emphasis
        ghost:
          "bg-transparent text-[#555555] hover:bg-[#f5f5f5] dark:text-[#aaaaaa] dark:hover:bg-[#1f1f1f]",
        // Semantic variants keep existing behavior
        danger:
          "bg-danger text-danger-foreground hover:bg-danger/90",
        success:
          "bg-success text-success-foreground hover:bg-success/90",
        // Backwards-compatible aliases
        default:
          "bg-[#111111] text-white hover:bg-[#181818] dark:bg-white dark:text-[#111111] dark:hover:bg-[#e5e5e5] border border-transparent",
        outline:
          "border border-[#e5e5e5] bg-transparent text-[#111111] hover:bg-[#f5f5f5] dark:border-[#2a2a2a] dark:text-white dark:hover:bg-[#1f1f1f]",
        subtle:
          "border border-[#e5e5e5] bg-transparent text-[#111111] hover:bg-[#f5f5f5] dark:border-[#2a2a2a] dark:text-white dark:hover:bg-[#1f1f1f]"
      },
      size: {
        sm: "px-3 py-1.5 text-[11px]",
        md: "px-4 py-2 text-xs",
        lg: "px-5 py-2.5 text-sm"
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "md"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";


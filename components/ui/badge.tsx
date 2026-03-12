import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-medium tracking-wide",
  {
    variants: {
      variant: {
        default:
          "border-border bg-muted text-muted-foreground",
        outline:
          "border-border text-muted-foreground",
        success:
          "border-success/40 bg-success/10 text-success",
        warning:
          "border-warning/40 bg-warning/10 text-warning",
        danger:
          "border-danger/40 bg-danger/10 text-danger",
        info:
          "border-aiAccent/40 bg-aiAccent/10 text-aiAccent"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}


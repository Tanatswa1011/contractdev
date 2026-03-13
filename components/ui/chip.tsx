import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

interface ChipProps extends HTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

export function Chip({ active, className, ...props }: ChipProps) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-medium text-muted-foreground transition-colors",
        active
          ? "border-foreground bg-btn text-btn-foreground"
          : "border-border bg-secondary hover:border-foreground/40 hover:text-foreground",
        className
      )}
      {...props}
    />
  );
}


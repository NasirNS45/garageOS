import type { ButtonHTMLAttributes } from "react";
import { cn } from "./cn";

interface FilterPillProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

/** Status/filter chip used in JobsTab and similar filter rows. */
export default function FilterPill({
  active = false,
  className,
  children,
  ...rest
}: FilterPillProps) {
  return (
    <button
      type="button"
      className={cn(
        "shrink-0 px-3.5 py-1.5 rounded-[var(--r-pill)] text-xs font-semibold transition whitespace-nowrap",
        active
          ? "bg-[var(--brand)] text-white shadow-sm"
          : "bg-[var(--surface)] text-[var(--text-muted)] ring-1 ring-[var(--border)] hover:bg-[var(--surface-2)] hover:text-[var(--text-strong)]",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

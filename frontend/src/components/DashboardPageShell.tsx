import type { ReactNode } from "react";
import { cn } from "./ui/cn";

export type DashboardPageVariant = "scroll" | "split";

interface DashboardPageShellProps {
  children: ReactNode;
  /** scroll: standard padded page. split: full-height jobs layout (no outer padding). */
  variant?: DashboardPageVariant;
  className?: string;
}

/**
 * Unified dashboard page frame — same padding and min-height on every tab
 * so navigation does not shift content vertically.
 */
export default function DashboardPageShell({
  children,
  variant = "scroll",
  className,
}: DashboardPageShellProps) {
  return (
    <div
      className={cn(
        "dashboard-page w-full",
        variant === "split" && "dashboard-page--split flex",
        variant === "scroll" && "overflow-y-auto",
        variant === "split" &&
          "min-h-[var(--dashboard-content-min-h)] lg:min-h-[var(--dashboard-content-min-h-lg)]",
        className
      )}
    >
      {children}
    </div>
  );
}

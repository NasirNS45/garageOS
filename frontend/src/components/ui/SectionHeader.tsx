import type { ReactNode } from "react";
import { cn } from "./cn";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

/** Consistent section title row with optional right-aligned action. */
export default function SectionHeader({ title, subtitle, action, className }: SectionHeaderProps) {
  return (
    <div className={cn("flex items-end justify-between gap-3 mb-3", className)}>
      <div className="min-w-0">
        <h2 className="text-sm font-bold text-[var(--text-strong)] truncate">{title}</h2>
        {subtitle && <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

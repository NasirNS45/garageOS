import type { ReactNode } from "react";
import { cn } from "./cn";

interface PageHeaderProps {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  meta?: ReactNode;
  className?: string;
}

/** Page title block with optional stats row and actions. */
export default function PageHeader({
  title,
  subtitle,
  actions,
  meta,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("mb-5", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1
            className="font-bold text-[var(--text-strong)] tracking-tight"
            style={{ fontSize: "var(--text-page-title)" }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-[var(--text-muted)] mt-0.5">{subtitle}</p>
          )}
        </div>
        {actions && <div className="shrink-0 flex items-center gap-2">{actions}</div>}
      </div>
      {meta && <div className="mt-3">{meta}</div>}
    </div>
  );
}

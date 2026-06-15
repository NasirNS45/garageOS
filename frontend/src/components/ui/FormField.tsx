import type { ReactNode } from "react";
import { cn } from "./cn";

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  errorId?: string;
  hint?: ReactNode;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}

/** Standard form field wrapper with uppercase label and error slot. */
export default function FormField({
  label,
  htmlFor,
  error,
  errorId,
  hint,
  action,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn("min-w-0", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1 mb-1.5">
        <label
          htmlFor={htmlFor}
          className="block text-[length:var(--text-label)] font-semibold text-[var(--text-muted)] uppercase tracking-wide"
        >
          {label}
        </label>
        {action}
      </div>
      {children}
      {hint && !error && (
        <p className="text-xs text-[var(--text-faint)] mt-1">{hint}</p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-xs text-[var(--danger-fg)] mt-1">
          {error}
        </p>
      )}
    </div>
  );
}

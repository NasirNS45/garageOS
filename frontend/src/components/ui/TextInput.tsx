import * as React from "react";
import { cn } from "./cn";

export const inputBaseClass =
  "w-full bg-[var(--surface-2)] ring-1 ring-[var(--border)] rounded-[var(--r-control)] px-3 py-2.5 text-sm text-[var(--text-strong)] placeholder:text-[var(--text-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)] transition";

export function fieldClass(hasError: boolean): string {
  return hasError
    ? "w-full bg-[var(--surface-2)] ring-1 ring-[var(--danger)] rounded-[var(--r-control)] px-3 py-2.5 text-sm text-[var(--text-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--danger)] transition"
    : inputBaseClass;
}

export interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  ({ className, hasError = false, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(fieldClass(hasError), className)}
        aria-invalid={hasError || undefined}
        {...props}
      />
    );
  }
);
TextInput.displayName = "TextInput";

export default TextInput;

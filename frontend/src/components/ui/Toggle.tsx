import { cn } from "./cn";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  id?: string;
  disabled?: boolean;
  className?: string;
}

/** Accessible switch toggle used in forms and settings. */
export default function Toggle({
  checked,
  onChange,
  label,
  id,
  disabled = false,
  className,
}: ToggleProps) {
  const inputId = id ?? `toggle-${label.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <label
      htmlFor={inputId}
      className={cn(
        "flex items-center gap-3 select-none",
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
        className
      )}
    >
      <div className="relative shrink-0">
        <input
          id={inputId}
          type="checkbox"
          role="switch"
          aria-checked={checked}
          className="sr-only"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div
          className={cn(
            "w-10 h-5 rounded-[var(--r-pill)] transition-colors",
            checked
              ? "bg-[var(--brand)]"
              : "bg-[var(--surface-2)] ring-1 ring-[var(--border)]"
          )}
        />
        <div
          className={cn(
            "absolute top-0.5 start-0.5 w-4 h-4 bg-white rounded-[var(--r-pill)] shadow transition-transform",
            checked && "translate-x-5 rtl:-translate-x-5"
          )}
        />
      </div>
      <span className="text-sm text-[var(--text-strong)]">{label}</span>
    </label>
  );
}

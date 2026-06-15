import type { HTMLAttributes } from "react";
import { cn } from "./cn";

export type BadgeTone = "brand" | "success" | "warning" | "danger" | "info" | "neutral";
type Size = "sm" | "md";

const TONE: Record<BadgeTone, string> = {
  brand:   "bg-[var(--brand-bg)]   text-[var(--brand-fg)]   ring-1 ring-[var(--brand)]/25",
  success: "bg-[var(--success-bg)] text-[var(--success-fg)] ring-1 ring-[var(--success)]/25",
  warning: "bg-[var(--warning-bg)] text-[var(--warning-fg)] ring-1 ring-[var(--warning)]/25",
  danger:  "bg-[var(--danger-bg)]  text-[var(--danger-fg)]  ring-1 ring-[var(--danger)]/25",
  info:    "bg-[var(--info-bg)]    text-[var(--info-fg)]    ring-1 ring-[var(--info)]/25",
  neutral: "bg-[var(--neutral-bg)] text-[var(--neutral-fg)]",
};

const DOT: Record<BadgeTone, string> = {
  brand: "bg-[var(--brand)]",
  success: "bg-[var(--success)]",
  warning: "bg-[var(--warning)]",
  danger: "bg-[var(--danger)]",
  info: "bg-[var(--info)]",
  neutral: "bg-[var(--neutral-fg)]",
};

const SIZE: Record<Size, string> = {
  sm: "text-[11px] px-2 py-0.5 gap-1",
  md: "text-xs px-2.5 py-1 gap-1.5",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  size?: Size;
  /** Leading status dot. */
  dot?: boolean;
}

/** Pill/badge primitive. Replaces the ~60 inline `bg-x-100 text-x-800` pills. */
export default function Badge({
  tone = "neutral",
  size = "md",
  dot = false,
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-semibold rounded-[var(--r-pill)] whitespace-nowrap",
        TONE[tone],
        SIZE[size],
        className
      )}
      {...rest}
    >
      {dot && <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", DOT[tone])} aria-hidden />}
      {children}
    </span>
  );
}

import type { ReactNode } from "react";
import { cn } from "./cn";

export type IconTone = "brand" | "success" | "warning" | "danger" | "info" | "neutral";
type Size = "sm" | "md" | "lg";

const TONE: Record<IconTone, string> = {
  brand: "bg-[var(--brand-bg)] text-[var(--brand-fg)]",
  success: "bg-[var(--success-bg)] text-[var(--success-fg)]",
  warning: "bg-[var(--warning-bg)] text-[var(--warning-fg)]",
  danger: "bg-[var(--danger-bg)] text-[var(--danger-fg)]",
  info: "bg-[var(--info-bg)] text-[var(--info-fg)]",
  neutral: "bg-[var(--neutral-bg)] text-[var(--neutral-fg)]",
};

const SIZE: Record<Size, string> = {
  sm: "w-8 h-8 rounded-lg [&>svg]:size-4",
  md: "w-10 h-10 rounded-xl [&>svg]:size-5",
  lg: "w-12 h-12 rounded-xl [&>svg]:size-6",
};

interface IconTileProps {
  tone?: IconTone;
  size?: Size;
  className?: string;
  children: ReactNode;
}

/** Tinted icon container. Standardizes the scattered `w-9 h-9 bg-x-50 text-x-600` blocks. */
export default function IconTile({ tone = "brand", size = "md", className, children }: IconTileProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center shrink-0 ring-1 ring-inset ring-[var(--ring-subtle)]",
        TONE[tone],
        SIZE[size],
        className
      )}
      aria-hidden
    >
      {children}
    </div>
  );
}

import * as React from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

/* ── Legacy Card wrapper ────────────────────────────────────────────────── */

type Variant = "default" | "elevated" | "inset";
type Padding = "none" | "sm" | "md" | "lg";

const VARIANT: Record<Variant, string> = {
  default:  "bg-[var(--surface)] ring-1 ring-[var(--border)] shadow-[var(--shadow-sm)]",
  elevated: "bg-[var(--surface-raised)] ring-1 ring-[var(--border)] shadow-[var(--shadow-md)]",
  inset:    "bg-[var(--surface-2)] ring-1 ring-[var(--border)]",
};

const PADDING: Record<Padding, string> = {
  none: "",
  sm:   "p-3",
  md:   "p-4",
  lg:   "p-5",
};

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
  padding?: Padding;
  interactive?: boolean;
  children?: ReactNode;
}

export default function Card({
  variant = "default",
  padding = "md",
  interactive = false,
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--r-card)]",
        VARIANT[variant],
        PADDING[padding],
        interactive && "card-lift u-press cursor-pointer",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

/* ── shadcn/ui Card sub-components ──────────────────────────────────────── */

const CardRoot = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)}
      {...props}
    />
  )
);
CardRoot.displayName = "CardRoot";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  )
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("text-2xl font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  )
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  )
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  )
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
  )
);
CardFooter.displayName = "CardFooter";

export { CardRoot, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };

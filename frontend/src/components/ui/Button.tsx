import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { LoaderCircle } from "lucide-react";
import { cn } from "./cn";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:brightness-90 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:     "bg-primary text-primary-foreground hover:brightness-110",
        destructive: "bg-destructive text-destructive-foreground hover:brightness-110",
        outline:     "border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--text-strong)] hover:bg-[var(--surface-2)]",
        secondary:   "bg-[var(--surface-2)] text-[var(--text-strong)] ring-1 ring-[var(--border-strong)] hover:bg-[var(--surface-raised)]",
        ghost:       "text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text-strong)]",
        link:        "text-primary underline-offset-4 hover:underline",
        /* Legacy aliases kept so existing callers don't break */
        primary:     "bg-primary text-primary-foreground hover:brightness-110",
        danger:      "bg-destructive text-destructive-foreground hover:brightness-110",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm:      "h-8 px-3 text-xs",
        lg:      "h-11 px-8",
        icon:    "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "default",
      asChild = false,
      loading = false,
      leftIcon,
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";

    // Slot requires exactly one React element child — no loading/icon siblings.
    if (asChild) {
      return (
        <Comp
          className={cn(buttonVariants({ variant, size }), fullWidth && "w-full", className)}
          ref={ref}
          {...props}
        >
          {children}
        </Comp>
      );
    }

    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), fullWidth && "w-full", className)}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? (
          <LoaderCircle size={size === "sm" ? 14 : 16} className="animate-spin" aria-hidden />
        ) : (
          leftIcon
        )}
        {children}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button };
export default Button;

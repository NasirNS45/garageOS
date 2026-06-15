import type { CSSProperties, ReactNode } from "react";
import { cn } from "../ui/cn";

const GRID_PATTERN =
  "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNiI+PHBhdGggZD0ibTM2IDM0di00aC0ydjRoLTR2Mmg0djRoMnYtNGg0di0yaC00em0wLTMwVjBoLTJ2NGgtNHYyaDR2NGgyVjZoNFY0aC00ek02IDM0di00SDR2NGgwdjJoNHY0aDJ2LTRoNHYtMkg2ek02IDRWMEg0djRIMHYyaDR2NGgyVjZoNFY0SDZ6Ii8+PC9nPjwvZz48L3N2Zz4=')";

/** Consistent max-width + horizontal padding (matches dashboard). */
export function LandingContainer({
  children,
  className,
  narrow,
}: {
  children: ReactNode;
  className?: string;
  narrow?: boolean;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-[var(--page-pad-x)] lg:px-[var(--page-pad-x-lg)]",
        narrow ? "max-w-3xl" : "max-w-[1400px]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function LandingSection({
  children,
  id,
  className,
  variant = "default",
}: {
  children: ReactNode;
  id?: string;
  className?: string;
  variant?: "default" | "muted" | "dark" | "hero";
}) {
  const bg =
    variant === "muted"
      ? "bg-[var(--surface-2)]"
      : variant === "dark"
        ? "bg-[var(--brand-panel)] text-white"
        : variant === "hero"
          ? "text-white"
          : "bg-[var(--surface)]";

  return (
    <section id={id} className={cn("py-14 lg:py-16", bg, className)}>
      {children}
    </section>
  );
}

export function LandingSectionHeader({
  badge,
  title,
  subtitle,
  className,
  light = false,
}: {
  badge: string;
  title: string;
  subtitle?: string;
  className?: string;
  light?: boolean;
}) {
  return (
    <div className={cn("text-center mb-10 lg:mb-12", className)}>
      <span
        className={cn(
          "inline-flex items-center text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-[var(--r-pill)] mb-3",
          light
            ? "bg-white/10 text-white/90 ring-1 ring-white/15"
            : "bg-[var(--brand-bg)] text-[var(--brand)]"
        )}
      >
        {badge}
      </span>
      <h2
        className={cn(
          "urdu-display text-3xl lg:text-4xl font-extrabold leading-tight",
          light ? "text-white" : "text-[var(--text-strong)]"
        )}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={cn(
            "mt-3 max-w-2xl mx-auto text-base leading-relaxed",
            light ? "text-white/75" : "text-[var(--text-muted)]"
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

export function LandingCard({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      style={style}
      className={cn(
        "bg-[var(--surface)] ring-1 ring-[var(--border)] rounded-[var(--r-card)] shadow-[var(--shadow-sm)]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function LandingHeroBackdrop({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{ background: "var(--brand-panel)", colorScheme: "dark" }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(135deg, color-mix(in srgb, var(--brand) 30%, transparent) 0%, transparent 50%, color-mix(in srgb, var(--brand-panel) 80%, #000) 100%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-50 pointer-events-none"
        style={{ backgroundImage: GRID_PATTERN }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}

/** Merged marquee + stats dark band. */
export function LandingDarkStrip({ children }: { children: ReactNode }) {
  return (
    <section
      className="bg-[var(--brand-panel)] text-white border-y border-white/5"
      aria-label="GarageOS highlights"
    >
      {children}
    </section>
  );
}

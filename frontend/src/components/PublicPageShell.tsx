import { type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import AuthLanguageToggle from "./AuthLanguageToggle";
import EmptyState from "./EmptyState";
import { resolveBrandColor } from "../utils/brandColor";

interface PublicPageShellProps {
  children: ReactNode;
  actions?: ReactNode;
  maxWidth?: 480 | 600;
}

/** Centered layout for customer-facing invoice and track pages. */
export function PublicPageShell({ children, actions, maxWidth = 600 }: PublicPageShellProps) {
  return (
    <div className="min-h-screen bg-[var(--page)] py-6 px-4 print:bg-white print:p-0">
      <div
        className="mx-auto mb-3.5 flex justify-end gap-2 print:hidden"
        style={{ maxWidth }}
      >
        <AuthLanguageToggle />
        {actions}
      </div>
      <div className="mx-auto" style={{ maxWidth }}>
        {children}
      </div>
    </div>
  );
}

export function PublicBrand() {
  return (
    <span className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.12em] uppercase opacity-80 mb-3">
      <span className="w-[22px] h-[22px] rounded-lg bg-white/20 flex items-center justify-center">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
      </span>
      GarageOS
    </span>
  );
}

export function PublicSectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-2.5">
      {children}
    </div>
  );
}

export function PublicCard({ children }: { children: ReactNode }) {
  return (
    <div className="bg-white border border-slate-100 rounded-[var(--r-card)] overflow-hidden shadow-[0_4px_24px_rgba(15,23,42,0.08)] print:shadow-none print:border-0 print:rounded-none">
      {children}
    </div>
  );
}

export function PublicCenterSpinner({
  label,
  brandColor,
}: {
  label: string;
  brandColor?: string | null;
}) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-[var(--page)] gap-3"
      role="status"
    >
      <Loader2
        className="animate-spin"
        size={28}
        style={{ color: resolveBrandColor(brandColor) }}
        aria-hidden
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function PublicNotFound({
  icon,
  title,
}: {
  icon: ReactNode;
  title: string;
}) {
  return (
    <div className="min-h-screen bg-[var(--page)] flex items-center justify-center px-4">
      <EmptyState icon={icon} title={title} />
    </div>
  );
}

import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="text-slate-300">{icon}</div>
      <p className="text-slate-700 font-semibold text-base mt-4">{title}</p>
      {description && (
        <p className="text-slate-400 text-sm mt-1 max-w-xs">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-6 bg-[var(--brand)] hover:bg-[var(--brand-hover)] active:bg-[var(--brand-panel)] text-white font-semibold rounded-xl px-6 py-3 text-sm transition active:scale-95 shadow-sm"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

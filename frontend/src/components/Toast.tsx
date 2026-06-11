import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import type { Toast, ToastType } from "../context/ToastContext";

const STYLES: Record<ToastType, { bg: string; icon: React.ReactNode }> = {
  success: {
    bg: "bg-emerald-600",
    icon: <CheckCircle2 size={18} className="shrink-0" />,
  },
  error: {
    bg: "bg-red-600",
    icon: <XCircle size={18} className="shrink-0" />,
  },
  info: {
    bg: "bg-[var(--brand)]",
    icon: <Info size={18} className="shrink-0" />,
  },
};

interface ToastListProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

export default function ToastList({ toasts, onDismiss }: ToastListProps) {
  if (!toasts.length) return null;

  return (
    <div className="fixed top-[max(16px,env(safe-area-inset-top))] inset-x-4 z-50 flex flex-col gap-2 max-w-sm mx-auto pointer-events-none">
      {toasts.map((t) => {
        const { bg, icon } = STYLES[t.type];
        return (
          <div
            key={t.id}
            role={t.type === "error" ? "alert" : "status"}
            aria-live={t.type === "error" ? "assertive" : "polite"}
            className={`${bg} text-white rounded-2xl px-4 py-3 shadow-lg flex items-center gap-3 pointer-events-auto`}
          >
            {icon}
            <span className="text-sm font-medium flex-1">{t.message}</span>
            <button
              onClick={() => onDismiss(t.id)}
              aria-label="Dismiss"
              className="text-white/70 hover:text-white transition p-1"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

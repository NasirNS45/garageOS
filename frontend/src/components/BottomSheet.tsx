import { useEffect, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export default function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) {
      setMounted(true);
      // Defer to next frame so the entry animation runs
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
    } else {
      setVisible(false);
      closeTimer.current = setTimeout(() => setMounted(false), 320);
    }
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, [open]);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-end lg:items-center justify-center p-0 lg:px-4">
      {/* Overlay */}
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Sheet — mobile: slide up from bottom; desktop: centered dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="bs-title"
        className={`relative w-full max-w-2xl lg:max-w-md mx-auto bg-white dark:bg-slate-800 rounded-t-3xl lg:rounded-2xl shadow-2xl transition-all duration-300 ease-out ${
          visible
            ? "translate-y-0 lg:translate-y-0 opacity-100"
            : "translate-y-full lg:translate-y-3 opacity-0"
        }`}
      >
        {/* Drag handle (mobile only) */}
        <div className="flex justify-center pt-3 pb-1 lg:hidden">
          <div className="w-10 h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-700">
          <h2 id="bs-title" className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[80vh] overscroll-contain px-5 pb-10 pt-4">{children}</div>
      </div>
    </div>
  );
}

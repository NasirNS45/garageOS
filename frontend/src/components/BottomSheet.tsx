import { useEffect, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { useT } from "../i18n/useT";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  const t = useT();
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<Element | null>(null);

  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement;
      setMounted(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
      document.body.style.overflow = "hidden";
    } else {
      setVisible(false);
      closeTimer.current = setTimeout(() => setMounted(false), 320);
      document.body.style.overflow = "";
    }
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !sheetRef.current) return;

      const focusables = Array.from(sheetRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!visible || !sheetRef.current) return;
    const focusables = sheetRef.current.querySelectorAll<HTMLElement>(FOCUSABLE);
    focusables[0]?.focus();
  }, [visible]);

  useEffect(() => {
    if (open) return;
    const trigger = triggerRef.current;
    if (trigger instanceof HTMLElement) {
      trigger.focus();
    }
  }, [open]);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-end lg:items-center justify-center p-0 lg:px-4">
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
        aria-hidden
      />

      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bs-title"
        className={`relative w-full max-w-2xl lg:max-w-md mx-auto bg-white dark:bg-slate-800 rounded-t-3xl lg:rounded-2xl shadow-2xl transition-all duration-300 ease-out ${
          visible
            ? "translate-y-0 lg:translate-y-0 opacity-100"
            : "translate-y-full lg:translate-y-3 opacity-0"
        }`}
      >
        <div className="flex justify-center pt-3 pb-1 lg:hidden">
          <div className="w-10 h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full" />
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-700">
          <h2 id="bs-title" className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("common.close")}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[80vh] overscroll-contain px-5 pb-10 pt-4">{children}</div>
      </div>
    </div>
  );
}

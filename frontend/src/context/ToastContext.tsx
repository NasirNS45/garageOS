import type { ReactNode } from "react";
import { toast as sonnerToast } from "sonner";

export type ToastType = "success" | "error" | "info";

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
  dismiss: (id: string) => void;
}

export function useToast(): ToastContextValue {
  function toast(message: string, type: ToastType = "info") {
    if (type === "success") sonnerToast.success(message);
    else if (type === "error") sonnerToast.error(message);
    else sonnerToast(message);
  }

  function dismiss(id: string) {
    sonnerToast.dismiss(id);
  }

  return { toast, dismiss };
}

export function ToastProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

import { type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useT } from "../i18n/useT";
import { cn } from "./ui/cn";

type SheetSize = "sm" | "md" | "lg";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: SheetSize;
}

const SIZE_CLASS: Record<SheetSize, string> = {
  sm: "lg:max-w-sm",
  md: "lg:max-w-md",
  lg: "lg:max-w-lg",
};

const overlayVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1 },
};

const sheetVariants = {
  hidden:  { y: "100%", opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring" as const, damping: 30, stiffness: 300 },
  },
  exit: { y: "100%", opacity: 0, transition: { duration: 0.22, ease: "easeIn" as const } },
};

export default function BottomSheet({
  open,
  onClose,
  title,
  children,
  size = "md",
}: BottomSheetProps) {
  const t = useT();

  return (
    <Dialog.Root open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-40 bg-black/50"
                variants={overlayVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                transition={{ duration: 0.2 }}
              />
            </Dialog.Overlay>

            <Dialog.Content asChild forceMount>
              <motion.div
                role="dialog"
                aria-modal="true"
                className={cn(
                  "fixed z-40 w-full mx-auto",
                  "bottom-0 left-0 right-0 max-w-full",
                  "lg:bottom-auto lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2",
                  SIZE_CLASS[size],
                  "bg-[var(--surface)] rounded-t-3xl lg:rounded-[var(--r-card)]",
                  "shadow-[var(--shadow-lg)] ring-1 ring-[var(--border)]",
                  "outline-none"
                )}
                variants={sheetVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                style={{ originX: "50%", originY: "50%" }}
              >
                <div className="flex justify-center pt-3 pb-1 lg:hidden">
                  <div className="w-10 h-1.5 bg-[var(--border-strong)] rounded-full" />
                </div>

                <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border)]">
                  <Dialog.Title
                    className="text-lg font-bold text-[var(--text-strong)] truncate"
                    style={{ fontSize: "var(--text-section)" }}
                  >
                    {title}
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      aria-label={t("common.close")}
                      className="text-[var(--text-faint)] hover:text-[var(--text-muted)] transition p-1.5 rounded-lg hover:bg-[var(--surface-2)]"
                    >
                      <X size={18} />
                    </button>
                  </Dialog.Close>
                </div>

                <div className="overflow-y-auto max-h-[80vh] overscroll-contain px-5 pb-10 pt-4">
                  {children}
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Button } from "./ui";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-12 px-6 text-center"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
    >
      <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-[var(--neutral-bg)] text-[var(--text-faint)] ring-1 ring-inset ring-[var(--ring-subtle)]">
        {icon}
      </div>
      <p className="text-[var(--text-strong)] font-semibold text-base mt-4">{title}</p>
      {description && (
        <p className="text-[var(--text-muted)] text-sm mt-1 max-w-xs">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick} className="mt-6">
          {action.label}
        </Button>
      )}
    </motion.div>
  );
}

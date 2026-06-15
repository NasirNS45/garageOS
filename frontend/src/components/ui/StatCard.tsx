import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { motion } from "framer-motion";
import Card from "./Card";
import IconTile, { type IconTone } from "./IconTile";
import { cn } from "./cn";

interface Delta {
  text: string;
  direction?: "up" | "down" | "flat";
}

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  tone?: IconTone;
  delta?: Delta;
  className?: string;
}

const DELTA_STYLE: Record<NonNullable<Delta["direction"]>, string> = {
  up: "text-[var(--success-fg)]",
  down: "text-[var(--danger-fg)]",
  flat: "text-[var(--text-faint)]",
};

const DELTA_ICON = { up: ArrowUpRight, down: ArrowDownRight, flat: Minus } as const;

/** KPI tile — label, big tabular value, optional trend delta + icon. */
export default function StatCard({ label, value, icon, tone = "brand", delta, className }: StatCardProps) {
  const dir = delta?.direction ?? "flat";
  const DeltaIcon = DELTA_ICON[dir];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
    >
    <Card padding="md" className={cn("flex items-start justify-between gap-3", className)}>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-faint)]">
          {label}
        </p>
        <p
          className="text-2xl font-bold text-[var(--text-strong)] mt-1 tnum truncate"
          data-keep-ltr
        >
          {value}
        </p>
        {delta && (
          <p className={cn("flex items-center gap-0.5 text-xs font-semibold mt-1", DELTA_STYLE[dir])}>
            <DeltaIcon size={13} aria-hidden />
            {delta.text}
          </p>
        )}
      </div>
      {icon && (
        <IconTile tone={tone} size="md">
          {icon}
        </IconTile>
      )}
    </Card>
    </motion.div>
  );
}

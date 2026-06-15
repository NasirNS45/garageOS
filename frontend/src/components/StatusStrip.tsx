import { CheckCircle2, ClipboardList, Wrench } from "lucide-react";
import type { JobCard } from "../hooks/useJobCards";
import { useT } from "../i18n/useT";

interface StatusStripProps {
  jobs: JobCard[];
}

function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export default function StatusStrip({ jobs }: StatusStripProps) {
  const t = useT();
  const today = localDateStr(new Date());

  const active = jobs.filter(
    (j) => j.status === "pending" || j.status === "in_progress"
  ).length;

  const doneToday = jobs.filter(
    (j) =>
      j.status === "completed" &&
      j.completed_at !== null &&
      localDateStr(new Date(j.completed_at)) === today
  ).length;

  const total = jobs.length;

  if (total === 0) return null;

  const chips = [
    { icon: Wrench, tone: "text-[var(--info-fg)]", bg: "bg-[var(--info-bg)]", value: active, label: t("stat.active").toLowerCase() },
    { icon: CheckCircle2, tone: "text-[var(--success-fg)]", bg: "bg-[var(--success-bg)]", value: doneToday, label: t("stat.doneToday").toLowerCase() },
    { icon: ClipboardList, tone: "text-[var(--neutral-fg)]", bg: "bg-[var(--neutral-bg)]", value: total, label: t("stat.total").toLowerCase() },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map(({ icon: Icon, tone, bg, value, label }) => (
        <span
          key={label}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--r-pill)] text-xs font-medium text-[var(--text-muted)] ${bg}`}
        >
          <Icon size={12} className={tone} />
          <span className={`font-bold text-[var(--text-strong)] tnum ${tone}`} data-keep-ltr>
            {value}
          </span>
          <span>{label}</span>
        </span>
      ))}
    </div>
  );
}

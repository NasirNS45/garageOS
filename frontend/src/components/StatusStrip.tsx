import { CheckCircle2, ClipboardList, Wrench } from "lucide-react";
import type { JobCard } from "../hooks/useJobCards";
import { useT } from "../i18n/useT";
import type { TKey } from "../i18n/translations";

interface StatusStripProps {
  jobs: JobCard[];
}

function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

type Accent = "blue" | "emerald" | "slate";

const ACCENTS: Record<Accent, { chip: string; value: string }> = {
  blue: {
    chip: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300",
    value: "text-blue-700 dark:text-blue-300",
  },
  emerald: {
    chip: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300",
    value: "text-emerald-700 dark:text-emerald-300",
  },
  slate: {
    chip: "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300",
    value: "text-slate-700 dark:text-slate-200",
  },
};

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

  const stats: { icon: React.ElementType; value: number; label: TKey; accent: Accent }[] = [
    { icon: Wrench, value: active, label: "stat.active", accent: "blue" },
    { icon: CheckCircle2, value: doneToday, label: "stat.doneToday", accent: "emerald" },
    { icon: ClipboardList, value: total, label: "stat.total", accent: "slate" },
  ];

  return (
    <div className="grid grid-cols-3 gap-2.5 mb-4">
      {stats.map(({ icon: Icon, value, label, accent }) => {
        const a = ACCENTS[accent];
        return (
          <div
            key={label}
            className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-3 flex flex-col gap-1.5"
          >
            <div className="flex items-center justify-between">
              <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${a.chip}`}>
                <Icon size={14} strokeWidth={2.2} />
              </span>
              <span className={`text-2xl font-extrabold leading-none ${a.value}`} data-keep-ltr>
                {value}
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-tight">
              {t(label)}
            </p>
          </div>
        );
      })}
    </div>
  );
}

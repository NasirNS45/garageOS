import type { JobCard } from "../hooks/useJobCards";

interface StatusStripProps {
  jobs: JobCard[];
}

function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export default function StatusStrip({ jobs }: StatusStripProps) {
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

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 mb-3 no-scrollbar">
      <Pill color="blue" label={`${active} Active`} />
      <Pill color="emerald" label={`${doneToday} Done today`} />
      <Pill color="slate" label={`${total} Total`} />
    </div>
  );
}

function Pill({ color, label }: { color: "blue" | "emerald" | "slate"; label: string }) {
  const styles = {
    blue: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
    emerald: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
    slate: "bg-slate-100 dark:bg-slate-700 text-slate-600",
  };
  const dot = {
    blue: "bg-blue-50 dark:bg-blue-900/300",
    emerald: "bg-emerald-50 dark:bg-emerald-900/300",
    slate: "bg-slate-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shrink-0 ${styles[color]}`}
    >
      <span className={`w-2 h-2 rounded-full ${dot[color]}`} />
      {label}
    </span>
  );
}

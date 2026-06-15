import {
  BarChart3,
  ClipboardList,
  Clock,
  History,
  Settings,
  Wrench,
} from "lucide-react";
import { useT } from "../../i18n/useT";
import type { TKey } from "../../i18n/translations";

const JOBS = [
  {
    plate: "LEA-4821",
    customer: "Muhammad Asif",
    statusKey: "status.in_progress" as TKey,
    statusClass: "bg-[var(--info-bg)] text-[var(--info-fg)]",
    amount: "PKR 4,500",
    rowClass: "bg-[var(--row-progress)]",
  },
  {
    plate: "KHI-1155",
    customer: "Fatima Zaidi",
    statusKey: "status.pending" as TKey,
    statusClass: "bg-[var(--warning-bg)] text-[var(--warning-fg)]",
    amount: "PKR 8,000",
    rowClass: "bg-[var(--row-pending)]",
  },
  {
    plate: "ISB-7743",
    customer: "Bilal Ahmed",
    statusKey: "status.completed" as TKey,
    statusClass: "bg-[var(--success-bg)] text-[var(--success-fg)]",
    amount: "PKR 3,200",
    rowClass: "bg-[var(--row-completed)]",
  },
] as const;

const RAIL_ITEMS = [
  { icon: ClipboardList, active: true, labelKey: "nav.jobs" as TKey },
  { icon: History, active: false, labelKey: "nav.history" as TKey },
  { icon: BarChart3, active: false, labelKey: "nav.summary" as TKey },
  { icon: Settings, active: false, labelKey: "nav.settings" as TKey },
] as const;

/** Static desktop dashboard mockup for the landing preview section. */
export default function LandingProductPreview() {
  const t = useT();
  const selected = JOBS[0];

  return (
    <div
      className="rounded-[var(--r-card)] overflow-hidden ring-1 ring-[var(--border)] shadow-[var(--shadow-md)] bg-[var(--page)]"
      data-keep-ltr
    >
      <div className="flex min-h-[340px] lg:min-h-[400px]">
        {/* Sidebar rail */}
        <div className="hidden sm:flex w-14 shrink-0 flex-col items-center gap-2 py-4 bg-[var(--brand-panel)] border-e border-white/10">
          <div className="w-8 h-8 rounded-lg bg-[var(--brand)] flex items-center justify-center mb-2">
            <Wrench size={14} className="text-white" />
          </div>
          {RAIL_ITEMS.map(({ icon: Icon, active, labelKey }) => (
            <div
              key={labelKey}
              title={t(labelKey)}
              className={`w-9 h-9 rounded-[var(--r-pill)] flex items-center justify-center ${
                active ? "bg-white/15 text-white" : "text-white/45"
              }`}
            >
              <Icon size={16} />
            </div>
          ))}
        </div>

        {/* Jobs list */}
        <div className="flex-1 min-w-0 border-e border-[var(--border)] bg-[var(--surface)]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--surface)]">
            <div>
              <p className="text-sm font-bold text-[var(--text-strong)]">{t("nav.jobs")}</p>
              <p className="text-[10px] text-[var(--text-faint)]">Ali Motors</p>
            </div>
            <span className="text-[10px] font-semibold px-2.5 py-1 rounded-[var(--r-pill)] bg-[var(--brand-bg)] text-[var(--brand)]">
              3 {t("landing.mockup.todaysJobs").toLowerCase()}
            </span>
          </div>

          <div className="hidden md:grid grid-cols-[1fr_1fr_auto_auto] gap-3 px-4 py-2 text-[9px] font-semibold uppercase tracking-wide text-[var(--text-muted)] bg-[var(--surface-2)] border-b border-[var(--border)]">
            <span>{t("jobs.colVehicle")}</span>
            <span>{t("jobs.colCustomer")}</span>
            <span>{t("jobs.colStatus")}</span>
            <span className="text-end">{t("jobs.colAmount")}</span>
          </div>

          <div className="divide-y divide-[var(--border)]">
            {JOBS.map((job) => (
              <div
                key={job.plate}
                className={`flex items-center gap-3 px-4 py-3 ${job.rowClass} ${
                  job.plate === selected.plate ? "ring-1 ring-inset ring-[var(--brand)]/40" : ""
                }`}
              >
                <div className="bg-[#FDE047] border border-slate-800 rounded px-1.5 py-0.5 shrink-0">
                  <span className="text-[9px] font-black font-mono text-slate-900 tracking-wider">
                    {job.plate}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[var(--text-strong)] truncate">
                    {job.customer}
                  </p>
                </div>
                <span className={`hidden md:inline text-[9px] font-bold px-2 py-0.5 rounded-[var(--r-pill)] ${job.statusClass}`}>
                  {t(job.statusKey)}
                </span>
                <span className="text-xs font-bold text-[var(--text-strong)] shrink-0">
                  {job.amount}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Detail panel */}
        <div className="hidden lg:flex w-[220px] xl:w-[260px] shrink-0 flex-col bg-[var(--surface)]">
          <div className="px-4 py-3 border-b border-[var(--border)]">
            <p className="text-xs font-bold text-[var(--text-strong)]">{t("job.detailTitle")}</p>
          </div>
          <div className="p-4 space-y-3 flex-1">
            <div className="bg-[#FDE047] border border-slate-800 rounded px-2 py-1 w-fit">
              <span className="text-[10px] font-black font-mono text-slate-900 tracking-wider">
                {selected.plate}
              </span>
            </div>
            <div>
              <p className="text-[10px] text-[var(--text-faint)] uppercase tracking-wide">
                {t("jobs.colCustomer")}
              </p>
              <p className="text-xs font-semibold text-[var(--text-strong)]">{selected.customer}</p>
            </div>
            <div>
              <p className="text-[10px] text-[var(--text-faint)] uppercase tracking-wide">
                {t("jobs.colStatus")}
              </p>
              <span className={`inline-flex text-[10px] font-bold px-2 py-0.5 rounded-[var(--r-pill)] ${selected.statusClass}`}>
                {t(selected.statusKey)}
              </span>
            </div>
            <div className="rounded-[var(--r-card)] bg-[var(--surface-2)] p-3 space-y-1.5">
              <div className="flex justify-between text-[10px]">
                <span className="text-[var(--text-muted)]">Oil change</span>
                <span className="font-semibold text-[var(--text-strong)]">PKR 2,500</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-[var(--text-muted)]">Brake pads</span>
                <span className="font-semibold text-[var(--text-strong)]">PKR 2,000</span>
              </div>
              <div className="flex justify-between text-xs font-bold pt-1 border-t border-[var(--border)]">
                <span>{t("parts.total")}</span>
                <span>{selected.amount}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-[var(--success-fg)]">
              <Clock size={11} />
              {t("landing.mockup.whatsappSent")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

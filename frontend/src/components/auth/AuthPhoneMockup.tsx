import { Car, MessageCircle, TrendingUp, Wrench } from "lucide-react";
import { useT } from "../../i18n/useT";
import type { TKey } from "../../i18n/translations";

interface Props {
  className?: string;
  /** full = landing hero (3 cards + bubbles); compact = auth panel (2 cards) */
  variant?: "full" | "compact";
}

const JOB_META = [
  {
    plate: "LEA-4821",
    statusKey: "status.in_progress" as TKey,
    statusClass: "bg-blue-100 text-blue-700",
    name: "Muhammad Asif",
    detail: "Oil change · Brake pads",
    amount: "PKR 4,500",
  },
  {
    plate: "KHI-1155",
    statusKey: "status.pending" as TKey,
    statusClass: "bg-amber-100 text-amber-700",
    name: "Fatima Zaidi",
    detail: "AC service · Toyota Corolla",
    amount: "PKR 8,000",
  },
  {
    plate: "ISB-7743",
    statusKey: "status.completed" as TKey,
    statusClass: "bg-emerald-100 text-emerald-700",
    name: "Bilal Ahmed",
    detail: "Engine flush · Honda Civic",
    amount: "PKR 3,200",
  },
] as const;

const NAV_KEYS: readonly TKey[] = ["nav.jobs", "nav.history", "nav.summary", "nav.settings"];

/** Mini phone frame with job cards — shared by auth pages and landing hero. */
export default function AuthPhoneMockup({ className, variant = "full" }: Props) {
  const t = useT();
  const compact = variant === "compact";
  const jobs = compact ? JOB_META.slice(0, 2) : JOB_META;
  const widthClass = compact ? "w-[252px]" : "w-[280px] max-w-[300px]";

  return (
    <div className={`relative mx-auto select-none ${widthClass}${className ? ` ${className}` : ""}`}>
      <div className="absolute inset-0 -m-4 rounded-full bg-blue-500/15 blur-2xl pointer-events-none" />

      <div className="relative rounded-[42px] bg-slate-900 p-[10px] shadow-2xl shadow-blue-950/40 ring-1 ring-white/10">
        <div className="overflow-hidden rounded-[34px] bg-[#F1F5F9]">
          <div className="flex items-center justify-between bg-white px-5 pt-3 pb-2">
            <span className="text-[10px] font-semibold text-slate-600">9:41</span>
            <div className="h-4 w-20 rounded-full bg-slate-900" />
            <div className="flex gap-1">
              {[3, 2, 1].map((h) => (
                <div key={h} className="w-1 rounded-sm bg-slate-700" style={{ height: h * 4 }} />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between bg-white px-4 py-2.5 shadow-sm border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[var(--brand)] flex items-center justify-center">
                <Wrench size={12} className="text-white" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-900 leading-none">Ali Motors</p>
                <p className="text-[8px] text-slate-400 uppercase tracking-wide">{t("landing.mockup.owner")}</p>
              </div>
            </div>
          </div>

          <div className="px-3 py-3 space-y-2.5">
            {jobs.map((job) => (
              <div key={job.plate} className="bg-white rounded-xl p-3 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="bg-[#FDE047] border border-slate-800 rounded px-2 py-0.5">
                    <span className="text-[9px] font-black font-mono text-slate-900 tracking-wider">
                      {job.plate}
                    </span>
                  </div>
                  <span
                    className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${job.statusClass}`}
                  >
                    {t(job.statusKey)}
                  </span>
                </div>
                <p className="text-[10px] font-semibold text-slate-800">{job.name}</p>
                <p className="text-[9px] text-slate-400 mt-0.5">{job.detail}</p>
                <p className="text-[11px] font-bold text-slate-900 mt-1.5">{job.amount}</p>
              </div>
            ))}
          </div>

          <div className="flex bg-white border-t border-slate-100 px-2 py-2">
            {NAV_KEYS.map((key, i) => (
              <div
                key={key}
                className={`flex-1 flex flex-col items-center gap-0.5 ${i === 0 ? "text-[var(--brand)]" : "text-slate-300"}`}
              >
                <div className={`w-4 h-1 rounded-full mb-0.5 ${i === 0 ? "bg-[var(--brand)]" : "bg-transparent"}`} />
                <div className={`w-4 h-4 rounded ${i === 0 ? "bg-blue-100" : "bg-slate-100"}`} />
                <span className="text-[7px] font-semibold">{t(key)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {compact ? (
        <div
          className="lp-float absolute -right-1 top-16 bg-white rounded-xl shadow-lg px-2.5 py-2 flex items-center gap-2 border border-slate-100 max-w-[148px]"
          style={{ animationDelay: "0.5s" }}
        >
          <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0">
            <MessageCircle size={12} className="text-white" />
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-900 leading-tight">{t("landing.mockup.whatsappSent")}</p>
            <p className="text-[8px] text-slate-400 leading-tight">{t("landing.mockup.invoiceDelivered")}</p>
          </div>
        </div>
      ) : (
        <>
          <div
            className="lp-float absolute -left-8 top-6 bg-white rounded-2xl shadow-xl px-3 py-2.5 border border-slate-100 min-w-[148px]"
            style={{ animationDelay: "0s" }}
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <Car size={11} className="text-[var(--brand)]" />
              <span className="text-[9px] font-bold text-slate-700 uppercase tracking-wide">
                {t("landing.mockup.todaysJobs")}
              </span>
            </div>
            <div className="space-y-1">
              {[
                { plate: "LEA-4821", statusKey: "status.in_progress" as TKey, color: "bg-blue-400" },
                { plate: "KHI-1155", statusKey: "status.pending" as TKey, color: "bg-amber-400" },
                { plate: "ISB-7743", statusKey: "status.completed" as TKey, color: "bg-emerald-400" },
              ].map(({ plate, statusKey, color }) => (
                <div key={plate} className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${color} shrink-0`} />
                  <span className="text-[8px] font-mono font-semibold text-slate-700">{plate}</span>
                  <span className="text-[7px] text-slate-400 ml-auto">{t(statusKey)}</span>
                </div>
              ))}
            </div>
          </div>

          <div
            className="lp-float absolute -right-4 top-20 bg-white rounded-2xl shadow-xl px-3 py-2 flex items-center gap-2 border border-slate-100 max-w-[160px]"
            style={{ animationDelay: "0.6s" }}
          >
            <div className="w-7 h-7 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0">
              <MessageCircle size={12} className="text-white" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-900 leading-tight">{t("landing.mockup.whatsappSent")}</p>
              <p className="text-[8px] text-slate-400 leading-tight">{t("landing.mockup.invoiceDelivered")}</p>
            </div>
          </div>

          <div
            className="lp-float absolute -left-6 bottom-28 bg-white rounded-2xl shadow-xl px-3 py-2 border border-slate-100"
            style={{ animationDelay: "1.2s" }}
          >
            <p className="text-[8px] text-slate-500 font-medium">{t("landing.mockup.todaysRevenue")}</p>
            <p className="text-sm font-extrabold text-slate-900">PKR 47,500</p>
            <div className="flex items-center gap-1 mt-0.5">
              <TrendingUp size={9} className="text-emerald-500" />
              <span className="text-[8px] text-emerald-600 font-semibold">{t("landing.mockup.revenueGrowth")}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

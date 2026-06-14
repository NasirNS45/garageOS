import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Trash2, Wallet, X } from "lucide-react";
import {
  useSummary,
  useRangeSummary,
  useMechanicSummary,
  useDailySeries,
  type SummaryData,
  type RangeSummaryData,
  type MechanicSummaryItem,
} from "../../hooks/useJobCards";
import {
  useExpenses,
  useCreateExpense,
  useDeleteExpense,
  EXPENSE_CATEGORY_LABELS,
  type ExpenseCategory,
} from "../../hooks/useExpenses";
import JobCardSkeleton from "../../components/JobCardSkeleton";
import RevenueChart from "../../components/RevenueChart";
import BottomSheet from "../../components/BottomSheet";
import { useToast } from "../../context/ToastContext";
import { parseApiError } from "../../utils/parseApiError";
import { inputClass } from "./formStyles";
import { todayStr, shiftDate, weekRange, monthRange } from "../../utils/dates";
import { useT } from "../../i18n/useT";
import { trackPilotEvent } from "../../utils/trackPilotEvent";

// ── Summary tab ───────────────────────────────────────────────────────────────
type SummaryPeriod = "day" | "week" | "month";

export default function SummaryTab() {
  const t = useT();

  useEffect(() => {
    trackPilotEvent("summary_viewed");
  }, []);
  const today = todayStr();
  const [period, setPeriod] = useState<SummaryPeriod>("day");
  const [dayStr, setDayStr] = useState<string>(today);
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);

  // Compute the active date range based on period
  const [startDate, endDate] = (() => {
    if (period === "day") return [dayStr, dayStr];
    if (period === "week") return weekRange(weekOffset);
    return monthRange(monthOffset);
  })();

  const isToday = period === "day" && dayStr === today;
  const isCurrentWeek = period === "week" && weekOffset === 0;
  const isCurrentMonth = period === "month" && monthOffset === 0;
  const disableNext = isToday || isCurrentWeek || isCurrentMonth;

  const handlePrev = () => {
    if (period === "day") setDayStr((s) => shiftDate(s, -1));
    else if (period === "week") setWeekOffset((o) => o - 1);
    else setMonthOffset((o) => o - 1);
  };
  const handleNext = () => {
    if (disableNext) return;
    if (period === "day") setDayStr((s) => shiftDate(s, 1));
    else if (period === "week") setWeekOffset((o) => o + 1);
    else setMonthOffset((o) => o + 1);
  };

  // Human-readable period label
  const periodLabel = (() => {
    if (period === "day") {
      if (isToday) return t("summary.today");
      const [sy, sm, sd] = dayStr.split("-").map(Number);
      return new Date(sy, sm - 1, sd).toLocaleDateString("en-PK", {
        weekday: "short", day: "numeric", month: "short",
      });
    }
    if (period === "week") {
      const [s, e] = weekRange(weekOffset);
      const [sy, sm, sd] = s.split("-").map(Number);
      const [ey, em, ed] = e.split("-").map(Number);
      const start = new Date(sy, sm - 1, sd);
      const end = new Date(ey, em - 1, ed);
      const fmt = (dt: Date) =>
        dt.toLocaleDateString("en-PK", { day: "numeric", month: "short" });
      return isCurrentWeek
        ? `${t("summary.thisWeek")} (${fmt(start)} - ${fmt(end)})`
        : `${fmt(start)} - ${fmt(end)}`;
    }
    // month
    const [s] = monthRange(monthOffset);
    const [my, mm] = s.split("-").map(Number);
    return new Date(my, mm - 1, 1).toLocaleDateString("en-PK", {
      month: "long", year: "numeric",
    });
  })();

  // Fetch the right summary
  const dailyQ = useSummary(period === "day" ? dayStr : undefined);
  const rangeQ = useRangeSummary(startDate, endDate);
  const mechQ = useMechanicSummary(startDate, endDate);
  const seriesQ = useDailySeries(startDate, endDate, period !== "day");
  const expensesQ = useExpenses(startDate, endDate);

  const isLoading = period === "day" ? dailyQ.isLoading : rangeQ.isLoading;
  const isError = period === "day" ? dailyQ.isError : rangeQ.isError;
  const refetchSummary = () => {
    if (period === "day") dailyQ.refetch();
    else rangeQ.refetch();
  };

  const totalExpenses = expensesQ.data?.total_amount ?? 0;

  // Normalise to a common shape for rendering
  const d: { total_jobs: number; completed_jobs: number; in_progress_jobs: number; pending_jobs: number; total_revenue: number; total_collected: number } | undefined = (() => {
    if (period === "day") return dailyQ.data as SummaryData | undefined;
    return rangeQ.data as RangeSummaryData | undefined;
  })();

  const stats: { label: string; value: number; accent: boolean; bg: string; textColor: string }[] = [
    { label: t("summary.totalJobs"),  value: d?.total_jobs ?? 0,       accent: false, bg: "bg-white dark:bg-slate-800",          textColor: "text-slate-800 dark:text-slate-100" },
    { label: t("status.completed"),   value: d?.completed_jobs ?? 0,   accent: true,  bg: "bg-emerald-50 dark:bg-emerald-900/30", textColor: "text-emerald-700 dark:text-emerald-300" },
    { label: t("status.in_progress"), value: d?.in_progress_jobs ?? 0, accent: false, bg: "bg-blue-50 dark:bg-blue-900/30",       textColor: "text-blue-700 dark:text-blue-300" },
    { label: t("status.pending"),     value: d?.pending_jobs ?? 0,     accent: false, bg: "bg-amber-50 dark:bg-amber-900/30",     textColor: "text-amber-700 dark:text-amber-300" },
  ];

  return (
    <div>
      {/* Period switcher */}
      <div className="flex gap-2 mb-4">
        {(["day", "week", "month"] as SummaryPeriod[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 text-xs font-semibold py-2 rounded-xl transition active:scale-95 capitalize ${
              period === p
                ? "bg-[var(--brand)] text-white shadow-sm"
                : "bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600"
            }`}
          >
            {t(`summary.${p}`)}
          </button>
        ))}
      </div>

      {/* Date navigator */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrev}
          aria-label={t("summary.prevPeriod")}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 transition shadow-sm"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-bold text-slate-900 dark:text-slate-100 text-center px-2">{periodLabel}</span>
        <button
          onClick={handleNext}
          disabled={disableNext}
          aria-label={t("summary.nextPeriod")}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 transition shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {isLoading ? (
        <JobCardSkeleton count={2} />
      ) : isError ? (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center">
          <p className="font-semibold text-sm text-red-700 dark:text-red-300 mb-3">
            {t("summary.loadError")}
          </p>
          <button
            onClick={() => refetchSummary()}
            className="text-sm font-semibold text-[var(--brand)] underline hover:no-underline"
          >
            {t("common.retry")}
          </button>
        </div>
      ) : (
        <>
          {/* Revenue hero */}
          <div className="bg-gradient-to-r from-[var(--brand)] to-[var(--brand-hover)] rounded-2xl p-5 text-white mb-3 shadow-md">
            <p className="text-xs font-semibold uppercase tracking-widest opacity-70">
              {t("summary.revenue")}
            </p>
            <p className="text-3xl font-extrabold mt-1">
              PKR {(d?.total_revenue ?? 0).toLocaleString()}
            </p>
            <p className="text-xs opacity-60 mt-0.5">
              {t("summary.via")} {d?.completed_jobs ?? 0} {t("summary.completedJobs")}
              {(d?.completed_jobs ?? 0) > 0 &&
                ` · ${t("summary.avg")} PKR ${Math.round((d?.total_revenue ?? 0) / (d?.completed_jobs ?? 1)).toLocaleString()}`}
            </p>
            <div className="flex gap-4 mt-3 pt-3 border-t border-white/20">
              <div>
                <p className="text-[11px] uppercase tracking-widest opacity-60 font-semibold">
                  {t("summary.collected")}
                </p>
                <p className="text-base font-bold mt-0.5">
                  PKR {(d?.total_collected ?? 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-widest opacity-60 font-semibold">
                  {t("summary.outstanding")}
                </p>
                <p className="text-base font-bold mt-0.5">
                  PKR {((d?.total_revenue ?? 0) - (d?.total_collected ?? 0)).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-widest opacity-60 font-semibold">
                  {t("summary.expenses")}
                </p>
                <p className="text-base font-bold mt-0.5">
                  PKR {totalExpenses.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex justify-between items-baseline mt-3 pt-3 border-t border-white/20">
              <p className="text-[11px] uppercase tracking-widest opacity-60 font-semibold">
                {t("summary.netProfit")}
              </p>
              <p className="text-lg font-extrabold">
                PKR {((d?.total_revenue ?? 0) - totalExpenses).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Daily revenue chart (week/month) */}
          {period !== "day" && seriesQ.data && seriesQ.data.length > 1 && (
            <RevenueChart points={seriesQ.data} />
          )}

          {/* Stat grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            {stats.map((s) => (
              <div
                key={s.label}
                className={`${s.bg} rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 text-center`}
              >
                <p className={`text-2xl font-bold ${s.textColor}`}>
                  {s.value}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Expenses */}
          <ExpensesSection startDate={startDate} endDate={endDate} />

          {/* Mechanic breakdown */}
          <MechanicBreakdown items={mechQ.data ?? []} isLoading={mechQ.isLoading} />
        </>
      )}
    </div>
  );
}

// ── Expenses section ──────────────────────────────────────────────────────────

function ExpensesSection({ startDate, endDate }: { startDate: string; endDate: string }) {
  const t = useT();
  const [showForm, setShowForm] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const expensesQ = useExpenses(startDate, endDate);
  const deleteExpense = useDeleteExpense();
  const { toast } = useToast();

  const items = expensesQ.data?.items ?? [];

  const handleDelete = (id: string) => {
    setConfirmId(null);
    deleteExpense.mutate(id, {
      onSuccess: () => toast(t("summary.expenseDeleted"), "success"),
      onError: (e) => toast(parseApiError(e)._form ?? t("summary.expenseDeleteFailed"), "error"),
    });
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <Wallet size={15} className="text-amber-500" />
          {t("summary.expenses")}
        </h3>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1 text-xs font-semibold text-[var(--brand)] hover:underline active:scale-95 transition"
        >
          <Plus size={14} />
          {t("summary.addExpense")}
        </button>
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-slate-400 dark:text-slate-500">
          {t("summary.noExpenses")}
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((e) => (
            <div key={e.id} className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {t(`expcat.${e.category}`)}
                  {e.note ? ` · ${e.note}` : ""}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{e.expense_date}</p>
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 shrink-0">
                PKR {e.amount.toLocaleString()}
              </p>
              {confirmId === e.id ? (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleDelete(e.id)}
                    className="text-[11px] font-semibold text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-lg active:scale-95"
                  >
                    {t("common.delete")}
                  </button>
                  <button
                    onClick={() => setConfirmId(null)}
                    aria-label={t("common.cancel")}
                    className="text-slate-400 hover:text-slate-600 p-1 active:scale-95"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmId(e.id)}
                  aria-label={t("summary.deleteExpense")}
                  className="text-slate-300 hover:text-red-500 transition p-1 active:scale-95 shrink-0"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <BottomSheet open={showForm} onClose={() => setShowForm(false)} title={t("summary.addExpenseTitle")}>
        <ExpenseForm onSuccess={() => setShowForm(false)} />
      </BottomSheet>
    </div>
  );
}

function ExpenseForm({ onSuccess }: { onSuccess: () => void }) {
  const t = useT();
  const createExpense = useCreateExpense();
  const { toast } = useToast();
  const [expenseDate, setExpenseDate] = useState(todayStr());
  const [category, setCategory] = useState<ExpenseCategory>("parts_purchase");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseFloat(amount);
    if (!amount || isNaN(value) || value <= 0) {
      setError(t("summary.amountInvalid"));
      return;
    }
    setError("");
    createExpense.mutate(
      {
        expense_date: expenseDate,
        category,
        amount: value,
        note: note.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast(t("summary.expenseAdded"), "success");
          onSuccess();
        },
        onError: (err) =>
          toast(parseApiError(err)._form ?? t("summary.expenseSaveFailed"), "error"),
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
          {t("summary.date")}
        </label>
        <input
          type="date"
          value={expenseDate}
          max={todayStr()}
          onChange={(e) => setExpenseDate(e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
          {t("summary.category")}
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
          className={inputClass}
        >
          {(Object.keys(EXPENSE_CATEGORY_LABELS) as ExpenseCategory[]).map((value) => (
            <option key={value} value={value}>
              {t(`expcat.${value}`)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
          {t("summary.amount")}
        </label>
        <input
          type="number"
          inputMode="decimal"
          min="1"
          placeholder={t("summary.amountPlaceholder")}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className={inputClass}
        />
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
          {t("summary.note")}
        </label>
        <input
          type="text"
          maxLength={500}
          placeholder={t("summary.notePlaceholder")}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className={inputClass}
        />
      </div>
      <button
        type="submit"
        disabled={createExpense.isPending}
        className="w-full bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white font-bold py-3 rounded-xl transition active:scale-95 disabled:opacity-50"
      >
        {createExpense.isPending ? t("summary.saving") : t("summary.saveExpense")}
      </button>
    </form>
  );
}

function MechanicBreakdown({
  items,
  isLoading,
}: {
  items: MechanicSummaryItem[];
  isLoading: boolean;
}) {
  const t = useT();
  if (isLoading) return <JobCardSkeleton count={2} />;
  if (items.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700">
      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3">{t("summary.team")}</h3>
      <div className="space-y-3">
        {items.map((m) => (
          <div key={m.mechanic_id} className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{m.full_name}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                {m.completed_jobs} {m.completed_jobs === 1 ? t("summary.jobSingular") : t("summary.jobPlural")}
                {" · "}
                {t("summary.labour")} PKR {m.total_labour.toLocaleString()}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                PKR {m.total_revenue.toLocaleString()}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">{t("summary.revenueLabel")}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

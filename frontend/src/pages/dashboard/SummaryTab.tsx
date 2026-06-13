import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Trash2, Wallet } from "lucide-react";
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

// ── Summary tab ───────────────────────────────────────────────────────────────
type SummaryPeriod = "day" | "week" | "month";

export default function SummaryTab() {
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
      if (isToday) return "Today";
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
        ? `This week (${fmt(start)} - ${fmt(end)})`
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

  const totalExpenses = expensesQ.data?.total_amount ?? 0;

  // Normalise to a common shape for rendering
  const d: { total_jobs: number; completed_jobs: number; in_progress_jobs: number; pending_jobs: number; total_revenue: number; total_collected: number } | undefined = (() => {
    if (period === "day") return dailyQ.data as SummaryData | undefined;
    return rangeQ.data as RangeSummaryData | undefined;
  })();

  const stats: { label: string; value: number; accent: boolean; bg: string; textColor: string }[] = [
    { label: "Total Jobs",  value: d?.total_jobs ?? 0,       accent: false, bg: "bg-white dark:bg-slate-800",          textColor: "text-slate-800 dark:text-slate-100" },
    { label: "Completed",   value: d?.completed_jobs ?? 0,   accent: true,  bg: "bg-emerald-50 dark:bg-emerald-900/30", textColor: "text-emerald-700 dark:text-emerald-300" },
    { label: "In Progress", value: d?.in_progress_jobs ?? 0, accent: false, bg: "bg-blue-50 dark:bg-blue-900/30",       textColor: "text-blue-700 dark:text-blue-300" },
    { label: "Pending",     value: d?.pending_jobs ?? 0,     accent: false, bg: "bg-amber-50 dark:bg-amber-900/30",     textColor: "text-amber-700 dark:text-amber-300" },
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
            {p}
          </button>
        ))}
      </div>

      {/* Date navigator */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrev}
          aria-label="Previous period"
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 transition shadow-sm"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-bold text-slate-900 dark:text-slate-100 text-center px-2">{periodLabel}</span>
        <button
          onClick={handleNext}
          disabled={disableNext}
          aria-label="Next period"
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 transition shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {isLoading ? (
        <JobCardSkeleton count={2} />
      ) : (
        <>
          {/* Revenue hero */}
          <div className="bg-gradient-to-r from-[var(--brand)] to-[var(--brand-hover)] rounded-2xl p-5 text-white mb-3 shadow-md">
            <p className="text-xs font-semibold uppercase tracking-widest opacity-70">
              Revenue
            </p>
            <p className="text-3xl font-extrabold mt-1">
              PKR {(d?.total_revenue ?? 0).toLocaleString()}
            </p>
            <p className="text-xs opacity-60 mt-0.5">
              via {d?.completed_jobs ?? 0} completed job(s)
            </p>
            <div className="flex gap-4 mt-3 pt-3 border-t border-white/20">
              <div>
                <p className="text-[10px] uppercase tracking-widest opacity-60 font-semibold">
                  Collected
                </p>
                <p className="text-base font-bold mt-0.5">
                  PKR {(d?.total_collected ?? 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest opacity-60 font-semibold">
                  Outstanding
                </p>
                <p className="text-base font-bold mt-0.5">
                  PKR {((d?.total_revenue ?? 0) - (d?.total_collected ?? 0)).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest opacity-60 font-semibold">
                  Expenses
                </p>
                <p className="text-base font-bold mt-0.5">
                  PKR {totalExpenses.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex justify-between items-baseline mt-3 pt-3 border-t border-white/20">
              <p className="text-[10px] uppercase tracking-widest opacity-60 font-semibold">
                Net profit
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
          <div className="grid grid-cols-2 gap-3 mb-4">
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
  const [showForm, setShowForm] = useState(false);
  const expensesQ = useExpenses(startDate, endDate);
  const deleteExpense = useDeleteExpense();
  const { toast } = useToast();

  const items = expensesQ.data?.items ?? [];

  const handleDelete = (id: string) => {
    deleteExpense.mutate(id, {
      onSuccess: () => toast("Expense deleted", "success"),
      onError: (e) => toast(parseApiError(e)._form ?? "Could not delete expense", "error"),
    });
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <Wallet size={15} className="text-amber-500" />
          Expenses
        </h3>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1 text-xs font-semibold text-[var(--brand)] hover:underline active:scale-95 transition"
        >
          <Plus size={14} />
          Add expense
        </button>
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-slate-400 dark:text-slate-500">
          No expenses recorded for this period.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((e) => (
            <div key={e.id} className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {EXPENSE_CATEGORY_LABELS[e.category]}
                  {e.note ? ` · ${e.note}` : ""}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{e.expense_date}</p>
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 shrink-0">
                PKR {e.amount.toLocaleString()}
              </p>
              <button
                onClick={() => handleDelete(e.id)}
                aria-label="Delete expense"
                className="text-slate-300 hover:text-red-500 transition p-1 active:scale-95 shrink-0"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      <BottomSheet open={showForm} onClose={() => setShowForm(false)} title="Add Expense">
        <ExpenseForm onSuccess={() => setShowForm(false)} />
      </BottomSheet>
    </div>
  );
}

function ExpenseForm({ onSuccess }: { onSuccess: () => void }) {
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
      setError("Enter a valid amount");
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
          toast("Expense added", "success");
          onSuccess();
        },
        onError: (err) =>
          toast(parseApiError(err)._form ?? "Could not save expense", "error"),
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
          Date
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
          Category
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
          className={inputClass}
        >
          {Object.entries(EXPENSE_CATEGORY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
          Amount (PKR)
        </label>
        <input
          type="number"
          inputMode="decimal"
          min="1"
          placeholder="e.g. 2500"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className={inputClass}
        />
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
          Note (optional)
        </label>
        <input
          type="text"
          maxLength={500}
          placeholder="e.g. Brake pads stock"
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
        {createExpense.isPending ? "Saving…" : "Save Expense"}
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
  if (isLoading) return <JobCardSkeleton count={2} />;
  if (items.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700">
      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3">Team Performance</h3>
      <div className="space-y-3">
        {items.map((m) => (
          <div key={m.mechanic_id} className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{m.full_name}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                {m.completed_jobs} job{m.completed_jobs !== 1 ? "s" : ""}
                {" · "}
                Labour PKR {m.total_labour.toLocaleString()}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                PKR {m.total_revenue.toLocaleString()}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">revenue</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

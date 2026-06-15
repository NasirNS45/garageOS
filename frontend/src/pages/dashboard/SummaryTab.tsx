import { useEffect, useState, type ReactNode } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  Plus,
  Trash2,
  Wrench,
  X,
} from "lucide-react";
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
import EmptyState from "../../components/EmptyState";
import DashboardPageShell from "../../components/DashboardPageShell";
import { useToast } from "../../context/ToastContext";
import { parseApiError } from "../../utils/parseApiError";
import { Button, Card, FilterPill, FormField, PageHeader, SectionHeader, StatCard, TextInput } from "../../components/ui";
import { todayStr, shiftDate, weekRange, monthRange, formatLocaleDate } from "../../utils/dates";
import { useT } from "../../i18n/useT";
import { useLanguageStore } from "../../stores/languageStore";
import { trackPilotEvent } from "../../utils/trackPilotEvent";

// ── Summary tab ───────────────────────────────────────────────────────────────
type SummaryPeriod = "day" | "week" | "month";

export default function SummaryTab() {
  const t = useT();
  const language = useLanguageStore((s) => s.language);
  const PrevIcon = language === "ur" ? ChevronRight : ChevronLeft;
  const NextIcon = language === "ur" ? ChevronLeft : ChevronRight;

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
      return formatLocaleDate(new Date(sy, sm - 1, sd), language, {
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
        formatLocaleDate(dt, language, { day: "numeric", month: "short" });
      return isCurrentWeek
        ? `${t("summary.thisWeek")} (${fmt(start)} - ${fmt(end)})`
        : `${fmt(start)} - ${fmt(end)}`;
    }
    // month
    const [s] = monthRange(monthOffset);
    const [my, mm] = s.split("-").map(Number);
    return formatLocaleDate(new Date(my, mm - 1, 1), language, {
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

  const stats: {
    label: string;
    value: number;
    tone: "neutral" | "success" | "info" | "warning";
    icon: ReactNode;
  }[] = [
    { label: t("summary.totalJobs"),  value: d?.total_jobs ?? 0,       tone: "neutral", icon: <ClipboardList /> },
    { label: t("status.completed"),   value: d?.completed_jobs ?? 0,   tone: "success", icon: <CheckCircle2 /> },
    { label: t("status.in_progress"), value: d?.in_progress_jobs ?? 0, tone: "info",    icon: <Wrench /> },
    { label: t("status.pending"),     value: d?.pending_jobs ?? 0,     tone: "warning", icon: <Clock /> },
  ];

  return (
    <DashboardPageShell>
      <PageHeader
        title={t("nav.summary")}
        actions={
          <div className="flex gap-2">
            {(["day", "week", "month"] as SummaryPeriod[]).map((p) => (
              <FilterPill key={p} active={period === p} onClick={() => setPeriod(p)}>
                {t(`summary.${p}`)}
              </FilterPill>
            ))}
          </div>
        }
      />

      {/* Date navigator */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrev}
          aria-label={t("summary.prevPeriod")}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-[var(--surface)] ring-1 ring-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--surface-2)] active:scale-95 transition"
        >
          <PrevIcon size={18} />
        </button>
        <span className="text-sm font-bold text-[var(--text-strong)] text-center px-2">{periodLabel}</span>
        <button
          onClick={handleNext}
          disabled={disableNext}
          aria-label={t("summary.nextPeriod")}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-[var(--surface)] ring-1 ring-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--surface-2)] active:scale-95 transition disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <NextIcon size={18} />
        </button>
      </div>

      {isLoading ? (
        <JobCardSkeleton count={2} />
      ) : isError ? (
        <EmptyState
          icon={<ClipboardList size={48} />}
          title={t("summary.loadError")}
          action={{ label: t("common.retry"), onClick: () => refetchSummary() }}
        />
      ) : (
        <>
          {/* Revenue hero — fullbleed dark */}
          <div className="bg-[var(--surface)] border-s-4 border-[var(--brand)] rounded-[var(--r-card)] ring-1 ring-[var(--border)] p-5 mb-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-faint)] mb-1">
              {t("summary.revenue")}
            </p>
            <p className="text-5xl font-black text-[var(--text-strong)] tnum leading-none" data-keep-ltr>
              PKR {(d?.total_revenue ?? 0).toLocaleString()}
            </p>
            <p className="text-xs text-[var(--text-faint)] mt-1.5">
              {t("summary.via")} {d?.completed_jobs ?? 0} {t("summary.completedJobs")}
              {(d?.completed_jobs ?? 0) > 0 &&
                ` · ${t("summary.avg")} PKR ${Math.round((d?.total_revenue ?? 0) / (d?.completed_jobs ?? 1)).toLocaleString()}`}
            </p>
            <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-[var(--border)]">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[var(--text-faint)] font-semibold mb-0.5">
                  {t("summary.collected")}
                </p>
                <p className="text-lg font-black text-[var(--success-fg)] tnum leading-none" data-keep-ltr>
                  PKR {(d?.total_collected ?? 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[var(--text-faint)] font-semibold mb-0.5">
                  {t("summary.outstanding")}
                </p>
                <p className="text-lg font-black text-[var(--warning-fg)] tnum leading-none" data-keep-ltr>
                  PKR {((d?.total_revenue ?? 0) - (d?.total_collected ?? 0)).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[var(--text-faint)] font-semibold mb-0.5">
                  {t("summary.netProfit")}
                </p>
                <p className="text-lg font-black text-[var(--text-strong)] tnum leading-none" data-keep-ltr>
                  PKR {((d?.total_revenue ?? 0) - totalExpenses).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* ── 2-col desktop layout ── */}
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Left: chart + stat grid + expenses */}
            <div className="flex-1 min-w-0 space-y-4">
              {/* Daily revenue chart (week/month) */}
              {period !== "day" && seriesQ.data && seriesQ.data.length > 1 && (
                <RevenueChart points={seriesQ.data} />
              )}

              {/* Stat grid */}
              <div className="grid grid-cols-2 gap-3">
                {stats.map((s) => (
                  <StatCard key={s.label} label={s.label} value={s.value} tone={s.tone} icon={s.icon} />
                ))}
              </div>

              {/* Expenses */}
              <ExpensesSection startDate={startDate} endDate={endDate} />
            </div>

            {/* Right: mechanic leaderboard */}
            <div className="lg:w-80 shrink-0">
              <MechanicBreakdown items={mechQ.data ?? []} isLoading={mechQ.isLoading} />
            </div>
          </div>
        </>
      )}
    </DashboardPageShell>
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
    <Card className="mb-4">
      <SectionHeader
        title={t("summary.expenses")}
        action={
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1 text-xs font-semibold text-[var(--brand)] hover:underline active:scale-95 transition"
          >
            <Plus size={14} />
            {t("summary.addExpense")}
          </button>
        }
      />

      {items.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={32} />}
          title={t("summary.noExpenses")}
          description={t("summary.addExpense")}
          action={{ label: t("summary.addExpense"), onClick: () => setShowForm(true) }}
        />
      ) : (
        <div className="space-y-2">
          {items.map((e) => (
            <div key={e.id} className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--text-strong)] truncate">
                  {t(`expcat.${e.category}`)}
                  {e.note ? ` · ${e.note}` : ""}
                </p>
                <p className="text-xs text-[var(--text-faint)] mt-0.5">{e.expense_date}</p>
              </div>
              <p className="text-sm font-bold text-[var(--text-strong)] shrink-0 tnum" data-keep-ltr>
                PKR {e.amount.toLocaleString()}
              </p>
              {confirmId === e.id ? (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleDelete(e.id)}
                    className="text-[11px] font-semibold text-[var(--danger-fg)] bg-[var(--danger-bg)] px-2 py-1 rounded-[var(--r-control)] active:scale-95"
                  >
                    {t("common.delete")}
                  </button>
                  <button
                    onClick={() => setConfirmId(null)}
                    aria-label={t("common.cancel")}
                    className="text-[var(--text-faint)] hover:text-[var(--text-muted)] p-1 active:scale-95"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmId(e.id)}
                  aria-label={t("summary.deleteExpense")}
                  className="text-[var(--text-faint)] hover:text-[var(--danger-fg)] transition p-1 active:scale-95 shrink-0"
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
    </Card>
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
      <FormField label={t("summary.date")}>
        <TextInput
          type="date"
          value={expenseDate}
          max={todayStr()}
          onChange={(e) => setExpenseDate(e.target.value)}
        />
      </FormField>
      <FormField label={t("summary.category")}>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
          className="w-full bg-[var(--surface-2)] ring-1 ring-[var(--border)] rounded-[var(--r-control)] px-3 py-2.5 text-sm text-[var(--text-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)] transition"
        >
          {(Object.keys(EXPENSE_CATEGORY_LABELS) as ExpenseCategory[]).map((value) => (
            <option key={value} value={value}>
              {t(`expcat.${value}`)}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label={t("summary.amount")} error={error}>
        <TextInput
          type="number"
          inputMode="decimal"
          min="1"
          placeholder={t("summary.amountPlaceholder")}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          hasError={!!error}
        />
      </FormField>
      <FormField label={t("summary.note")}>
        <TextInput
          type="text"
          maxLength={500}
          placeholder={t("summary.notePlaceholder")}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </FormField>
      <Button type="submit" fullWidth loading={createExpense.isPending}>
        {createExpense.isPending ? t("summary.saving") : t("summary.saveExpense")}
      </Button>
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
  if (items.length === 0) {
    return (
      <Card>
        <SectionHeader title={t("summary.team")} />
        <p className="text-xs text-[var(--text-faint)] text-center py-4">
          {t("summary.noTeam")}
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <SectionHeader title={t("summary.team")} />
      <div className="space-y-3">
        {items.map((m) => (
          <div key={m.mechanic_id} className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--text-strong)] truncate">{m.full_name}</p>
              <p className="text-xs text-[var(--text-faint)] mt-0.5">
                {m.completed_jobs} {m.completed_jobs === 1 ? t("summary.jobSingular") : t("summary.jobPlural")}
                {" · "}
                <span className="tnum" data-keep-ltr>{t("summary.labour")} PKR {m.total_labour.toLocaleString()}</span>
              </p>
            </div>
            <div className="text-end shrink-0">
              <p className="text-sm font-bold text-[var(--text-strong)] tnum" data-keep-ltr>
                PKR {m.total_revenue.toLocaleString()}
              </p>
              <p className="text-[11px] text-[var(--text-faint)] font-medium">{t("summary.revenueLabel")}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

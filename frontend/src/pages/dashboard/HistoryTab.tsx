import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Car,
  ChevronRight,
  Phone,
  Search,
  SearchX,
  Trophy,
  Wallet,
  X,
} from "lucide-react";
import JobCardSkeleton from "../../components/JobCardSkeleton";
import EmptyState from "../../components/EmptyState";
import PullToRefresh from "../../components/PullToRefresh";
import DashboardPageShell from "../../components/DashboardPageShell";
import CustomerJobList, {
  CustomerSummaryCard,
  computeTotalSpent,
  type CustomerJob,
} from "../../components/CustomerJobList";
import { useCustomerInsights } from "../../hooks/useCustomerInsights";
import { useOutstandingCustomers } from "../../hooks/useOutstandingCustomers";
import { api } from "../../api/axios";
import { useT } from "../../i18n/useT";
import { useLanguageStore } from "../../stores/languageStore";
import {
  Button,
  FilterPill,
  PageHeader,
  TextInput,
  cn,
} from "../../components/ui";
import type { Language } from "../../i18n/translations";

interface HistoryJob extends CustomerJob {}

interface HistoryResult {
  customer_name: string;
  total_jobs: number;
  jobs: HistoryJob[];
}

type HistoryStatusFilter = "all" | "completed" | "in_progress" | "pending" | "cancelled";
type SearchType = "vehicle" | "phone";

const HISTORY_STATUS_KEYS: Record<
  HistoryStatusFilter,
  "status.all" | "status.completed" | "status.in_progress" | "status.pending" | "status.cancelled"
> = {
  all: "status.all",
  completed: "status.completed",
  in_progress: "status.in_progress",
  pending: "status.pending",
  cancelled: "status.cancelled",
};

export default function HistoryTab() {
  const t = useT();
  const language = useLanguageStore((s) => s.language);
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [type, setType] = useState<SearchType>("vehicle");
  const [result, setResult] = useState<HistoryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<HistoryStatusFilter>("all");
  const insightsQ = useCustomerInsights(8);
  const outstandingQ = useOutstandingCustomers(8);

  const runSearch = async (searchType: SearchType, value: string) => {
    setLoading(true);
    setSearched(true);
    setResult(null);
    setSearchError(false);
    setHistoryFilter("all");
    try {
      const param =
        searchType === "vehicle"
          ? `vehicle_number=${encodeURIComponent(value)}`
          : `phone=${encodeURIComponent(value)}`;
      const { data } = await api.get<HistoryResult>(`/customers/history?${param}`);
      setResult(data);
    } catch {
      setResult(null);
      setSearchError(true);
    } finally {
      setLoading(false);
    }
  };

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    void runSearch(type, query.trim());
  };

  const openCustomer = (phone: string) => {
    navigate(`/customers/${encodeURIComponent(phone)}`);
  };

  const showDiscovery =
    !searched &&
    !loading &&
    ((outstandingQ.data?.length ?? 0) > 0 || (insightsQ.data?.length ?? 0) > 0);

  const handleRefresh = async () => {
    await Promise.all([
      outstandingQ.refetch(),
      insightsQ.refetch(),
      searched && query.trim() ? runSearch(type, query.trim()) : Promise.resolve(),
    ]);
  };

  return (
    <DashboardPageShell>
      <PullToRefresh onRefresh={handleRefresh}>
      <PageHeader title={t("history.title")} subtitle={t("history.searchHint")} />

      {/* Search */}
      <div className="bg-[var(--surface)] rounded-[var(--r-card)] ring-1 ring-[var(--border)] p-4 lg:p-5 mb-6">
        <div className="flex gap-2 mb-3">
          <FilterPill
            active={type === "vehicle"}
            onClick={() => setType("vehicle")}
            className="flex items-center gap-1.5"
          >
            <Car size={13} />
            {t("history.byVehicle")}
          </FilterPill>
          <FilterPill
            active={type === "phone"}
            onClick={() => setType("phone")}
            className="flex items-center gap-1.5"
          >
            <Phone size={13} />
            {t("history.byPhone")}
          </FilterPill>
        </div>

        <form onSubmit={search} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1 min-w-0">
            <Search
              size={16}
              className="absolute start-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)] pointer-events-none"
            />
            <TextInput
              type="text"
              required
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                type === "vehicle"
                  ? t("history.placeholderVehicle")
                  : t("history.placeholderPhone")
              }
              className="h-10 ps-9 pe-9 bg-[var(--surface)]"
              data-keep-ltr
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label={t("jobs.clearSearch")}
                className="absolute end-2.5 top-1/2 -translate-y-1/2 text-[var(--text-faint)] hover:text-[var(--text-strong)] p-0.5 active:scale-95"
              >
                <X size={15} />
              </button>
            )}
          </div>
          <Button type="submit" loading={loading} className="shrink-0 sm:min-w-[7.5rem]">
            {loading ? t("history.searching") : t("history.search")}
          </Button>
        </form>
      </div>

      {/* Discovery panels */}
      {!searched && (outstandingQ.isLoading || insightsQ.isLoading) && (
        <div className="grid lg:grid-cols-2 gap-4 mb-6">
          <JobCardSkeleton count={1} />
          <JobCardSkeleton count={1} />
        </div>
      )}

      {!searched && outstandingQ.isError && (
        <InsightError message={t("history.insightsError")} onRetry={() => void outstandingQ.refetch()} />
      )}

      {!searched && insightsQ.isError && !outstandingQ.isError && (
        <InsightError message={t("history.insightsError")} onRetry={() => void insightsQ.refetch()} />
      )}

      {showDiscovery && (
        <div className="grid lg:grid-cols-2 gap-4 mb-2">
          {(outstandingQ.data?.length ?? 0) > 0 && (
            <InsightPanel
              title={t("history.outstandingCustomers")}
              icon={<Wallet size={15} className="text-[var(--warning-fg)]" />}
            >
              {outstandingQ.data!.map((c, i) => (
                <InsightRow
                  key={c.customer_phone}
                  rank={i + 1}
                  name={c.customer_name}
                  meta={`${c.open_invoices} ${t("customer.openInvoices")} · ${c.customer_phone}`}
                  amount={`PKR ${c.total_outstanding.toLocaleString()}`}
                  amountClass="text-[var(--warning-fg)]"
                  onClick={() => openCustomer(c.customer_phone)}
                />
              ))}
            </InsightPanel>
          )}

          {(insightsQ.data?.length ?? 0) > 0 && (
            <InsightPanel
              title={t("history.topCustomers")}
              icon={<Trophy size={15} className="text-[var(--warning)]" />}
            >
              {insightsQ.data!.map((c, i) => (
                <InsightRow
                  key={c.customer_phone}
                  rank={i + 1}
                  name={c.customer_name}
                  meta={`${c.total_jobs} ${
                    c.total_jobs === 1 ? t("history.visit") : t("history.visits")
                  } · ${c.customer_phone}`}
                  amount={`PKR ${c.total_spent.toLocaleString()}`}
                  onClick={() => openCustomer(c.customer_phone)}
                />
              ))}
            </InsightPanel>
          )}
        </div>
      )}

      {loading && <JobCardSkeleton count={3} />}

      {!loading && searched && searchError && (
        <EmptyState
          icon={<SearchX size={48} />}
          title={t("history.searchFailed")}
          action={{ label: t("common.retry"), onClick: () => void runSearch(type, query.trim()) }}
        />
      )}

      {!loading && searched && !result && !searchError && (
        <EmptyState
          icon={<SearchX size={48} />}
          title={t("history.noRecords")}
          description={t("history.noRecordsDesc")}
        />
      )}

      {result && (
        <HistoryResults
          result={result}
          language={language}
          historyFilter={historyFilter}
          onFilterChange={setHistoryFilter}
          searchType={type}
          searchQuery={query.trim()}
          onOpenCustomer={openCustomer}
        />
      )}
      </PullToRefresh>
    </DashboardPageShell>
  );
}

/* ── Search results ─────────────────────────────────────────────────────── */

function HistoryResults({
  result,
  language,
  historyFilter,
  onFilterChange,
  searchType,
  searchQuery,
  onOpenCustomer,
}: {
  result: HistoryResult;
  language: Language;
  historyFilter: HistoryStatusFilter;
  onFilterChange: (f: HistoryStatusFilter) => void;
  searchType: SearchType;
  searchQuery: string;
  onOpenCustomer: (phone: string) => void;
}) {
  const t = useT();

  const filteredJobs =
    historyFilter === "all"
      ? result.jobs
      : result.jobs.filter((j) => j.status === historyFilter);

  const statuses = Array.from(new Set(result.jobs.map((j) => j.status)));
  const showFilter = statuses.length > 1;

  const filterOptions: HistoryStatusFilter[] = ["all", ...statuses].filter(
    (f, i, arr) => arr.indexOf(f) === i
  ) as HistoryStatusFilter[];

  return (
    <div className="space-y-4">
      <CustomerSummaryCard
        customerName={result.customer_name}
        totalJobs={result.total_jobs}
        totalSpent={computeTotalSpent(result.jobs)}
        language={language}
        profileAction={
          searchType === "phone" && searchQuery
            ? { label: t("customer.profile"), onClick: () => onOpenCustomer(searchQuery) }
            : undefined
        }
      />

      {showFilter && (
        <div className="relative">
          <div className="flex gap-2 overflow-x-auto pb-0.5 no-scrollbar">
            {filterOptions.map((f) => (
              <FilterPill
                key={f}
                active={historyFilter === f}
                onClick={() => onFilterChange(f)}
              >
                {t(HISTORY_STATUS_KEYS[f])}
              </FilterPill>
            ))}
          </div>
          <div className="absolute end-0 top-0 h-full w-8 bg-gradient-to-l rtl:bg-gradient-to-r from-[var(--page)] to-transparent pointer-events-none" />
        </div>
      )}

      {filteredJobs.length === 0 ? (
        <EmptyState
          icon={<SearchX size={40} />}
          title={t("history.noFilterJobs")}
          description={t("history.tryFilter")}
        />
      ) : (
        <CustomerJobList jobs={filteredJobs} language={language} showSectionHeader />
      )}
    </div>
  );
}

/* ── Discovery helpers ──────────────────────────────────────────────────── */

function InsightPanel({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[var(--surface)] rounded-[var(--r-card)] ring-1 ring-[var(--border)] overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[var(--border)] bg-[var(--surface-2)]">
        {icon}
        <h3 className="text-sm font-bold text-[var(--text-strong)]">{title}</h3>
      </div>
      <div className="divide-y divide-[var(--border)]">{children}</div>
    </div>
  );
}

function InsightRow({
  rank,
  name,
  meta,
  amount,
  amountClass,
  onClick,
}: {
  rank: number;
  name: string;
  meta: string;
  amount: string;
  amountClass?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 px-5 py-3.5 text-start hover:bg-[var(--surface-2)] transition group"
    >
      <span
        className="w-6 text-xs font-bold text-[var(--text-faint)] shrink-0 tnum text-center"
        data-keep-ltr
      >
        {rank}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[var(--text-strong)] truncate">{name}</p>
        <p className="text-xs text-[var(--text-faint)] truncate mt-0.5" data-keep-ltr>
          {meta}
        </p>
      </div>
      <p
        className={cn("text-sm font-bold shrink-0 tnum", amountClass ?? "text-[var(--text-strong)]")}
        data-keep-ltr
      >
        {amount}
      </p>
      <ChevronRight
        size={14}
        className="shrink-0 text-[var(--text-faint)] opacity-0 group-hover:opacity-100 transition-opacity"
      />
    </button>
  );
}

function InsightError({ message, onRetry }: { message: string; onRetry: () => void }) {
  const t = useT();
  return (
    <div
      className="bg-[var(--danger-bg)] ring-1 ring-[var(--border)] text-[var(--danger-fg)] text-sm rounded-[var(--r-card)] px-4 py-3 mb-4"
      role="alert"
    >
      <p>{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-2 text-xs font-semibold text-[var(--brand)] hover:underline"
      >
        {t("common.retry")}
      </button>
    </div>
  );
}

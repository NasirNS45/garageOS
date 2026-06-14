import { useEffect, useMemo, useRef, useState } from "react";
import { ClipboardList, Search, X } from "lucide-react";
import { useJobCards, type JobCard, type JobCardListFilters } from "../../hooks/useJobCards";
import { useDebounce } from "../../hooks/useDebounce";
import JobCardList from "../../components/JobCardList";
import StatusStrip from "../../components/StatusStrip";
import JobCardSkeleton from "../../components/JobCardSkeleton";
import EmptyState from "../../components/EmptyState";
import PullToRefresh from "../../components/PullToRefresh";
import OnboardingChecklist from "../../components/OnboardingChecklist";
import { useT } from "../../i18n/useT";
import type { TKey } from "../../i18n/translations";

type StatusFilter = "active" | "all" | "pending" | "in_progress" | "completed" | "unpaid";

const STATUS_FILTER_KEYS: Record<StatusFilter, TKey> = {
  active: "stat.active",
  all: "status.all",
  pending: "status.pending",
  in_progress: "status.in_progress",
  completed: "status.completed",
  unpaid: "job.unpaid",
};

const BASE_PILLS: StatusFilter[] = ["active", "pending", "in_progress", "completed", "all"];

function buildApiFilters(statusFilter: StatusFilter): JobCardListFilters {
  if (statusFilter === "active" || statusFilter === "pending" || statusFilter === "in_progress") {
    return { activeOnly: true };
  }
  if (statusFilter === "unpaid") {
    return { activeOnly: false, status: "completed", paymentStatus: "unpaid" };
  }
  if (statusFilter === "completed") {
    return { activeOnly: false, status: "completed" };
  }
  return { activeOnly: false };
}

export default function JobsTab({ role, onNewJob }: { role: string | null; onNewJob: () => void }) {
  const t = useT();
  const isOwner = role === "owner";
  const [page, setPage] = useState(1);
  const [allItems, setAllItems] = useState<JobCard[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  const apiFilters = useMemo(
    () => ({ ...buildApiFilters(statusFilter), search: debouncedSearch }),
    [statusFilter, debouncedSearch]
  );
  const { data, isLoading, isError, isFetching, refetch } = useJobCards(page, apiFilters);

  const prevP1Ts = useRef(0);
  const { dataUpdatedAt: p1UpdatedAt, data: p1Data } = useJobCards(1, apiFilters);

  useEffect(() => {
    setPage(1);
    setAllItems([]);
  }, [statusFilter, debouncedSearch]);

  useEffect(() => {
    if (!p1UpdatedAt || p1UpdatedAt === prevP1Ts.current) return;
    prevP1Ts.current = p1UpdatedAt;
    if (page !== 1) setPage(1);
    setAllItems(p1Data?.items ?? []);
  }, [p1UpdatedAt, p1Data, page]);

  useEffect(() => {
    if (!data || page === 1) return;
    setAllItems((prev) => {
      const ids = new Set(prev.map((c) => c.id));
      return [...prev, ...data.items.filter((c) => !ids.has(c.id))];
    });
  }, [data, page]);

  const displayItems = page === 1 ? (data?.items ?? allItems) : allItems;
  const hasMore = data ? displayItems.length < data.total : false;

  const filterPills = isOwner
    ? [...BASE_PILLS.slice(0, 4), "unpaid" as const, "all" as const]
    : BASE_PILLS;

  const q = search.trim().toLowerCase();
  const filteredItems = displayItems.filter((c) => {
    if (statusFilter === "active") {
      if (c.status !== "pending" && c.status !== "in_progress") return false;
    } else if (statusFilter === "unpaid") {
      if (c.status !== "completed" || c.payment_status !== "unpaid") return false;
    } else if (statusFilter !== "all") {
      if (c.status !== statusFilter) return false;
    }
    if (!q) return true;
    return (
      c.vehicle_number.toLowerCase().includes(q) ||
      c.customer_name.toLowerCase().includes(q) ||
      c.customer_phone.toLowerCase().includes(q)
    );
  });

  return (
    <PullToRefresh onRefresh={() => refetch()}>
      {displayItems.length > 0 && <StatusStrip jobs={displayItems} />}

      {displayItems.length > 0 && (
        <div className="relative mb-3">
          <Search
            size={16}
            className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("jobs.search")}
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl ps-9 pe-9 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent transition"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              aria-label={t("jobs.clearSearch")}
              className="absolute end-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 active:scale-95"
            >
              <X size={15} />
            </button>
          )}
        </div>
      )}

      {displayItems.length > 0 && (
        <div className="relative mb-3">
          <div className="flex gap-2 overflow-x-auto pb-0.5 no-scrollbar">
            {filterPills.map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full transition active:scale-95 ${
                  statusFilter === f
                    ? "bg-[var(--brand)] text-white shadow-sm"
                    : "bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600"
                }`}
              >
                {t(STATUS_FILTER_KEYS[f])}
              </button>
            ))}
          </div>
          <div className="absolute end-0 top-0 h-full w-8 bg-gradient-to-l rtl:bg-gradient-to-r from-[#F1F5F9] to-transparent dark:from-slate-900 pointer-events-none" />
        </div>
      )}

      {isLoading && page === 1 && <JobCardSkeleton count={3} />}

      {isError && (
        <EmptyState
          icon={<ClipboardList size={48} />}
          title={t("jobs.loadError.title")}
          description={t("jobs.loadError.desc")}
          action={{ label: t("common.retry"), onClick: () => refetch() }}
        />
      )}

      {!isLoading && !isError && displayItems.length === 0 && (
        role === "owner" ? (
          <OnboardingChecklist onNewJob={onNewJob} />
        ) : (
          <EmptyState
            icon={<ClipboardList size={48} />}
            title={t("jobs.empty.title")}
            description={t("jobs.empty.desc")}
            action={{ label: t("jobs.empty.action"), onClick: onNewJob }}
          />
        )
      )}

      {!isLoading && !isError && displayItems.length > 0 && filteredItems.length === 0 && (
        <EmptyState
          icon={q ? <Search size={48} /> : <ClipboardList size={48} />}
          title={q ? t("jobs.searchEmpty") : `${t(STATUS_FILTER_KEYS[statusFilter])} — 0`}
          description={t("jobs.filterEmpty.desc")}
        />
      )}

      {filteredItems.length > 0 && (
        <JobCardList cards={filteredItems} isOwner={isOwner} />
      )}

      {hasMore && (
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={isFetching}
          className="w-full mt-4 py-3 text-sm font-semibold text-[var(--brand)] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 transition disabled:opacity-50 shadow-sm"
        >
          {isFetching
            ? t("jobs.loading")
            : `${t("jobs.loadMore")} (${data!.total - displayItems.length})`}
        </button>
      )}
    </PullToRefresh>
  );
}

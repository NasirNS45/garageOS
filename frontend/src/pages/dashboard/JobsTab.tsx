import { useEffect, useRef, useState } from "react";
import { ClipboardList, Search, X } from "lucide-react";
import { useJobCards, type JobCard } from "../../hooks/useJobCards";
import JobCardList from "../../components/JobCardList";
import StatusStrip from "../../components/StatusStrip";
import JobCardSkeleton from "../../components/JobCardSkeleton";
import EmptyState from "../../components/EmptyState";
import PullToRefresh from "../../components/PullToRefresh";
import OnboardingChecklist from "../../components/OnboardingChecklist";
import { useT } from "../../i18n/useT";
import type { TKey } from "../../i18n/translations";

// ── Jobs tab ──────────────────────────────────────────────────────────────────
type StatusFilter = "all" | "pending" | "in_progress" | "completed";

const STATUS_FILTER_KEYS: Record<StatusFilter, TKey> = {
  all: "status.all",
  pending: "status.pending",
  in_progress: "status.in_progress",
  completed: "status.completed",
};

export default function JobsTab({ role, onNewJob }: { role: string | null; onNewJob: () => void }) {
  const t = useT();
  const [page, setPage] = useState(1);
  const [allItems, setAllItems] = useState<JobCard[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  const { data, isLoading, isError, isFetching, refetch } = useJobCards(page);

  // When page 1 data refreshes (after a mutation), reset the accumulated list.
  // For page > 1, append deduplicated new items.
  const prevP1Ts = useRef(0);
  const { dataUpdatedAt: p1UpdatedAt, data: p1Data } = useJobCards(1);

  useEffect(() => {
    if (!p1UpdatedAt || p1UpdatedAt === prevP1Ts.current) return;
    prevP1Ts.current = p1UpdatedAt;
    // Page 1 data refreshed: if we were on a later page, reset to 1
    if (page !== 1) setPage(1);
    setAllItems(p1Data?.items ?? []);
  }, [p1UpdatedAt, p1Data, page]);

  useEffect(() => {
    if (!data || page === 1) return;
    // Append page 2+ items, deduplicating by id
    setAllItems((prev) => {
      const ids = new Set(prev.map((c) => c.id));
      return [...prev, ...data.items.filter((c) => !ids.has(c.id))];
    });
  }, [data, page]);

  const displayItems = page === 1 ? (data?.items ?? allItems) : allItems;
  const hasMore = data ? displayItems.length < data.total : false;

  const q = search.trim().toLowerCase();
  const filteredItems = displayItems.filter((c) => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
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

      {/* Quick search */}
      {displayItems.length > 0 && (
        <div className="relative mb-3">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("jobs.search")}
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl pl-9 pr-9 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent transition"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 active:scale-95"
            >
              <X size={15} />
            </button>
          )}
        </div>
      )}

      {/* Status filter pills */}
      {displayItems.length > 0 && (
        <div className="relative mb-3">
          <div className="flex gap-2 overflow-x-auto pb-0.5 no-scrollbar">
            {(Object.keys(STATUS_FILTER_KEYS) as StatusFilter[]).map((f) => (
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
          {/* Right fade hint — shows when pills overflow */}
          <div className="absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-[#F1F5F9] to-transparent pointer-events-none" />
        </div>
      )}

      {isLoading && page === 1 && <JobCardSkeleton count={3} />}

      {isError && (
        <EmptyState
          icon={<ClipboardList size={48} />}
          title={t("jobs.loadError.title")}
          description={t("jobs.loadError.desc")}
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
        <JobCardList cards={filteredItems} isOwner={role === "owner"} />
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

import { useEffect, useRef, useState } from "react";
import { ClipboardList } from "lucide-react";
import { useJobCards, type JobCard } from "../../hooks/useJobCards";
import JobCardList from "../../components/JobCardList";
import StatusStrip from "../../components/StatusStrip";
import JobCardSkeleton from "../../components/JobCardSkeleton";
import EmptyState from "../../components/EmptyState";

// ── Jobs tab ──────────────────────────────────────────────────────────────────
type StatusFilter = "all" | "pending" | "in_progress" | "completed";

const STATUS_FILTER_LABELS: Record<StatusFilter, string> = {
  all: "All",
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
};

export default function JobsTab({ role, onNewJob }: { role: string | null; onNewJob: () => void }) {
  const [page, setPage] = useState(1);
  const [allItems, setAllItems] = useState<JobCard[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const { data, isLoading, isError, isFetching } = useJobCards(page);

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

  const filteredItems =
    statusFilter === "all"
      ? displayItems
      : displayItems.filter((c) => c.status === statusFilter);

  return (
    <div>
      {displayItems.length > 0 && <StatusStrip jobs={displayItems} />}

      {/* Status filter pills */}
      {displayItems.length > 0 && (
        <div className="relative mb-3">
          <div className="flex gap-2 overflow-x-auto pb-0.5 no-scrollbar">
            {(Object.keys(STATUS_FILTER_LABELS) as StatusFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full transition active:scale-95 ${
                  statusFilter === f
                    ? "bg-[var(--brand)] text-white shadow-sm"
                    : "bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600"
                }`}
              >
                {STATUS_FILTER_LABELS[f]}
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
          title="Couldn't load job cards"
          description="Check your connection and try again"
        />
      )}

      {!isLoading && !isError && displayItems.length === 0 && (
        <EmptyState
          icon={<ClipboardList size={48} />}
          title="No job cards yet"
          description="Tap the + button to create your first job"
          action={{ label: "New Job Card", onClick: onNewJob }}
        />
      )}

      {!isLoading && !isError && displayItems.length > 0 && filteredItems.length === 0 && (
        <EmptyState
          icon={<ClipboardList size={48} />}
          title={`No ${STATUS_FILTER_LABELS[statusFilter].toLowerCase()} jobs`}
          description="Switch to a different filter or create a new job"
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
          {isFetching ? "Loading…" : `Load more (${data!.total - displayItems.length} remaining)`}
        </button>
      )}
    </div>
  );
}

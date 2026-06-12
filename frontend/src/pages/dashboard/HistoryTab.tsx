import { useState } from "react";
import { SearchX } from "lucide-react";
import JobCardSkeleton from "../../components/JobCardSkeleton";
import EmptyState from "../../components/EmptyState";
import VehiclePlate from "../../components/VehiclePlate";
import { api } from "../../api/axios";

// ── History tab ───────────────────────────────────────────────────────────────
interface HistoryJob {
  id: string;
  vehicle_number: string;
  status: string;
  total_amount: number;
  created_at: string;
  invoice_url?: string;
}

interface HistoryResult {
  customer_name: string;
  total_jobs: number;
  jobs: HistoryJob[];
}

type HistoryStatusFilter = "all" | "completed" | "in_progress" | "pending" | "cancelled";

const HISTORY_STATUS_LABELS: Record<HistoryStatusFilter, string> = {
  all: "All",
  completed: "Completed",
  in_progress: "In Progress",
  pending: "Pending",
  cancelled: "Cancelled",
};

export default function HistoryTab() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<"vehicle" | "phone">("vehicle");
  const [result, setResult] = useState<HistoryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<HistoryStatusFilter>("all");

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSearched(true);
    setResult(null);
    setSearchError(false);
    setHistoryFilter("all");
    try {
      const param =
        type === "vehicle"
          ? `vehicle_number=${encodeURIComponent(query)}`
          : `phone=${encodeURIComponent(query)}`;
      const { data } = await api.get<HistoryResult>(`/customers/history?${param}`);
      setResult(data);
    } catch {
      setResult(null);
      setSearchError(true);
    } finally {
      setLoading(false);
    }
  };

  const toggle = (active: boolean) =>
    `flex-1 text-sm rounded-xl py-2.5 font-semibold transition active:scale-95 ${
      active
        ? "bg-[var(--brand)] text-white shadow-sm"
        : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
    }`;

  return (
    <div>
      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">Customer History</h2>

      <form
        onSubmit={search}
        className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm mb-4 space-y-3 border border-slate-100 dark:border-slate-700"
      >
        <div className="flex gap-2">
          <button type="button" onClick={() => setType("vehicle")} className={toggle(type === "vehicle")}>
            Vehicle No.
          </button>
          <button type="button" onClick={() => setType("phone")} className={toggle(type === "phone")}>
            Phone
          </button>
        </div>
        <input
          type="text"
          required
          placeholder={type === "vehicle" ? "e.g. ABC-123" : "e.g. 03xx xxx xxxx"}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent transition"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white text-sm font-semibold rounded-xl py-3 transition active:scale-95 disabled:opacity-60"
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </form>

      {loading && <JobCardSkeleton count={1} />}

      {!loading && searched && searchError && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm rounded-xl px-4 py-3 mt-2">
          Search failed. Check your connection and try again.
        </div>
      )}

      {!loading && searched && !result && !searchError && (
        <EmptyState
          icon={<SearchX size={48} />}
          title="No records found"
          description="Try searching by a different vehicle number or phone"
        />
      )}

      {result && (() => {
        const filteredJobs =
          historyFilter === "all"
            ? result.jobs
            : result.jobs.filter((j) => j.status === historyFilter);

        // Only show filter pills when there are multiple statuses present
        const statuses = Array.from(new Set(result.jobs.map((j) => j.status)));
        const showFilter = statuses.length > 1;

        return (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              {result.customer_name}
              <span className="font-normal text-slate-400"> · {result.total_jobs} job(s)</span>
            </p>

            {/* Status filter pills */}
            {showFilter && (
              <div className="flex gap-2 flex-wrap mb-3">
                {(["all", ...statuses] as HistoryStatusFilter[])
                  .filter((f, i, arr) => arr.indexOf(f) === i)
                  .map((f) => (
                    <button
                      key={f}
                      onClick={() => setHistoryFilter(f)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full transition active:scale-95 ${
                        historyFilter === f
                          ? "bg-[var(--brand)] text-white shadow-sm"
                          : "bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600"
                      }`}
                    >
                      {HISTORY_STATUS_LABELS[f] ?? f}
                    </button>
                  ))}
              </div>
            )}

            {filteredJobs.length === 0 ? (
              <EmptyState
                icon={<SearchX size={40} />}
                title={`No ${HISTORY_STATUS_LABELS[historyFilter].toLowerCase()} jobs`}
                description="Try a different filter"
              />
            ) : (
              filteredJobs.map((j) => (
                <div
                  key={j.id}
                  className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700"
                >
                  <div className="flex items-center justify-between">
                    <VehiclePlate number={j.vehicle_number} size="sm" />
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {new Date(j.created_at).toLocaleDateString("en-PK", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between mt-2 text-sm">
                    <span className="text-slate-500 dark:text-slate-400 capitalize">{j.status.replace("_", " ")}</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      PKR {j.total_amount.toLocaleString()}
                    </span>
                  </div>
                  {j.invoice_url && (
                    <a
                      href={j.invoice_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-[var(--brand)] font-medium hover:underline mt-2"
                    >
                      View Invoice →
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        );
      })()}
    </div>
  );
}

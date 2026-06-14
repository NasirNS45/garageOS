import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, User } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../api/axios";
import JobCardSkeleton from "../components/JobCardSkeleton";
import EmptyState from "../components/EmptyState";
import VehiclePlate from "../components/VehiclePlate";
import { useT } from "../i18n/useT";
import { useLanguageStore } from "../stores/languageStore";
import { formatLocaleDateStr } from "../utils/dates";
import type { TKey } from "../i18n/translations";

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
  total_outstanding?: number;
  jobs: HistoryJob[];
}

const STATUS_KEYS: Record<string, TKey> = {
  pending: "status.pending",
  in_progress: "status.in_progress",
  completed: "status.completed",
  cancelled: "status.cancelled",
};

export default function CustomerProfile() {
  const { phone } = useParams<{ phone: string }>();
  const navigate = useNavigate();
  const t = useT();
  const language = useLanguageStore((s) => s.language);
  const [result, setResult] = useState<HistoryResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!phone) return;
    setLoading(true);
    setError(false);
    api
      .get<HistoryResult>(`/customers/history?phone=${encodeURIComponent(phone)}`)
      .then(({ data }) => setResult(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [phone]);

  const totalSpent = result?.jobs
    .filter((j) => j.status === "completed")
    .reduce((sum, j) => sum + j.total_amount, 0) ?? 0;

  const lastVisit = result?.jobs[0];

  return (
    <div className="min-h-screen bg-[#F1F5F9] dark:bg-slate-900">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => navigate("/history")}
            className="text-slate-500 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label={t("customer.back")}
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
            {t("customer.profile")}
          </h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {loading && <JobCardSkeleton count={2} />}

        {error && (
          <EmptyState
            icon={<User size={48} />}
            title={t("history.searchFailed")}
            action={{ label: t("common.retry"), onClick: () => window.location.reload() }}
          />
        )}

        {!loading && result && (
          <>
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{result.customer_name}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1" data-keep-ltr>{phone}</p>
              <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">
                    {t("customer.totalSpent")}
                  </p>
                  <p className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                    PKR {totalSpent.toLocaleString()}
                  </p>
                </div>
                {(result.total_outstanding ?? 0) > 0 && (
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-amber-600 font-semibold">
                      {t("customer.outstanding")}
                    </p>
                    <p className="text-base font-bold text-amber-700 dark:text-amber-400 mt-0.5">
                      PKR {(result.total_outstanding ?? 0).toLocaleString()}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">
                    {t("history.jobsCount")}
                  </p>
                  <p className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                    {result.total_jobs}
                  </p>
                </div>
                {lastVisit && (
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">
                      {t("customer.lastVisit")}
                    </p>
                    <p className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                      {formatLocaleDateStr(lastVisit.created_at, language, {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </div>
                )}
              </div>
              <button
                onClick={() => navigate("/jobs")}
                className="mt-4 w-full flex items-center justify-center gap-2 bg-[var(--brand)] text-white font-semibold rounded-xl py-2.5 text-sm"
              >
                <Plus size={16} />
                {t("customer.newJob")}
              </button>
            </div>

            <div className="space-y-2">
              {result.jobs.map((j) => (
                <div
                  key={j.id}
                  className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700"
                >
                  <div className="flex items-center justify-between">
                    <VehiclePlate number={j.vehicle_number} size="sm" />
                    <span className="text-xs text-slate-400">
                      {formatLocaleDateStr(j.created_at, language, {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between mt-2 text-sm">
                    <span className="text-slate-500 dark:text-slate-400">
                      {t(STATUS_KEYS[j.status] ?? "status.pending")}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      PKR {j.total_amount.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

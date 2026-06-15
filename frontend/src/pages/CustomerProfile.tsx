import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, SearchX, User } from "lucide-react";
import { api } from "../api/axios";
import AppShell from "../components/AppShell";
import DashboardPageShell from "../components/DashboardPageShell";
import JobCardSkeleton from "../components/JobCardSkeleton";
import EmptyState from "../components/EmptyState";
import CustomerJobList, {
  CustomerSummaryCard,
  computeTotalSpent,
  type CustomerJob,
} from "../components/CustomerJobList";
import { useT } from "../i18n/useT";
import { useLanguageStore } from "../stores/languageStore";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { pageTransition, pageVariants } from "../lib/pageMotion";
import { Button, PageHeader } from "../components/ui";

interface HistoryResult {
  customer_name: string;
  total_jobs: number;
  total_outstanding?: number;
  jobs: CustomerJob[];
}

export default function CustomerProfile() {
  const { phone } = useParams<{ phone: string }>();
  const navigate = useNavigate();
  const t = useT();
  const language = useLanguageStore((s) => s.language);
  const [result, setResult] = useState<HistoryResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const reduceMotion = useReducedMotion();
  useDocumentTitle(t("customer.profile"));

  const loadProfile = useCallback(() => {
    if (!phone) return;
    setLoading(true);
    setError(false);
    setResult(null);
    api
      .get<HistoryResult>(`/customers/history?phone=${encodeURIComponent(phone)}`)
      .then(({ data }) => setResult(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [phone]);

  useEffect(() => {
    const controller = new AbortController();
    if (!phone) return;
    setLoading(true);
    setError(false);
    setResult(null);
    api
      .get<HistoryResult>(`/customers/history?phone=${encodeURIComponent(phone)}`, {
        signal: controller.signal,
      })
      .then(({ data }) => setResult(data))
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [phone]);

  const lastVisit = result?.jobs[0]?.created_at;

  return (
    <AppShell
      activeTab="history"
      mobileTitle={result?.customer_name ?? t("customer.profile")}
      showBack
      onBack={() => navigate("/history")}
      createJobOpen={showForm}
      onCreateJobClose={() => setShowForm(false)}
    >
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        transition={reduceMotion ? { duration: 0 } : pageTransition}
        className="min-h-[var(--dashboard-content-min-h)] lg:min-h-[var(--dashboard-content-min-h-lg)]"
      >
        <DashboardPageShell>
          <PageHeader
            title={result?.customer_name ?? t("customer.profile")}
            subtitle={<span data-keep-ltr>{phone}</span>}
            actions={
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<ArrowLeft size={14} />}
                onClick={() => navigate("/history")}
                className="hidden lg:inline-flex"
              >
                {t("customer.back")}
              </Button>
            }
          />

          {loading && <JobCardSkeleton count={2} />}

          {error && (
            <EmptyState
              icon={<User size={48} />}
              title={t("history.searchFailed")}
              action={{ label: t("common.retry"), onClick: loadProfile }}
            />
          )}

          {!loading && result && (
            <div className="space-y-4">
              <CustomerSummaryCard
                customerName={result.customer_name}
                totalJobs={result.total_jobs}
                totalSpent={computeTotalSpent(result.jobs)}
                totalOutstanding={result.total_outstanding}
                phone={phone}
                lastVisitDate={lastVisit}
                language={language}
                newJobAction={{
                  label: t("customer.newJob"),
                  onClick: () => setShowForm(true),
                }}
              />

              {result.jobs.length === 0 ? (
                <EmptyState
                  icon={<SearchX size={40} />}
                  title={t("history.noRecords")}
                  description={t("history.noRecordsDesc")}
                />
              ) : (
                <CustomerJobList jobs={result.jobs} language={language} showSectionHeader />
              )}
            </div>
          )}
        </DashboardPageShell>
      </motion.div>
    </AppShell>
  );
}

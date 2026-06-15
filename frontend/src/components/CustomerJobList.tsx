import { ExternalLink, FileText, Plus, SearchX, User } from "lucide-react";
import { motion } from "framer-motion";
import VehiclePlate from "./VehiclePlate";
import EmptyState from "./EmptyState";
import { useT } from "../i18n/useT";
import { formatLocaleDateStr } from "../utils/dates";
import { Badge, Button, SectionHeader, cn, statusTone } from "./ui";
import type { Language, TKey } from "../i18n/translations";

export interface CustomerJob {
  id: string;
  vehicle_number: string;
  status: string;
  total_amount: number;
  created_at: string;
  invoice_url?: string;
}

const STATUS_KEYS: Record<string, TKey> = {
  pending: "status.pending",
  in_progress: "status.in_progress",
  completed: "status.completed",
  cancelled: "status.cancelled",
};

const STATUS_ROW_TINT: Record<string, string> = {
  pending: "bg-[var(--row-pending)]",
  in_progress: "bg-[var(--row-progress)]",
  completed: "bg-[var(--row-completed)]",
  cancelled: "bg-[var(--row-cancelled)]",
};

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.18, ease: "easeOut" as const } },
};

export function computeTotalSpent(jobs: CustomerJob[]): number {
  return jobs
    .filter((j) => j.status === "completed")
    .reduce((sum, j) => sum + j.total_amount, 0);
}

interface CustomerSummaryCardProps {
  customerName: string;
  totalJobs: number;
  totalSpent: number;
  totalOutstanding?: number;
  phone?: string;
  lastVisitDate?: string;
  language: Language;
  profileAction?: { label: string; onClick: () => void };
  newJobAction?: { label: string; onClick: () => void };
}

export function CustomerSummaryCard({
  customerName,
  totalJobs,
  totalSpent,
  totalOutstanding,
  phone,
  lastVisitDate,
  language,
  profileAction,
  newJobAction,
}: CustomerSummaryCardProps) {
  const t = useT();

  return (
    <div className="bg-[var(--surface)] rounded-[var(--r-card)] ring-1 ring-[var(--border)] p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-[var(--brand-bg)] text-[var(--brand-fg)] flex items-center justify-center shrink-0">
            <User size={18} />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-[var(--text-strong)] truncate">
              {customerName}
            </h2>
            {phone && (
              <p className="text-sm text-[var(--text-muted)] mt-0.5 truncate" data-keep-ltr>
                {phone}
              </p>
            )}
            <p className="text-sm text-[var(--text-muted)] mt-0.5">
              {totalJobs} {t("history.jobsCount")}
            </p>
          </div>
        </div>
        {profileAction && (
          <Button variant="secondary" size="sm" onClick={profileAction.onClick} className="shrink-0">
            {profileAction.label}
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-6 mt-4 pt-4 border-t border-[var(--border)]">
        <SummaryStat label={t("customer.totalSpent")} value={`PKR ${totalSpent.toLocaleString()}`} />
        {(totalOutstanding ?? 0) > 0 && (
          <SummaryStat
            label={t("customer.outstanding")}
            value={`PKR ${(totalOutstanding ?? 0).toLocaleString()}`}
            valueClass="text-[var(--warning-fg)]"
            labelClass="text-[var(--warning-fg)]"
          />
        )}
        <SummaryStat label={t("history.jobsCount")} value={String(totalJobs)} />
        {lastVisitDate && (
          <SummaryStat
            label={t("customer.lastVisit")}
            value={formatLocaleDateStr(lastVisitDate, language, {
              day: "numeric",
              month: "short",
            })}
          />
        )}
      </div>

      {newJobAction && (
        <Button onClick={newJobAction.onClick} fullWidth leftIcon={<Plus size={16} />} className="mt-4">
          {newJobAction.label}
        </Button>
      )}
    </div>
  );
}

function SummaryStat({
  label,
  value,
  valueClass,
  labelClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
  labelClass?: string;
}) {
  return (
    <div>
      <p
        className={cn(
          "text-[11px] uppercase tracking-wide text-[var(--text-faint)] font-semibold",
          labelClass
        )}
      >
        {label}
      </p>
      <p
        className={cn("text-base font-bold text-[var(--text-strong)] mt-0.5 tnum", valueClass)}
        data-keep-ltr={value.startsWith("PKR")}
      >
        {value}
      </p>
    </div>
  );
}

interface CustomerJobListProps {
  jobs: CustomerJob[];
  language: Language;
  emptyIcon?: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  showSectionHeader?: boolean;
}

export default function CustomerJobList({
  jobs,
  language,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  showSectionHeader = true,
}: CustomerJobListProps) {
  const t = useT();

  if (jobs.length === 0) {
    return (
      <EmptyState
        icon={emptyIcon ?? <SearchX size={40} />}
        title={emptyTitle ?? t("history.noRecords")}
        description={emptyDescription ?? t("history.noRecordsDesc")}
      />
    );
  }

  return (
    <div className="space-y-3">
      {showSectionHeader && (
        <SectionHeader
          title={t("history.pastVisits")}
          subtitle={`${jobs.length} ${t("history.jobsCount")}`}
        />
      )}

      <motion.div
        className="hidden lg:block bg-[var(--surface)] rounded-[var(--r-card)] ring-1 ring-[var(--border)] overflow-hidden"
        variants={listVariants}
        initial="hidden"
        animate="show"
      >
        <div className="flex items-center bg-[var(--surface-2)] border-b border-[var(--border)] text-[length:var(--text-label)] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          <div className="w-1 shrink-0" />
          <div className="flex items-center gap-4 flex-1 px-5 py-2.5">
            <div className="w-40 shrink-0">{t("history.byVehicle")}</div>
            <div className="w-36 shrink-0">{t("history.colDate")}</div>
            <div className="w-32 text-center">{t("history.colStatus")}</div>
            <div className="flex-1 text-end">{t("history.colAmount")}</div>
            <div className="w-10 shrink-0" />
          </div>
        </div>
        <div className="divide-y divide-[var(--border)]">
          {jobs.map((job) => (
            <motion.div key={job.id} variants={itemVariants}>
              <CustomerJobDesktopRow job={job} language={language} />
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div
        className="lg:hidden divide-y divide-[var(--border)] bg-[var(--surface)] rounded-[var(--r-card)] ring-1 ring-[var(--border)] overflow-hidden"
        variants={listVariants}
        initial="hidden"
        animate="show"
      >
        {jobs.map((job) => (
          <motion.div key={job.id} variants={itemVariants}>
            <CustomerJobMobileRow job={job} language={language} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

function CustomerJobDesktopRow({ job, language }: { job: CustomerJob; language: Language }) {
  const t = useT();

  return (
    <div
      className={cn(
        "flex items-center transition-colors",
        STATUS_ROW_TINT[job.status] ?? "bg-[var(--surface)]"
      )}
    >
      <div className="w-[3px] self-stretch shrink-0 bg-[var(--border-strong)]" />
      <div className="flex items-center gap-4 flex-1 px-5 py-3.5 min-w-0">
        <div className="w-40 shrink-0">
          <VehiclePlate number={job.vehicle_number} size="sm" />
        </div>
        <div className="w-36 shrink-0 text-sm text-[var(--text-muted)]">
          {formatLocaleDateStr(job.created_at, language, {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </div>
        <div className="w-32 shrink-0 flex justify-center">
          <Badge tone={statusTone(job.status)} size="sm" dot>
            {t(STATUS_KEYS[job.status] ?? "status.pending")}
          </Badge>
        </div>
        <div className="flex-1 text-end">
          <p className="text-base font-black text-[var(--text-strong)] tnum" data-keep-ltr>
            PKR {job.total_amount.toLocaleString()}
          </p>
        </div>
        <div className="w-10 shrink-0 flex justify-end">
          {job.invoice_url && (
            <a
              href={job.invoice_url}
              target="_blank"
              rel="noreferrer"
              aria-label={t("history.viewInvoice")}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--brand)] hover:bg-[var(--brand-bg)] transition"
            >
              <FileText size={14} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function CustomerJobMobileRow({ job, language }: { job: CustomerJob; language: Language }) {
  const t = useT();

  return (
    <div
      className={cn(
        "relative px-4 py-3.5 overflow-hidden",
        STATUS_ROW_TINT[job.status] ?? "bg-[var(--surface)]"
      )}
    >
      <div className="absolute inset-y-0 start-0 w-1 rounded-e-full bg-[var(--border-strong)]" />
      <div className="ps-2">
        <div className="flex items-start justify-between gap-2">
          <VehiclePlate number={job.vehicle_number} size="sm" />
          <Badge tone={statusTone(job.status)} size="sm" dot>
            {t(STATUS_KEYS[job.status] ?? "status.pending")}
          </Badge>
        </div>
        <div className="flex items-center justify-between mt-2.5">
          <span className="text-xs text-[var(--text-faint)]">
            {formatLocaleDateStr(job.created_at, language, {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
          <span className="text-base font-black text-[var(--text-strong)] tnum" data-keep-ltr>
            PKR {job.total_amount.toLocaleString()}
          </span>
        </div>
        {job.invoice_url && (
          <a
            href={job.invoice_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-[var(--brand)] font-semibold hover:underline mt-2"
          >
            <ExternalLink size={12} />
            {t("history.viewInvoice")}
          </a>
        )}
      </div>
    </div>
  );
}

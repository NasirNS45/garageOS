import { useState } from "react";
import { ChevronRight, CreditCard, MessageCircle, Phone } from "lucide-react";
import { motion } from "framer-motion";
import { type JobCard } from "../hooks/useJobCards";
import { useMechanics } from "../hooks/useMechanics";
import { useLanguageStore } from "../stores/languageStore";
import { formatAge } from "../utils/formatAge";
import VehiclePlate from "./VehiclePlate";
import ReviewSheet from "./ReviewSheet";
import JobDetailSheet from "./JobDetailSheet";
import { useT } from "../i18n/useT";
import type { TKey } from "../i18n/translations";
import { Badge, cn, statusTone } from "./ui";

const STATUS_KEYS: Record<string, TKey> = {
  pending: "status.pending",
  in_progress: "status.in_progress",
  completed: "status.completed",
  cancelled: "status.cancelled",
};

const STATUS_ACCENT: Record<string, string> = {
  pending: "var(--warning)",
  in_progress: "var(--info)",
  completed: "var(--success)",
  cancelled: "var(--border-strong)",
};

const STATUS_ROW_TINT: Record<string, string> = {
  pending:     "bg-[var(--row-pending)]",
  in_progress: "bg-[var(--row-progress)]",
  completed:   "bg-[var(--row-completed)]",
  cancelled:   "bg-[var(--row-cancelled)]",
};

interface Props {
  cards: JobCard[];
  isOwner: boolean;
  onSelectJob?: (card: JobCard) => void;
  selectedJobId?: string;
}

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" as const } },
};

export default function JobCardList({ cards, isOwner, onSelectJob, selectedJobId }: Props) {
  const { data: mechanics = [] } = useMechanics();
  const t = useT();

  return (
    <>
      {/* ── Desktop: table rows ── */}
      <motion.div
        className="hidden lg:block bg-[var(--surface)] rounded-[var(--r-card)] ring-1 ring-[var(--border)] overflow-hidden"
        variants={listVariants}
        initial="hidden"
        animate="show"
      >
        {/* Column headers */}
        <div className="flex items-center bg-[var(--surface-2)] border-b border-[var(--border)] text-[length:var(--text-label)] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          <div className="w-1 shrink-0" />
          <div className="flex items-center gap-4 flex-1 px-5 py-2.5">
            <div className="w-44 shrink-0">{t("jobs.colVehicle")}</div>
            <div className="flex-1">{t("jobs.colCustomer")}</div>
            <div className="w-32 text-center">{t("jobs.colStatus")}</div>
            <div className="w-36 text-end">{t("jobs.colAmount")}</div>
            <div className="w-16 shrink-0" />
          </div>
        </div>
        <div className="divide-y divide-[var(--border)]">
          {cards.map((card, i) => (
            <motion.div key={card.id} variants={itemVariants}>
              <DesktopRow
                card={card}
                isOwner={isOwner}
                mechanics={mechanics}
                index={i}
                onSelectJob={onSelectJob}
                isSelected={card.id === selectedJobId}
              />
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── Mobile: flat list rows ── */}
      <motion.div
        className="lg:hidden divide-y divide-[var(--border)] bg-[var(--surface)] rounded-[var(--r-card)] ring-1 ring-[var(--border)] overflow-hidden"
        variants={listVariants}
        initial="hidden"
        animate="show"
      >
        {cards.map((card, i) => (
          <motion.div key={card.id} variants={itemVariants}>
            <MobileCard
              card={card}
              isOwner={isOwner}
              mechanics={mechanics}
              index={i}
            />
          </motion.div>
        ))}
      </motion.div>
    </>
  );
}

/* ─────────────────────────── Desktop row ─────────────────────────── */
function DesktopRow({
  card,
  isOwner,
  mechanics,
  index,
  onSelectJob,
  isSelected,
}: {
  card: JobCard;
  isOwner: boolean;
  mechanics: ReturnType<typeof useMechanics>["data"] & object[];
  index: number;
  onSelectJob?: (card: JobCard) => void;
  isSelected?: boolean;
}) {
  const [reviewOpen, setReviewOpen] = useState(false);
  const t = useT();
  void isOwner;
  const language = useLanguageStore((s) => s.language);
  const isTerminal = card.status === "completed" || card.status === "cancelled";
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  const handleOpen = () => onSelectJob?.(card);

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={handleOpen}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleOpen();
          }
        }}
        aria-label={t("job.openDetails").replace("{plate}", card.vehicle_number)}
        aria-pressed={isSelected}
        className={cn(
          "group relative flex items-center cursor-pointer transition-colors",
          isSelected
            ? "ring-2 ring-inset ring-[var(--brand)]/30 bg-[var(--brand-bg)]"
            : [STATUS_ROW_TINT[card.status], "hover:bg-[var(--surface-2)]"].join(" "),
          `u-stagger-${Math.min(index + 1, 6)}`
        )}
      >
        {/* Status stripe */}
        <div
          className="w-[3px] self-stretch shrink-0 transition-all"
          style={{ background: isSelected ? "var(--brand)" : STATUS_ACCENT[card.status] }}
        />

        <div className="flex items-center gap-4 flex-1 px-5 py-4 min-w-0">
          {/* Plate + make + age */}
          <div className="w-44 shrink-0">
            <VehiclePlate number={card.vehicle_number} size="sm" />
            <p className="text-[11px] text-[var(--text-faint)] mt-0.5 truncate">
              {[card.vehicle_make, !isTerminal ? formatAge(card.created_at, language) : null]
                .filter(Boolean).join(" · ")}
            </p>
          </div>

          {/* Customer name + phone */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[var(--text-strong)] truncate leading-snug">
              {card.customer_name}
            </p>
            {card.customer_phone && (
              <p className="text-[11px] text-[var(--text-faint)] mt-0.5 truncate" data-keep-ltr>
                {card.customer_phone}
              </p>
            )}
          </div>

          {/* Status badge */}
          <div className="w-32 shrink-0 flex justify-center">
            <Badge tone={statusTone(card.status)} dot>
              {t(STATUS_KEYS[card.status])}
            </Badge>
          </div>

          {/* Amount */}
          <div className="w-36 shrink-0 text-end">
            <p className="text-base font-black text-[var(--text-strong)] tnum leading-snug" data-keep-ltr>
              PKR {card.total_amount.toLocaleString()}
            </p>
            {card.status === "completed" && card.payment_status === "unpaid" && (
              <p className="text-[10px] font-bold text-[var(--warning-fg)]">{t("job.unpaid")}</p>
            )}
            {card.status === "completed" && card.payment_status === "paid" && (
              <p className="text-[10px] font-bold text-[var(--success-fg)]">{t("job.paid")}</p>
            )}
          </div>

          {/* Quick actions */}
          <div className="w-16 shrink-0 flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {card.customer_phone && (
              <>
                <a
                  href={`tel:${card.customer_phone}`}
                  onClick={stop}
                  aria-label={t("job.callCustomer")}
                  className="w-7 h-7 rounded-full flex items-center justify-center bg-[var(--brand-bg)] text-[var(--brand-fg)] hover:brightness-95 transition active:scale-95"
                >
                  <Phone size={12} />
                </a>
                <a
                  href={`https://wa.me/${card.customer_phone.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={stop}
                  aria-label={t("job.messageWhatsApp")}
                  className="w-7 h-7 rounded-full flex items-center justify-center bg-[var(--success-bg)] text-[var(--success-fg)] hover:brightness-95 transition active:scale-95"
                >
                  <MessageCircle size={12} />
                </a>
              </>
            )}
          </div>
        </div>

        <ChevronRight
          size={15}
          className="shrink-0 me-4 text-[var(--text-faint)] group-hover:text-[var(--text-muted)] transition-colors"
        />
      </div>

      {reviewOpen && (
        <ReviewSheet
          card={card}
          open={reviewOpen}
          onClose={() => setReviewOpen(false)}
          mechanics={mechanics ?? []}
        />
      )}
    </>
  );
}

/* ─────────────────────────── Mobile card ─────────────────────────── */
function MobileCard({
  card,
  isOwner,
  mechanics,
  index,
}: {
  card: JobCard;
  isOwner: boolean;
  mechanics: ReturnType<typeof useMechanics>["data"] & object[];
  index: number;
}) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const t = useT();
  const language = useLanguageStore((s) => s.language);
  const isTerminal = card.status === "completed" || card.status === "cancelled";
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setDetailOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setDetailOpen(true);
          }
        }}
        aria-label={t("job.openDetails").replace("{plate}", card.vehicle_number)}
        className={cn(
          "relative flex gap-3 px-4 py-3 cursor-pointer transition-colors overflow-hidden",
          STATUS_ROW_TINT[card.status],
          "hover:bg-[var(--surface-2)] active:bg-[var(--surface-2)]",
          `u-stagger-${Math.min(index + 1, 6)}`
        )}
      >
        {/* Left status stripe */}
        <div
          className="absolute inset-y-0 start-0 w-1 rounded-e-full"
          style={{ background: STATUS_ACCENT[card.status] }}
        />

        <div className="flex-1 min-w-0 ps-1">
          {/* Row 1: plate + make | status */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <VehiclePlate number={card.vehicle_number} size="sm" />
              {card.vehicle_make && (
                <span className="text-[11px] text-[var(--text-faint)]">{card.vehicle_make}</span>
              )}
            </div>
            <Badge tone={statusTone(card.status)} dot size="sm">
              {t(STATUS_KEYS[card.status])}
            </Badge>
          </div>

          {/* Row 2: customer + age | actions */}
          <div className="flex items-center justify-between gap-2 mt-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--text-strong)] truncate">
                {card.customer_name}
              </p>
              {!isTerminal && (
                <p className="text-[11px] text-[var(--text-faint)]">
                  {formatAge(card.created_at, language)}
                </p>
              )}
            </div>
            {card.customer_phone && (
              <div className="flex items-center gap-1.5 shrink-0">
                <a
                  href={`tel:${card.customer_phone}`}
                  onClick={stop}
                  aria-label={t("job.callCustomer")}
                  className="w-7 h-7 rounded-full flex items-center justify-center bg-[var(--brand-bg)] text-[var(--brand-fg)] transition active:scale-95"
                >
                  <Phone size={13} />
                </a>
                <a
                  href={`https://wa.me/${card.customer_phone.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={stop}
                  aria-label={t("job.messageWhatsApp")}
                  className="w-7 h-7 rounded-full flex items-center justify-center bg-[var(--success-bg)] text-[var(--success-fg)] transition active:scale-95"
                >
                  <MessageCircle size={13} />
                </a>
              </div>
            )}
          </div>

          {/* Row 3: amount | payment */}
          <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-[var(--border)]">
            <span
              className="text-base font-black text-[var(--text-strong)] tnum leading-none"
              data-keep-ltr
            >
              PKR {card.total_amount.toLocaleString()}
            </span>
            {card.status === "completed" &&
              (card.payment_status === "paid" ? (
                <Badge tone="success" size="sm">
                  <CreditCard size={11} />
                  {t("job.paid")}
                </Badge>
              ) : (
                <Badge tone="warning" size="sm" dot>
                  {t("job.unpaid")}
                </Badge>
              ))}
          </div>
        </div>
      </div>

      <JobDetailSheet
        card={card}
        isOwner={isOwner}
        mechanics={mechanics ?? []}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onRequestReview={() => {
          setDetailOpen(false);
          setReviewOpen(true);
        }}
      />
      {reviewOpen && (
        <ReviewSheet
          card={card}
          open={reviewOpen}
          onClose={() => setReviewOpen(false)}
          mechanics={mechanics ?? []}
        />
      )}
    </>
  );
}

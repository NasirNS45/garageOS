import { useState } from "react";
import { CreditCard, MessageCircle, Phone } from "lucide-react";
import { type JobCard } from "../hooks/useJobCards";
import { useMechanics } from "../hooks/useMechanics";
import { formatAge } from "../utils/formatAge";
import VehiclePlate from "./VehiclePlate";
import ReviewSheet from "./ReviewSheet";
import JobDetailSheet from "./JobDetailSheet";
import { useT } from "../i18n/useT";
import type { TKey } from "../i18n/translations";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-slate-100 text-slate-500",
};

const STATUS_KEYS: Record<string, TKey> = {
  pending: "status.pending",
  in_progress: "status.in_progress",
  completed: "status.completed",
  cancelled: "status.cancelled",
};

interface Props {
  cards: JobCard[];
  isOwner: boolean;
}

export default function JobCardList({ cards, isOwner }: Props) {
  const { data: mechanics = [] } = useMechanics();

  return (
    <div className="space-y-3 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-3 lg:items-start">
      {cards.map((card) => (
        <JobCardItem key={card.id} card={card} isOwner={isOwner} mechanics={mechanics} />
      ))}
    </div>
  );
}

function JobCardItem({
  card,
  isOwner,
  mechanics,
}: {
  card: JobCard;
  isOwner: boolean;
  mechanics: ReturnType<typeof useMechanics>["data"] & object[];
}) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const t = useT();

  const isTerminal = card.status === "completed" || card.status === "cancelled";
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <>
      {/* Compact, tappable summary */}
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
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-4 cursor-pointer transition active:scale-[0.99] hover:border-slate-200 dark:hover:border-slate-600"
      >
        {/* Row 1: plate + make · status + age */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <VehiclePlate number={card.vehicle_number} size="md" />
            {card.vehicle_make && (
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                {card.vehicle_make}
              </span>
            )}
          </div>
          <div className="flex flex-col items-end gap-0.5 shrink-0">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[card.status]}`}>
              {t(STATUS_KEYS[card.status])}
            </span>
            {!isTerminal && (
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                {formatAge(card.created_at)}
              </span>
            )}
          </div>
        </div>

        {/* Row 2: customer + quick call/WhatsApp */}
        <div className="flex items-center justify-between gap-2 mt-2.5">
          <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
            {card.customer_name}
          </span>
          {card.customer_phone && (
            <div className="flex items-center gap-1.5 shrink-0">
              <a
                href={`tel:${card.customer_phone}`}
                onClick={stop}
                aria-label="Call customer"
                className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-50 text-[var(--brand)] hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 transition active:scale-95"
              >
                <Phone size={13} />
              </a>
              <a
                href={`https://wa.me/${card.customer_phone.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noreferrer"
                onClick={stop}
                aria-label="Message customer on WhatsApp"
                className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 transition active:scale-95"
              >
                <MessageCircle size={13} />
              </a>
            </div>
          )}
        </div>

        {/* Row 3: total + payment indicator */}
        <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-700">
          <span className="text-base font-bold text-slate-900 dark:text-slate-100" data-keep-ltr>
            PKR {card.total_amount.toLocaleString()}
          </span>
          {card.status === "completed" &&
            (card.payment_status === "paid" ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                <CreditCard size={11} />
                {t("job.paid")}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                {t("job.unpaid")}
              </span>
            ))}
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

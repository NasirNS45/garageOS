import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Copy, CreditCard, FileText, Radio, Share2, User, X } from "lucide-react";
import {
  type JobCard,
  useCancelJobCard,
  useMarkPaid,
  useUpdateJobCard,
} from "../hooks/useJobCards";
import { useMechanics } from "../hooks/useMechanics";
import MechanicSelector from "./MechanicSelector";
import { formatAge } from "../utils/formatAge";
import VehiclePlate from "./VehiclePlate";
import PartsPanel from "./PartsPanel";
import ReviewSheet from "./ReviewSheet";
import JobPhotos from "./JobPhotos";
import { useToast } from "../context/ToastContext";
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
    <div className="space-y-3">
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
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [showMechanicPicker, setShowMechanicPicker] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [notesExpanded, setNotesExpanded] = useState(false);
  const [descOverflows, setDescOverflows] = useState(false);
  const [notesOverflows, setNotesOverflows] = useState(false);
  const descRef = useRef<HTMLParagraphElement>(null);
  const notesRef = useRef<HTMLParagraphElement>(null);
  const cancel = useCancelJobCard();
  const updateCard = useUpdateJobCard();
  const markPaid = useMarkPaid();
  const { toast } = useToast();
  const t = useT();

  const isTerminal = card.status === "completed" || card.status === "cancelled";
  const showActions = isOwner && !isTerminal;
  const showAge = !isTerminal;

  const assignedMechanic = mechanics?.find((m) => m.id === card.assigned_mechanic_id);

  useEffect(() => {
    if (descRef.current) {
      setDescOverflows(descRef.current.scrollHeight > descRef.current.clientHeight + 2);
    }
  }, [card.description]);

  useEffect(() => {
    if (notesRef.current) {
      setNotesOverflows(notesRef.current.scrollHeight > notesRef.current.clientHeight + 2);
    }
  }, [card.notes]);

  const handleCancel = () => {
    cancel.mutate(card.id, {
      onSuccess: () => toast("Job cancelled", "info"),
      onError: () => toast("Failed to cancel job", "error"),
    });
  };

  return (
    <>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-4">
        {/* Row 1: plate + make + status + age */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <VehiclePlate number={card.vehicle_number} size="md" />
            {card.vehicle_make && (
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                {card.vehicle_make}
              </span>
            )}
          </div>
          <div className="flex flex-col items-end gap-0.5 shrink-0">
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[card.status]}`}
            >
              {t(STATUS_KEYS[card.status])}
            </span>
            {showAge && (
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                {formatAge(card.created_at)}
              </span>
            )}
          </div>
        </div>

        {/* Row 2: customer */}
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-2">
          {card.customer_name}
          <span className="text-slate-400 font-normal"> · {card.customer_phone}</span>
        </p>

        {/* Row 3: assigned mechanic */}
        {assignedMechanic && (
          <p className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            <User size={12} />
            {assignedMechanic.full_name}
          </p>
        )}

        {/* Mechanic assign / reassign (non-terminal, owner only) */}
        {!isTerminal && isOwner && (
          showMechanicPicker ? (
            <div className="mt-1 flex items-center gap-2">
              <div className="flex-1">
                <MechanicSelector
                  mechanics={mechanics ?? []}
                  value={card.assigned_mechanic_id ?? ""}
                  onChange={(id) => {
                    updateCard.mutate(
                      { id: card.id, assigned_mechanic_id: id || null },
                      {
                        onSuccess: () => {
                          setShowMechanicPicker(false);
                          toast(id ? "Mechanic assigned" : "Mechanic unassigned", "success");
                        },
                        onError: () => toast("Failed to assign mechanic", "error"),
                      }
                    );
                  }}
                  disabled={updateCard.isPending}
                />
              </div>
              <button
                onClick={() => setShowMechanicPicker(false)}
                className="text-slate-400 hover:text-slate-600 shrink-0 mt-5"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowMechanicPicker(true)}
              className="text-xs text-[var(--brand)] font-medium mt-0.5 hover:underline"
            >
              {card.assigned_mechanic_id ? "Change mechanic" : "Assign mechanic"}
            </button>
          )
        )}

        {/* Row 4: description */}
        {card.description && (
          <div className="mt-1">
            <p
              ref={descRef}
              className={`text-sm text-slate-500 dark:text-slate-400 leading-relaxed ${descExpanded ? "" : "line-clamp-2"}`}
            >
              {card.description}
            </p>
            {descOverflows && (
              <button
                onClick={() => setDescExpanded((v) => !v)}
                className="text-xs text-[var(--brand)] font-medium mt-0.5 hover:underline"
              >
                {descExpanded ? "show less" : "show more"}
              </button>
            )}
          </div>
        )}

        {/* Row 5: notes (internal, styled subtly) */}
        {card.notes && (
          <div className="mt-0.5">
            <p
              ref={notesRef}
              className={`text-xs text-slate-400 dark:text-slate-500 italic ${notesExpanded ? "" : "line-clamp-2"}`}
            >
              {card.notes}
            </p>
            {notesOverflows && (
              <button
                onClick={() => setNotesExpanded((v) => !v)}
                className="text-xs text-[var(--brand)] font-medium mt-0.5 hover:underline"
              >
                {notesExpanded ? "show less" : "show more"}
              </button>
            )}
          </div>
        )}

        {/* Parts panel */}
        <PartsPanel card={card} isEditable={!isTerminal} />

        {/* Amount + date */}
        <div className="flex items-center justify-between mt-3">
          <span className="text-base font-bold text-slate-900 dark:text-slate-100">
            PKR {card.total_amount.toLocaleString()}
          </span>
          <span className="text-xs text-slate-400">
            {new Date(card.created_at).toLocaleDateString("en-PK", {
              day: "numeric",
              month: "short",
            })}
          </span>
        </div>

        {/* Invoice link + share + payment status */}
        {card.status === "completed" && (
          <div className="flex items-center justify-between mt-2 gap-2">
            {card.invoice_url ? (
              <div className="flex items-center gap-2">
                <a
                  href={card.invoice_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-[var(--brand)] font-medium hover:underline"
                >
                  <FileText size={12} />
                  {t("job.viewInvoice")}
                </a>
                <ShareLinkButton
                  url={card.invoice_url}
                  title="Invoice"
                  label={t("job.share")}
                  toastMessage="Invoice link copied"
                />
              </div>
            ) : (
              <span />
            )}
            {card.payment_status === "paid" ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                <CreditCard size={11} />
                {t("job.paid")}
              </span>
            ) : (
              isOwner && (
                <button
                  onClick={() =>
                    markPaid.mutate(
                      { id: card.id, payment_status: "paid" },
                      {
                        onSuccess: () => toast("Marked as paid", "success"),
                        onError: () => toast("Failed to update payment status", "error"),
                      }
                    )
                  }
                  disabled={markPaid.isPending}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 px-2.5 py-1 rounded-full transition disabled:opacity-50"
                >
                  <CreditCard size={11} />
                  {markPaid.isPending ? "…" : t("job.markPaid")}
                </button>
              )
            )}
          </div>
        )}

        {/* Invoice link for non-completed cards (edge case) */}
        {card.status !== "completed" && card.invoice_url && (
          <a
            href={card.invoice_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-[var(--brand)] font-medium hover:underline mt-2"
          >
            <FileText size={12} />
            {t("job.viewInvoice")}
          </a>
        )}

        {/* Customer tracking link — active jobs only */}
        {!isTerminal && card.track_url && (
          <div className="flex items-center justify-between mt-2">
            <a
              href={card.track_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-[var(--brand)] font-medium hover:underline"
            >
              <Radio size={12} />
              {t("job.liveTracking")}
            </a>
            <ShareLinkButton
              url={card.track_url}
              title="Vehicle tracking"
              label={t("job.shareWithCustomer")}
              toastMessage="Tracking link copied"
            />
          </div>
        )}

        {/* Photos — available on active and completed jobs */}
        {card.status !== "cancelled" && (
          <JobPhotos cardId={card.id} canEdit />
        )}

        {/* Actions */}
        {showActions && (
          <div className="mt-3">
            {confirmCancel ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400 flex-1">{t("job.cancelQuestion")}</span>
                <button
                  onClick={handleCancel}
                  disabled={cancel.isPending}
                  className="text-xs text-red-600 font-semibold px-3 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition disabled:opacity-60"
                >
                  {t("job.yesCancel")}
                </button>
                <button
                  onClick={() => setConfirmCancel(false)}
                  className="text-xs text-slate-600 dark:text-slate-400 font-semibold px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition"
                >
                  {t("job.keep")}
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowReview(true)}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl py-2.5 transition active:scale-95 shadow-sm"
                >
                  <CheckCircle2 size={14} />
                  {t("job.reviewComplete")}
                </button>
                <button
                  onClick={() => setConfirmCancel(true)}
                  aria-label="Cancel job"
                  className="w-11 h-11 flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-500 rounded-xl transition active:scale-95"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {showReview && (
        <ReviewSheet
          card={card}
          open={showReview}
          onClose={() => setShowReview(false)}
          mechanics={mechanics ?? []}
        />
      )}
    </>
  );
}

function ShareLinkButton({
  url,
  title,
  label = "Share",
  toastMessage,
}: {
  url: string;
  title: string;
  label?: string;
  toastMessage: string;
}) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const t = useT();

  const handleShare = async () => {
    // Web Share API — available on mobile browsers
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // User cancelled — not an error
      }
      return;
    }
    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast(toastMessage, "success");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast("Could not copy link", "error");
    }
  };

  return (
    <button
      onClick={handleShare}
      aria-label={`Share ${title.toLowerCase()}`}
      className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-[var(--brand)] transition"
    >
      {copied ? <Copy size={12} /> : <Share2 size={12} />}
      {copied ? t("job.copied") : label}
    </button>
  );
}

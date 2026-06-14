import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  Copy,
  CreditCard,
  FileText,
  MessageCircle,
  Phone,
  Radio,
  Share2,
  User,
  X,
} from "lucide-react";
import {
  type JobCard,
  useCancelJobCard,
  useMarkPaid,
  useUpdateJobCard,
} from "../hooks/useJobCards";
import type { Mechanic } from "../hooks/useMechanics";
import BottomSheet from "./BottomSheet";
import MechanicSelector from "./MechanicSelector";
import VehiclePlate from "./VehiclePlate";
import PartsPanel from "./PartsPanel";
import JobPhotos from "./JobPhotos";
import { formatAge } from "../utils/formatAge";
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
  card: JobCard;
  isOwner: boolean;
  mechanics: Mechanic[];
  open: boolean;
  onClose: () => void;
  onRequestReview: () => void;
}

export default function JobDetailSheet({
  card,
  isOwner,
  mechanics,
  open,
  onClose,
  onRequestReview,
}: Props) {
  const [confirmCancel, setConfirmCancel] = useState(false);
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
  const assignedMechanic = mechanics?.find((m) => m.id === card.assigned_mechanic_id);

  useEffect(() => {
    if (descRef.current) {
      setDescOverflows(descRef.current.scrollHeight > descRef.current.clientHeight + 2);
    }
  }, [card.description, descExpanded, open]);

  useEffect(() => {
    if (notesRef.current) {
      setNotesOverflows(notesRef.current.scrollHeight > notesRef.current.clientHeight + 2);
    }
  }, [card.notes, notesExpanded, open]);

  const handleCancel = () => {
    cancel.mutate(card.id, {
      onSuccess: () => {
        toast(t("toast.jobCancelled"), "info");
        onClose();
      },
      onError: () => toast(t("toast.cancelFailed"), "error"),
    });
  };

  return (
    <BottomSheet open={open} onClose={onClose} title={t("job.detailTitle")}>
      <div>
        {/* Plate + make + status + age */}
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
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[card.status]}`}>
              {t(STATUS_KEYS[card.status])}
            </span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
              {formatAge(card.created_at)}
            </span>
          </div>
        </div>

        {/* Customer with tap-to-call + WhatsApp */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
            {card.customer_name}
          </span>
          {card.customer_phone && (
            <>
              <a
                href={`tel:${card.customer_phone}`}
                className="inline-flex items-center gap-1 text-xs text-[var(--brand)] hover:underline"
                data-keep-ltr
              >
                <Phone size={11} />
                {card.customer_phone}
              </a>
              <a
                href={`https://wa.me/${card.customer_phone.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noreferrer"
                aria-label="Message customer on WhatsApp"
                className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 transition active:scale-95"
              >
                <MessageCircle size={12} />
              </a>
            </>
          )}
        </div>

        {/* Assigned mechanic */}
        {assignedMechanic && (
          <p className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
            <User size={12} />
            {assignedMechanic.full_name}
          </p>
        )}

        {/* Mechanic assign / reassign */}
        {!isTerminal && isOwner && (
          showMechanicPicker ? (
            <div className="mt-1.5 flex items-center gap-2">
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
                          toast(id ? t("toast.mechanicAssigned") : t("toast.mechanicUnassigned"), "success");
                        },
                        onError: () => toast(t("toast.mechanicFailed"), "error"),
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
              className="text-xs text-[var(--brand)] font-medium mt-1 hover:underline"
            >
              {card.assigned_mechanic_id ? t("job.changeMechanic") : t("job.assignMechanic")}
            </button>
          )
        )}

        {/* Description */}
        {card.description && (
          <div className="mt-3">
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
                {descExpanded ? t("job.showLess") : t("job.showMore")}
              </button>
            )}
          </div>
        )}

        {/* Notes */}
        {card.notes && (
          <div className="mt-1">
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
                {notesExpanded ? t("job.showLess") : t("job.showMore")}
              </button>
            )}
          </div>
        )}

        {/* Parts */}
        <PartsPanel card={card} isEditable={!isTerminal} />

        {/* Total */}
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

        {/* Invoice link + share + payment status (completed) */}
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
                  toastMessage={t("toast.linkCopied")}
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
                        onSuccess: () => toast(t("toast.markedPaid"), "success"),
                        onError: () => toast(t("toast.paymentFailed"), "error"),
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
              toastMessage={t("toast.linkCopied")}
            />
          </div>
        )}

        {/* Photos */}
        {card.status !== "cancelled" && <JobPhotos cardId={card.id} canEdit />}

        {/* Actions */}
        {showActions && (
          <div className="mt-4">
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
                  onClick={onRequestReview}
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
    </BottomSheet>
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
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // User cancelled — not an error
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast(toastMessage, "success");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast(t("toast.copyFailed"), "error");
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

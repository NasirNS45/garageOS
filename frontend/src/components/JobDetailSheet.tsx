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
  useUpdatePayment,
  useUpdateJobCard,
} from "../hooks/useJobCards";
import { useCreateReminder } from "../hooks/useReminders";
import type { Mechanic } from "../hooks/useMechanics";
import BottomSheet from "./BottomSheet";
import MechanicSelector from "./MechanicSelector";
import VehiclePlate from "./VehiclePlate";
import PartsPanel from "./PartsPanel";
import JobPhotos from "./JobPhotos";
import { formatAge } from "../utils/formatAge";
import { formatLocaleDateStr } from "../utils/dates";
import { useToast } from "../context/ToastContext";
import { useAuthStore } from "../stores/authStore";
import { useLanguageStore } from "../stores/languageStore";
import { useT } from "../i18n/useT";
import type { TKey } from "../i18n/translations";
import { Badge, Button, Card, statusTone } from "./ui";

const STATUS_KEYS: Record<string, TKey> = {
  pending: "status.pending",
  in_progress: "status.in_progress",
  completed: "status.completed",
  cancelled: "status.cancelled",
};

export interface JobDetailContentProps {
  card: JobCard;
  isOwner: boolean;
  mechanics: Mechanic[];
  onClose: () => void;
  onRequestReview: () => void;
}

/** Shared inner content — used by both JobDetailSheet (mobile) and JobDetailPanel (desktop). */
export function JobDetailContent({
  card,
  isOwner,
  mechanics,
  onClose,
  onRequestReview,
}: JobDetailContentProps) {
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
  const updatePayment = useUpdatePayment();
  const createReminder = useCreateReminder();
  const { toast } = useToast();
  const t = useT();
  const language = useLanguageStore((s) => s.language);
  const userId = useAuthStore((s) => s.userId);

  const isTerminal = card.status === "completed" || card.status === "cancelled";
  const isAssignedMechanic = !isOwner && userId === card.assigned_mechanic_id;
  const canComplete = !isTerminal && (isOwner || isAssignedMechanic);
  const showCancel = isOwner && !isTerminal;
  const assignedMechanic = mechanics?.find((m) => m.id === card.assigned_mechanic_id);

  useEffect(() => {
    if (descRef.current) {
      setDescOverflows(descRef.current.scrollHeight > descRef.current.clientHeight + 2);
    }
  }, [card.description, descExpanded]);

  useEffect(() => {
    if (notesRef.current) {
      setNotesOverflows(notesRef.current.scrollHeight > notesRef.current.clientHeight + 2);
    }
  }, [card.notes, notesExpanded]);

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
    <div className="flex flex-col">
        {/* Plate + make + status + age */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <VehiclePlate number={card.vehicle_number} size="md" variant="subtle" />
            {card.vehicle_make && (
              <Badge tone="neutral" size="sm">
                {card.vehicle_make}
              </Badge>
            )}
          </div>
          <div className="flex flex-col items-end gap-0.5 shrink-0">
            <Badge tone={statusTone(card.status)} dot>
              {t(STATUS_KEYS[card.status])}
            </Badge>
            <span className="text-[11px] text-[var(--text-faint)] font-medium">
              {formatAge(card.created_at, language)}
            </span>
          </div>
        </div>

        {/* Customer */}
        <div className="mt-4">
          <p className="text-base font-bold text-[var(--text-strong)]">{card.customer_name}</p>
          {card.customer_phone && (
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <a
                href={`tel:${card.customer_phone}`}
                className="inline-flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--brand)] transition"
                data-keep-ltr
              >
                <Phone size={13} />
                {card.customer_phone}
              </a>
              <a
                href={`https://wa.me/${card.customer_phone.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noreferrer"
                aria-label={t("job.messageWhatsApp")}
                className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[var(--success-bg)] text-[var(--success-fg)] hover:brightness-95 transition active:scale-95"
              >
                <MessageCircle size={13} />
              </a>
            </div>
          )}
        </div>

        {/* Assigned mechanic */}
        {assignedMechanic && (
          <p className="flex items-center gap-1 text-xs text-[var(--text-muted)] mt-2">
            <User size={12} />
            {assignedMechanic.full_name}
          </p>
        )}

        {/* Mechanic assign / reassign */}
        {!isTerminal && isOwner && (
          <div className="mt-3">
            <p className="text-[length:var(--text-label)] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1.5">
              {t("job.assignMechanic")}
            </p>
            {showMechanicPicker ? (
              <div className="flex items-center gap-2">
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
                  className="text-[var(--text-faint)] hover:text-[var(--text-muted)] shrink-0"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setShowMechanicPicker(true)} className="!px-0">
                {card.assigned_mechanic_id ? t("job.changeMechanic") : t("job.assignMechanic")}
              </Button>
            )}
          </div>
        )}

        {/* Description */}
        {card.description && (
          <div className="mt-4">
            <p
              ref={descRef}
              className={`text-sm text-[var(--text-muted)] leading-relaxed ${descExpanded ? "" : "line-clamp-2"}`}
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
          <div className="mt-2">
            <p
              ref={notesRef}
              className={`text-xs text-[var(--text-faint)] italic ${notesExpanded ? "" : "line-clamp-2"}`}
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
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-[var(--border)]">
          <span className="text-lg font-bold text-[var(--text-strong)] tnum" data-keep-ltr>
            PKR {card.total_amount.toLocaleString()}
          </span>
          <span className="text-xs text-[var(--text-faint)]">
            {formatLocaleDateStr(card.created_at, language, {
              day: "numeric",
              month: "short",
            })}
          </span>
        </div>

        {/* Invoice link + share + payment (completed) */}
        {card.status === "completed" && (
          <>
            <div className="flex items-center justify-between mt-2 gap-2 flex-wrap">
              {card.invoice_url ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <a
                    href={card.invoice_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)] font-medium hover:text-[var(--brand)] transition"
                  >
                    <FileText size={12} />
                    {t("job.viewInvoice")}
                  </a>
                  {card.invoice_number && (
                    <a
                      href={`${import.meta.env.VITE_API_URL || "/api/v1"}/public/invoices/${card.invoice_number}/pdf`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)] font-medium hover:text-[var(--brand)] transition"
                    >
                      {t("job.pdf")}
                    </a>
                  )}
                  <ShareLinkButton
                    url={card.invoice_url}
                    title={t("job.shareInvoice")}
                    label={t("job.share")}
                    toastMessage={t("toast.linkCopied")}
                  />
                </div>
              ) : (
                <span />
              )}
              {card.payment_status === "paid" ? (
                <Badge tone="success" size="sm">
                  <CreditCard size={11} />
                  {t("job.paid")}
                </Badge>
              ) : (
                <Badge tone="warning" size="sm" dot>
                  {t("job.unpaid")}
                </Badge>
              )}
            </div>

            {isOwner && (
              <CompletedJobPaymentPanel
                card={card}
                onSave={(collected, method) =>
                  updatePayment.mutate(
                    { id: card.id, collected_amount: collected, payment_method: method },
                    {
                      onSuccess: () => toast(t("payment.saved"), "success"),
                      onError: () => toast(t("payment.failed"), "error"),
                    }
                  )
                }
                saving={updatePayment.isPending}
              />
            )}

            {isOwner && (
              <ScheduleReminderPanel
                card={card}
                onSchedule={(dueDate, note) =>
                  createReminder.mutate(
                    {
                      job_card_id: card.id,
                      due_date: dueDate,
                      service_note: note || undefined,
                    },
                    {
                      onSuccess: () => toast(t("reminder.scheduled"), "success"),
                      onError: () => toast(t("reminder.scheduleFailed"), "error"),
                    }
                  )
                }
                scheduling={createReminder.isPending}
              />
            )}
          </>
        )}

        {/* Customer tracking link — active jobs only */}
        {!isTerminal && card.track_url && (
          <div className="flex items-center justify-between mt-3 gap-2">
            <Button variant="ghost" size="sm" asChild className="!px-0">
              <a href={card.track_url} target="_blank" rel="noreferrer">
                <Radio size={12} />
                {t("job.liveTracking")}
              </a>
            </Button>
            <ShareLinkButton
              url={card.track_url}
              title={t("job.shareTrack")}
              label={t("job.shareWithCustomer")}
              toastMessage={t("toast.linkCopied")}
            />
          </div>
        )}

        {/* Photos */}
        {card.status !== "cancelled" && <JobPhotos cardId={card.id} canEdit />}

        {/* Actions */}
        {(canComplete || showCancel) && (
          <div className="mt-4 pt-4 border-t border-[var(--border)] lg:static sticky bottom-0 bg-[var(--surface)] pb-safe -mx-5 px-5 lg:mx-0 lg:px-0 lg:pb-0">
            {confirmCancel ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--text-muted)] flex-1">{t("job.cancelQuestion")}</span>
                <Button variant="danger" size="sm" onClick={handleCancel} loading={cancel.isPending}>
                  {t("job.yesCancel")}
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setConfirmCancel(false)}>
                  {t("job.keep")}
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                {canComplete && (
                  <Button
                    onClick={onRequestReview}
                    fullWidth
                    leftIcon={<CheckCircle2 size={14} />}
                  >
                    {t("job.reviewComplete")}
                  </Button>
                )}
                {showCancel && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setConfirmCancel(true)}
                    aria-label={t("job.cancelAction")}
                    className="shrink-0 !text-[var(--danger-fg)] !border-[var(--danger)]/30 hover:!bg-[var(--danger-bg)]"
                  >
                    <X size={16} />
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
  );
}

interface SheetProps extends JobDetailContentProps {
  open: boolean;
}

export default function JobDetailSheet({ open, onClose, ...rest }: SheetProps) {
  const t = useT();
  return (
    <BottomSheet open={open} onClose={onClose} title={t("job.detailTitle")} size="lg">
      <JobDetailContent onClose={onClose} {...rest} />
    </BottomSheet>
  );
}

function CompletedJobPaymentPanel({
  card,
  onSave,
  saving,
}: {
  card: JobCard;
  onSave: (collected: number, method: string) => void;
  saving: boolean;
}) {
  const t = useT();
  const [collected, setCollected] = useState(String(card.collected_amount ?? 0));
  const [method, setMethod] = useState(card.payment_method ?? "cash");
  const balance = Math.max(0, card.total_amount - (parseFloat(collected) || 0));

  return (
    <Card variant="inset" padding="sm" className="mt-3 space-y-2">
      <p className="text-xs font-semibold text-[var(--text-muted)]">{t("payment.recordPayment")}</p>
      <div className="flex gap-2">
        <input
          type="number"
          min="0"
          value={collected}
          onChange={(e) => setCollected(e.target.value)}
          className="flex-1 bg-[var(--surface)] ring-1 ring-[var(--border)] rounded-[var(--r-control)] px-3 py-2 text-sm text-[var(--text-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
          placeholder={t("payment.collected")}
        />
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          className="bg-[var(--surface)] ring-1 ring-[var(--border)] rounded-[var(--r-control)] px-2 py-2 text-xs text-[var(--text-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
        >
          <option value="cash">{t("payment.methodCash")}</option>
          <option value="bank">{t("payment.methodBank")}</option>
          <option value="jazzcash">{t("payment.methodJazzcash")}</option>
        </select>
      </div>
      {balance > 0 && (
        <p className="text-xs text-[var(--warning-fg)] tnum" data-keep-ltr>
          {t("payment.balance")}: PKR {balance.toLocaleString()}
        </p>
      )}
      <Button type="button" size="sm" fullWidth onClick={() => onSave(parseFloat(collected) || 0, method)} loading={saving}>
        {t("common.save")}
      </Button>
    </Card>
  );
}

function ScheduleReminderPanel({
  card,
  onSchedule,
  scheduling,
}: {
  card: JobCard;
  onSchedule: (dueDate: string, note: string) => void;
  scheduling: boolean;
}) {
  const t = useT();
  const defaultDue = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 90);
    return d.toISOString().slice(0, 10);
  })();
  const [dueDate, setDueDate] = useState(defaultDue);
  const [note, setNote] = useState(card.description ?? "");

  return (
    <Card variant="inset" padding="sm" className="mt-3 space-y-2">
      <p className="text-xs font-semibold text-[var(--text-muted)]">{t("reminder.schedule")}</p>
      <input
        type="date"
        value={dueDate}
        min={new Date().toISOString().slice(0, 10)}
        onChange={(e) => setDueDate(e.target.value)}
        className="w-full bg-[var(--surface)] ring-1 ring-[var(--border)] rounded-[var(--r-control)] px-3 py-2 text-sm text-[var(--text-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)] dark:[color-scheme:dark]"
      />
      <input
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={t("reminder.noteOptional")}
        className="w-full bg-[var(--surface)] ring-1 ring-[var(--border)] rounded-[var(--r-control)] px-3 py-2 text-sm text-[var(--text-strong)] placeholder:text-[var(--text-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
      />
      <Button
        type="button"
        variant="secondary"
        size="sm"
        fullWidth
        onClick={() => onSchedule(dueDate, note)}
        loading={scheduling}
        disabled={!dueDate}
        className="!text-[var(--brand)] !ring-[var(--brand)]"
      >
        {t("reminder.schedule")}
      </Button>
    </Card>
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
      aria-label={`${t("job.share")} ${title}`}
      className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-strong)] transition"
    >
      {copied ? <Copy size={12} /> : <Share2 size={12} />}
      {copied ? t("job.copied") : label}
    </button>
  );
}

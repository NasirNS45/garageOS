import { useState } from "react";
import BottomSheet from "./BottomSheet";
import VehiclePlate from "./VehiclePlate";
import {
  useCompleteJobCard,
  useUpdateJobCard,
  type JobCard,
} from "../hooks/useJobCards";
import { useToast } from "../context/ToastContext";
import type { Mechanic } from "../hooks/useMechanics";
import { parseApiError } from "../utils/parseApiError";
import { useT } from "../i18n/useT";
import { trackPilotEvent } from "../utils/trackPilotEvent";

interface Props {
  card: JobCard;
  open: boolean;
  onClose: () => void;
  mechanics: Mechanic[];
}

const inputBase =
  "w-full bg-[var(--surface-2)] ring-1 rounded-[var(--r-control)] px-3 py-2 text-sm text-[var(--text-strong)] placeholder:text-[var(--text-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)] transition";

const labelClass =
  "text-xs font-semibold text-[var(--text-faint)] uppercase tracking-wide mb-1";

export default function ReviewSheet({ card, open, onClose, mechanics }: Props) {
  const [labourInput, setLabourInput] = useState(card.labour_charge);
  const [labourError, setLabourError] = useState("");
  const [notesInput, setNotesInput] = useState(card.notes ?? "");
  const [notifyCustomer, setNotifyCustomer] = useState(true);

  const complete = useCompleteJobCard();
  const update = useUpdateJobCard();
  const { toast } = useToast();
  const t = useT();

  const mechanic = mechanics.find((m) => m.id === card.assigned_mechanic_id);

  const partsTotal = card.parts.reduce((sum, p) => sum + p.line_total, 0);
  const total = labourInput + partsTotal;

  const isBusy = complete.isPending || update.isPending;

  const handleConfirm = async () => {
    if (labourInput < 0) {
      setLabourError(t("review.labourNegative"));
      return;
    }
    setLabourError("");

    const labourChanged = labourInput !== card.labour_charge;
    const notesChanged = notesInput !== (card.notes ?? "");

    if (labourChanged || notesChanged) {
      try {
        await update.mutateAsync({
          id: card.id,
          ...(labourChanged ? { labour_charge: labourInput } : {}),
          ...(notesChanged ? { notes: notesInput || undefined } : {}),
        });
      } catch (err: unknown) {
        const serverErrors = parseApiError(err);
        toast(serverErrors._form ?? serverErrors.labour_charge ?? t("toast.saveFailed"), "error");
        return;
      }
    }

    complete.mutate(
      { id: card.id, notify_customer: notifyCustomer },
      {
        onSuccess: () => {
          trackPilotEvent("job_completed_frontend");
          toast(t("toast.jobCompleted"), "success");
          onClose();
        },
        onError: (err: unknown) => {
          const serverErrors = parseApiError(err);
          toast(serverErrors._form ?? t("toast.completeFailed"), "error");
        },
      }
    );
  };

  return (
    <BottomSheet open={open} onClose={onClose} title={t("review.title")}>
      <div className="space-y-4">
        {/* Header info */}
        <div className="flex items-center gap-3">
          <VehiclePlate number={card.vehicle_number} size="md" />
          <div>
            <p className="text-sm font-semibold text-[var(--text-strong)]">{card.customer_name}</p>
            <p className="text-xs text-[var(--text-faint)]">{card.customer_phone}</p>
          </div>
        </div>

        {mechanic && (
          <div className="text-sm text-[var(--text-muted)]">
            <span className="font-medium">{t("review.mechanic")}:</span> {mechanic.full_name}
          </div>
        )}

        {card.description && (
          <div>
            <p className={labelClass}>{t("review.description")}</p>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">{card.description}</p>
          </div>
        )}

        {/* Parts list */}
        {card.parts.length > 0 && (
          <div>
            <p className={labelClass}>{t("review.parts")}</p>
            <div className="space-y-1">
              {card.parts.map((p) => (
                <div key={p.id} className="flex items-center gap-2 text-sm">
                  <span className="flex-1 text-[var(--text-muted)]">{p.name}</span>
                  <span className="text-[var(--text-faint)] text-xs shrink-0 tnum" data-keep-ltr>
                    {p.quantity} × PKR {p.unit_price.toLocaleString()}
                  </span>
                  <span className="font-semibold text-[var(--text-strong)] shrink-0 text-xs tnum" data-keep-ltr>
                    PKR {p.line_total.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Editable notes */}
        <div>
          <p className={labelClass}>{t("review.notes")}</p>
          <textarea
            rows={2}
            placeholder={t("review.notesPlaceholder")}
            value={notesInput}
            onChange={(e) => setNotesInput(e.target.value)}
            className={`${inputBase} resize-none`}
          />
        </div>

        {/* Charges summary with editable labour */}
        <div className="border-t border-[var(--border)] pt-3 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-[var(--text-muted)] shrink-0">{t("review.labour")}</span>
            <div className="flex flex-col items-end gap-1">
              <input
                type="number"
                inputMode="decimal"
                min="0"
                value={labourInput}
                onChange={(e) => {
                  setLabourInput(Number(e.target.value));
                  setLabourError("");
                }}
                className={`w-32 ring-1 rounded-[var(--r-control)] px-2.5 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:border-transparent bg-[var(--surface-2)] text-[var(--text-strong)] tnum transition ${
                  labourError
                    ? "ring-[var(--danger)] focus:ring-[var(--danger)]"
                    : "ring-[var(--border)] focus:ring-[var(--brand)]"
                }`}
              />
              {labourError && (
                <p className="text-xs text-[var(--danger-fg)]">{labourError}</p>
              )}
            </div>
          </div>
          {partsTotal > 0 && (
            <div className="flex justify-between text-sm text-[var(--text-muted)]">
              <span>{t("review.parts")}</span>
              <span className="tnum" data-keep-ltr>PKR {partsTotal.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold text-[var(--text-strong)] pt-1 border-t border-[var(--border)]">
            <span>{t("review.total")}</span>
            <span className="tnum" data-keep-ltr>PKR {total.toLocaleString()}</span>
          </div>
        </div>

        {/* Notify toggle */}
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <div className="relative">
            <input
              type="checkbox"
              className="sr-only"
              checked={notifyCustomer}
              onChange={(e) => setNotifyCustomer(e.target.checked)}
            />
            <div
              className={`w-11 h-6 rounded-full transition-colors ${
                notifyCustomer ? "bg-[var(--brand)]" : "bg-[var(--border-strong)]"
              }`}
            />
            <div
              className={`absolute top-0.5 start-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                notifyCustomer ? "translate-x-5 rtl:-translate-x-5" : ""
              }`}
            />
          </div>
          <span>
            <span className="text-sm text-[var(--text-strong)] font-medium block">
              {t("review.notify")}
            </span>
            <span className="text-xs text-[var(--text-faint)] mt-0.5 block">
              {t("review.notifySub")} <span data-keep-ltr>{card.customer_phone}</span>
            </span>
          </span>
        </label>

        {/* Confirm button */}
        <button
          onClick={handleConfirm}
          disabled={isBusy}
          className={`w-full bg-[var(--success)] hover:opacity-90 active:opacity-80 text-white font-bold text-base rounded-[var(--r-control)] py-3.5 transition u-press disabled:opacity-60 shadow-[var(--shadow-sm)] ${isBusy ? "animate-pulse" : ""}`}
        >
          {isBusy ? t("review.saving") : t("review.confirm")}
        </button>
      </div>
    </BottomSheet>
  );
}

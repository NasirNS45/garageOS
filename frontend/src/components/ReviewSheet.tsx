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

const inputClass =
  "w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent transition";

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
    // Client-side: labour must not be negative
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
            <p className="text-sm font-semibold text-slate-800">{card.customer_name}</p>
            <p className="text-xs text-slate-400">{card.customer_phone}</p>
          </div>
        </div>

        {mechanic && (
          <div className="text-sm text-slate-600">
            <span className="font-medium">{t("review.mechanic")}:</span> {mechanic.full_name}
          </div>
        )}

        {card.description && (
          <div>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">
              {t("review.description")}
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{card.description}</p>
          </div>
        )}

        {/* Parts list */}
        {card.parts.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-2">
              {t("review.parts")}
            </p>
            <div className="space-y-1">
              {card.parts.map((p) => (
                <div key={p.id} className="flex items-center gap-2 text-sm">
                  <span className="flex-1 text-slate-700">{p.name}</span>
                  <span className="text-slate-400 text-xs shrink-0">
                    {p.quantity} × PKR {p.unit_price.toLocaleString()}
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 shrink-0 text-xs">
                    PKR {p.line_total.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Editable notes */}
        <div>
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">
            {t("review.notes")}
          </p>
          <textarea
            rows={2}
            placeholder={t("review.notesPlaceholder")}
            value={notesInput}
            onChange={(e) => setNotesInput(e.target.value)}
            className={`${inputClass} resize-none`}
          />
        </div>

        {/* Charges summary with editable labour */}
        <div className="border-t border-slate-100 dark:border-slate-700 pt-3 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-slate-600 dark:text-slate-400 shrink-0">{t("review.labour")}</span>
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
                className={`w-32 border rounded-lg px-2.5 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:border-transparent bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 ${
                  labourError
                    ? "border-red-400 dark:border-red-500 focus:ring-red-400"
                    : "border-slate-200 dark:border-slate-600 focus:ring-[var(--brand)]"
                }`}
              />
              {labourError && (
                <p className="text-xs text-red-500">{labourError}</p>
              )}
            </div>
          </div>
          {partsTotal > 0 && (
            <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
              <span>{t("review.parts")}</span>
              <span>PKR {partsTotal.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold text-slate-900 dark:text-slate-100 pt-1 border-t border-slate-100 dark:border-slate-700">
            <span>{t("review.total")}</span>
            <span>PKR {total.toLocaleString()}</span>
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
                notifyCustomer ? "bg-[var(--brand)]" : "bg-slate-200 dark:bg-slate-600"
              }`}
            />
            <div
              className={`absolute top-0.5 start-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                notifyCustomer ? "translate-x-5 rtl:-translate-x-5" : ""
              }`}
            />
          </div>
          <span>
            <span className="text-sm text-slate-700 dark:text-slate-300 font-medium block">
              {t("review.notify")}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 block">
              {t("review.notifySub")} <span data-keep-ltr>{card.customer_phone}</span>
            </span>
          </span>
        </label>

        {/* Confirm button */}
        <button
          onClick={handleConfirm}
          disabled={isBusy}
          className={`w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-base rounded-2xl py-3.5 transition active:scale-[0.98] disabled:opacity-60 shadow-sm ${isBusy ? "animate-pulse" : ""}`}
        >
          {isBusy ? t("review.saving") : t("review.confirm")}
        </button>
      </div>
    </BottomSheet>
  );
}

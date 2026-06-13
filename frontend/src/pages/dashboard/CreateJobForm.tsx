import { useState } from "react";
import { Clock } from "lucide-react";
import {
  useCreateJobCard,
  type JobCardCreate,
} from "../../hooks/useJobCards";
import { useMechanics } from "../../hooks/useMechanics";
import { useServicePresets } from "../../hooks/useServicePresets";
import { useVehicleHistory } from "../../hooks/useVehicleHistory";
import { useDebounce } from "../../hooks/useDebounce";
import { useToast } from "../../context/ToastContext";
import MechanicSelector from "../../components/MechanicSelector";
import PhoneInputField from "../../components/PhoneInputField";
import { parseApiError } from "../../utils/parseApiError";
import { isValidPhone } from "../../utils/validation";
import { useT } from "../../i18n/useT";
import { inputClass, fieldClass } from "./formStyles";

// ── Create Job Form (used inside BottomSheet) ─────────────────────────────────
export default function CreateJobForm({ onSuccess }: { onSuccess: () => void }) {
  const createCard = useCreateJobCard();
  const { data: mechanics = [] } = useMechanics();
  const { data: presets = [] } = useServicePresets();
  const { toast } = useToast();
  const t = useT();

  const [vehicleNumber, setVehicleNumber] = useState("");
  const [vehicleMake, setVehicleMake] = useState("");
  const [customMake, setCustomMake] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [labourCharge, setLabourCharge] = useState(0);
  const [mechanicId, setMechanicId] = useState("");
  const [notifyCheckin, setNotifyCheckin] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Repeat vehicle detection
  const debouncedVehicle = useDebounce(vehicleNumber, 500);
  const { data: vehicleHistory } = useVehicleHistory(debouncedVehicle);
  const lastVisit = vehicleHistory?.jobs?.[0];

  const clearError = (field: string) =>
    setErrors((prev) => ({ ...prev, [field]: "" }));

  const validate = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (!vehicleNumber.trim()) errs.vehicle_number = "Vehicle number is required";
    if (!customerName.trim()) errs.customer_name = "Customer name is required";
    if (!customerPhone.trim()) {
      errs.customer_phone = "Customer phone is required";
    } else if (!isValidPhone(customerPhone)) {
      errs.customer_phone = "Enter a valid mobile number";
    }
    if (vehicleMake === "Other" && !customMake.trim()) {
      errs.vehicle_make = "Enter a make or choose from the list";
    }
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const clientErrors = validate();
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      return;
    }

    const resolvedMake = vehicleMake === "Other" ? customMake.trim() : vehicleMake;
    const payload: JobCardCreate = {
      vehicle_number: vehicleNumber,
      vehicle_make: resolvedMake || undefined,
      customer_name: customerName,
      customer_phone: customerPhone,
      description: description || undefined,
      notes: notes || undefined,
      labour_charge: labourCharge,
      parts_charge: 0,
      assigned_mechanic_id: mechanicId || undefined,
      notify_checkin: notifyCheckin,
    };
    try {
      await createCard.mutateAsync(payload);
      setVehicleNumber("");
      setVehicleMake("");
      setCustomMake("");
      setCustomerName("");
      setCustomerPhone("");
      setDescription("");
      setNotes("");
      setLabourCharge(0);
      setMechanicId("");
      setNotifyCheckin(false);
      setErrors({});
      toast("Job card created", "success");
      onSuccess();
    } catch (err: unknown) {
      const serverErrors = parseApiError(err);
      // Field-level errors go inline; truly generic errors stay as a toast
      const hasFieldErrors = Object.keys(serverErrors).some((k) => k !== "_form");
      if (hasFieldErrors) {
        setErrors(serverErrors);
      } else {
        toast(serverErrors._form ?? "Failed to create job card", "error");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        Vehicle &amp; Customer
      </p>

      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
          {t("form.vehicleNumber")}
        </label>
        <input
          type="text"
          placeholder="ABC-123"
          value={vehicleNumber}
          onChange={(e) => { setVehicleNumber(e.target.value); clearError("vehicle_number"); }}
          className={fieldClass(!!errors.vehicle_number)}
        />
        {errors.vehicle_number && (
          <p className="text-xs text-red-500 mt-1">{errors.vehicle_number}</p>
        )}
        {/* Repeat vehicle banner */}
        {lastVisit && (
          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 px-2.5 py-1.5 rounded-lg">
            <Clock size={11} className="shrink-0" />
            <span>
              Last visit{" "}
              {new Date(lastVisit.created_at).toLocaleDateString("en-PK", {
                day: "numeric",
                month: "short",
              })}
              {" · "}
              {lastVisit.status.replace("_", " ")}
              {" · "}
              PKR {lastVisit.total_amount.toLocaleString()}
            </span>
          </div>
        )}
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
          {t("form.vehicleMake")}
        </label>
        <select
          value={vehicleMake}
          onChange={(e) => {
            setVehicleMake(e.target.value);
            setCustomMake("");
            clearError("vehicle_make");
          }}
          className={fieldClass(!!errors.vehicle_make)}
        >
          <option value="">Select make (optional)</option>
          {[
            "Toyota", "Honda", "Suzuki", "Kia", "Hyundai", "Daihatsu",
            "Nissan", "Mitsubishi", "Isuzu", "FAW", "Chery", "MG", "BAIC",
            "Prince", "United",
          ].map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
          <option value="Other">Other</option>
        </select>
        {vehicleMake === "Other" && (
          <input
            type="text"
            placeholder="Enter make manually"
            value={customMake}
            onChange={(e) => { setCustomMake(e.target.value); clearError("vehicle_make"); }}
            className={`${fieldClass(!!errors.vehicle_make)} mt-2`}
          />
        )}
        {errors.vehicle_make && (
          <p className="text-xs text-red-500 mt-1">{errors.vehicle_make}</p>
        )}
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
          {t("form.customerName")}
        </label>
        <input
          type="text"
          placeholder="Muhammad Ali"
          value={customerName}
          onChange={(e) => { setCustomerName(e.target.value); clearError("customer_name"); }}
          className={fieldClass(!!errors.customer_name)}
        />
        {errors.customer_name && (
          <p className="text-xs text-red-500 mt-1">{errors.customer_name}</p>
        )}
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
          {t("form.customerPhone")}
        </label>
        <PhoneInputField
          value={customerPhone}
          onChange={(val) => { setCustomerPhone(val); clearError("customer_phone"); }}
          error={!!errors.customer_phone}
        />
        {errors.customer_phone && (
          <p className="text-xs text-red-500 mt-1">{errors.customer_phone}</p>
        )}
      </div>

      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 pt-1">
        Work &amp; Assignment
      </p>

      {/* Preset quick-fill */}
      {presets.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
            Quick-fill from preset
          </label>
          <select
            defaultValue=""
            onChange={(e) => {
              const preset = presets.find((p) => p.id === e.target.value);
              if (preset) {
                if (preset.description) setDescription(preset.description);
                else setDescription(preset.name);
                setLabourCharge(preset.default_labour);
              }
            }}
            className={inputClass}
          >
            <option value="">Select a preset…</option>
            {presets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.default_labour > 0
                  ? ` — PKR ${p.default_labour.toLocaleString()}`
                  : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
          {t("form.description")}
        </label>
        <input
          type="text"
          placeholder="Oil change, brake pads…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={inputClass}
        />
      </div>

      <MechanicSelector
        mechanics={mechanics}
        value={mechanicId}
        onChange={setMechanicId}
        disabled={createCard.isPending}
      />
      {mechanics.length === 0 && (
        <p className="text-xs text-slate-400 dark:text-slate-500 -mt-2">
          No mechanics yet. Add them in the Settings tab.
        </p>
      )}

      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
          {t("form.labour")}
        </label>
        <input
          type="number"
          inputMode="decimal"
          min="0"
          value={labourCharge}
          onChange={(e) => setLabourCharge(Number(e.target.value))}
          className={inputClass}
        />
      </div>

      <p className="text-xs text-slate-400 dark:text-slate-500 -mt-2">
        Parts are added as line items after creating the job card.
      </p>

      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
          {t("form.notes")}
        </label>
        <textarea
          rows={2}
          placeholder="Mechanic observations, special requests…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className={`${inputClass} resize-none`}
        />
      </div>

      {/* Notify checkin toggle */}
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <div className="relative shrink-0">
          <input
            type="checkbox"
            className="sr-only"
            checked={notifyCheckin}
            onChange={(e) => setNotifyCheckin(e.target.checked)}
          />
          <div
            className={`w-10 h-5 rounded-full transition-colors ${
              notifyCheckin ? "bg-[var(--brand)]" : "bg-slate-200"
            }`}
          />
          <div
            className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
              notifyCheckin ? "translate-x-5" : ""
            }`}
          />
        </div>
        <span className="text-sm text-slate-700">
          {t("form.notifyCheckin")}
        </span>
      </label>

      <button
        type="submit"
        disabled={createCard.isPending}
        className="w-full bg-[var(--brand)] hover:bg-[var(--brand-hover)] active:bg-[var(--brand-panel)] text-white font-semibold rounded-xl py-3 text-sm transition active:scale-95 shadow-sm disabled:opacity-60"
      >
        {createCard.isPending ? t("form.saving") : t("form.submit")}
      </button>
    </form>
  );
}

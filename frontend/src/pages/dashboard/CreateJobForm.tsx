import { useState } from "react";
import { ArrowLeft, ArrowRight, Clock } from "lucide-react";
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
import { useLanguageStore } from "../../stores/languageStore";
import { formatLocaleDateStr } from "../../utils/dates";
import { trackPilotEvent } from "../../utils/trackPilotEvent";
import { inputClass, fieldClass } from "./formStyles";
import { Button, FormField, TextInput, Toggle } from "../../components/ui";

// ── Create Job Form (used inside BottomSheet) ─────────────────────────────────
export default function CreateJobForm({ onSuccess }: { onSuccess: () => void }) {
  const createCard = useCreateJobCard();
  const { data: mechanics = [] } = useMechanics();
  const { data: presets = [] } = useServicePresets();
  const { toast } = useToast();
  const t = useT();
  const language = useLanguageStore((s) => s.language);

  const [step, setStep] = useState<1 | 2>(1);
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

  // All required fields live in step 1.
  const validateStep1 = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (!vehicleNumber.trim()) errs.vehicle_number = t("form.errVehicleRequired");
    if (!customerName.trim()) errs.customer_name = t("form.errCustomerNameRequired");
    if (!customerPhone.trim()) {
      errs.customer_phone = t("form.errCustomerPhoneRequired");
    } else if (!isValidPhone(customerPhone)) {
      errs.customer_phone = t("form.errMobileInvalid");
    }
    if (vehicleMake === "Other" && !customMake.trim()) {
      errs.vehicle_make = t("form.errVehicleMakeRequired");
    }
    return errs;
  };

  const applyPreset = (presetId: string) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) return;
    if (preset.description) setDescription(preset.description);
    else setDescription(preset.name);
    setLabourCharge(preset.default_labour);
  };

  const goNext = () => {
    const stepErrors = validateStep1();
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
    setStep(2);
  };

  const resetForm = () => {
    setStep(1);
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Enter key on step 1 advances rather than submitting.
    if (step === 1) {
      goNext();
      return;
    }
    setErrors({});

    const clientErrors = validateStep1();
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      setStep(1); // surface the missing required field
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
      resetForm();
      trackPilotEvent("job_created_frontend");
      toast(t("form.toastCreated"), "success");
      onSuccess();
    } catch (err: unknown) {
      const serverErrors = parseApiError(err);
      const hasFieldErrors = Object.keys(serverErrors).some((k) => k !== "_form");
      if (hasFieldErrors) {
        setErrors(serverErrors);
        setStep(1);
      } else {
        toast(serverErrors._form ?? t("form.errCreateFailed"), "error");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Step indicator */}
      <div className="mb-1">
        <p className="text-[length:var(--text-label)] font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-2">
          {t("form.step")} {step}/2 · {step === 1 ? t("form.stepVehicle") : t("form.stepWork")}
        </p>
        <div className="flex gap-1.5">
          <span className="flex-1 h-1 rounded-[var(--r-pill)] bg-[var(--brand)] transition-colors" />
          <span
            className={`flex-1 h-1 rounded-[var(--r-pill)] transition-colors ${
              step === 2 ? "bg-[var(--brand)]" : "bg-[var(--surface-2)] ring-1 ring-[var(--border)]"
            }`}
          />
        </div>
      </div>

      {step === 1 && (
        <>
          <FormField
            label={t("form.vehicleNumber")}
            error={errors.vehicle_number}
          >
            <TextInput
              type="text"
              placeholder="ABC-123"
              value={vehicleNumber}
              onChange={(e) => { setVehicleNumber(e.target.value); clearError("vehicle_number"); }}
              hasError={!!errors.vehicle_number}
            />
            {vehicleHistory && vehicleHistory.total_jobs > 0 && (
              <div className="mt-1.5 text-xs bg-[var(--success-bg)] ring-1 ring-[var(--border)] rounded-[var(--r-control)] px-2.5 py-2 space-y-1">
                <div className="flex items-center gap-1.5 text-[var(--success-fg)] font-semibold">
                  <Clock size={11} className="shrink-0" />
                  {t("form.repeatCustomer")}
                  {" · "}
                  {vehicleHistory.total_jobs} {t("form.visitsCount")}
                </div>
                {lastVisit && (
                  <p className="text-[var(--success-fg)]">
                    {t("form.lastVisit")}{" "}
                    {formatLocaleDateStr(lastVisit.created_at, language, {
                      day: "numeric",
                      month: "short",
                    })}
                    {" · "}
                    {t(`status.${lastVisit.status}` as "status.pending")}
                    {" · "}
                    <span className="tnum" data-keep-ltr>PKR {lastVisit.total_amount.toLocaleString()}</span>
                  </p>
                )}
                {vehicleHistory.customer_name && !customerName && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomerName(vehicleHistory.customer_name);
                      if (vehicleHistory.customer_phone) setCustomerPhone(vehicleHistory.customer_phone);
                    }}
                    className="text-[var(--brand)] font-semibold hover:underline"
                  >
                    {vehicleHistory.customer_name}
                    {vehicleHistory.customer_phone ? ` · ${vehicleHistory.customer_phone}` : ""}
                  </button>
                )}
              </div>
            )}
          </FormField>

          <FormField
            label={t("form.vehicleMake")}
            error={errors.vehicle_make}
          >
            <select
              value={vehicleMake}
              onChange={(e) => {
                setVehicleMake(e.target.value);
                setCustomMake("");
                clearError("vehicle_make");
              }}
              className={fieldClass(!!errors.vehicle_make)}
            >
              <option value="">{t("form.makeSelect")}</option>
              {[
                "Toyota", "Honda", "Suzuki", "Kia", "Hyundai", "Daihatsu",
                "Nissan", "Mitsubishi", "Isuzu", "FAW", "Chery", "MG", "BAIC",
                "Prince", "United",
              ].map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
              <option value="Other">{t("form.makeOther")}</option>
            </select>
            {vehicleMake === "Other" && (
              <TextInput
                type="text"
                placeholder={t("form.makeManual")}
                value={customMake}
                onChange={(e) => { setCustomMake(e.target.value); clearError("vehicle_make"); }}
                hasError={!!errors.vehicle_make}
                className="mt-2"
              />
            )}
          </FormField>

          <FormField
            label={t("form.customerName")}
            error={errors.customer_name}
          >
            <TextInput
              type="text"
              placeholder="Muhammad Ali"
              value={customerName}
              onChange={(e) => { setCustomerName(e.target.value); clearError("customer_name"); }}
              hasError={!!errors.customer_name}
            />
          </FormField>

          <FormField
            label={t("form.customerPhone")}
            error={errors.customer_phone}
          >
            <PhoneInputField
              value={customerPhone}
              onChange={(val) => { setCustomerPhone(val); clearError("customer_phone"); }}
              error={!!errors.customer_phone}
            />
          </FormField>

          <Button type="button" onClick={goNext} fullWidth>
            {t("form.continue")}
            <ArrowRight size={16} className="rtl:rotate-180" />
          </Button>
        </>
      )}

      {step === 2 && (
        <>
          {/* Preset quick-fill */}
          {presets.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                {t("form.presetLabel")}
              </label>
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar mb-2">
                {presets.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => applyPreset(p.id)}
                    className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-[var(--r-pill)] bg-[var(--surface-2)] ring-1 ring-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--brand)] hover:text-white transition active:scale-95"
                  >
                    {p.name}
                    {p.default_labour > 0 ? ` · ${p.default_labour.toLocaleString()}` : ""}
                  </button>
                ))}
              </div>
            </div>
          )}

          <FormField label={t("form.description")}>
            <TextInput
              type="text"
              placeholder={t("form.placeholderDescription")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </FormField>

          <MechanicSelector
            mechanics={mechanics}
            value={mechanicId}
            onChange={setMechanicId}
            disabled={createCard.isPending}
          />
          {mechanics.length === 0 && (
            <p className="text-xs text-[var(--text-faint)] -mt-2">
              {t("form.noMechanics")}
            </p>
          )}

          <FormField label={t("form.labour")}>
            <TextInput
              type="number"
              inputMode="decimal"
              min="0"
              value={labourCharge}
              onChange={(e) => setLabourCharge(Number(e.target.value))}
              className="tnum"
              data-keep-ltr
            />
          </FormField>

          <p className="text-xs text-[var(--text-faint)] -mt-2">
            {t("form.partsLater")}
          </p>

          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
              {t("form.notes")}
            </label>
            <textarea
              rows={2}
              placeholder={t("form.placeholderNotes")}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={`${inputClass} resize-none`}
            />
          </div>

          <Toggle
            checked={notifyCheckin}
            onChange={setNotifyCheckin}
            label={t("form.notifyCheckin")}
          />

          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setStep(1)}
              leftIcon={<ArrowLeft size={16} />}
            >
              {t("common.back")}
            </Button>
            <Button type="submit" loading={createCard.isPending} className="flex-1">
              {createCard.isPending ? t("form.saving") : t("form.submit")}
            </Button>
          </div>
        </>
      )}
    </form>
  );
}

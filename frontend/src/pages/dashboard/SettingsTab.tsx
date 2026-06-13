import { useEffect, useState } from "react";
import {
  BellRing,
  Building2,
  Download,
  Package,
  Palette,
  Plus,
  Trash2,
  Users,
  Wrench,
} from "lucide-react";
import { useReminders, useCancelReminder } from "../../hooks/useReminders";
import { useAuthStore } from "../../stores/authStore";
import { useMechanics, useAddMechanic, useToggleMechanic, type Mechanic } from "../../hooks/useMechanics";
import {
  useServicePresets,
  useCreatePreset,
  useDeletePreset,
  type ServicePreset,
} from "../../hooks/useServicePresets";
import {
  usePartCatalog,
  useCreatePartCatalogItem,
  useDeletePartCatalogItem,
  type PartCatalogItem,
} from "../../hooks/usePartCatalog";
import { useToast } from "../../context/ToastContext";
import BottomSheet from "../../components/BottomSheet";
import JobCardSkeleton from "../../components/JobCardSkeleton";
import ThemePicker from "../../components/ThemePicker";
import PhoneInputField from "../../components/PhoneInputField";
import { api } from "../../api/axios";
import { parseApiError } from "../../utils/parseApiError";
import { isValidPhone } from "../../utils/validation";
import { todayStr, shiftDate } from "../../utils/dates";
import { inputClass, fieldClass } from "./formStyles";

// ── Settings tab ──────────────────────────────────────────────────────────────
interface SettingsForm {
  name: string;
  address: string;
  owner_contact: string;
  whatsapp_number: string;
  invoice_footer: string;
  bank_details: string;
  reminder_interval_days: number;
  digest_enabled: boolean;
}

const EMPTY_SETTINGS: SettingsForm = {
  name: "",
  address: "",
  owner_contact: "",
  whatsapp_number: "",
  invoice_footer: "",
  bank_details: "",
  reminder_interval_days: 0,
  digest_enabled: false,
};

// ── Shared card shell for every settings section ─────────────────────────────
function SettingCard({
  icon,
  title,
  action,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "color-mix(in srgb, var(--brand) 12%, transparent)" }}
          >
            <div style={{ color: "var(--brand)" }}>{icon}</div>
          </div>
          <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">{title}</span>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ── Upcoming service reminders list ──────────────────────────────────────────
function RemindersList() {
  const { data: reminders = [], isLoading } = useReminders();
  const cancelReminder = useCancelReminder();
  const { toast } = useToast();

  if (isLoading || reminders.length === 0) return null;

  return (
    <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-700">
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2.5 uppercase tracking-wide">
        Upcoming reminders ({reminders.length})
      </p>
      <div className="space-y-2">
        {reminders.map((r) => (
          <div key={r.id} className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                {r.vehicle_number} · {r.customer_name}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Due {r.due_date}
              </p>
            </div>
            <button
              onClick={() =>
                cancelReminder.mutate(r.id, {
                  onSuccess: () => toast("Reminder cancelled", "info"),
                  onError: () => toast("Could not cancel reminder", "error"),
                })
              }
              aria-label="Cancel reminder"
              className="text-slate-300 hover:text-red-500 transition p-1 active:scale-95 shrink-0"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SettingsTab() {
  const { setWorkshopName } = useAuthStore();
  const { toast } = useToast();
  const [form, setForm] = useState<SettingsForm>(EMPTY_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testingWa, setTestingWa] = useState(false);

  const loadSettings = () => {
    setLoaded(false);
    setLoadError(false);
    api
      .get<SettingsForm>("/settings")
      .then(({ data }) => {
        setForm({
          name: data.name ?? "",
          address: data.address ?? "",
          owner_contact: data.owner_contact ?? "",
          whatsapp_number: data.whatsapp_number ?? "",
          invoice_footer: (data as SettingsForm).invoice_footer ?? "",
          bank_details: (data as SettingsForm).bank_details ?? "",
          reminder_interval_days: (data as SettingsForm).reminder_interval_days ?? 0,
          digest_enabled: (data as SettingsForm).digest_enabled ?? false,
        });
        setLoaded(true);
      })
      .catch(() => {
        setLoadError(true);
        setLoaded(true);
      });
  };

  useEffect(() => {
    loadSettings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setField =
    (name: keyof SettingsForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [name]: e.target.value }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put("/settings", form);
      setWorkshopName(form.name);
      toast("Settings saved", "success");
    } catch {
      toast("Failed to save settings", "error");
    } finally {
      setSaving(false);
    }
  };

  const testWhatsApp = async () => {
    const phone = form.whatsapp_number.trim();
    if (!phone) { toast("Enter a WhatsApp number first", "info"); return; }
    setTestingWa(true);
    try {
      await api.post("/settings/test-whatsapp", { phone });
      toast("Test message sent! Check WhatsApp.", "success");
    } catch (err: unknown) {
      const msg =
        err instanceof Object && "response" in err
          ? ((err as { response?: { data?: { detail?: string } } }).response?.data?.detail ??
            "Failed to send test message")
          : "Failed to send test message";
      toast(msg, "error");
    } finally {
      setTestingWa(false);
    }
  };

  const settingInput =
    "w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent transition";

  if (!loaded) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Settings</h2>
        <JobCardSkeleton count={3} />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Settings</h2>
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-2xl p-6 text-center">
          <p className="font-semibold text-sm mb-3">Failed to load settings</p>
          <button onClick={loadSettings} className="text-sm font-semibold underline hover:no-underline">
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Settings</h2>

      {/* Workshop */}
      <SettingCard icon={<Building2 size={15} />} title="Workshop">
        <form onSubmit={save} className="space-y-3.5">
          <div className="grid grid-cols-1 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Workshop Name
              </label>
              <input
                type="text"
                placeholder="Ali Motors"
                value={form.name}
                onChange={setField("name")}
                className={settingInput}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Address
              </label>
              <input
                type="text"
                placeholder="Shop 5, GT Road"
                value={form.address}
                onChange={setField("address")}
                className={settingInput}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Owner Contact
              </label>
              <PhoneInputField
                value={form.owner_contact}
                onChange={(val) => setForm((prev) => ({ ...prev, owner_contact: val }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                WhatsApp Number
              </label>
              <PhoneInputField
                value={form.whatsapp_number}
                onChange={(val) => setForm((prev) => ({ ...prev, whatsapp_number: val }))}
              />
              <button
                type="button"
                onClick={testWhatsApp}
                disabled={testingWa || !form.whatsapp_number.trim()}
                className="mt-2 text-xs font-semibold text-[var(--brand)] border border-[var(--brand)] bg-transparent hover:bg-[var(--brand)] hover:text-white px-3 py-1.5 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {testingWa ? "Sending…" : "Send Test Message"}
              </button>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Invoice Footer
              </label>
              <textarea
                rows={2}
                placeholder="Thank you for your business!"
                value={form.invoice_footer}
                onChange={(e) => setForm((prev) => ({ ...prev, invoice_footer: e.target.value }))}
                className={`${settingInput} resize-none`}
              />
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Shown at the bottom of every invoice.
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Payment / Bank Details
              </label>
              <textarea
                rows={3}
                placeholder={"Bank: Allied Bank\nAccount: 0123456789\nIBAN: PK00ABCD..."}
                value={form.bank_details}
                onChange={(e) => setForm((prev) => ({ ...prev, bank_details: e.target.value }))}
                className={`${settingInput} resize-none`}
              />
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Shown on the invoice under "Payment Details".
              </p>
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white font-semibold rounded-xl py-2.5 text-sm transition active:scale-95 disabled:opacity-60 shadow-sm"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </form>
      </SettingCard>

      {/* Appearance */}
      <SettingCard icon={<Palette size={15} />} title="Appearance">
        <ThemePicker />
      </SettingCard>

      {/* Automation: reminders + digest */}
      <SettingCard icon={<BellRing size={15} />} title="Automation">
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Service reminder interval (days)
            </label>
            <input
              type="number"
              min={0}
              max={365}
              value={form.reminder_interval_days}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  reminder_interval_days: Math.max(0, Number(e.target.value) || 0),
                }))
              }
              className={settingInput}
            />
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              When a job is completed, schedule a WhatsApp service reminder this many
              days later. Set to 0 to turn reminders off. (90 = roughly 3 months.)
            </p>
          </div>

          <label className="flex items-center justify-between gap-3 cursor-pointer select-none">
            <span className="text-sm text-slate-700 dark:text-slate-300">
              Daily summary to my WhatsApp
            </span>
            <div className="relative shrink-0">
              <input
                type="checkbox"
                className="sr-only"
                checked={form.digest_enabled}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, digest_enabled: e.target.checked }))
                }
              />
              <div
                className={`w-10 h-5 rounded-full transition-colors ${
                  form.digest_enabled ? "bg-[var(--brand)]" : "bg-slate-200 dark:bg-slate-600"
                }`}
              />
              <div
                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  form.digest_enabled ? "translate-x-5" : ""
                }`}
              />
            </div>
          </label>
          <p className="text-xs text-slate-400 dark:text-slate-500 -mt-2">
            Each evening, get a WhatsApp with the day's jobs, revenue, and outstanding
            amount. Sent to your WhatsApp number above.
          </p>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white font-semibold rounded-xl py-2.5 text-sm transition active:scale-95 disabled:opacity-60 shadow-sm"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </form>

        <RemindersList />
      </SettingCard>

      {/* Team */}
      <MechanicsSection />

      {/* Service Presets */}
      <PresetsSection />

      {/* Parts Catalog */}
      <PartsCatalogSection />

      {/* Export */}
      <ExportSection />
    </div>
  );
}

// ── Mechanics management section (inside SettingsTab) ─────────────────────────
function MechanicsSection() {
  const { data: mechanics = [], isLoading } = useMechanics();
  const addMechanic = useAddMechanic();
  const toggleMechanic = useToggleMechanic();
  const { toast } = useToast();

  const [showAddSheet, setShowAddSheet] = useState(false);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [mechErrors, setMechErrors] = useState<Record<string, string>>({});

  const clearMechError = (field: string) =>
    setMechErrors((prev) => ({ ...prev, [field]: "" }));

  const validateMechanic = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.full_name = "Full name is required";
    if (!mobile.trim()) {
      errs.mobile = "Mobile number is required";
    } else if (!isValidPhone(mobile)) {
      errs.mobile = "Enter a valid mobile number";
    }
    if (!password) {
      errs.password = "Password is required";
    } else if (password.length < 8) {
      errs.password = "Password must be at least 8 characters";
    }
    return errs;
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setMechErrors({});

    const clientErrors = validateMechanic();
    if (Object.keys(clientErrors).length > 0) {
      setMechErrors(clientErrors);
      return;
    }

    try {
      await addMechanic.mutateAsync({ full_name: name, mobile, password });
      toast("Mechanic added", "success");
      setShowAddSheet(false);
      setName("");
      setMobile("");
      setPassword("");
      setMechErrors({});
    } catch (err: unknown) {
      const serverErrors = parseApiError(err);
      const hasFieldErrors = Object.keys(serverErrors).some((k) => k !== "_form");
      if (hasFieldErrors) {
        setMechErrors(serverErrors);
      } else {
        toast(serverErrors._form ?? "Failed to add mechanic", "error");
      }
    }
  };

  const handleToggle = (m: Mechanic) => {
    toggleMechanic.mutate(
      { id: m.id, is_active: !m.is_active },
      {
        onSuccess: () =>
          toast(m.is_active ? "Mechanic deactivated" : "Mechanic activated", "info"),
        onError: () => toast("Failed to update mechanic", "error"),
      }
    );
  };

  return (
    <>
      <SettingCard
        icon={<Users size={15} />}
        title="Team"
        action={
          <button
            onClick={() => setShowAddSheet(true)}
            className="flex items-center gap-1 text-xs font-semibold text-[var(--brand)] hover:underline"
          >
            <Plus size={13} />
            Add
          </button>
        }
      >
        {isLoading && <JobCardSkeleton count={1} />}

        {!isLoading && mechanics.length === 0 && (
          <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-2">
            No mechanics yet. Add your first mechanic to start assigning jobs.
          </p>
        )}

        <div className="space-y-3">
          {mechanics.map((m) => (
            <div key={m.id} className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${m.is_active ? "text-slate-800 dark:text-slate-200" : "text-slate-400 dark:text-slate-500"}`}>
                  {m.full_name}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${m.is_available ? "bg-emerald-500" : "bg-amber-400"}`} />
                  {m.mobile} · {m.is_available ? "Available" : "Busy"}
                </p>
              </div>
              <button
                onClick={() => handleToggle(m)}
                disabled={toggleMechanic.isPending}
                className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full transition disabled:opacity-60 ${
                  m.is_active
                    ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600"
                }`}
              >
                {m.is_active ? "Active" : "Inactive"}
              </button>
            </div>
          ))}
        </div>
      </SettingCard>

      <BottomSheet
        open={showAddSheet}
        onClose={() => {
          setShowAddSheet(false);
          setMechErrors({});
        }}
        title="Add Mechanic"
      >
        <form onSubmit={handleAdd} className="space-y-4" noValidate>
          {mechErrors._form && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm rounded-xl px-4 py-3">
              {mechErrors._form}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
              Full name
            </label>
            <input
              value={name}
              onChange={(e) => { setName(e.target.value); clearMechError("full_name"); }}
              placeholder="Ali Raza"
              className={fieldClass(!!mechErrors.full_name)}
            />
            {mechErrors.full_name && (
              <p className="text-xs text-red-500 mt-1">{mechErrors.full_name}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
              Mobile
            </label>
            <PhoneInputField
              value={mobile}
              onChange={(val) => { setMobile(val); clearMechError("mobile"); }}
              error={!!mechErrors.mobile}
            />
            {mechErrors.mobile && (
              <p className="text-xs text-red-500 mt-1">{mechErrors.mobile}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); clearMechError("password"); }}
              placeholder="Min 8 characters"
              className={fieldClass(!!mechErrors.password)}
            />
            {mechErrors.password && (
              <p className="text-xs text-red-500 mt-1">{mechErrors.password}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={addMechanic.isPending}
            className="w-full bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white font-semibold rounded-xl py-3 text-sm transition active:scale-95 disabled:opacity-60 shadow-sm"
          >
            {addMechanic.isPending ? "Adding…" : "Add Mechanic"}
          </button>
        </form>
      </BottomSheet>
    </>
  );
}

// ── Service presets section (inside SettingsTab) ───────────────────────────────
function PresetsSection() {
  const { data: presets = [], isLoading } = useServicePresets();
  const createPreset = useCreatePreset();
  const deletePreset = useDeletePreset();
  const { toast } = useToast();

  const [showAddSheet, setShowAddSheet] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [presetDesc, setPresetDesc] = useState("");
  const [presetLabour, setPresetLabour] = useState(0);
  const [presetErrors, setPresetErrors] = useState<Record<string, string>>({});

  const clearPresetError = (field: string) =>
    setPresetErrors((prev) => ({ ...prev, [field]: "" }));

  const resetForm = () => {
    setPresetName("");
    setPresetDesc("");
    setPresetLabour(0);
    setPresetErrors({});
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!presetName.trim()) errs.name = "Preset name is required";
    if (Object.keys(errs).length > 0) {
      setPresetErrors(errs);
      return;
    }
    try {
      await createPreset.mutateAsync({
        name: presetName.trim(),
        description: presetDesc.trim() || undefined,
        default_labour: presetLabour,
      });
      toast("Preset added", "success");
      setShowAddSheet(false);
      resetForm();
    } catch {
      toast("Failed to add preset", "error");
    }
  };

  const handleDelete = (preset: ServicePreset) => {
    deletePreset.mutate(preset.id, {
      onSuccess: () => toast("Preset deleted", "info"),
      onError: () => toast("Failed to delete preset", "error"),
    });
  };

  return (
    <>
      <SettingCard
        icon={<Wrench size={15} />}
        title="Service Presets"
        action={
          <button
            onClick={() => setShowAddSheet(true)}
            className="flex items-center gap-1 text-xs font-semibold text-[var(--brand)] hover:underline"
          >
            <Plus size={13} />
            Add
          </button>
        }
      >
        {isLoading && <JobCardSkeleton count={1} />}

        {!isLoading && presets.length === 0 && (
          <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-2">
            No presets yet. Add common services to speed up job creation.
          </p>
        )}

        <div className="space-y-0">
          {presets.map((p) => (
            <div key={p.id} className="flex items-center gap-2 py-2.5 border-b border-slate-100 dark:border-slate-700 last:border-b-0">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{p.name}</p>
                {p.description && (
                  <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">{p.description}</p>
                )}
              </div>
              {p.default_labour > 0 && (
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">
                  PKR {p.default_labour.toLocaleString()}
                </span>
              )}
              <button
                onClick={() => handleDelete(p)}
                disabled={deletePreset.isPending}
                aria-label="Delete preset"
                className="shrink-0 text-slate-300 dark:text-slate-600 hover:text-red-500 transition disabled:opacity-50"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </SettingCard>

      <BottomSheet
        open={showAddSheet}
        onClose={() => {
          setShowAddSheet(false);
          resetForm();
        }}
        title="Add Service Preset"
      >
        <form onSubmit={handleAdd} className="space-y-4" noValidate>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
              Preset name
            </label>
            <input
              value={presetName}
              onChange={(e) => { setPresetName(e.target.value); clearPresetError("name"); }}
              placeholder="Oil change"
              className={fieldClass(!!presetErrors.name)}
            />
            {presetErrors.name && (
              <p className="text-xs text-red-500 mt-1">{presetErrors.name}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
              Description (optional)
            </label>
            <input
              value={presetDesc}
              onChange={(e) => setPresetDesc(e.target.value)}
              placeholder="Engine oil + filter replacement"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
              Default labour charge (PKR)
            </label>
            <input
              type="number"
              min="0"
              value={presetLabour}
              onChange={(e) => setPresetLabour(Number(e.target.value))}
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            disabled={createPreset.isPending}
            className="w-full bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white font-semibold rounded-xl py-3 text-sm transition active:scale-95 disabled:opacity-60 shadow-sm"
          >
            {createPreset.isPending ? "Adding…" : "Add Preset"}
          </button>
        </form>
      </BottomSheet>
    </>
  );
}

// ── Parts catalog section (inside SettingsTab) ────────────────────────────────
function PartsCatalogSection() {
  const { data: items = [], isLoading } = usePartCatalog();
  const createItem = useCreatePartCatalogItem();
  const deleteItem = useDeletePartCatalogItem();
  const { toast } = useToast();

  const [showAddSheet, setShowAddSheet] = useState(false);
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemError, setItemError] = useState("");

  const resetForm = () => { setItemName(""); setItemPrice(""); setItemError(""); };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) { setItemError("Part name is required"); return; }
    const price = parseFloat(itemPrice);
    if (!itemPrice || isNaN(price) || price < 0) { setItemError("Enter a valid price"); return; }
    setItemError("");
    try {
      await createItem.mutateAsync({ name: itemName.trim(), default_price: price });
      toast("Part added to catalog", "success");
      setShowAddSheet(false);
      resetForm();
    } catch {
      toast("Failed to add part", "error");
    }
  };

  const handleDelete = (item: PartCatalogItem) => {
    deleteItem.mutate(item.id, {
      onSuccess: () => toast("Part removed from catalog", "info"),
      onError: () => toast("Failed to remove part", "error"),
    });
  };

  return (
    <>
      <SettingCard
        icon={<Package size={15} />}
        title="Parts Catalog"
        action={
          <button
            onClick={() => setShowAddSheet(true)}
            className="flex items-center gap-1 text-xs font-semibold text-[var(--brand)] hover:underline"
          >
            <Plus size={13} />
            Add
          </button>
        }
      >
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">
          Pre-define parts with standard prices. When adding a part to a job, typing the name will suggest from this list.
        </p>

        {isLoading && <JobCardSkeleton count={1} />}

        {!isLoading && items.length === 0 && (
          <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-2">
            No parts yet. Add common parts to speed up job tracking.
          </p>
        )}

        <div className="space-y-0">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-2 py-2.5 border-b border-slate-100 dark:border-slate-700 last:border-b-0">
              <span className="flex-1 text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                {item.name}
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">
                PKR {item.default_price.toLocaleString()}
              </span>
              <button
                onClick={() => handleDelete(item)}
                disabled={deleteItem.isPending}
                aria-label="Remove part"
                className="shrink-0 text-slate-300 dark:text-slate-600 hover:text-red-500 transition disabled:opacity-50"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </SettingCard>

      <BottomSheet
        open={showAddSheet}
        onClose={() => { setShowAddSheet(false); resetForm(); }}
        title="Add to Parts Catalog"
      >
        <form onSubmit={handleAdd} className="space-y-4" noValidate>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
              Part name
            </label>
            <input
              value={itemName}
              onChange={(e) => { setItemName(e.target.value); setItemError(""); }}
              placeholder="Engine Oil 1L"
              className={fieldClass(!!itemError && !itemPrice)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
              Default price (PKR)
            </label>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              value={itemPrice}
              onChange={(e) => { setItemPrice(e.target.value); setItemError(""); }}
              placeholder="1800"
              className={fieldClass(!!itemError && !!itemName)}
            />
          </div>
          {itemError && <p className="text-xs text-red-500 -mt-2">{itemError}</p>}
          <button
            type="submit"
            disabled={createItem.isPending}
            className="w-full bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white font-semibold rounded-xl py-3 text-sm transition active:scale-95 disabled:opacity-60 shadow-sm"
          >
            {createItem.isPending ? "Adding…" : "Add to Catalog"}
          </button>
        </form>
      </BottomSheet>
    </>
  );
}

// ── CSV Export section (inside SettingsTab) ────────────────────────────────────
function ExportSection() {
  const today = todayStr();
  const { toast } = useToast();
  const [exportStart, setExportStart] = useState(() => shiftDate(today, -30));
  const [exportEnd, setExportEnd] = useState(today);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (exportStart > exportEnd) {
      toast("Start date must be before end date", "error");
      return;
    }
    setExporting(true);
    try {
      const response = await api.get("/summary/export", {
        params: { start_date: exportStart, end_date: exportEnd },
        responseType: "blob",
      });
      const url = URL.createObjectURL(response.data as Blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `jobs-${exportStart}-to-${exportEnd}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      toast("Failed to export CSV", "error");
    } finally {
      setExporting(false);
    }
  };

  const dateInput =
    "w-full bg-slate-50 dark:bg-slate-900 dark:[color-scheme:dark] border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent transition";

  return (
    <SettingCard icon={<Download size={15} />} title="Export Data">
      <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">
        Download completed jobs as a CSV file for your accountant.
      </p>
      <div className="flex gap-2 mb-3">
        <div className="flex-1">
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">From</label>
          <input type="date" value={exportStart} max={exportEnd} onChange={(e) => setExportStart(e.target.value)} className={dateInput} />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">To</label>
          <input type="date" value={exportEnd} min={exportStart} max={today} onChange={(e) => setExportEnd(e.target.value)} className={dateInput} />
        </div>
      </div>
      <button
        onClick={handleExport}
        disabled={exporting}
        className="w-full flex items-center justify-center gap-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white font-semibold rounded-xl py-2.5 text-sm transition active:scale-95 disabled:opacity-60 shadow-sm"
      >
        <Download size={15} />
        {exporting ? "Exporting…" : "Download CSV"}
      </button>
    </SettingCard>
  );
}

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
import { useThemeStore } from "../../stores/themeStore";
import PhoneInputField from "../../components/PhoneInputField";
import { api } from "../../api/axios";
import { parseApiError } from "../../utils/parseApiError";
import { isValidPhone } from "../../utils/validation";
import { todayStr, shiftDate } from "../../utils/dates";
import { inputClass, fieldClass } from "./formStyles";
import { useT } from "../../i18n/useT";
import type { TKey } from "../../i18n/translations";

// ── Settings tab ──────────────────────────────────────────────────────────────
const APP_VERSION = import.meta.env.VITE_APP_VERSION ?? "1.0.0";

type SettingsSection = "general" | "automation" | "team" | "catalog" | "data";

const SETTINGS_SECTIONS: {
  id: SettingsSection;
  labelKey: TKey;
  icon: React.ElementType;
}[] = [
  { id: "general", labelKey: "settings.tabGeneral", icon: Building2 },
  { id: "automation", labelKey: "settings.tabAutomation", icon: BellRing },
  { id: "team", labelKey: "settings.tabTeam", icon: Users },
  { id: "catalog", labelKey: "settings.tabCatalog", icon: Package },
  { id: "data", labelKey: "settings.tabData", icon: Download },
];

function SettingsSectionNav({
  active,
  onChange,
}: {
  active: SettingsSection;
  onChange: (section: SettingsSection) => void;
}) {
  const t = useT();

  return (
    <div
      role="tablist"
      aria-label={t("settings.title")}
      className="sticky top-0 z-10 bg-[#F1F5F9] dark:bg-slate-900 flex gap-1.5 mb-4 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none"
    >
      {SETTINGS_SECTIONS.map(({ id, labelKey, icon: Icon }) => {
        const selected = active === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(id)}
            className={`shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl transition active:scale-95 whitespace-nowrap ${
              selected
                ? "bg-[var(--brand)] text-white shadow-sm"
                : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
            }`}
          >
            <Icon size={14} />
            {t(labelKey)}
          </button>
        );
      })}
    </div>
  );
}

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
  compact = false,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  action?: React.ReactNode;
  compact?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
      <div
        className={`flex items-center justify-between border-b border-slate-100 dark:border-slate-700 ${
          compact ? "px-4 py-2.5" : "px-5 py-3.5"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`rounded-lg flex items-center justify-center shrink-0 ${
              compact ? "w-6 h-6" : "w-7 h-7"
            }`}
            style={{ background: "color-mix(in srgb, var(--brand) 12%, transparent)" }}
          >
            <div style={{ color: "var(--brand)" }}>{icon}</div>
          </div>
          <span className={`font-semibold text-slate-900 dark:text-slate-100 ${compact ? "text-xs" : "text-sm"}`}>
            {title}
          </span>
        </div>
        {action}
      </div>
      <div className={compact ? "px-4 py-3" : "p-5"}>{children}</div>
    </div>
  );
}

// ── Upcoming service reminders list ──────────────────────────────────────────
function RemindersList() {
  const t = useT();
  const { data: reminders = [], isLoading } = useReminders();
  const cancelReminder = useCancelReminder();
  const { toast } = useToast();

  if (isLoading || reminders.length === 0) return null;

  return (
    <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-700">
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2.5 uppercase tracking-wide">
        {t("reminders.upcoming")} ({reminders.length})
      </p>
      <div className="space-y-2">
        {reminders.map((r) => (
          <div key={r.id} className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                {r.vehicle_number} · {r.customer_name}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {t("reminders.due")} {r.due_date}
              </p>
            </div>
            <button
              onClick={() =>
                cancelReminder.mutate(r.id, {
                  onSuccess: () => toast(t("reminders.cancelled"), "info"),
                  onError: () => toast(t("reminders.cancelFailed"), "error"),
                })
              }
              aria-label={t("reminders.cancelAria")}
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
  const t = useT();
  const { setWorkshopName } = useAuthStore();
  const { toast } = useToast();
  const [section, setSection] = useState<SettingsSection>("general");
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

  useEffect(() => {
    api
      .get<{ accent_theme?: string }>("/settings")
      .then(({ data }) => {
        const valid = ["blue", "emerald", "purple", "rose", "teal"] as const;
        const saved = data.accent_theme as (typeof valid)[number] | undefined;
        if (saved && valid.includes(saved)) {
          useThemeStore.getState().setTheme(saved);
        }
      })
      .catch(() => {/* non-critical */});
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
      toast(t("settings.saved"), "success");
    } catch {
      toast(t("settings.saveFailed"), "error");
    } finally {
      setSaving(false);
    }
  };

  const testWhatsApp = async () => {
    const phone = form.whatsapp_number.trim();
    if (!phone) { toast(t("settings.enterWhatsappFirst"), "info"); return; }
    setTestingWa(true);
    try {
      await api.post("/settings/test-whatsapp", { phone });
      toast(t("settings.testSent"), "success");
    } catch (err: unknown) {
      const msg =
        err instanceof Object && "response" in err
          ? ((err as { response?: { data?: { detail?: string } } }).response?.data?.detail ??
            t("settings.testFailed"))
          : t("settings.testFailed");
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
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{t("settings.title")}</h2>
        <JobCardSkeleton count={3} />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{t("settings.title")}</h2>
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-2xl p-6 text-center">
          <p className="font-semibold text-sm mb-3">{t("settings.loadFailed")}</p>
          <button onClick={loadSettings} className="text-sm font-semibold underline hover:no-underline">
            {t("settings.tryAgain")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-4">
      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">{t("settings.title")}</h2>

      <div className="mb-3 max-w-2xl">
        <SettingCard compact icon={<Palette size={13} />} title={t("settings.appearance")}>
          <ThemePicker compact />
        </SettingCard>
      </div>

      <SettingsSectionNav active={section} onChange={setSection} />

      <div role="tabpanel" className="space-y-4 max-w-2xl">
      {section === "general" && (
      <SettingCard icon={<Building2 size={15} />} title={t("settings.workshop")}>
        <form onSubmit={save} className="space-y-3.5">
          <div className="grid grid-cols-1 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                {t("settings.workshopName")}
              </label>
              <input
                type="text"
                placeholder={t("settings.workshopNamePlaceholder")}
                value={form.name}
                onChange={setField("name")}
                className={settingInput}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                {t("settings.address")}
              </label>
              <input
                type="text"
                placeholder={t("settings.addressPlaceholder")}
                value={form.address}
                onChange={setField("address")}
                className={settingInput}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                {t("settings.ownerContact")}
              </label>
              <PhoneInputField
                value={form.owner_contact}
                onChange={(val) => setForm((prev) => ({ ...prev, owner_contact: val }))}
              />
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50/80 dark:bg-slate-900/40 p-3.5 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                WhatsApp
              </p>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  {t("settings.whatsappNumber")}
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
                  {testingWa ? t("settings.sending") : t("settings.sendTest")}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                {t("settings.invoiceFooter")}
              </label>
              <textarea
                rows={2}
                placeholder={t("settings.invoiceFooterPlaceholder")}
                value={form.invoice_footer}
                onChange={(e) => setForm((prev) => ({ ...prev, invoice_footer: e.target.value }))}
                className={`${settingInput} resize-none`}
              />
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                {t("settings.invoiceFooterHint")}
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                {t("settings.bankDetails")}
              </label>
              <textarea
                rows={3}
                placeholder={t("settings.bankDetailsPlaceholder")}
                value={form.bank_details}
                onChange={(e) => setForm((prev) => ({ ...prev, bank_details: e.target.value }))}
                className={`${settingInput} resize-none`}
              />
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                {t("settings.bankDetailsHint")}
              </p>
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white font-semibold rounded-xl py-2.5 text-sm transition active:scale-95 disabled:opacity-60 shadow-sm"
          >
            {saving ? t("settings.saving") : t("settings.saveChanges")}
          </button>
        </form>
      </SettingCard>
      )}

      {section === "automation" && (
      <SettingCard icon={<BellRing size={15} />} title={t("settings.automation")}>
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              {t("settings.reminderInterval")}
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
              {t("settings.reminderIntervalHint")}
            </p>
          </div>

          <label className="flex items-center justify-between gap-3 cursor-pointer select-none">
            <span className="text-sm text-slate-700 dark:text-slate-300">
              {t("settings.dailyDigest")}
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
                className={`absolute top-0.5 start-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  form.digest_enabled ? "translate-x-5 rtl:-translate-x-5" : ""
                }`}
              />
            </div>
          </label>
          <p className="text-xs text-slate-400 dark:text-slate-500 -mt-2">
            {t("settings.dailyDigestHint")}
          </p>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white font-semibold rounded-xl py-2.5 text-sm transition active:scale-95 disabled:opacity-60 shadow-sm"
          >
            {saving ? t("settings.saving") : t("settings.saveChanges")}
          </button>
        </form>

        <RemindersList />
      </SettingCard>
      )}

      {section === "team" && <MechanicsSection />}

      {section === "catalog" && (
        <>
      {/* Service Presets */}
      <PresetsSection />

      {/* Parts Catalog */}
      <PartsCatalogSection />
        </>
      )}

      {section === "data" && <ExportSection />}
      </div>

      {/* App footer */}
      <p className="text-center text-xs text-slate-400 dark:text-slate-500 pt-5 pb-1">
        GarageOS v{APP_VERSION}
        <span className="mx-1.5">·</span>
        <a
          href="https://wa.me/923001234567?text=GarageOS%20feedback%3A%20"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-[var(--brand)] hover:underline"
        >
          {t("settings.sendFeedback")}
        </a>
      </p>
    </div>
  );
}

// ── Mechanics management section (inside SettingsTab) ─────────────────────────
function MechanicsSection() {
  const t = useT();
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
    if (!name.trim()) errs.full_name = t("settings.errFullNameRequired");
    if (!mobile.trim()) {
      errs.mobile = t("settings.errMobileRequired");
    } else if (!isValidPhone(mobile)) {
      errs.mobile = t("settings.errMobileInvalid");
    }
    if (!password) {
      errs.password = t("settings.errPasswordRequired");
    } else if (password.length < 8) {
      errs.password = t("settings.errPasswordShort");
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
      toast(t("settings.mechanicAdded"), "success");
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
        toast(serverErrors._form ?? t("settings.mechanicAddFailed"), "error");
      }
    }
  };

  const handleToggle = (m: Mechanic) => {
    toggleMechanic.mutate(
      { id: m.id, is_active: !m.is_active },
      {
        onSuccess: () =>
          toast(m.is_active ? t("settings.mechanicDeactivated") : t("settings.mechanicActivated"), "info"),
        onError: () => toast(t("settings.mechanicUpdateFailed"), "error"),
      }
    );
  };

  return (
    <>
      <SettingCard
        icon={<Users size={15} />}
        title={t("settings.team")}
        action={
          <button
            onClick={() => setShowAddSheet(true)}
            className="flex items-center gap-1 text-xs font-semibold text-[var(--brand)] hover:underline"
          >
            <Plus size={13} />
            {t("common.add")}
          </button>
        }
      >
        {isLoading && <JobCardSkeleton count={1} />}

        {!isLoading && mechanics.length === 0 && (
          <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-2">
            {t("settings.noMechanics")}
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
                  {m.mobile} · {m.is_available ? t("settings.available") : t("settings.busy")}
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
                {m.is_active ? t("settings.active") : t("settings.inactive")}
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
        title={t("settings.addMechanic")}
      >
        <form onSubmit={handleAdd} className="space-y-4" noValidate>
          {mechErrors._form && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm rounded-xl px-4 py-3">
              {mechErrors._form}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
              {t("settings.fullName")}
            </label>
            <input
              value={name}
              onChange={(e) => { setName(e.target.value); clearMechError("full_name"); }}
              placeholder={t("settings.fullNamePlaceholder")}
              className={fieldClass(!!mechErrors.full_name)}
            />
            {mechErrors.full_name && (
              <p className="text-xs text-red-500 mt-1">{mechErrors.full_name}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
              {t("settings.mobile")}
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
              {t("settings.password")}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); clearMechError("password"); }}
              placeholder={t("settings.passwordPlaceholder")}
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
            {addMechanic.isPending ? t("settings.adding") : t("settings.addMechanic")}
          </button>
        </form>
      </BottomSheet>
    </>
  );
}

// ── Service presets section (inside SettingsTab) ───────────────────────────────
function PresetsSection() {
  const t = useT();
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
    if (!presetName.trim()) errs.name = t("settings.errPresetNameRequired");
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
      toast(t("settings.presetAdded"), "success");
      setShowAddSheet(false);
      resetForm();
    } catch {
      toast(t("settings.presetAddFailed"), "error");
    }
  };

  const handleDelete = (preset: ServicePreset) => {
    deletePreset.mutate(preset.id, {
      onSuccess: () => toast(t("settings.presetDeleted"), "info"),
      onError: () => toast(t("settings.presetDeleteFailed"), "error"),
    });
  };

  return (
    <>
      <SettingCard
        icon={<Wrench size={15} />}
        title={t("settings.servicePresets")}
        action={
          <button
            onClick={() => setShowAddSheet(true)}
            className="flex items-center gap-1 text-xs font-semibold text-[var(--brand)] hover:underline"
          >
            <Plus size={13} />
            {t("common.add")}
          </button>
        }
      >
        {isLoading && <JobCardSkeleton count={1} />}

        {!isLoading && presets.length === 0 && (
          <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-2">
            {t("settings.noPresets")}
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
                aria-label={t("settings.deletePreset")}
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
        title={t("settings.addPreset")}
      >
        <form onSubmit={handleAdd} className="space-y-4" noValidate>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
              {t("settings.presetName")}
            </label>
            <input
              value={presetName}
              onChange={(e) => { setPresetName(e.target.value); clearPresetError("name"); }}
              placeholder={t("settings.presetNamePlaceholder")}
              className={fieldClass(!!presetErrors.name)}
            />
            {presetErrors.name && (
              <p className="text-xs text-red-500 mt-1">{presetErrors.name}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
              {t("settings.presetDescription")}
            </label>
            <input
              value={presetDesc}
              onChange={(e) => setPresetDesc(e.target.value)}
              placeholder={t("settings.presetDescriptionPlaceholder")}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
              {t("settings.defaultLabour")}
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
            {createPreset.isPending ? t("settings.adding") : t("settings.addPreset")}
          </button>
        </form>
      </BottomSheet>
    </>
  );
}

// ── Parts catalog section (inside SettingsTab) ────────────────────────────────
function PartsCatalogSection() {
  const t = useT();
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
    if (!itemName.trim()) { setItemError(t("settings.errPartNameRequired")); return; }
    const price = parseFloat(itemPrice);
    if (!itemPrice || isNaN(price) || price < 0) { setItemError(t("settings.errPartPriceInvalid")); return; }
    setItemError("");
    try {
      await createItem.mutateAsync({ name: itemName.trim(), default_price: price });
      toast(t("settings.partAdded"), "success");
      setShowAddSheet(false);
      resetForm();
    } catch {
      toast(t("settings.partAddFailed"), "error");
    }
  };

  const handleDelete = (item: PartCatalogItem) => {
    deleteItem.mutate(item.id, {
      onSuccess: () => toast(t("settings.partRemoved"), "info"),
      onError: () => toast(t("settings.partRemoveFailed"), "error"),
    });
  };

  return (
    <>
      <SettingCard
        icon={<Package size={15} />}
        title={t("settings.partsCatalog")}
        action={
          <button
            onClick={() => setShowAddSheet(true)}
            className="flex items-center gap-1 text-xs font-semibold text-[var(--brand)] hover:underline"
          >
            <Plus size={13} />
            {t("common.add")}
          </button>
        }
      >
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">
          {t("settings.partsCatalogHint")}
        </p>

        {isLoading && <JobCardSkeleton count={1} />}

        {!isLoading && items.length === 0 && (
          <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-2">
            {t("settings.noParts")}
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
                aria-label={t("settings.removePart")}
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
        title={t("settings.addToCatalog")}
      >
        <form onSubmit={handleAdd} className="space-y-4" noValidate>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
              {t("settings.partName")}
            </label>
            <input
              value={itemName}
              onChange={(e) => { setItemName(e.target.value); setItemError(""); }}
              placeholder={t("settings.partNamePlaceholder")}
              className={fieldClass(!!itemError && !itemPrice)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
              {t("settings.defaultPrice")}
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
            {createItem.isPending ? t("settings.adding") : t("settings.addToCatalog")}
          </button>
        </form>
      </BottomSheet>
    </>
  );
}

// ── CSV Export section (inside SettingsTab) ────────────────────────────────────
function ExportSection() {
  const t = useT();
  const today = todayStr();
  const { toast } = useToast();
  const [exportStart, setExportStart] = useState(() => shiftDate(today, -30));
  const [exportEnd, setExportEnd] = useState(today);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (exportStart > exportEnd) {
      toast(t("settings.exportDateError"), "error");
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
      toast(t("settings.exportFailed"), "error");
    } finally {
      setExporting(false);
    }
  };

  const dateInput =
    "w-full bg-slate-50 dark:bg-slate-900 dark:[color-scheme:dark] border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent transition";

  return (
    <SettingCard icon={<Download size={15} />} title={t("settings.exportData")}>
      <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">
        {t("settings.exportHint")}
      </p>
      <div className="flex gap-2 mb-3">
        <div className="flex-1">
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{t("settings.from")}</label>
          <input type="date" value={exportStart} max={exportEnd} onChange={(e) => setExportStart(e.target.value)} className={dateInput} />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{t("settings.to")}</label>
          <input type="date" value={exportEnd} min={exportStart} max={today} onChange={(e) => setExportEnd(e.target.value)} className={dateInput} />
        </div>
      </div>
      <button
        onClick={handleExport}
        disabled={exporting}
        className="w-full flex items-center justify-center gap-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white font-semibold rounded-xl py-2.5 text-sm transition active:scale-95 disabled:opacity-60 shadow-sm"
      >
        <Download size={15} />
        {exporting ? t("settings.exporting") : t("settings.downloadCsv")}
      </button>
    </SettingCard>
  );
}

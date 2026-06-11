import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  BarChart3,
  Building2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  Download,
  LogOut,
  Package,
  Palette,
  Plus,
  SearchX,
  Settings2,
  Trash2,
  Users,
  Wrench,
} from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import {
  useJobCards,
  useCreateJobCard,
  useSummary,
  useRangeSummary,
  useMechanicSummary,
  type JobCard,
  type JobCardCreate,
  type SummaryData,
  type RangeSummaryData,
  type MechanicSummaryItem,
} from "../hooks/useJobCards";
import { useMechanics, useAddMechanic, useToggleMechanic, type Mechanic } from "../hooks/useMechanics";
import {
  useServicePresets,
  useCreatePreset,
  useDeletePreset,
  type ServicePreset,
} from "../hooks/useServicePresets";
import {
  usePartCatalog,
  useCreatePartCatalogItem,
  useDeletePartCatalogItem,
  type PartCatalogItem,
} from "../hooks/usePartCatalog";
import { useVehicleHistory } from "../hooks/useVehicleHistory";
import { useDebounce } from "../hooks/useDebounce";
import { useToast } from "../context/ToastContext";
import JobCardList from "../components/JobCardList";
import Logo from "../components/Logo";
import BottomSheet from "../components/BottomSheet";
import MechanicSelector from "../components/MechanicSelector";
import StatusStrip from "../components/StatusStrip";
import JobCardSkeleton from "../components/JobCardSkeleton";
import EmptyState from "../components/EmptyState";
import VehiclePlate from "../components/VehiclePlate";
import ThemePicker from "../components/ThemePicker";
import { api } from "../api/axios";
import { parseApiError } from "../utils/parseApiError";
import { isValidPhone } from "../utils/validation";
import PhoneInputField from "../components/PhoneInputField";

type Tab = "jobs" | "history" | "summary" | "settings";

interface NavItem {
  tab: Tab;
  label: string;
  Icon: React.ElementType;
  ownerOnly: boolean;
}

const NAV: NavItem[] = [
  { tab: "jobs",     label: "Jobs",     Icon: Wrench,    ownerOnly: false },
  { tab: "history",  label: "History",  Icon: Clock,     ownerOnly: false },
  { tab: "summary",  label: "Summary",  Icon: BarChart3, ownerOnly: true  },
  { tab: "settings", label: "Settings", Icon: Settings2, ownerOnly: true  },
];

/** YYYY-MM-DD for today in local time */
function todayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Shift a YYYY-MM-DD string by delta days using local time (no UTC conversion). */
function shiftDate(dateStr: string, delta: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d + delta);
  return [
    dt.getFullYear(),
    String(dt.getMonth() + 1).padStart(2, "0"),
    String(dt.getDate()).padStart(2, "0"),
  ].join("-");
}

function fmtDate(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

/** ISO week range (Mon-Sun) for the week `offset` steps from current. */
function weekRange(offset: number): [string, string] {
  const now = new Date();
  const dow = now.getDay(); // 0=Sun
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((dow + 6) % 7) + offset * 7);
  const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
  return [fmtDate(monday), fmtDate(sunday)];
}

/** Month range (1st to last day) for `offset` months from current. */
function monthRange(offset: number): [string, string] {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const last = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0);
  return [fmtDate(first), fmtDate(last)];
}

const VALID_TABS: Tab[] = ["jobs", "history", "summary", "settings"];

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { role, workshopName, setWorkshopName, logout } = useAuthStore();
  const [showForm, setShowForm] = useState(false);

  // Derive active tab from URL path — defaults to "jobs" for unknown paths
  const pathSegment = location.pathname.replace(/^\//, "") as Tab;
  const tab: Tab = VALID_TABS.includes(pathSegment) ? pathSegment : "jobs";

  // Fetch workshop name once on mount
  useEffect(() => {
    if (!workshopName) {
      api
        .get<{ name: string }>("/settings")
        .then((r) => setWorkshopName(r.data.name))
        .catch(() => {/* non-critical */});
    }
  }, [workshopName, setWorkshopName]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const visibleTabs = NAV.filter((n) => !n.ownerOnly || role === "owner");

  return (
    <div className="min-h-screen bg-[#F1F5F9] dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700 sticky top-0 z-20 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo variant="icon" size="sm" to="/jobs" />
            <div className="flex flex-col leading-none">
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate max-w-[180px]">
                {workshopName ?? "GarageOS"}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                {role ?? ""}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            aria-label="Sign out"
            className="text-slate-400 hover:text-slate-700 transition p-1.5 rounded-xl hover:bg-slate-100 active:scale-95"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Tab content */}
      <main className="max-w-2xl mx-auto px-4 py-4 pb-24">
        {tab === "jobs"     && <JobsTab role={role} onNewJob={() => setShowForm(true)} />}
        {tab === "history"  && <HistoryTab />}
        {tab === "summary"  && role === "owner" && <SummaryTab />}
        {tab === "settings" && role === "owner" && <SettingsTab />}
      </main>

      {/* New job bottom sheet */}
      <BottomSheet
        open={showForm}
        onClose={() => setShowForm(false)}
        title="New Job Card"
      >
        <CreateJobForm onSuccess={() => setShowForm(false)} />
      </BottomSheet>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] pb-safe">
        <div className="max-w-2xl mx-auto flex h-16">
          {visibleTabs.map(({ tab: t, label, Icon }) => {
            const active = tab === t;
            return (
              <button
                key={t}
                onClick={() => { setShowForm(false); navigate(`/${t}`); }}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 relative transition active:scale-95 ${
                  active ? "text-[var(--brand)]" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[var(--brand)] rounded-full" />
                )}
                <Icon size={22} />
                <span className={`text-[10px] font-semibold ${active ? "font-bold" : ""}`}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* FAB — only on Jobs tab */}
      {tab === "jobs" && (
        <button
          onClick={() => setShowForm(true)}
          aria-label="New job card"
          className="fixed bottom-20 right-4 z-30 w-14 h-14 rounded-full bg-[var(--brand)] hover:bg-[var(--brand-hover)] active:bg-[var(--brand-panel)] text-white flex items-center justify-center shadow-lg shadow-blue-500/30 transition active:scale-95"
        >
          <Plus size={26} />
        </button>
      )}
    </div>
  );
}

// ── Create Job Form (used inside BottomSheet) ─────────────────────────────────
const inputClass =
  "w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent transition";

/** Returns the appropriate input class with red styling when there is an error. */
function fieldClass(hasError: boolean) {
  return hasError
    ? "w-full bg-slate-50 dark:bg-slate-900 border border-red-400 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition"
    : inputClass;
}

function CreateJobForm({ onSuccess }: { onSuccess: () => void }) {
  const createCard = useCreateJobCard();
  const { data: mechanics = [] } = useMechanics();
  const { data: presets = [] } = useServicePresets();
  const { toast } = useToast();

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
          Vehicle number
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
          Vehicle make
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
          Customer name
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
          Customer phone
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
          Description
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
          Labour charge (PKR)
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
          Notes (internal)
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
          Send check-in WhatsApp to customer
        </span>
      </label>

      <button
        type="submit"
        disabled={createCard.isPending}
        className="w-full bg-[var(--brand)] hover:bg-[var(--brand-hover)] active:bg-[var(--brand-panel)] text-white font-semibold rounded-xl py-3 text-sm transition active:scale-95 shadow-sm disabled:opacity-60"
      >
        {createCard.isPending ? "Creating…" : "Create Job Card"}
      </button>
    </form>
  );
}

// ── Jobs tab ──────────────────────────────────────────────────────────────────
type StatusFilter = "all" | "pending" | "in_progress" | "completed";

const STATUS_FILTER_LABELS: Record<StatusFilter, string> = {
  all: "All",
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
};

function JobsTab({ role, onNewJob }: { role: string | null; onNewJob: () => void }) {
  const [page, setPage] = useState(1);
  const [allItems, setAllItems] = useState<JobCard[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const { data, isLoading, isError, isFetching } = useJobCards(page);

  // When page 1 data refreshes (after a mutation), reset the accumulated list.
  // For page > 1, append deduplicated new items.
  const prevP1Ts = useRef(0);
  const { dataUpdatedAt: p1UpdatedAt, data: p1Data } = useJobCards(1);

  useEffect(() => {
    if (!p1UpdatedAt || p1UpdatedAt === prevP1Ts.current) return;
    prevP1Ts.current = p1UpdatedAt;
    // Page 1 data refreshed: if we were on a later page, reset to 1
    if (page !== 1) setPage(1);
    setAllItems(p1Data?.items ?? []);
  }, [p1UpdatedAt, p1Data, page]);

  useEffect(() => {
    if (!data || page === 1) return;
    // Append page 2+ items, deduplicating by id
    setAllItems((prev) => {
      const ids = new Set(prev.map((c) => c.id));
      return [...prev, ...data.items.filter((c) => !ids.has(c.id))];
    });
  }, [data, page]);

  const displayItems = page === 1 ? (data?.items ?? allItems) : allItems;
  const hasMore = data ? displayItems.length < data.total : false;

  const filteredItems =
    statusFilter === "all"
      ? displayItems
      : displayItems.filter((c) => c.status === statusFilter);

  return (
    <div>
      {displayItems.length > 0 && <StatusStrip jobs={displayItems} />}

      {/* Status filter pills */}
      {displayItems.length > 0 && (
        <div className="relative mb-3">
          <div className="flex gap-2 overflow-x-auto pb-0.5 no-scrollbar">
            {(Object.keys(STATUS_FILTER_LABELS) as StatusFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full transition active:scale-95 ${
                  statusFilter === f
                    ? "bg-[var(--brand)] text-white shadow-sm"
                    : "bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600"
                }`}
              >
                {STATUS_FILTER_LABELS[f]}
              </button>
            ))}
          </div>
          {/* Right fade hint — shows when pills overflow */}
          <div className="absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-[#F1F5F9] to-transparent pointer-events-none" />
        </div>
      )}

      {isLoading && page === 1 && <JobCardSkeleton count={3} />}

      {isError && (
        <EmptyState
          icon={<ClipboardList size={48} />}
          title="Couldn't load job cards"
          description="Check your connection and try again"
        />
      )}

      {!isLoading && !isError && displayItems.length === 0 && (
        <EmptyState
          icon={<ClipboardList size={48} />}
          title="No job cards yet"
          description="Tap the + button to create your first job"
          action={{ label: "New Job Card", onClick: onNewJob }}
        />
      )}

      {!isLoading && !isError && displayItems.length > 0 && filteredItems.length === 0 && (
        <EmptyState
          icon={<ClipboardList size={48} />}
          title={`No ${STATUS_FILTER_LABELS[statusFilter].toLowerCase()} jobs`}
          description="Switch to a different filter or create a new job"
        />
      )}

      {filteredItems.length > 0 && (
        <JobCardList cards={filteredItems} isOwner={role === "owner"} />
      )}

      {hasMore && (
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={isFetching}
          className="w-full mt-4 py-3 text-sm font-semibold text-[var(--brand)] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 transition disabled:opacity-50 shadow-sm"
        >
          {isFetching ? "Loading…" : `Load more (${data!.total - displayItems.length} remaining)`}
        </button>
      )}
    </div>
  );
}

// ── History tab ───────────────────────────────────────────────────────────────
interface HistoryJob {
  id: string;
  vehicle_number: string;
  status: string;
  total_amount: number;
  created_at: string;
  invoice_url?: string;
}

interface HistoryResult {
  customer_name: string;
  total_jobs: number;
  jobs: HistoryJob[];
}

type HistoryStatusFilter = "all" | "completed" | "in_progress" | "pending" | "cancelled";

const HISTORY_STATUS_LABELS: Record<HistoryStatusFilter, string> = {
  all: "All",
  completed: "Completed",
  in_progress: "In Progress",
  pending: "Pending",
  cancelled: "Cancelled",
};

function HistoryTab() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<"vehicle" | "phone">("vehicle");
  const [result, setResult] = useState<HistoryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<HistoryStatusFilter>("all");

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSearched(true);
    setResult(null);
    setSearchError(false);
    setHistoryFilter("all");
    try {
      const param =
        type === "vehicle"
          ? `vehicle_number=${encodeURIComponent(query)}`
          : `phone=${encodeURIComponent(query)}`;
      const { data } = await api.get<HistoryResult>(`/customers/history?${param}`);
      setResult(data);
    } catch {
      setResult(null);
      setSearchError(true);
    } finally {
      setLoading(false);
    }
  };

  const toggle = (active: boolean) =>
    `flex-1 text-sm rounded-xl py-2.5 font-semibold transition active:scale-95 ${
      active
        ? "bg-[var(--brand)] text-white shadow-sm"
        : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
    }`;

  return (
    <div>
      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">Customer History</h2>

      <form
        onSubmit={search}
        className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm mb-4 space-y-3 border border-slate-100 dark:border-slate-700"
      >
        <div className="flex gap-2">
          <button type="button" onClick={() => setType("vehicle")} className={toggle(type === "vehicle")}>
            Vehicle No.
          </button>
          <button type="button" onClick={() => setType("phone")} className={toggle(type === "phone")}>
            Phone
          </button>
        </div>
        <input
          type="text"
          required
          placeholder={type === "vehicle" ? "e.g. ABC-123" : "e.g. 03xx xxx xxxx"}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent transition"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white text-sm font-semibold rounded-xl py-3 transition active:scale-95 disabled:opacity-60"
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </form>

      {loading && <JobCardSkeleton count={1} />}

      {!loading && searched && searchError && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm rounded-xl px-4 py-3 mt-2">
          Search failed. Check your connection and try again.
        </div>
      )}

      {!loading && searched && !result && !searchError && (
        <EmptyState
          icon={<SearchX size={48} />}
          title="No records found"
          description="Try searching by a different vehicle number or phone"
        />
      )}

      {result && (() => {
        const filteredJobs =
          historyFilter === "all"
            ? result.jobs
            : result.jobs.filter((j) => j.status === historyFilter);

        // Only show filter pills when there are multiple statuses present
        const statuses = Array.from(new Set(result.jobs.map((j) => j.status)));
        const showFilter = statuses.length > 1;

        return (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              {result.customer_name}
              <span className="font-normal text-slate-400"> · {result.total_jobs} job(s)</span>
            </p>

            {/* Status filter pills */}
            {showFilter && (
              <div className="flex gap-2 flex-wrap mb-3">
                {(["all", ...statuses] as HistoryStatusFilter[])
                  .filter((f, i, arr) => arr.indexOf(f) === i)
                  .map((f) => (
                    <button
                      key={f}
                      onClick={() => setHistoryFilter(f)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full transition active:scale-95 ${
                        historyFilter === f
                          ? "bg-[var(--brand)] text-white shadow-sm"
                          : "bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600"
                      }`}
                    >
                      {HISTORY_STATUS_LABELS[f] ?? f}
                    </button>
                  ))}
              </div>
            )}

            {filteredJobs.length === 0 ? (
              <EmptyState
                icon={<SearchX size={40} />}
                title={`No ${HISTORY_STATUS_LABELS[historyFilter].toLowerCase()} jobs`}
                description="Try a different filter"
              />
            ) : (
              filteredJobs.map((j) => (
                <div
                  key={j.id}
                  className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700"
                >
                  <div className="flex items-center justify-between">
                    <VehiclePlate number={j.vehicle_number} size="sm" />
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {new Date(j.created_at).toLocaleDateString("en-PK", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between mt-2 text-sm">
                    <span className="text-slate-500 dark:text-slate-400 capitalize">{j.status.replace("_", " ")}</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      PKR {j.total_amount.toLocaleString()}
                    </span>
                  </div>
                  {j.invoice_url && (
                    <a
                      href={j.invoice_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-[var(--brand)] font-medium hover:underline mt-2"
                    >
                      View Invoice →
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        );
      })()}
    </div>
  );
}

// ── Summary tab ───────────────────────────────────────────────────────────────
type SummaryPeriod = "day" | "week" | "month";

function SummaryTab() {
  const today = todayStr();
  const [period, setPeriod] = useState<SummaryPeriod>("day");
  const [dayStr, setDayStr] = useState<string>(today);
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);

  // Compute the active date range based on period
  const [startDate, endDate] = (() => {
    if (period === "day") return [dayStr, dayStr];
    if (period === "week") return weekRange(weekOffset);
    return monthRange(monthOffset);
  })();

  const isToday = period === "day" && dayStr === today;
  const isCurrentWeek = period === "week" && weekOffset === 0;
  const isCurrentMonth = period === "month" && monthOffset === 0;
  const disableNext = isToday || isCurrentWeek || isCurrentMonth;

  const handlePrev = () => {
    if (period === "day") setDayStr((s) => shiftDate(s, -1));
    else if (period === "week") setWeekOffset((o) => o - 1);
    else setMonthOffset((o) => o - 1);
  };
  const handleNext = () => {
    if (disableNext) return;
    if (period === "day") setDayStr((s) => shiftDate(s, 1));
    else if (period === "week") setWeekOffset((o) => o + 1);
    else setMonthOffset((o) => o + 1);
  };

  // Human-readable period label
  const periodLabel = (() => {
    if (period === "day") {
      if (isToday) return "Today";
      const [sy, sm, sd] = dayStr.split("-").map(Number);
      return new Date(sy, sm - 1, sd).toLocaleDateString("en-PK", {
        weekday: "short", day: "numeric", month: "short",
      });
    }
    if (period === "week") {
      const [s, e] = weekRange(weekOffset);
      const [sy, sm, sd] = s.split("-").map(Number);
      const [ey, em, ed] = e.split("-").map(Number);
      const start = new Date(sy, sm - 1, sd);
      const end = new Date(ey, em - 1, ed);
      const fmt = (dt: Date) =>
        dt.toLocaleDateString("en-PK", { day: "numeric", month: "short" });
      return isCurrentWeek
        ? `This week (${fmt(start)} - ${fmt(end)})`
        : `${fmt(start)} - ${fmt(end)}`;
    }
    // month
    const [s] = monthRange(monthOffset);
    const [my, mm] = s.split("-").map(Number);
    return new Date(my, mm - 1, 1).toLocaleDateString("en-PK", {
      month: "long", year: "numeric",
    });
  })();

  // Fetch the right summary
  const dailyQ = useSummary(period === "day" ? dayStr : undefined);
  const rangeQ = useRangeSummary(startDate, endDate);
  const mechQ = useMechanicSummary(startDate, endDate);

  const isLoading = period === "day" ? dailyQ.isLoading : rangeQ.isLoading;

  // Normalise to a common shape for rendering
  const d: { total_jobs: number; completed_jobs: number; in_progress_jobs: number; pending_jobs: number; total_revenue: number; total_collected: number } | undefined = (() => {
    if (period === "day") return dailyQ.data as SummaryData | undefined;
    return rangeQ.data as RangeSummaryData | undefined;
  })();

  const stats: { label: string; value: number; accent: boolean; bg: string; textColor: string }[] = [
    { label: "Total Jobs",  value: d?.total_jobs ?? 0,       accent: false, bg: "bg-white dark:bg-slate-800",          textColor: "text-slate-800 dark:text-slate-100" },
    { label: "Completed",   value: d?.completed_jobs ?? 0,   accent: true,  bg: "bg-emerald-50 dark:bg-emerald-900/30", textColor: "text-emerald-700 dark:text-emerald-300" },
    { label: "In Progress", value: d?.in_progress_jobs ?? 0, accent: false, bg: "bg-blue-50 dark:bg-blue-900/30",       textColor: "text-blue-700 dark:text-blue-300" },
    { label: "Pending",     value: d?.pending_jobs ?? 0,     accent: false, bg: "bg-amber-50 dark:bg-amber-900/30",     textColor: "text-amber-700 dark:text-amber-300" },
  ];

  return (
    <div>
      {/* Period switcher */}
      <div className="flex gap-2 mb-4">
        {(["day", "week", "month"] as SummaryPeriod[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 text-xs font-semibold py-2 rounded-xl transition active:scale-95 capitalize ${
              period === p
                ? "bg-[var(--brand)] text-white shadow-sm"
                : "bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Date navigator */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrev}
          aria-label="Previous period"
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 transition shadow-sm"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-bold text-slate-900 dark:text-slate-100 text-center px-2">{periodLabel}</span>
        <button
          onClick={handleNext}
          disabled={disableNext}
          aria-label="Next period"
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 transition shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {isLoading ? (
        <JobCardSkeleton count={2} />
      ) : (
        <>
          {/* Revenue hero */}
          <div className="bg-gradient-to-r from-[var(--brand)] to-[var(--brand-hover)] rounded-2xl p-5 text-white mb-3 shadow-md">
            <p className="text-xs font-semibold uppercase tracking-widest opacity-70">
              Revenue
            </p>
            <p className="text-3xl font-extrabold mt-1">
              PKR {(d?.total_revenue ?? 0).toLocaleString()}
            </p>
            <p className="text-xs opacity-60 mt-0.5">
              via {d?.completed_jobs ?? 0} completed job(s)
            </p>
            <div className="flex gap-4 mt-3 pt-3 border-t border-white/20">
              <div>
                <p className="text-[10px] uppercase tracking-widest opacity-60 font-semibold">
                  Collected
                </p>
                <p className="text-base font-bold mt-0.5">
                  PKR {(d?.total_collected ?? 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest opacity-60 font-semibold">
                  Outstanding
                </p>
                <p className="text-base font-bold mt-0.5">
                  PKR {((d?.total_revenue ?? 0) - (d?.total_collected ?? 0)).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Stat grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {stats.map((s) => (
              <div
                key={s.label}
                className={`${s.bg} rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 text-center`}
              >
                <p className={`text-2xl font-bold ${s.textColor}`}>
                  {s.value}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Mechanic breakdown */}
          <MechanicBreakdown items={mechQ.data ?? []} isLoading={mechQ.isLoading} />
        </>
      )}
    </div>
  );
}

function MechanicBreakdown({
  items,
  isLoading,
}: {
  items: MechanicSummaryItem[];
  isLoading: boolean;
}) {
  if (isLoading) return <JobCardSkeleton count={2} />;
  if (items.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700">
      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3">Team Performance</h3>
      <div className="space-y-3">
        {items.map((m) => (
          <div key={m.mechanic_id} className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{m.full_name}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                {m.completed_jobs} job{m.completed_jobs !== 1 ? "s" : ""}
                {" · "}
                Labour PKR {m.total_labour.toLocaleString()}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                PKR {m.total_revenue.toLocaleString()}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">revenue</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Settings tab ──────────────────────────────────────────────────────────────
interface SettingsForm {
  name: string;
  address: string;
  owner_contact: string;
  whatsapp_number: string;
  invoice_footer: string;
  bank_details: string;
}

const EMPTY_SETTINGS: SettingsForm = {
  name: "",
  address: "",
  owner_contact: "",
  whatsapp_number: "",
  invoice_footer: "",
  bank_details: "",
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

function SettingsTab() {
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

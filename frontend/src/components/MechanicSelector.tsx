import type { Mechanic } from "../hooks/useMechanics";
import { useT } from "../i18n/useT";

interface Props {
  mechanics: Mechanic[];
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}

export default function MechanicSelector({
  mechanics,
  value,
  onChange,
  disabled = false,
}: Props) {
  const t = useT();

  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
        {t("job.assignMechanic")}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--brand)] disabled:opacity-60"
      >
        <option value="">{t("job.noMechanicPending")}</option>
        {mechanics.filter((m) => m.is_active).map((m) => (
          <option key={m.id} value={m.id}>
            {m.full_name}
            {m.is_available ? ` (${t("settings.available")})` : ` (${t("settings.busy")})`}
          </option>
        ))}
      </select>
    </div>
  );
}

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
      <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1.5">
        {t("job.assignMechanic")}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full bg-[var(--surface)] ring-1 ring-[var(--border)] rounded-[var(--r-control)] px-3 py-2.5 text-sm text-[var(--text-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)] disabled:opacity-60"
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

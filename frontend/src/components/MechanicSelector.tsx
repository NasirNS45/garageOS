import type { Mechanic } from "../hooks/useMechanics";

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
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
        Assign Mechanic
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--brand)] disabled:opacity-60"
      >
        <option value="">No mechanic (pending)</option>
        {mechanics.filter((m) => m.is_active).map((m) => (
          <option key={m.id} value={m.id}>
            {m.full_name}
            {m.is_available ? " (available)" : " (busy)"}
          </option>
        ))}
      </select>
    </div>
  );
}

import { Check, Moon, Sun } from "lucide-react";
import { useThemeStore, THEMES, type ThemeName } from "../stores/themeStore";

export default function ThemePicker() {
  const { theme, setTheme, mode, toggleMode } = useThemeStore();

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 mt-4">
      {/* Header row: title + light/dark toggle */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Appearance</h3>
        <button
          onClick={toggleMode}
          aria-label={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition active:scale-95 ${
            mode === "dark"
              ? "bg-slate-700 text-amber-300 hover:bg-slate-600"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          {mode === "dark" ? (
            <>
              <Sun size={13} />
              Light
            </>
          ) : (
            <>
              <Moon size={13} />
              Dark
            </>
          )}
        </button>
      </div>

      {/* Accent color dots */}
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-3">Accent color</p>
      <div className="flex items-center gap-3 flex-wrap">
        {THEMES.map((t) => (
          <ThemeDot
            key={t.name}
            option={t}
            active={theme === t.name}
            onSelect={setTheme}
          />
        ))}
      </div>
    </div>
  );
}

function ThemeDot({
  option,
  active,
  onSelect,
}: {
  option: { name: ThemeName; label: string; color: string };
  active: boolean;
  onSelect: (name: ThemeName) => void;
}) {
  return (
    <button
      onClick={() => onSelect(option.name)}
      aria-label={`${option.label} theme${active ? " (active)" : ""}`}
      aria-pressed={active}
      className="flex flex-col items-center gap-1.5 group"
    >
      <span
        className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90"
        style={{
          backgroundColor: option.color,
          boxShadow: active
            ? `0 0 0 2px ${document.documentElement.classList.contains("dark") ? "#1e293b" : "#fff"}, 0 0 0 4px ${option.color}`
            : undefined,
        }}
      >
        {active && <Check size={16} strokeWidth={3} className="text-white" />}
      </span>
      <span
        className={`text-[10px] font-semibold tracking-wide transition-colors ${
          active
            ? "text-slate-700 dark:text-slate-200"
            : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300"
        }`}
      >
        {option.label}
      </span>
    </button>
  );
}

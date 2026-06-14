import { Check, Moon, Sun } from "lucide-react";
import { useThemeStore, THEMES, type ThemeName } from "../stores/themeStore";
import { useT } from "../i18n/useT";
import type { TKey } from "../i18n/translations";

export default function ThemePicker() {
  const { theme, setTheme, mode, toggleMode } = useThemeStore();
  const t = useT();

  return (
    <div>
      {/* Light/dark toggle */}
      <div className="flex justify-end mb-4">
        <button
          onClick={toggleMode}
          aria-label={mode === "dark" ? t("theme.light") : t("theme.dark")}
          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition active:scale-95 ${
            mode === "dark"
              ? "bg-slate-700 text-amber-300 hover:bg-slate-600"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          {mode === "dark" ? (
            <>
              <Sun size={13} />
              {t("theme.light")}
            </>
          ) : (
            <>
              <Moon size={13} />
              {t("theme.dark")}
            </>
          )}
        </button>
      </div>

      {/* Accent color dots */}
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-3">{t("theme.accentColor")}</p>
      <div className="flex items-center gap-3 flex-wrap">
        {THEMES.map((opt) => (
          <ThemeDot
            key={opt.name}
            option={opt}
            label={t(`theme.${opt.name}` as TKey)}
            active={theme === opt.name}
            onSelect={setTheme}
          />
        ))}
      </div>
    </div>
  );
}

function ThemeDot({
  option,
  label,
  active,
  onSelect,
}: {
  option: { name: ThemeName; label: string; color: string };
  label: string;
  active: boolean;
  onSelect: (name: ThemeName) => void;
}) {
  return (
    <button
      onClick={() => onSelect(option.name)}
      aria-label={label}
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
        {label}
      </span>
    </button>
  );
}

import { Check, Moon, Sun } from "lucide-react";
import { useThemeStore, THEMES, type ThemeName } from "../stores/themeStore";
import { useT } from "../i18n/useT";
import type { TKey } from "../i18n/translations";
import { api } from "../api/axios";
import { useAuthStore } from "../stores/authStore";

function syncAccentTheme(theme: ThemeName) {
  if (!useAuthStore.getState().accessToken) return;
  api.put("/settings", { accent_theme: theme }).catch(() => {
    /* non-critical */
  });
}

function ModeToggle({ compact = false }: { compact?: boolean }) {
  const { mode, toggleMode } = useThemeStore();
  const t = useT();

  return (
    <button
      onClick={toggleMode}
      aria-label={mode === "dark" ? t("theme.light") : t("theme.dark")}
      className={`flex items-center gap-1 text-xs font-semibold rounded-full transition active:scale-95 shrink-0 ${
        compact ? "px-2.5 py-1" : "gap-1.5 px-3 py-1.5"
      } ${
        mode === "dark"
          ? "bg-slate-700 text-amber-300 hover:bg-slate-600"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
      }`}
    >
      {mode === "dark" ? (
        <>
          <Sun size={compact ? 12 : 13} />
          {!compact && t("theme.light")}
        </>
      ) : (
        <>
          <Moon size={compact ? 12 : 13} />
          {!compact && t("theme.dark")}
        </>
      )}
    </button>
  );
}

export default function ThemePicker({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useThemeStore();
  const t = useT();

  const handleSelect = (name: ThemeName) => {
    setTheme(name);
    syncAccentTheme(name);
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {THEMES.map((opt) => (
            <ThemeDot
              key={opt.name}
              option={opt}
              label={t(`theme.${opt.name}` as TKey)}
              active={theme === opt.name}
              onSelect={handleSelect}
              compact
            />
          ))}
        </div>
        <ModeToggle compact />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <ModeToggle />
      </div>

      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-3">{t("theme.accentColor")}</p>
      <div className="flex items-center gap-3 flex-wrap">
        {THEMES.map((opt) => (
          <ThemeDot
            key={opt.name}
            option={opt}
            label={t(`theme.${opt.name}` as TKey)}
            active={theme === opt.name}
            onSelect={handleSelect}
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
  compact = false,
}: {
  option: { name: ThemeName; label: string; color: string };
  label: string;
  active: boolean;
  onSelect: (name: ThemeName) => void;
  compact?: boolean;
}) {
  const size = compact ? "w-7 h-7" : "w-9 h-9";
  const checkSize = compact ? 12 : 16;

  return (
    <button
      onClick={() => onSelect(option.name)}
      aria-label={label}
      aria-pressed={active}
      title={compact ? label : undefined}
      className={compact ? "shrink-0" : "flex flex-col items-center gap-1.5 group"}
    >
      <span
        className={`${size} rounded-full flex items-center justify-center transition-all active:scale-90`}
        style={{
          backgroundColor: option.color,
          boxShadow: active
            ? `0 0 0 2px ${document.documentElement.classList.contains("dark") ? "#1e293b" : "#fff"}, 0 0 0 ${compact ? 3 : 4}px ${option.color}`
            : undefined,
        }}
      >
        {active && <Check size={checkSize} strokeWidth={3} className="text-white" />}
      </span>
      {!compact && (
        <span
          className={`text-[11px] font-semibold tracking-wide transition-colors ${
            active
              ? "text-slate-700 dark:text-slate-200"
              : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300"
          }`}
        >
          {label}
        </span>
      )}
    </button>
  );
}

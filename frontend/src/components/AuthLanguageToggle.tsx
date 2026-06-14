import { useLanguageStore } from "../stores/languageStore";
import { useT } from "../i18n/useT";

interface Props {
  variant?: "hero" | "form";
}

/** EN / Urdu toggle for pre-auth pages. */
export default function AuthLanguageToggle({ variant = "form" }: Props) {
  const { language, toggleLanguage } = useLanguageStore();
  const t = useT();

  const className =
    variant === "hero"
      ? "text-xs font-semibold text-blue-200/90 hover:text-white border border-white/20 rounded-lg px-2.5 py-1 transition shrink-0"
      : "text-xs font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-lg px-2.5 py-1 transition hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0";

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className={className}
      aria-label={t("auth.langToggle")}
    >
      {language === "ur" ? "English" : "اردو"}
    </button>
  );
}

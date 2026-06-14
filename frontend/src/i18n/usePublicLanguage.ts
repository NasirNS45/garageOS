import { useEffect } from "react";
import { applyLanguage } from "../stores/languageStore";
import { useLanguageStore } from "../stores/languageStore";

/** Apply saved language on public pages (supports Urdu RTL). */
export function usePublicLanguage() {
  const { language } = useLanguageStore();

  useEffect(() => {
    applyLanguage(language);
  }, [language]);
}

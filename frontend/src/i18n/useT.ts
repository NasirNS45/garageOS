import { useCallback } from "react";
import { useLanguageStore } from "../stores/languageStore";
import { DICTIONARIES, type TKey } from "./translations";

/** Returns a translate function bound to the active language. */
export function useT(): (key: TKey) => string {
  const language = useLanguageStore((s) => s.language);
  return useCallback((key: TKey) => DICTIONARIES[language][key], [language]);
}

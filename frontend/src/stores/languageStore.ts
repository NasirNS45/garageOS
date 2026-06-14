import { create } from "zustand";
import type { Language } from "../i18n/translations";

const LANG_KEY = "garageos_lang";

/** Apply a language's lang/dir to <html>. */
export function applyLanguage(lang: Language): void {
  const root = document.documentElement;
  root.lang = lang;
  root.dir = lang === "ur" ? "rtl" : "ltr";
}

function loadSavedLanguage(): Language {
  return localStorage.getItem(LANG_KEY) === "ur" ? "ur" : "en";
}

interface LanguageStore {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
}

export const useLanguageStore = create<LanguageStore>((set, get) => {
  const initial = loadSavedLanguage();
  applyLanguage(initial);

  return {
    language: initial,

    setLanguage: (lang) => {
      localStorage.setItem(LANG_KEY, lang);
      applyLanguage(lang);
      set({ language: lang });
    },

    toggleLanguage: () => {
      const next: Language = get().language === "ur" ? "en" : "ur";
      get().setLanguage(next);
    },
  };
});

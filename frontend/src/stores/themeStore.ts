import { create } from "zustand";

export type ThemeName = "blue" | "emerald" | "purple" | "rose" | "teal";
export type ColorMode = "light" | "dark";

export interface ThemeOption {
  name: ThemeName;
  label: string;
  color: string;
}

export const THEMES: ThemeOption[] = [
  { name: "blue",    label: "Blue",    color: "#1D4ED8" },
  { name: "emerald", label: "Emerald", color: "#059669" },
  { name: "purple",  label: "Purple",  color: "#7C3AED" },
  { name: "rose",    label: "Rose",    color: "#E11D48" },
  { name: "teal",    label: "Teal",    color: "#0D9488" },
];

const THEME_KEY = "garageos_theme";
const MODE_KEY  = "garageos_mode";

function applyTheme(theme: ThemeName): void {
  const root = document.documentElement;
  if (theme === "blue") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", theme);
  }
}

function applyMode(mode: ColorMode): void {
  if (mode === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

function loadSavedTheme(): ThemeName {
  const saved = localStorage.getItem(THEME_KEY) as ThemeName | null;
  const valid: ThemeName[] = ["blue", "emerald", "purple", "rose", "teal"];
  return saved && valid.includes(saved) ? saved : "blue";
}

function loadSavedMode(): ColorMode {
  return localStorage.getItem(MODE_KEY) === "dark" ? "dark" : "light";
}

interface ThemeStore {
  theme: ThemeName;
  mode: ColorMode;
  setTheme: (theme: ThemeName) => void;
  setMode: (mode: ColorMode) => void;
  toggleMode: () => void;
}

export const useThemeStore = create<ThemeStore>((set, get) => {
  const initialTheme = loadSavedTheme();
  const initialMode  = loadSavedMode();
  applyTheme(initialTheme);
  applyMode(initialMode);

  return {
    theme: initialTheme,
    mode:  initialMode,

    setTheme: (theme) => {
      localStorage.setItem(THEME_KEY, theme);
      applyTheme(theme);
      set({ theme });
    },

    setMode: (mode) => {
      localStorage.setItem(MODE_KEY, mode);
      applyMode(mode);
      set({ mode });
    },

    toggleMode: () => {
      const next: ColorMode = get().mode === "dark" ? "light" : "dark";
      localStorage.setItem(MODE_KEY, next);
      applyMode(next);
      set({ mode: next });
    },
  };
});

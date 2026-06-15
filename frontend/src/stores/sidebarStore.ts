import { create } from "zustand";

const STORAGE_KEY = "garageos_sidebar_collapsed";

const EXPANDED_WIDTH = "220px";
const COLLAPSED_WIDTH = "64px";

function applySidebarWidth(collapsed: boolean): void {
  const root = document.documentElement;
  root.style.setProperty("--sidebar-width", collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH);
  if (collapsed) {
    root.setAttribute("data-sidebar-collapsed", "true");
  } else {
    root.removeAttribute("data-sidebar-collapsed");
  }
}

function loadCollapsed(): boolean {
  return localStorage.getItem(STORAGE_KEY) === "true";
}

interface SidebarStore {
  collapsed: boolean;
  toggle: () => void;
  setCollapsed: (collapsed: boolean) => void;
}

export const useSidebarStore = create<SidebarStore>((set, get) => {
  const initial = loadCollapsed();
  applySidebarWidth(initial);

  return {
    collapsed: initial,

    toggle: () => {
      const next = !get().collapsed;
      localStorage.setItem(STORAGE_KEY, String(next));
      applySidebarWidth(next);
      set({ collapsed: next });
    },

    setCollapsed: (collapsed) => {
      localStorage.setItem(STORAGE_KEY, String(collapsed));
      applySidebarWidth(collapsed);
      set({ collapsed });
    },
  };
});

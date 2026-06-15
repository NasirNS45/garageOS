import { BarChart3, ClipboardList, Clock, Settings } from "lucide-react";
import type { TKey } from "../i18n/translations";

export type AppTab = "jobs" | "history" | "summary" | "settings";

export interface AppNavItem {
  tab: AppTab;
  labelKey: TKey;
  Icon: React.ElementType;
  ownerOnly: boolean;
}

export const APP_NAV: AppNavItem[] = [
  { tab: "jobs", labelKey: "nav.jobs", Icon: ClipboardList, ownerOnly: false },
  { tab: "history", labelKey: "nav.history", Icon: Clock, ownerOnly: false },
  { tab: "summary", labelKey: "nav.summary", Icon: BarChart3, ownerOnly: true },
  { tab: "settings", labelKey: "nav.settings", Icon: Settings, ownerOnly: true },
];

export const VALID_APP_TABS: AppTab[] = ["jobs", "history", "summary", "settings"];

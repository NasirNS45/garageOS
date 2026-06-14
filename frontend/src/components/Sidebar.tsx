import { Globe, LogOut, Plus } from "lucide-react";
import Logo from "./Logo";
import { useT } from "../i18n/useT";
import type { TKey } from "../i18n/translations";
import { useLanguageStore } from "../stores/languageStore";

interface NavItem {
  tab: string;
  labelKey: TKey;
  Icon: React.ElementType;
}

interface Props {
  items: NavItem[];
  activeTab: string;
  onSelect: (tab: string) => void;
  onNewJob: () => void;
  onLogout: () => void;
  workshopName: string;
  role: string | null;
  activeCount: number;
}

/** Desktop-only left sidebar (lg+). Mirrors to the right in RTL via logical props. */
export default function Sidebar({
  items,
  activeTab,
  onSelect,
  onNewJob,
  onLogout,
  workshopName,
  role,
  activeCount,
}: Props) {
  const t = useT();
  const { language, toggleLanguage } = useLanguageStore();

  return (
    <aside className="hidden lg:flex flex-col fixed inset-y-0 start-0 w-60 bg-white dark:bg-slate-900 border-e border-slate-100 dark:border-slate-700 z-30">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2.5">
        <Logo variant="icon" size="sm" to="/jobs" />
        <div className="flex flex-col leading-none min-w-0">
          <span className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
            {workshopName}
          </span>
          <span className="text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-medium mt-0.5">
            {role ?? ""}
          </span>
        </div>
      </div>

      {/* Nav + primary action */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <button
          onClick={onNewJob}
          className="w-full flex items-center justify-center gap-2 bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white font-semibold text-sm rounded-xl py-2.5 mb-4 transition active:scale-95 shadow-sm"
        >
          <Plus size={18} />
          {t("jobs.empty.action")}
        </button>

        <nav className="space-y-1">
          {items.map(({ tab, labelKey, Icon }) => {
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => onSelect(tab)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition active:scale-[0.98] ${
                  active
                    ? "bg-blue-50 dark:bg-blue-900/30 text-[var(--brand)] dark:text-blue-300"
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <span className="relative">
                  <Icon size={19} />
                  {tab === "jobs" && activeCount > 0 && (
                    <span
                      className="absolute -top-1.5 -end-2 min-w-[16px] h-4 px-1 rounded-full bg-amber-500 text-white text-[11px] font-bold flex items-center justify-center"
                      data-keep-ltr
                    >
                      {activeCount > 9 ? "9+" : activeCount}
                    </span>
                  )}
                </span>
                {t(labelKey)}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer: language + logout */}
      <div className="px-3 py-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
        <button
          onClick={toggleLanguage}
          aria-label={language === "ur" ? "Switch to English" : "اردو میں دیکھیں"}
          className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition active:scale-95"
        >
          <Globe size={17} />
          <span data-keep-ltr>{language === "ur" ? "EN" : "اردو"}</span>
        </button>
        <button
          onClick={onLogout}
          aria-label={t("header.signOut")}
          className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-red-500 px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition active:scale-95"
        >
          <LogOut size={17} />
        </button>
      </div>
    </aside>
  );
}

import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  BarChart3,
  Clock,
  Globe,
  LogOut,
  Plus,
  Settings2,
  Wrench,
} from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import { useLanguageStore, applyLanguage } from "../stores/languageStore";
import { useT } from "../i18n/useT";
import type { TKey } from "../i18n/translations";
import { useOnline } from "../hooks/useOnline";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useJobCards } from "../hooks/useJobCards";
import Logo from "../components/Logo";
import Sidebar from "../components/Sidebar";
import BottomSheet from "../components/BottomSheet";
import { api } from "../api/axios";
import CreateJobForm from "./dashboard/CreateJobForm";
import JobsTab from "./dashboard/JobsTab";
import HistoryTab from "./dashboard/HistoryTab";
import SummaryTab from "./dashboard/SummaryTab";
import SettingsTab from "./dashboard/SettingsTab";

type Tab = "jobs" | "history" | "summary" | "settings";

interface NavItem {
  tab: Tab;
  labelKey: TKey;
  Icon: React.ElementType;
  ownerOnly: boolean;
}

const NAV: NavItem[] = [
  { tab: "jobs",     labelKey: "nav.jobs",     Icon: Wrench,    ownerOnly: false },
  { tab: "history",  labelKey: "nav.history",  Icon: Clock,     ownerOnly: false },
  { tab: "summary",  labelKey: "nav.summary",  Icon: BarChart3, ownerOnly: true  },
  { tab: "settings", labelKey: "nav.settings", Icon: Settings2, ownerOnly: true  },
];

const VALID_TABS: Tab[] = ["jobs", "history", "summary", "settings"];

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { role, workshopName, setWorkshopName, logout } = useAuthStore();
  const [showForm, setShowForm] = useState(false);
  const online = useOnline();
  const t = useT();
  const { language, toggleLanguage } = useLanguageStore();

  // Re-apply lang/dir on mount: a pre-auth page may have forced LTR.
  useEffect(() => {
    applyLanguage(language);
  }, [language]);

  // Derive active tab from URL path — defaults to "jobs" for unknown paths
  const pathSegment = location.pathname.replace(/^\//, "") as Tab;
  const tab: Tab = VALID_TABS.includes(pathSegment) ? pathSegment : "jobs";

  useDocumentTitle(tab.charAt(0).toUpperCase() + tab.slice(1));

  // Active-job count for the Jobs nav badge (shares cache with JobsTab)
  const { data: jobPage } = useJobCards(1);
  const activeCount = (jobPage?.items ?? []).filter(
    (j) => j.status === "pending" || j.status === "in_progress"
  ).length;

  // Fetch workshop name once on mount
  useEffect(() => {
    if (!workshopName) {
      api
        .get<{ name: string }>("/settings")
        .then((r) => setWorkshopName(r.data.name))
        .catch(() => {/* non-critical */});
    }
  }, [workshopName, setWorkshopName]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const visibleTabs = NAV.filter((n) => !n.ownerOnly || role === "owner");

  return (
    <div className="min-h-screen bg-[#F1F5F9] dark:bg-slate-900">
      {/* Offline banner */}
      {!online && (
        <div
          role="status"
          className="bg-amber-500 text-slate-900 text-center text-xs font-bold py-1.5 px-4 sticky top-0 z-30"
        >
          {t("banner.offline")}
        </div>
      )}

      {/* Desktop sidebar (lg+) */}
      <Sidebar
        items={visibleTabs}
        activeTab={tab}
        onSelect={(t2) => { setShowForm(false); navigate(`/${t2}`); }}
        onNewJob={() => setShowForm(true)}
        onLogout={handleLogout}
        workshopName={workshopName ?? "GarageOS"}
        role={role}
        activeCount={activeCount}
      />

      <div className="lg:ms-60">
      {/* Header (mobile only) */}
      <header className="lg:hidden bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700 sticky top-0 z-20 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo variant="icon" size="sm" to="/jobs" />
            <div className="flex flex-col leading-none">
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate max-w-[180px]">
                {workshopName ?? "GarageOS"}
              </span>
              <span className="text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                {role ?? ""}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleLanguage}
              aria-label={language === "ur" ? "Switch to English" : "اردو میں دیکھیں"}
              className="flex items-center gap-1 text-slate-400 hover:text-slate-700 transition px-2 py-1.5 rounded-xl hover:bg-slate-100 active:scale-95"
            >
              <Globe size={17} />
              <span className="text-xs font-bold" data-keep-ltr>
                {language === "ur" ? "EN" : "اردو"}
              </span>
            </button>
            <button
              onClick={handleLogout}
              aria-label={t("header.signOut")}
              className="text-slate-400 hover:text-slate-700 transition p-1.5 rounded-xl hover:bg-slate-100 active:scale-95"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Tab content */}
      <main className="max-w-2xl lg:max-w-5xl mx-auto px-4 lg:px-8 py-4 lg:py-8 pb-24 lg:pb-10">
        {tab === "jobs"     && <JobsTab role={role} onNewJob={() => setShowForm(true)} />}
        {tab === "history"  && <HistoryTab />}
        {tab === "summary"  && role === "owner" && <SummaryTab />}
        {tab === "settings" && role === "owner" && <SettingsTab />}
      </main>
      </div>{/* /lg:ms-60 */}

      {/* New job bottom sheet */}
      <BottomSheet
        open={showForm}
        onClose={() => setShowForm(false)}
        title={t("jobs.empty.action")}
      >
        <CreateJobForm onSuccess={() => setShowForm(false)} />
      </BottomSheet>

      {/* Bottom nav (mobile only) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] pb-safe">
        <div className="max-w-2xl mx-auto flex h-16">
          {visibleTabs.map(({ tab: navTab, labelKey, Icon }) => {
            const active = tab === navTab;
            return (
              <button
                key={navTab}
                onClick={() => { setShowForm(false); navigate(`/${navTab}`); }}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 relative transition active:scale-95 ${
                  active ? "text-[var(--brand)]" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[var(--brand)] rounded-full" />
                )}
                <span className="relative">
                  <Icon size={22} />
                  {navTab === "jobs" && activeCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 rtl:right-auto rtl:-left-2 min-w-[16px] h-4 px-1 rounded-full bg-amber-500 text-white text-[11px] font-bold flex items-center justify-center" data-keep-ltr>
                      {activeCount > 9 ? "9+" : activeCount}
                    </span>
                  )}
                </span>
                <span className={`text-[11px] font-semibold ${active ? "font-bold" : ""}`}>
                  {t(labelKey)}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* FAB — only on Jobs tab */}
      {tab === "jobs" && (
        <button
          onClick={() => setShowForm(true)}
          aria-label="New job card"
          className="lg:hidden fixed bottom-20 right-4 rtl:right-auto rtl:left-4 z-30 w-14 h-14 rounded-full bg-[var(--brand)] hover:bg-[var(--brand-hover)] active:bg-[var(--brand-panel)] text-white flex items-center justify-center shadow-lg shadow-blue-500/30 ring-4 ring-[var(--brand)]/15 transition-transform hover:scale-105 active:scale-95"
        >
          <Plus size={26} />
        </button>
      )}
    </div>
  );
}

import { type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Globe, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuthStore } from "../stores/authStore";
import { useLanguageStore, applyLanguage } from "../stores/languageStore";
import { useT } from "../i18n/useT";
import { useOnline } from "../hooks/useOnline";
import Logo from "./Logo";
import AppRail from "./AppRail";
import MobileNav from "./MobileNav";
import BottomSheet from "./BottomSheet";
import { Badge, Button, cn } from "./ui";
import { layoutTransitionClass } from "../lib/pageMotion";
import { useSidebarStore } from "../stores/sidebarStore";
import { api } from "../api/axios";
import { APP_NAV, type AppTab } from "../lib/appNav";
import CreateJobForm from "../pages/dashboard/CreateJobForm";

interface AppShellProps {
  children: ReactNode;
  activeTab: AppTab;
  mobileTitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  createJobOpen?: boolean;
  onCreateJobClose?: () => void;
}

/** Shared authenticated app chrome: sidebar, mobile header/nav, logout, new-job sheet. */
export default function AppShell({
  children,
  activeTab,
  mobileTitle,
  showBack = false,
  onBack,
  createJobOpen = false,
  onCreateJobClose,
}: AppShellProps) {
  const navigate = useNavigate();
  const { role, workshopName, setWorkshopName, logout } = useAuthStore();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const online = useOnline();
  const t = useT();
  const { language, toggleLanguage } = useLanguageStore();
  useSidebarStore();

  useEffect(() => {
    applyLanguage(language);
  }, [language]);

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

  const visibleTabs = APP_NAV.filter((n) => !n.ownerOnly || role === "owner");

  const navigateTab = (tab: string) => {
    onCreateJobClose?.();
    navigate(`/${tab}`);
  };

  return (
    <div className="min-h-screen bg-[var(--page)]">
      {!online && (
        <div role="status" className="sticky top-0 z-40 flex justify-center py-2 px-4">
          <Badge tone="warning" size="md" className="w-full max-w-xl justify-center py-1.5">
            {t("banner.offline")}
          </Badge>
        </div>
      )}

      <AppRail
        items={visibleTabs}
        activeTab={activeTab}
        onSelect={navigateTab}
        onLogout={() => setShowLogoutConfirm(true)}
        workshopName={workshopName ?? "GarageOS"}
        role={role}
      />

      <div className={cn("lg:ms-[var(--sidebar-width)]", layoutTransitionClass)}>
        <header className="lg:hidden bg-[var(--surface)] border-b border-[var(--border)] sticky top-0 z-20">
          <div className="px-[var(--page-pad-x)] h-[var(--mobile-header-h)] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {showBack && onBack ? (
                <>
                  <button
                    type="button"
                    onClick={onBack}
                    className="text-[var(--text-muted)] hover:text-[var(--text-strong)] p-1.5 rounded-[var(--r-control)] hover:bg-[var(--surface-2)] shrink-0"
                    aria-label={t("customer.back")}
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <span className="text-sm font-bold text-[var(--text-strong)] truncate">
                    {mobileTitle ?? t("customer.profile")}
                  </span>
                </>
              ) : (
                <div className="flex items-center gap-2.5 min-w-0">
                  <Logo variant="icon" size="sm" to="/jobs" />
                  <span className="text-sm font-bold text-[var(--text-strong)] truncate max-w-[160px]">
                    {workshopName ?? "GarageOS"}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={toggleLanguage}
                aria-label={language === "ur" ? "Switch to English" : "اردو میں دیکھیں"}
                className="flex items-center gap-1 text-[var(--text-faint)] hover:text-[var(--text-strong)] transition px-2 py-1.5 rounded-[var(--r-card)] hover:bg-[var(--surface-2)]"
              >
                <Globe size={16} />
                <span className="text-xs font-bold" data-keep-ltr>
                  {language === "ur" ? "EN" : "اردو"}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(true)}
                aria-label={t("header.signOut")}
                className="text-[var(--text-faint)] hover:text-[var(--danger-fg)] transition p-1.5 rounded-[var(--r-card)] hover:bg-[var(--danger-bg)]"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </header>

        <main className="w-full max-w-[1400px] mx-auto overflow-x-hidden pb-[var(--mobile-nav-h)] lg:pb-0">
          {children}
        </main>
      </div>

      <BottomSheet
        open={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        title={t("header.signOutConfirm")}
      >
        <p className="text-sm text-[var(--text-muted)] mb-5">{t("header.signOutHint")}</p>
        <div className="flex gap-2">
          <Button variant="secondary" fullWidth onClick={() => setShowLogoutConfirm(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="danger"
            fullWidth
            onClick={() => {
              setShowLogoutConfirm(false);
              handleLogout();
            }}
          >
            {t("header.signOutYes")}
          </Button>
        </div>
      </BottomSheet>

      <BottomSheet
        open={createJobOpen}
        onClose={() => onCreateJobClose?.()}
        title={t("jobs.empty.action")}
      >
        <CreateJobForm onSuccess={() => onCreateJobClose?.()} />
      </BottomSheet>

      <MobileNav items={visibleTabs} activeTab={activeTab} onSelect={navigateTab} />
    </div>
  );
}

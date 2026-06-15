import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useAuthStore } from "../stores/authStore";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import AppShell from "../components/AppShell";
import { pageTransition, pageVariants } from "../lib/pageMotion";
import { VALID_APP_TABS, type AppTab } from "../lib/appNav";
import JobsTab from "./dashboard/JobsTab";
import HistoryTab from "./dashboard/HistoryTab";
import SummaryTab from "./dashboard/SummaryTab";
import SettingsTab from "./dashboard/SettingsTab";

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { role } = useAuthStore();
  const [showForm, setShowForm] = useState(false);
  const reduceMotion = useReducedMotion();

  const pathSegment = location.pathname.replace(/^\//, "") as AppTab;
  const tab: AppTab = VALID_APP_TABS.includes(pathSegment) ? pathSegment : "jobs";

  useEffect(() => {
    if (role === "mechanic" && (tab === "summary" || tab === "settings")) {
      navigate("/jobs", { replace: true });
    }
  }, [role, tab, navigate]);

  useEffect(() => {
    const state = location.state as { openCreate?: boolean } | null;
    if (state?.openCreate) {
      setShowForm(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);

  useDocumentTitle(tab.charAt(0).toUpperCase() + tab.slice(1));

  return (
    <AppShell
      activeTab={tab}
      createJobOpen={showForm}
      onCreateJobClose={() => setShowForm(false)}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={tab}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={reduceMotion ? { duration: 0 } : pageTransition}
          className="min-h-[var(--dashboard-content-min-h)] lg:min-h-[var(--dashboard-content-min-h-lg)]"
        >
          {tab === "jobs" && <JobsTab role={role} onNewJob={() => setShowForm(true)} />}
          {tab === "history" && <HistoryTab />}
          {tab === "summary" && role === "owner" && <SummaryTab />}
          {tab === "settings" && role === "owner" && <SettingsTab />}
        </motion.div>
      </AnimatePresence>
    </AppShell>
  );
}

import { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "./stores/authStore";
import { routeTransition, routeVariants } from "./lib/pageMotion";
import { useSidebarStore } from "./stores/sidebarStore";
import { useThemeStore } from "./stores/themeStore";
import { ToastProvider } from "./context/ToastContext";
import { Toaster } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui";
import ErrorBoundary from "./components/ErrorBoundary";
import { useT } from "./i18n/useT";

// Route-level code splitting — each page ships as its own chunk
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Landing = lazy(() => import("./pages/Landing"));
const InvoicePage = lazy(() => import("./pages/public/InvoicePage"));
const TrackPage = lazy(() => import("./pages/public/TrackPage"));
const CustomerProfile = lazy(() => import("./pages/CustomerProfile"));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function PageFallback() {
  const t = useT();
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--page)]" role="status">
      <div className="w-8 h-8 rounded-full border-[3px] border-[var(--border)] border-t-[var(--brand)] animate-spin" aria-hidden />
      <span className="sr-only">{t("common.loading")}</span>
    </div>
  );
}

const DASHBOARD_PATHS = new Set(["/jobs", "/history", "/summary", "/settings"]);

function routeAnimationKey(pathname: string): string {
  if (DASHBOARD_PATHS.has(pathname)) return "/dashboard";
  if (pathname.startsWith("/customers/")) return "/dashboard";
  return pathname;
}

function AnimatedRoutes() {
  const location = useLocation();
  const motionKey = routeAnimationKey(location.pathname);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={motionKey}
        variants={routeVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={routeTransition}
        className="min-h-screen"
      >
        <Routes location={location}>
          {/* Public customer-facing pages (no auth, work logged-in or not) */}
          <Route path="/invoices/:invoiceNumber" element={<InvoicePage />} />
          <Route path="/track/:cardId" element={<TrackPage />} />

          {/* Public landing — logged-in users skip to dashboard */}
          <Route path="/" element={<GuestRoute><Landing /></GuestRoute>} />

          {/* Auth pages — logged-in users skip to dashboard */}
          <Route path="/login"  element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/signup" element={<GuestRoute><Signup /></GuestRoute>} />
          <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected app routes */}
          <Route path="/jobs"     element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/history"  element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/summary"  element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/settings" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/customers/:phone" element={<PrivateRoute><CustomerProfile /></PrivateRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

/** Redirects unauthenticated users to /login. */
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.accessToken);
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

/** Redirects already-authenticated users to /jobs (dashboard). */
function GuestRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.accessToken);
  return token ? <Navigate to="/jobs" replace /> : <>{children}</>;
}

export default function App() {
  // Ensure theme store initializes (applies saved data-theme to <html>) on first render
  useThemeStore();
  useSidebarStore();

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={300}>
        <ToastProvider>
          <BrowserRouter>
            <Suspense fallback={<PageFallback />}>
            <AnimatedRoutes />
            </Suspense>
          </BrowserRouter>
        </ToastProvider>
        </TooltipProvider>
        <Toaster position="top-center" richColors />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

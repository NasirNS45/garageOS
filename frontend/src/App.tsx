import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "./stores/authStore";
import { useThemeStore } from "./stores/themeStore";
import { ToastProvider } from "./context/ToastContext";
import ErrorBoundary from "./components/ErrorBoundary";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Landing from "./pages/Landing";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

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

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              {/* Public landing — logged-in users skip to dashboard */}
              <Route path="/" element={<GuestRoute><Landing /></GuestRoute>} />

              {/* Auth pages — logged-in users skip to dashboard */}
              <Route path="/login"  element={<GuestRoute><Login /></GuestRoute>} />
              <Route path="/signup" element={<GuestRoute><Signup /></GuestRoute>} />

              {/* Protected app routes */}
              <Route path="/jobs"     element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/history"  element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/summary"  element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/settings" element={<PrivateRoute><Dashboard /></PrivateRoute>} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

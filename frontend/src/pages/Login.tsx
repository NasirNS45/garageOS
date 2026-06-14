import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { api } from "../api/axios";
import Logo from "../components/Logo";
import { useAuthStore } from "../stores/authStore";
import PhoneInputField from "../components/PhoneInputField";
import { isValidPhone } from "../utils/validation";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useForceLtr } from "../i18n/useForceLtr";

const inputBase =
  "w-full bg-white dark:bg-slate-800 dark:text-slate-100 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition shadow-sm";

function fieldClass(hasError: boolean) {
  return hasError
    ? `${inputBase} border-red-400 focus:ring-red-400`
    : `${inputBase} border-slate-200 dark:border-slate-600 focus:ring-[var(--brand)]`;
}

export default function Login() {
  const navigate = useNavigate();
  const setTokens = useAuthStore((s) => s.setTokens);
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [sessionExpired, setSessionExpired] = useState(false);
  const [loading, setLoading] = useState(false);

  useDocumentTitle("Sign in");
  useForceLtr();

  useEffect(() => {
    if (sessionStorage.getItem("session_expired")) {
      setSessionExpired(true);
      sessionStorage.removeItem("session_expired");
    }
  }, []);

  const clearFieldError = (field: string) =>
    setFieldErrors((prev) => ({ ...prev, [field]: "" }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    // Client-side validation
    const errs: Record<string, string> = {};
    if (!isValidPhone(mobile)) errs.mobile = "Enter a valid mobile number";
    if (!password) errs.password = "Password is required";

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { mobile, password });
      setTokens(data.access_token, data.refresh_token);
      navigate("/");
    } catch {
      // Auth failures intentionally stay as a top-level banner (no field disambiguation)
      setFormError("Invalid mobile number or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — brand hero (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-[var(--brand-panel)] flex-col justify-between p-12">
        <Logo variant="full" size="lg" light to="/" />
        <div>
          <p className="text-white text-3xl font-bold leading-snug mb-3">
            Run your workshop<br />like a professional.
          </p>
          <p className="text-blue-200 text-base leading-relaxed">
            Job cards, invoices, courier booking, and WhatsApp notifications
            — all in one place.
          </p>
        </div>
        <p className="text-blue-300 text-sm">Built for Pakistani workshops</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-[#F1F5F9] dark:bg-slate-900">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8">
            <Logo variant="full" size="md" to="/" />
          </div>

          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">Welcome back</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">Sign in to your workshop</p>

          {sessionExpired && (
            <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-sm rounded-xl px-4 py-3 mb-5">
              Your session expired. Please sign in again.
            </div>
          )}

          {formError && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm rounded-xl px-4 py-3 mb-5">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Mobile number
              </label>
              <PhoneInputField
                value={mobile}
                onChange={(val) => { setMobile(val); clearFieldError("mobile"); }}
                error={!!fieldErrors.mobile}
              />
              {fieldErrors.mobile && (
                <p className="text-xs text-red-500 mt-1">{fieldErrors.mobile}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearFieldError("password"); }}
                  className={fieldClass(!!fieldErrors.password)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 transition"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-xs text-red-500 mt-1">{fieldErrors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--brand)] hover:bg-[var(--brand-hover)] active:bg-[var(--brand-panel)] text-white font-semibold rounded-xl py-3 text-sm transition shadow-sm disabled:opacity-60"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
            New workshop?{" "}
            <Link to="/signup" className="text-[var(--brand)] font-semibold hover:underline">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

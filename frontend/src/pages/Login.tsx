import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { api } from "../api/axios";
import AuthHeroPanel from "../components/auth/AuthHeroPanel";
import AuthLanguageToggle from "../components/AuthLanguageToggle";
import Logo from "../components/Logo";
import { useAuthStore } from "../stores/authStore";
import PhoneInputField from "../components/PhoneInputField";
import { isValidPhone } from "../utils/validation";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useT } from "../i18n/useT";

const inputBase =
  "w-full bg-white dark:bg-slate-800 dark:text-slate-100 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition shadow-sm";

function fieldClass(hasError: boolean) {
  return hasError
    ? `${inputBase} border-red-400 focus:ring-red-400`
    : `${inputBase} border-slate-200 dark:border-slate-600 focus:ring-[var(--brand)]`;
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const setTokens = useAuthStore((s) => s.setTokens);
  const t = useT();
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [sessionExpired, setSessionExpired] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(
    () => (location.state as { resetSuccess?: boolean } | null)?.resetSuccess === true
  );
  const [loading, setLoading] = useState(false);

  const mobileId = "login-mobile";
  const passwordId = "login-password";
  const mobileErrorId = "login-mobile-error";
  const passwordErrorId = "login-password-error";

  useDocumentTitle(t("auth.signIn"));
  useEffect(() => {
    if (sessionStorage.getItem("session_expired")) {
      setSessionExpired(true);
      sessionStorage.removeItem("session_expired");
    }
  }, []);

  useEffect(() => {
    if (resetSuccess) {
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [resetSuccess, navigate, location.pathname]);

  const clearFieldError = (field: string) =>
    setFieldErrors((prev) => ({ ...prev, [field]: "" }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    const errs: Record<string, string> = {};
    if (!isValidPhone(mobile)) errs.mobile = t("auth.errMobileInvalid");
    if (!password) errs.password = t("auth.errPasswordRequired");

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
      setFormError(t("auth.errLoginFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden flex flex-col lg:flex-row">
      <div className="lg:order-2 rtl:lg:order-1 flex-1 flex items-center justify-center px-6 py-12 bg-[#F1F5F9] dark:bg-slate-900">
        <div className="w-full max-w-sm text-start">
          <div className="lg:hidden mb-8 flex items-start justify-between gap-4">
            <Logo variant="full" size="md" to="/" />
            <AuthLanguageToggle />
          </div>

          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">
            {t("auth.loginTitle")}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">{t("auth.loginSubtitle")}</p>

          {resetSuccess && (
            <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-sm rounded-xl px-4 py-3 mb-5 flex items-start justify-between gap-3" role="status">
              <span>{t("auth.resetSuccess")}</span>
              <button
                type="button"
                onClick={() => setResetSuccess(false)}
                className="text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 shrink-0 text-xs font-semibold"
                aria-label={t("common.close")}
              >
                ✕
              </button>
            </div>
          )}

          {sessionExpired && (
            <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-sm rounded-xl px-4 py-3 mb-5" role="alert">
              {t("auth.sessionExpired")}
            </div>
          )}

          {formError && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm rounded-xl px-4 py-3 mb-5" role="alert">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="min-w-0">
              <label htmlFor={mobileId} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                {t("auth.mobileNumber")}
              </label>
              <PhoneInputField
                id={mobileId}
                ariaLabel={t("auth.mobileNumber")}
                ariaDescribedBy={fieldErrors.mobile ? mobileErrorId : undefined}
                value={mobile}
                onChange={(val) => { setMobile(val); clearFieldError("mobile"); }}
                error={!!fieldErrors.mobile}
              />
              {fieldErrors.mobile && (
                <p id={mobileErrorId} role="alert" className="text-xs text-red-500 mt-1">{fieldErrors.mobile}</p>
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1 mb-1.5">
                <label htmlFor={passwordId} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t("auth.password")}
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-[var(--brand)] hover:underline shrink-0"
                >
                  {t("auth.forgotPassword")}
                </Link>
              </div>
              <div className="relative auth-latin-field">
                <input
                  id={passwordId}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearFieldError("password"); }}
                  className={`${fieldClass(!!fieldErrors.password)} auth-latin-input pe-10`}
                  aria-describedby={fieldErrors.password ? passwordErrorId : undefined}
                  aria-invalid={!!fieldErrors.password}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 transition"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {fieldErrors.password && (
                <p id={passwordErrorId} role="alert" className="text-xs text-red-500 mt-1">{fieldErrors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--brand)] hover:bg-[var(--brand-hover)] active:bg-[var(--brand-panel)] text-white font-semibold rounded-xl py-3 text-sm transition shadow-sm disabled:opacity-60"
            >
              {loading ? t("auth.signingIn") : t("auth.signIn")}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
            {t("auth.newWorkshop")}{" "}
            <Link to="/signup" className="text-[var(--brand)] font-semibold hover:underline">
              {t("auth.registerHere")}
            </Link>
          </p>
        </div>
      </div>

      <div className="lg:order-1 rtl:lg:order-2">
        <AuthHeroPanel headlineKey="auth.heroLoginHeadline" subtextKey="auth.heroLoginSubtext" />
      </div>
    </div>
  );
}

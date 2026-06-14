import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { api } from "../api/axios";
import AuthLanguageToggle from "../components/AuthLanguageToggle";
import Logo from "../components/Logo";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useT } from "../i18n/useT";

const inputBase =
  "w-full bg-white dark:bg-slate-800 dark:text-slate-100 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition shadow-sm";

function fieldClass(hasError: boolean) {
  return hasError
    ? `${inputBase} border-red-400 focus:ring-red-400`
    : `${inputBase} border-slate-200 dark:border-slate-600 focus:ring-[var(--brand)]`;
}

export default function ResetPassword() {
  const t = useT();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  useDocumentTitle(t("auth.resetTitle"));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    const errs: Record<string, string> = {};

    if (!password) {
      errs.password = t("auth.errPasswordRequired");
    } else if (password.length < 8) {
      errs.password = t("auth.errPasswordShort");
    }
    if (password !== confirm) {
      errs.confirm = t("auth.errPasswordMismatch");
    }
    if (!token) {
      setFormError("Invalid or missing reset link.");
      return;
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, password });
      navigate("/login", { state: { resetSuccess: true } });
    } catch {
      setFormError("Could not reset password. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-[#F1F5F9] dark:bg-slate-900">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-start justify-between gap-4">
          <Logo variant="full" size="md" to="/" />
          <AuthLanguageToggle />
        </div>

        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">
          {t("auth.resetTitle")}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">{t("auth.resetDesc")}</p>

        {formError && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm rounded-xl px-4 py-3 mb-5">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              {t("auth.newPassword")}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: "" })); }}
                className={fieldClass(!!errors.password)}
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
            {errors.password && (
              <p className="text-xs text-red-500 mt-1">{errors.password}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              {t("auth.confirmPassword")}
            </label>
            <input
              type={showPassword ? "text" : "password"}
              value={confirm}
              onChange={(e) => { setConfirm(e.target.value); setErrors((p) => ({ ...p, confirm: "" })); }}
              className={fieldClass(!!errors.confirm)}
            />
            {errors.confirm && (
              <p className="text-xs text-red-500 mt-1">{errors.confirm}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white font-semibold rounded-xl py-3 text-sm transition shadow-sm disabled:opacity-60"
          >
            {loading ? t("auth.resetSaving") : t("auth.resetSubmit")}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
          <Link to="/login" className="text-[var(--brand)] font-semibold hover:underline">
            {t("auth.backToLogin")}
          </Link>
        </p>
      </div>
    </div>
  );
}

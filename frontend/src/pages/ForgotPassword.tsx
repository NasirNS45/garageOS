import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/axios";
import AuthLanguageToggle from "../components/AuthLanguageToggle";
import Logo from "../components/Logo";
import PhoneInputField from "../components/PhoneInputField";
import { isValidPhone } from "../utils/validation";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useT } from "../i18n/useT";

export default function ForgotPassword() {
  const t = useT();
  const [mobile, setMobile] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const mobileId = "forgot-mobile";
  const mobileErrorId = "forgot-mobile-error";

  useDocumentTitle(t("auth.forgotTitle"));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError("");
    setSuccess(false);

    if (!isValidPhone(mobile)) {
      setFieldError(t("auth.errMobileInvalid"));
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { mobile });
    } catch {
      // Always show success to avoid account enumeration
    } finally {
      setLoading(false);
      setSuccess(true);
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
          {t("auth.forgotTitle")}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">{t("auth.forgotDesc")}</p>

        {success && (
          <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-sm rounded-xl px-4 py-3 mb-5" role="status">
            {t("auth.forgotSuccess")}
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
              ariaDescribedBy={fieldError ? mobileErrorId : undefined}
              value={mobile}
              onChange={(val) => { setMobile(val); setFieldError(""); }}
              error={!!fieldError}
            />
            {fieldError && (
              <p id={mobileErrorId} role="alert" className="text-xs text-red-500 mt-1">{fieldError}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white font-semibold rounded-xl py-3 text-sm transition shadow-sm disabled:opacity-60"
          >
            {loading ? t("auth.forgotSending") : t("auth.forgotSubmit")}
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

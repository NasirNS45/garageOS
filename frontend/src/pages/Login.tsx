import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { api } from "../api/axios";
import AuthLayout from "../components/auth/AuthLayout";
import PhoneInputField from "../components/PhoneInputField";
import { useAuthStore } from "../stores/authStore";
import { isValidPhone } from "../utils/validation";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useT } from "../i18n/useT";
import { Button, FormField, TextInput } from "../components/ui";

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
      navigate("/jobs");
    } catch {
      setFormError(t("auth.errLoginFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      heroHeadlineKey="auth.heroLoginHeadline"
      heroSubtextKey="auth.heroLoginSubtext"
      title={t("auth.loginTitle")}
      subtitle={t("auth.loginSubtitle")}
      footer={
        <p className="text-sm text-[var(--text-muted)]">
          {t("auth.newWorkshop")}{" "}
          <Link to="/signup" className="text-[var(--brand)] font-semibold hover:underline">
            {t("auth.registerHere")}
          </Link>
        </p>
      }
    >
      {resetSuccess && (
        <div
          className="bg-[var(--success-bg)] ring-1 ring-[var(--success)]/25 text-[var(--success-fg)] text-sm rounded-[var(--r-control)] px-4 py-3 mb-4 flex items-start justify-between gap-3"
          role="status"
        >
          <span>{t("auth.resetSuccess")}</span>
          <button
            type="button"
            onClick={() => setResetSuccess(false)}
            className="text-[var(--success-fg)] hover:opacity-80 shrink-0 text-xs font-semibold"
            aria-label={t("common.close")}
          >
            ✕
          </button>
        </div>
      )}

      {sessionExpired && (
        <div
          className="bg-[var(--warning-bg)] ring-1 ring-[var(--warning)]/25 text-[var(--warning-fg)] text-sm rounded-[var(--r-control)] px-4 py-3 mb-4"
          role="alert"
        >
          {t("auth.sessionExpired")}
        </div>
      )}

      {formError && (
        <div
          className="bg-[var(--danger-bg)] ring-1 ring-[var(--danger)]/25 text-[var(--danger-fg)] text-sm rounded-[var(--r-control)] px-4 py-3 mb-4"
          role="alert"
        >
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <FormField
          label={t("auth.mobileNumber")}
          htmlFor={mobileId}
          error={fieldErrors.mobile}
          errorId={mobileErrorId}
        >
          <PhoneInputField
            id={mobileId}
            ariaLabel={t("auth.mobileNumber")}
            ariaDescribedBy={fieldErrors.mobile ? mobileErrorId : undefined}
            value={mobile}
            onChange={(val) => {
              setMobile(val);
              clearFieldError("mobile");
            }}
            error={!!fieldErrors.mobile}
          />
        </FormField>

        <FormField
          label={t("auth.password")}
          htmlFor={passwordId}
          error={fieldErrors.password}
          errorId={passwordErrorId}
          action={
            <Link
              to="/forgot-password"
              className="text-xs font-semibold text-[var(--brand)] hover:underline shrink-0"
            >
              {t("auth.forgotPassword")}
            </Link>
          }
        >
          <div className="relative auth-latin-field">
            <TextInput
              id={passwordId}
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearFieldError("password");
              }}
              hasError={!!fieldErrors.password}
              className="auth-latin-input pe-10"
              aria-describedby={fieldErrors.password ? passwordErrorId : undefined}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)] hover:text-[var(--text-muted)] transition"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </FormField>

        <Button type="submit" loading={loading} fullWidth>
          {loading ? t("auth.signingIn") : t("auth.signIn")}
        </Button>
      </form>
    </AuthLayout>
  );
}

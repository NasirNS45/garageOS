import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { api } from "../api/axios";
import AuthLayout from "../components/auth/AuthLayout";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useT } from "../i18n/useT";
import { Button, FormField, TextInput } from "../components/ui";

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

  const passwordId = "reset-password";
  const confirmId = "reset-confirm";
  const passwordErrorId = "reset-password-error";
  const confirmErrorId = "reset-confirm-error";

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
      setFormError(t("auth.errResetInvalid"));
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
      setFormError(t("auth.errResetFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      heroHeadlineKey="auth.heroResetHeadline"
      heroSubtextKey="auth.heroResetSubtext"
      title={t("auth.resetTitle")}
      subtitle={t("auth.resetDesc")}
      footer={
        <p className="text-sm text-[var(--text-muted)]">
          <Link to="/login" className="text-[var(--brand)] font-semibold hover:underline">
            {t("auth.backToLogin")}
          </Link>
        </p>
      }
    >
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
          label={t("auth.newPassword")}
          htmlFor={passwordId}
          error={errors.password}
          errorId={passwordErrorId}
        >
          <div className="relative auth-latin-field">
            <TextInput
              id={passwordId}
              type={showPassword ? "text" : "password"}
              placeholder={t("auth.passwordPlaceholder")}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors((p) => ({ ...p, password: "" }));
              }}
              hasError={!!errors.password}
              className="auth-latin-input pe-10"
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

        <FormField
          label={t("auth.confirmPassword")}
          htmlFor={confirmId}
          error={errors.confirm}
          errorId={confirmErrorId}
        >
          <TextInput
            id={confirmId}
            type={showPassword ? "text" : "password"}
            value={confirm}
            onChange={(e) => {
              setConfirm(e.target.value);
              setErrors((p) => ({ ...p, confirm: "" }));
            }}
            hasError={!!errors.confirm}
            className="auth-latin-input"
          />
        </FormField>

        <Button type="submit" loading={loading} fullWidth>
          {loading ? t("auth.resetSaving") : t("auth.resetSubmit")}
        </Button>
      </form>
    </AuthLayout>
  );
}

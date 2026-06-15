import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/axios";
import AuthLayout from "../components/auth/AuthLayout";
import PhoneInputField from "../components/PhoneInputField";
import { isValidPhone } from "../utils/validation";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useT } from "../i18n/useT";
import { Button, FormField } from "../components/ui";

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
    <AuthLayout
      heroHeadlineKey="auth.heroForgotHeadline"
      heroSubtextKey="auth.heroForgotSubtext"
      title={t("auth.forgotTitle")}
      subtitle={t("auth.forgotDesc")}
      footer={
        <p className="text-sm text-[var(--text-muted)]">
          <Link to="/login" className="text-[var(--brand)] font-semibold hover:underline">
            {t("auth.backToLogin")}
          </Link>
        </p>
      }
    >
      {success && (
        <div
          className="bg-[var(--success-bg)] ring-1 ring-[var(--success)]/25 text-[var(--success-fg)] text-sm rounded-[var(--r-control)] px-4 py-3 mb-4"
          role="status"
        >
          {t("auth.forgotSuccess")}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <FormField
          label={t("auth.mobileNumber")}
          htmlFor={mobileId}
          error={fieldError}
          errorId={mobileErrorId}
        >
          <PhoneInputField
            id={mobileId}
            ariaLabel={t("auth.mobileNumber")}
            ariaDescribedBy={fieldError ? mobileErrorId : undefined}
            value={mobile}
            onChange={(val) => {
              setMobile(val);
              setFieldError("");
            }}
            error={!!fieldError}
          />
        </FormField>

        <Button type="submit" loading={loading} fullWidth>
          {loading ? t("auth.forgotSending") : t("auth.forgotSubmit")}
        </Button>
      </form>
    </AuthLayout>
  );
}

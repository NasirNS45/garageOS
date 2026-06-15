import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { api } from "../api/axios";
import AuthLayout from "../components/auth/AuthLayout";
import PhoneInputField from "../components/PhoneInputField";
import { useAuthStore } from "../stores/authStore";
import { parseApiError } from "../utils/parseApiError";
import { isValidPhone } from "../utils/validation";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useT } from "../i18n/useT";
import { trackPilotEvent } from "../utils/trackPilotEvent";
import { Button, FormField, TextInput } from "../components/ui";

interface SignupForm {
  full_name: string;
  mobile: string;
  password: string;
  workshop_name: string;
  workshop_address: string;
}

const INITIAL: SignupForm = {
  full_name: "",
  mobile: "",
  password: "",
  workshop_name: "",
  workshop_address: "",
};

export default function Signup() {
  const navigate = useNavigate();
  const setTokens = useAuthStore((s) => s.setTokens);
  const t = useT();
  const [form, setForm] = useState<SignupForm>(INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const fullNameId = "signup-full-name";
  const mobileId = "signup-mobile";
  const passwordId = "signup-password";
  const workshopNameId = "signup-workshop-name";
  const workshopAddressId = "signup-workshop-address";

  useDocumentTitle(t("auth.signupTitle"));

  const set =
    (field: keyof SignupForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      setErrors((prev) => ({ ...prev, [field]: "", _form: "" }));
    };

  const validate = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (!form.full_name.trim()) errs.full_name = t("auth.errFullNameRequired");
    if (!form.mobile.trim()) {
      errs.mobile = t("auth.errMobileRequired");
    } else if (!isValidPhone(form.mobile)) {
      errs.mobile = t("auth.errMobileInvalid");
    }
    if (!form.password) {
      errs.password = t("auth.errPasswordRequired");
    } else if (form.password.length < 8) {
      errs.password = t("auth.errPasswordShort");
    }
    if (!form.workshop_name.trim()) errs.workshop_name = t("auth.errWorkshopNameRequired");
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const clientErrors = validate();
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/auth/signup", form);
      setTokens(data.access_token, data.refresh_token);
      trackPilotEvent("signup_completed_frontend");
      navigate("/jobs");
    } catch (err: unknown) {
      const serverErrors = parseApiError(err);
      setErrors(serverErrors);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      heroHeadlineKey="auth.heroSignupHeadline"
      heroSubtextKey="auth.heroSignupSubtext"
      title={t("auth.signupTitle")}
      subtitle={t("auth.signupSubtitle")}
      footer={
        <p className="text-sm text-[var(--text-muted)]">
          {t("auth.alreadyRegistered")}{" "}
          <Link to="/login" className="text-[var(--brand)] font-semibold hover:underline">
            {t("auth.signIn")}
          </Link>
        </p>
      }
    >
      {errors._form && (
        <div
          className="bg-[var(--danger-bg)] ring-1 ring-[var(--danger)]/25 text-[var(--danger-fg)] text-sm rounded-[var(--r-control)] px-4 py-3 mb-4"
          role="alert"
        >
          {errors._form}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
        <FormField
          label={t("auth.fullName")}
          htmlFor={fullNameId}
          error={errors.full_name}
          errorId={`${fullNameId}-error`}
        >
          <TextInput
            id={fullNameId}
            type="text"
            placeholder="Muhammad Ali"
            value={form.full_name}
            onChange={set("full_name")}
            hasError={!!errors.full_name}
            className="auth-latin-input"
          />
        </FormField>

        <FormField
          label={t("auth.mobileNumber")}
          htmlFor={mobileId}
          error={errors.mobile}
          errorId={`${mobileId}-error`}
        >
          <PhoneInputField
            id={mobileId}
            ariaLabel={t("auth.mobileNumber")}
            ariaDescribedBy={errors.mobile ? `${mobileId}-error` : undefined}
            value={form.mobile}
            onChange={(val) => {
              setForm((prev) => ({ ...prev, mobile: val }));
              setErrors((prev) => ({ ...prev, mobile: "", _form: "" }));
            }}
            error={!!errors.mobile}
          />
        </FormField>

        <FormField
          label={t("auth.password")}
          htmlFor={passwordId}
          error={errors.password}
          errorId={`${passwordId}-error`}
        >
          <div className="relative auth-latin-field">
            <TextInput
              id={passwordId}
              type={showPassword ? "text" : "password"}
              placeholder={t("auth.passwordPlaceholder")}
              value={form.password}
              onChange={set("password")}
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

        <div className="grid sm:grid-cols-2 gap-3">
          <FormField
            label={t("auth.workshopName")}
            htmlFor={workshopNameId}
            error={errors.workshop_name}
            errorId={`${workshopNameId}-error`}
          >
            <TextInput
              id={workshopNameId}
              type="text"
              placeholder="Ali Motors"
              value={form.workshop_name}
              onChange={set("workshop_name")}
              hasError={!!errors.workshop_name}
              className="auth-latin-input"
            />
          </FormField>

          <FormField
            label={t("auth.addressOptional")}
            htmlFor={workshopAddressId}
            error={errors.workshop_address}
            errorId={`${workshopAddressId}-error`}
          >
            <TextInput
              id={workshopAddressId}
              type="text"
              placeholder="GT Road, Lahore"
              value={form.workshop_address}
              onChange={set("workshop_address")}
              hasError={!!errors.workshop_address}
              className="auth-latin-input"
            />
          </FormField>
        </div>

        <Button type="submit" loading={loading} fullWidth>
          {loading ? t("auth.creatingWorkshop") : t("auth.createWorkshop")}
        </Button>
      </form>
    </AuthLayout>
  );
}

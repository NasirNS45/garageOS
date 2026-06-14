import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { api } from "../api/axios";
import AuthHeroPanel from "../components/auth/AuthHeroPanel";
import AuthLanguageToggle from "../components/AuthLanguageToggle";
import Logo from "../components/Logo";
import { useAuthStore } from "../stores/authStore";
import { parseApiError } from "../utils/parseApiError";
import { isValidPhone } from "../utils/validation";
import PhoneInputField from "../components/PhoneInputField";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useT } from "../i18n/useT";
import { trackPilotEvent } from "../utils/trackPilotEvent";

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

const inputBase =
  "w-full bg-white dark:bg-slate-800 dark:text-slate-100 border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition shadow-sm";

function fieldClass(hasError: boolean) {
  return hasError
    ? `${inputBase} border-red-400 focus:ring-red-400`
    : `${inputBase} border-slate-200 dark:border-slate-600 focus:ring-[var(--brand)]`;
}

export default function Signup() {
  const navigate = useNavigate();
  const setTokens = useAuthStore((s) => s.setTokens);
  const t = useT();
  const [form, setForm] = useState<SignupForm>(INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
      navigate("/");
    } catch (err: unknown) {
      const serverErrors = parseApiError(err);
      setErrors(serverErrors);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden flex">
      <AuthHeroPanel headlineKey="auth.heroSignupHeadline" subtextKey="auth.heroSignupSubtext" />

      <div className="flex-1 flex items-center justify-center px-6 py-8 lg:py-6 bg-[#F1F5F9] dark:bg-slate-900 overflow-y-auto lg:overflow-hidden">
        <div className="w-full max-w-lg my-auto lg:my-0">
          <div className="lg:hidden mb-6 flex items-start justify-between gap-4">
            <Logo variant="full" size="md" to="/" />
            <AuthLanguageToggle />
          </div>

          <div className="mb-5 lg:mb-4">
            <h2 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-0.5">
              {t("auth.signupTitle")}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t("auth.signupSubtitle")}</p>
          </div>

          {errors._form && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm rounded-xl px-4 py-2.5 mb-4">
              {errors._form}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3" noValidate>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t("auth.fullName")}
                </label>
                <input
                  type="text"
                  placeholder="Muhammad Ali"
                  value={form.full_name}
                  onChange={set("full_name")}
                  className={fieldClass(!!errors.full_name)}
                />
                {errors.full_name && (
                  <p className="text-xs text-red-500 mt-1">{errors.full_name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t("auth.mobileNumber")}
                </label>
                <PhoneInputField
                  value={form.mobile}
                  onChange={(val) => {
                    setForm((prev) => ({ ...prev, mobile: val }));
                    setErrors((prev) => ({ ...prev, mobile: "", _form: "" }));
                  }}
                  error={!!errors.mobile}
                />
                {errors.mobile && (
                  <p className="text-xs text-red-500 mt-1">{errors.mobile}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t("auth.password")}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 8 characters"
                  value={form.password}
                  onChange={set("password")}
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

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t("auth.workshopName")}
                </label>
                <input
                  type="text"
                  placeholder="Ali Motors"
                  value={form.workshop_name}
                  onChange={set("workshop_name")}
                  className={fieldClass(!!errors.workshop_name)}
                />
                {errors.workshop_name && (
                  <p className="text-xs text-red-500 mt-1">{errors.workshop_name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t("auth.addressOptional")}
                </label>
                <input
                  type="text"
                  placeholder="GT Road, Lahore"
                  value={form.workshop_address}
                  onChange={set("workshop_address")}
                  className={fieldClass(!!errors.workshop_address)}
                />
                {errors.workshop_address && (
                  <p className="text-xs text-red-500 mt-1">{errors.workshop_address}</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--brand)] hover:bg-[var(--brand-hover)] active:bg-[var(--brand-panel)] text-white font-semibold rounded-xl py-2.5 text-sm transition shadow-sm disabled:opacity-60 mt-1"
            >
              {loading ? t("auth.creatingWorkshop") : t("auth.createWorkshop")}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-4">
            {t("auth.alreadyRegistered")}{" "}
            <Link to="/login" className="text-[var(--brand)] font-semibold hover:underline">
              {t("auth.signIn")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

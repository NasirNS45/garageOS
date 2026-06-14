import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { api } from "../api/axios";
import Logo from "../components/Logo";
import { useAuthStore } from "../stores/authStore";
import { parseApiError } from "../utils/parseApiError";
import { isValidPhone } from "../utils/validation";
import PhoneInputField from "../components/PhoneInputField";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useForceLtr } from "../i18n/useForceLtr";

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
  "w-full bg-white dark:bg-slate-800 dark:text-slate-100 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition shadow-sm";

function fieldClass(hasError: boolean) {
  return hasError
    ? `${inputBase} border-red-400 focus:ring-red-400`
    : `${inputBase} border-slate-200 dark:border-slate-600 focus:ring-[var(--brand)]`;
}

export default function Signup() {
  const navigate = useNavigate();
  const setTokens = useAuthStore((s) => s.setTokens);
  const [form, setForm] = useState<SignupForm>(INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useDocumentTitle("Create account");
  useForceLtr();

  const set =
    (field: keyof SignupForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      // Clear field error on change
      setErrors((prev) => ({ ...prev, [field]: "", _form: "" }));
    };

  const validate = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (!form.full_name.trim()) errs.full_name = "Full name is required";
    if (!form.mobile.trim()) {
      errs.mobile = "Mobile number is required";
    } else if (!isValidPhone(form.mobile)) {
      errs.mobile = "Enter a valid mobile number";
    }
    if (!form.password) {
      errs.password = "Password is required";
    } else if (form.password.length < 8) {
      errs.password = "Password must be at least 8 characters";
    }
    if (!form.workshop_name.trim()) errs.workshop_name = "Workshop name is required";
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
      navigate("/");
    } catch (err: unknown) {
      const serverErrors = parseApiError(err);
      setErrors(serverErrors);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[var(--brand-panel)] flex-col justify-between p-12">
        <Logo variant="full" size="lg" light to="/" />
        <div>
          <p className="text-white text-3xl font-bold leading-snug mb-3">
            Your workshop,<br />fully organised.
          </p>
          <p className="text-blue-200 text-base leading-relaxed">
            Create your workshop in under 2 minutes. Job cards, invoices,
            and WhatsApp notifications ready from day one.
          </p>
        </div>
        <p className="text-blue-300 text-sm">Built for Pakistani workshops</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-[#F1F5F9] dark:bg-slate-900 overflow-y-auto">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8">
            <Logo variant="full" size="md" to="/" />
          </div>

          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">
            Create your workshop
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
            Free account. No credit card needed.
          </p>

          {errors._form && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm rounded-xl px-4 py-3 mb-5">
              {errors._form}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 pt-1">
              Your details
            </p>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Full name
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
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Mobile number
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

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Password
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

            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 pt-2">
              Workshop details
            </p>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Workshop name
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
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Workshop address
              </label>
              <input
                type="text"
                placeholder="Shop 5, GT Road, Lahore"
                value={form.workshop_address}
                onChange={set("workshop_address")}
                className={fieldClass(!!errors.workshop_address)}
              />
              {errors.workshop_address && (
                <p className="text-xs text-red-500 mt-1">{errors.workshop_address}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--brand)] hover:bg-[var(--brand-hover)] active:bg-[var(--brand-panel)] text-white font-semibold rounded-xl py-3 text-sm transition shadow-sm disabled:opacity-60 mt-2"
            >
              {loading ? "Creating workshop…" : "Create workshop"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
            Already registered?{" "}
            <Link to="/login" className="text-[var(--brand)] font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

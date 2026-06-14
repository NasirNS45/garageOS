import { useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, ClipboardList, Users, Wrench } from "lucide-react";
import { useMechanics } from "../hooks/useMechanics";
import { useAuthStore } from "../stores/authStore";
import { useT } from "../i18n/useT";

/** First-run guidance shown to an owner with no jobs yet. */
export default function OnboardingChecklist({ onNewJob }: { onNewJob: () => void }) {
  const navigate = useNavigate();
  const { data: mechanics = [] } = useMechanics();
  const workshopName = useAuthStore((s) => s.workshopName);
  const t = useT();

  const steps = [
    {
      icon: Wrench,
      title: t("onboarding.s1Title"),
      desc: t("onboarding.s1Desc"),
      done: !!workshopName?.trim(),
      cta: t("onboarding.s1Cta"),
      onClick: () => navigate("/settings"),
    },
    {
      icon: Users,
      title: t("onboarding.s2Title"),
      desc: t("onboarding.s2Desc"),
      done: mechanics.length > 0,
      cta: t("onboarding.s2Cta"),
      onClick: () => navigate("/settings?section=team"),
    },
    {
      icon: ClipboardList,
      title: t("onboarding.s3Title"),
      desc: t("onboarding.s3Desc"),
      done: false,
      cta: t("onboarding.s3Cta"),
      onClick: onNewJob,
      primary: true,
    },
  ];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-br from-[var(--brand)] to-[var(--brand-panel)] text-white p-5">
        <h2 className="text-lg font-extrabold">{t("onboarding.welcome")}</h2>
        <p className="text-sm text-white/80 mt-1">{t("onboarding.subtitle")}</p>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-700">
        {steps.map(({ icon: Icon, title, desc, done, cta, onClick, primary }, i) => (
          <div key={title} className="flex items-center gap-3 p-4">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                done
                  ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300"
                  : "bg-blue-50 text-[var(--brand)] dark:bg-blue-900/30"
              }`}
            >
              {done ? <CheckCircle2 size={18} /> : <Icon size={17} />}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm font-bold ${
                  done
                    ? "text-slate-400 dark:text-slate-500 line-through"
                    : "text-slate-900 dark:text-slate-100"
                }`}
              >
                {i + 1}. {title}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{desc}</p>
            </div>
            {!done && (
              <button
                onClick={onClick}
                className={`shrink-0 inline-flex items-center gap-1 text-xs font-semibold px-3 py-2 rounded-xl transition active:scale-95 ${
                  primary
                    ? "bg-[var(--brand)] text-white hover:bg-[var(--brand-hover)] shadow-sm"
                    : "text-[var(--brand)] hover:bg-blue-50 dark:hover:bg-blue-900/20"
                }`}
              >
                {cta}
                <ArrowRight size={13} className="rtl:rotate-180" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

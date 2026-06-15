import { useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, ClipboardList, Users, Wrench } from "lucide-react";
import { motion } from "framer-motion";
import { useMechanics } from "../hooks/useMechanics";
import { useAuthStore } from "../stores/authStore";
import { useT } from "../i18n/useT";
import { Card, Button, IconTile } from "./ui";

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
    <Card padding="none" className="overflow-hidden">
      <div className="relative bg-[var(--surface)] border-b border-[var(--border)] p-5 overflow-hidden">
        {/* Brand accent stripe */}
        <div className="absolute inset-y-0 start-0 w-1 bg-[var(--brand)]" />
        {/* Subtle glow */}
        <div className="absolute -top-8 -start-8 w-40 h-40 rounded-full bg-[var(--brand)]/10 blur-2xl pointer-events-none" />
        <div className="relative ps-3">
          <h2 className="text-2xl font-black text-[var(--text-strong)] leading-tight">
            {t("onboarding.welcome")}
          </h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">{t("onboarding.subtitle")}</p>
        </div>
      </div>
      <motion.div
        className="divide-y divide-[var(--border)]"
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
      >
        {steps.map(({ icon: Icon, title, desc, done, cta, onClick, primary }, i) => (
          <motion.div
            key={title}
            className="flex items-center gap-3 p-4"
            variants={{ hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0, transition: { duration: 0.2, ease: "easeOut" as const } } }}
          >
            <IconTile tone={done ? "success" : "info"}>
              {done ? <CheckCircle2 size={18} /> : <Icon size={17} />}
            </IconTile>
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm font-bold ${
                  done
                    ? "text-[var(--text-faint)] line-through"
                    : "text-[var(--text-strong)]"
                }`}
              >
                {i + 1}. {title}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">{desc}</p>
            </div>
            {!done && (
              <Button
                size="sm"
                variant={primary ? "primary" : "ghost"}
                onClick={onClick}
                className="shrink-0"
              >
                {cta}
                <ArrowRight size={13} className="rtl:rotate-180" />
              </Button>
            )}
          </motion.div>
        ))}
      </motion.div>
    </Card>
  );
}

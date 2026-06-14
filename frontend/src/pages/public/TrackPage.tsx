import { useParams } from "react-router-dom";
import { Check, FileText, FileX, Loader2 } from "lucide-react";
import AuthLanguageToggle from "../../components/AuthLanguageToggle";
import { usePublicTrack } from "../../hooks/usePublic";
import { usePublicLanguage } from "../../i18n/usePublicLanguage";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { useT } from "../../i18n/useT";
import {
  brandAccentStyle,
  brandBorderStyle,
  brandButtonClass,
  brandHeaderStyle,
  resolveBrandColor,
} from "../../utils/brandColor";

const fmt = (n: number) => `PKR ${Math.round(n).toLocaleString()}`;

export default function TrackPage() {
  usePublicLanguage();
  const t = useT();
  const { cardId } = useParams<{ cardId: string }>();
  const { data, isLoading, isError } = usePublicTrack(cardId);
  useDocumentTitle(t("public.trackStatus"));

  if (isLoading) return <CenterSpinner label={t("common.loading")} brandColor={undefined} />;
  if (isError || !data) return <NotFound label={t("public.trackNotFound")} />;

  const brandColor = resolveBrandColor(data.brand_color);

  const isCancelled = data.status === "cancelled";
  const isCompleted = data.status === "completed";
  const isInProgress = data.status === "in_progress";

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-4">
      <div className="max-w-[480px] mx-auto mb-3 flex justify-end print:hidden">
        <AuthLanguageToggle />
      </div>
      <div className="max-w-[480px] mx-auto bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-[0_4px_24px_rgba(15,23,42,0.08)]">
        <div className="text-white px-6 py-7" style={brandHeaderStyle(data.brand_color)}>
          <Brand />
          <h1 className="text-xl font-extrabold tracking-tight">{data.workshop_name}</h1>
          <p className="text-[13px] opacity-75 mt-0.5">{t("public.trackStatus")}</p>
        </div>

        <div className="p-6">
          <div className="text-center mb-6">
            <Plate text={data.vehicle_number} />
            {data.vehicle_make && (
              <p className="text-[13px] text-slate-500 mt-2.5">{data.vehicle_make}</p>
            )}
          </div>

          {isCancelled ? (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3.5 text-sm font-semibold text-center">
              {t("public.jobCancelled")}
            </div>
          ) : (
            <div className="mb-6">
              <SectionTitle>{t("public.status")}</SectionTitle>
              <ol className="relative">
                <Step done label={t("public.stepReceived")} sub={data.created_at} connector />
                <Step
                  done={isCompleted}
                  active={isInProgress}
                  index={2}
                  label={t("public.stepInProgress")}
                  brandColor={brandColor}
                  connector
                />
                <Step
                  done={isCompleted}
                  index={3}
                  label={t("public.stepReady")}
                  sub={isCompleted ? data.completed_at : undefined}
                  brandColor={brandColor}
                />
              </ol>
            </div>
          )}

          {data.description && (
            <div className="mb-6">
              <SectionTitle>{t("public.workDone")}</SectionTitle>
              <p className="text-sm text-slate-700 leading-relaxed">{data.description}</p>
            </div>
          )}

          <div className="mb-2">
            <SectionTitle>
              {isCompleted ? t("public.charges") : t("public.runningBill")}
            </SectionTitle>
            <div className="flex justify-between py-2 border-b border-slate-100 text-sm">
              <span className="text-slate-500">{t("public.labour")}</span>
              <span className="font-semibold">{fmt(data.labour_charge)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100 text-sm">
              <span className="text-slate-500">{t("public.parts")}</span>
              <span className="font-semibold">{fmt(data.parts_charge)}</span>
            </div>
            <div
              className="flex justify-between items-center pt-3 mt-1 border-t-2 text-lg font-extrabold"
              style={{ ...brandBorderStyle(data.brand_color), ...brandAccentStyle(data.brand_color) }}
            >
              <span>{t("public.total")}</span>
              <span>{fmt(data.total_amount)}</span>
            </div>
          </div>

          {data.invoice_number && (
            <a
              href={`/invoices/${data.invoice_number}`}
              style={brandButtonClass(data.brand_color)}
              className="mt-4 flex items-center justify-center gap-2 hover:opacity-90 text-white font-bold text-[15px] py-3.5 rounded-2xl transition active:scale-95"
            >
              <FileText size={16} />
              {t("public.viewInvoice")}
            </a>
          )}
        </div>

        <div className="text-center px-6 py-4 border-t border-slate-100 text-xs text-slate-400">
          {t("public.thankYou").replace("{workshop}", data.workshop_name)}
          <div className="mt-1.5 font-semibold text-slate-300">{t("public.poweredBy")}</div>
        </div>
      </div>
    </div>
  );
}

function Step({
  done = false,
  active = false,
  index,
  label,
  sub,
  connector = false,
  brandColor = "#1d4ed8",
}: {
  done?: boolean;
  active?: boolean;
  index?: number;
  label: string;
  sub?: string;
  connector?: boolean;
  brandColor?: string;
}) {
  return (
    <li className="flex items-start gap-3 pb-[18px] last:pb-0 relative">
      {connector && (
        <span className="absolute start-3 top-7 bottom-0 w-0.5 bg-slate-200" aria-hidden />
      )}
      <span
        className={`w-[26px] h-[26px] rounded-full flex items-center justify-center text-xs font-bold shrink-0 z-10 ${
          done
            ? "bg-emerald-500 text-white"
            : active
              ? "text-white ring-4 ring-blue-100"
              : "bg-slate-200 text-slate-400"
        }`}
        style={active && !done ? { backgroundColor: brandColor } : undefined}
      >
        {done ? <Check size={14} /> : index}
      </span>
      <div className="pt-0.5">
        <div className={`text-[15px] font-bold ${done || active ? "text-slate-900" : "text-slate-400 font-medium"}`}>
          {label}
        </div>
        {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
      </div>
    </li>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-3">{children}</div>
  );
}

function Brand() {
  return (
    <span className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.12em] uppercase opacity-80 mb-3">
      <span className="w-[22px] h-[22px] rounded-lg bg-white/20 flex items-center justify-center">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>
      </span>
      GarageOS
    </span>
  );
}

function Plate({ text }: { text: string }) {
  return (
    <span
      data-keep-ltr
      className="inline-flex items-center border-2 border-slate-800 rounded-lg px-4 py-1.5 font-mono font-extrabold text-lg tracking-[0.1em] text-slate-900"
      style={{ background: "linear-gradient(135deg,#fef08a 0%,#fde047 60%,#facc15 100%)" }}
    >
      {text}
    </span>
  );
}

function CenterSpinner({ label, brandColor }: { label: string; brandColor?: string | null }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 gap-3" role="status">
      <Loader2 className="animate-spin" size={28} style={{ color: resolveBrandColor(brandColor) }} aria-hidden />
      <span className="sr-only">{label}</span>
    </div>
  );
}

function NotFound({ label }: { label: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 text-slate-400 gap-3 px-6 text-center">
      <FileX size={40} aria-hidden />
      <p className="text-sm font-semibold text-slate-500">{label}</p>
    </div>
  );
}

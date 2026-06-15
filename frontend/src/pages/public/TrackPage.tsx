import { useParams } from "react-router-dom";
import { Check, FileText, FileX } from "lucide-react";
import VehiclePlate from "../../components/VehiclePlate";
import {
  PublicBrand,
  PublicCard,
  PublicCenterSpinner,
  PublicNotFound,
  PublicPageShell,
  PublicSectionTitle,
} from "../../components/PublicPageShell";
import { usePublicTrack } from "../../hooks/usePublic";
import { usePublicLanguage } from "../../i18n/usePublicLanguage";
import { useLanguageStore } from "../../stores/languageStore";
import { formatLocaleDateStr } from "../../utils/dates";
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
  const language = useLanguageStore((s) => s.language);
  const { cardId } = useParams<{ cardId: string }>();
  const { data, isLoading, isError } = usePublicTrack(cardId);
  useDocumentTitle(t("public.trackStatus"));

  if (isLoading) return <PublicCenterSpinner label={t("common.loading")} />;
  if (isError || !data) {
    return <PublicNotFound icon={<FileX size={40} />} title={t("public.trackNotFound")} />;
  }

  const brandColor = resolveBrandColor(data.brand_color);

  const formatStepDate = (dateStr: string) =>
    formatLocaleDateStr(dateStr, language, {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const isCancelled = data.status === "cancelled";
  const isCompleted = data.status === "completed";
  const isInProgress = data.status === "in_progress";

  return (
    <PublicPageShell maxWidth={480}>
      <PublicCard>
        <div className="text-white px-6 py-7" style={brandHeaderStyle(data.brand_color)}>
          <PublicBrand />
          <h1 className="text-xl font-extrabold tracking-tight">{data.workshop_name}</h1>
          <p className="text-[13px] opacity-75 mt-0.5">{t("public.trackStatus")}</p>
        </div>

        <div className="p-6">
          <div className="text-center mb-6">
            <VehiclePlate number={data.vehicle_number} size="md" />
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
              <PublicSectionTitle>{t("public.status")}</PublicSectionTitle>
              <ol className="relative">
                <Step done label={t("public.stepReceived")} sub={formatStepDate(data.created_at)} connector />
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
                  sub={isCompleted && data.completed_at ? formatStepDate(data.completed_at) : undefined}
                  brandColor={brandColor}
                />
              </ol>
            </div>
          )}

          {data.description && (
            <div className="mb-6">
              <PublicSectionTitle>{t("public.workDone")}</PublicSectionTitle>
              <p className="text-sm text-slate-700 leading-relaxed">{data.description}</p>
            </div>
          )}

          <div className="mb-2">
            <PublicSectionTitle>
              {isCompleted ? t("public.charges") : t("public.runningBill")}
            </PublicSectionTitle>
            <div className="flex justify-between py-2 border-b border-slate-100 text-sm">
              <span className="text-slate-500">{t("public.labour")}</span>
              <span className="font-semibold tnum" data-keep-ltr>{fmt(data.labour_charge)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100 text-sm">
              <span className="text-slate-500">{t("public.parts")}</span>
              <span className="font-semibold tnum" data-keep-ltr>{fmt(data.parts_charge)}</span>
            </div>
            <div
              className="flex justify-between items-center pt-3 mt-1 border-t-2 text-lg font-extrabold"
              style={{ ...brandBorderStyle(data.brand_color), ...brandAccentStyle(data.brand_color) }}
            >
              <span>{t("public.total")}</span>
              <span className="tnum" data-keep-ltr>{fmt(data.total_amount)}</span>
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
      </PublicCard>
    </PublicPageShell>
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

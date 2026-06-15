import { useParams } from "react-router-dom";
import { Download, FileX, Printer } from "lucide-react";
import VehiclePlate from "../../components/VehiclePlate";
import {
  PublicBrand,
  PublicCard,
  PublicCenterSpinner,
  PublicNotFound,
  PublicPageShell,
  PublicSectionTitle,
} from "../../components/PublicPageShell";
import { Button, Badge } from "../../components/ui";
import { usePublicInvoice } from "../../hooks/usePublic";
import { usePublicLanguage } from "../../i18n/usePublicLanguage";
import { useLanguageStore } from "../../stores/languageStore";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { useT } from "../../i18n/useT";
import { formatLocaleDateStr } from "../../utils/dates";
import {
  brandAccentStyle,
  brandBorderStyle,
  brandButtonClass,
  brandHeaderStyle,
} from "../../utils/brandColor";

const fmt = (n: number) => `PKR ${Math.round(n).toLocaleString()}`;
const apiBase = import.meta.env.VITE_API_URL || "/api/v1";

export default function InvoicePage() {
  usePublicLanguage();
  const t = useT();
  const language = useLanguageStore((s) => s.language);
  const { invoiceNumber } = useParams<{ invoiceNumber: string }>();
  const { data, isLoading, isError } = usePublicInvoice(invoiceNumber);
  useDocumentTitle(invoiceNumber ? `${t("public.invoiceNo")} ${invoiceNumber}` : t("public.taxInvoice"));

  if (isLoading) return <PublicCenterSpinner label={t("common.loading")} />;
  if (isError || !data) {
    return <PublicNotFound icon={<FileX size={40} />} title={t("public.invoiceNotFound")} />;
  }

  const pdfUrl = `${apiBase}/public/invoices/${data.invoice_number}/pdf`;
  const completedDate = formatLocaleDateStr(data.completed_at, language, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <PublicPageShell
      maxWidth={600}
      actions={
        <>
          <Button variant="primary" size="sm" asChild style={brandButtonClass(data.brand_color)}>
            <a href={pdfUrl} target="_blank" rel="noreferrer">
              <Download size={15} />
              {t("public.downloadPdf")}
            </a>
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => window.print()}
            style={brandButtonClass(data.brand_color)}
            leftIcon={<Printer size={15} />}
          >
            {t("public.printPdf")}
          </Button>
        </>
      }
    >
      <PublicCard>
        <div className="text-white px-6 py-7" style={brandHeaderStyle(data.brand_color)}>
          <PublicBrand />
          <h1 className="text-[22px] font-extrabold tracking-tight">{data.workshop_name}</h1>
          <p className="text-[13px] opacity-75 mt-0.5">{t("public.taxInvoice")}</p>
        </div>

        <div className="p-6">
          <Section title={t("public.invoiceDetails")}>
            <Row label={t("public.invoiceNo")} value={data.invoice_number} />
            <Row label={t("public.date")} value={completedDate} />
            <Row
              label={t("status.completed")}
              value={<Badge tone="success">{t("status.completed")}</Badge>}
            />
          </Section>

          <Section title={t("public.customerVehicle")}>
            <Row label={t("public.customer")} value={data.customer_name} />
            <Row label={t("public.phone")} value={<span data-keep-ltr>{data.customer_phone}</span>} />
            <Row label={t("public.vehicleNo")} value={<VehiclePlate number={data.vehicle_number} size="sm" />} />
            {data.description && <Row label={t("public.workDone")} value={data.description} />}
          </Section>

          <Section title={t("public.charges")}>
            {data.parts.length > 0 && (
              <table className="w-full border-collapse text-sm mb-3">
                <thead>
                  <tr className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    <th className="text-start py-1.5 border-b border-slate-200">{t("public.partItem")}</th>
                    <th className="text-center py-1.5 border-b border-slate-200">{t("public.qty")}</th>
                    <th className="text-end py-1.5 border-b border-slate-200">{t("public.unit")}</th>
                    <th className="text-end py-1.5 border-b border-slate-200">{t("public.amount")}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.parts.map((p, i) => (
                    <tr key={i}>
                      <td className="py-2 border-b border-slate-100">{p.name}</td>
                      <td className="py-2 border-b border-slate-100 text-center text-slate-400 text-[13px] tnum" data-keep-ltr>
                        {p.quantity}
                      </td>
                      <td className="py-2 border-b border-slate-100 text-end text-slate-400 text-[13px] tnum" data-keep-ltr>
                        {p.unit_price.toLocaleString()}
                      </td>
                      <td className="py-2 border-b border-slate-100 text-end font-semibold tnum" data-keep-ltr>
                        {p.line_total.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div className="flex justify-between py-1.5 text-sm">
              <span className="text-slate-500">{t("public.labour")}</span>
              <span className="tnum" data-keep-ltr>{fmt(data.labour_charge)}</span>
            </div>
            <div className="flex justify-between py-1.5 text-sm">
              <span className="text-slate-500">{t("public.parts")}</span>
              <span className="tnum" data-keep-ltr>{fmt(data.parts_charge)}</span>
            </div>
            <div
              className="flex justify-between items-center pt-3.5 mt-2.5 border-t-2 text-[19px] font-extrabold"
              style={{ ...brandBorderStyle(data.brand_color), ...brandAccentStyle(data.brand_color) }}
            >
              <span>{t("public.total")}</span>
              <span className="tnum" data-keep-ltr>{fmt(data.total_amount)}</span>
            </div>
          </Section>

          {data.workshop_bank_details && (
            <Section title={t("public.paymentDetails")}>
              <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5">
                <p className="text-[13px] text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {data.workshop_bank_details}
                </p>
              </div>
            </Section>
          )}
        </div>

        <div className="text-center px-6 py-4 border-t border-slate-100 text-xs text-slate-400 whitespace-pre-wrap leading-relaxed">
          {data.workshop_invoice_footer ||
            [data.workshop_address, data.workshop_whatsapp && `WhatsApp: ${data.workshop_whatsapp}`]
              .filter(Boolean)
              .join("  |  ")}
          <div className="mt-2 font-semibold text-slate-300">{t("public.poweredBy")}</div>
        </div>
      </PublicCard>
    </PublicPageShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5 last:mb-0">
      <PublicSectionTitle>{title}</PublicSectionTitle>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center gap-3 py-2 border-b border-slate-100 last:border-b-0 text-[15px]">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-end">{value}</span>
    </div>
  );
}

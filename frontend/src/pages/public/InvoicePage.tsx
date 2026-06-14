import { useParams } from "react-router-dom";
import { FileX, Loader2, Printer } from "lucide-react";
import { usePublicInvoice } from "../../hooks/usePublic";
import { useForceLtr } from "../../i18n/useForceLtr";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";

const fmt = (n: number) => `PKR ${Math.round(n).toLocaleString()}`;

export default function InvoicePage() {
  useForceLtr();
  const { invoiceNumber } = useParams<{ invoiceNumber: string }>();
  const { data, isLoading, isError } = usePublicInvoice(invoiceNumber);
  useDocumentTitle(invoiceNumber ? `Invoice ${invoiceNumber}` : "Invoice");

  if (isLoading) return <CenterSpinner />;
  if (isError || !data) return <NotFound label="Invoice not found" />;

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-4 print:bg-white print:p-0">
      <div className="max-w-[600px] mx-auto mb-3.5 flex justify-end print:hidden">
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-sm font-bold px-4 py-2.5 rounded-xl transition active:scale-95"
        >
          <Printer size={15} />
          Print / Save PDF
        </button>
      </div>

      <div className="max-w-[600px] mx-auto bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-[0_4px_24px_rgba(15,23,42,0.08)] print:shadow-none print:border-0 print:rounded-none">
        {/* Header */}
        <div className="bg-gradient-to-br from-[#1d4ed8] to-[#1e3a8a] text-white px-6 py-7">
          <Brand />
          <h1 className="text-[22px] font-extrabold tracking-tight">{data.workshop_name}</h1>
          <p className="text-[13px] opacity-75 mt-0.5">Tax Invoice</p>
        </div>

        <div className="p-6">
          <Section title="Invoice Details">
            <Row label="Invoice No." value={data.invoice_number} />
            <Row label="Date" value={data.completed_at} />
            <Row
              label="Status"
              value={
                <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                  Completed
                </span>
              }
            />
          </Section>

          <Section title="Customer & Vehicle">
            <Row label="Customer" value={data.customer_name} />
            <Row label="Phone" value={<span data-keep-ltr>{data.customer_phone}</span>} />
            <Row label="Vehicle No." value={<Plate text={data.vehicle_number} />} />
            {data.description && <Row label="Work Done" value={data.description} />}
          </Section>

          <Section title="Charges">
            {data.parts.length > 0 && (
              <table className="w-full border-collapse text-sm mb-3">
                <thead>
                  <tr className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    <th className="text-left py-1.5 border-b border-slate-200">Part / Item</th>
                    <th className="text-center py-1.5 border-b border-slate-200">Qty</th>
                    <th className="text-right py-1.5 border-b border-slate-200">Unit</th>
                    <th className="text-right py-1.5 border-b border-slate-200">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {data.parts.map((p, i) => (
                    <tr key={i}>
                      <td className="py-2 border-b border-slate-100">{p.name}</td>
                      <td className="py-2 border-b border-slate-100 text-center text-slate-400 text-[13px]">
                        {p.quantity}
                      </td>
                      <td className="py-2 border-b border-slate-100 text-right text-slate-400 text-[13px]">
                        {p.unit_price.toLocaleString()}
                      </td>
                      <td className="py-2 border-b border-slate-100 text-right font-semibold">
                        {p.line_total.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div className="flex justify-between py-1.5 text-sm">
              <span className="text-slate-500">Labour</span>
              <span>{fmt(data.labour_charge)}</span>
            </div>
            <div className="flex justify-between py-1.5 text-sm">
              <span className="text-slate-500">Parts</span>
              <span>{fmt(data.parts_charge)}</span>
            </div>
            <div className="flex justify-between items-center pt-3.5 mt-2.5 border-t-2 border-[#1d4ed8] text-[19px] font-extrabold text-[#1d4ed8]">
              <span>Total</span>
              <span>{fmt(data.total_amount)}</span>
            </div>
          </Section>

          {data.workshop_bank_details && (
            <Section title="Payment Details">
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
          <div className="mt-2 font-semibold text-slate-300">Powered by GarageOS</div>
        </div>
      </div>
    </div>
  );
}

// ── Shared bits ───────────────────────────────────────────────────────────────

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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5 last:mb-0">
      <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-2.5">{title}</div>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center gap-3 py-2 border-b border-slate-100 last:border-b-0 text-[15px]">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-right">{value}</span>
    </div>
  );
}

function Plate({ text }: { text: string }) {
  return (
    <span
      data-keep-ltr
      className="inline-flex items-center border-2 border-slate-800 rounded-md px-3 py-1 font-mono font-extrabold text-sm tracking-[0.12em] text-slate-900"
      style={{ background: "linear-gradient(135deg,#fef08a 0%,#fde047 60%,#facc15 100%)" }}
    >
      {text}
    </span>
  );
}

function CenterSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <Loader2 className="animate-spin text-[#1d4ed8]" size={28} />
    </div>
  );
}

function NotFound({ label }: { label: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 text-slate-400 gap-3 px-6 text-center">
      <FileX size={40} />
      <p className="text-sm font-semibold text-slate-500">{label}</p>
    </div>
  );
}

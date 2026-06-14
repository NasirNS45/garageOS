import { useQuery } from "@tanstack/react-query";
import { api } from "../api/axios";

export interface PublicInvoicePart {
  name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface PublicInvoice {
  invoice_number: string;
  workshop_name: string;
  workshop_address: string;
  workshop_whatsapp: string;
  workshop_bank_details: string;
  workshop_invoice_footer: string;
  customer_name: string;
  customer_phone: string;
  vehicle_number: string;
  description: string;
  labour_charge: number;
  parts_charge: number;
  total_amount: number;
  parts: PublicInvoicePart[];
  completed_at: string;
}

export interface PublicTrack {
  workshop_name: string;
  vehicle_number: string;
  vehicle_make: string;
  status: string;
  description: string;
  labour_charge: number;
  parts_charge: number;
  total_amount: number;
  created_at: string;
  completed_at: string;
  invoice_number: string | null;
}

export function usePublicInvoice(invoiceNumber: string | undefined) {
  return useQuery({
    queryKey: ["public", "invoice", invoiceNumber],
    queryFn: () =>
      api.get<PublicInvoice>(`/public/invoices/${invoiceNumber}`).then((r) => r.data),
    enabled: !!invoiceNumber,
    retry: false,
  });
}

export function usePublicTrack(cardId: string | undefined) {
  return useQuery({
    queryKey: ["public", "track", cardId],
    queryFn: () => api.get<PublicTrack>(`/public/track/${cardId}`).then((r) => r.data),
    enabled: !!cardId,
    retry: false,
  });
}

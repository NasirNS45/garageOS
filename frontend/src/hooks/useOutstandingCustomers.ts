import { useQuery } from "@tanstack/react-query";
import { api } from "../api/axios";

export interface OutstandingCustomer {
  customer_name: string;
  customer_phone: string;
  total_outstanding: number;
  open_invoices: number;
}

export function useOutstandingCustomers(limit = 10) {
  return useQuery({
    queryKey: ["customers", "outstanding", limit],
    queryFn: () =>
      api
        .get<OutstandingCustomer[]>(`/customers/outstanding?limit=${limit}`)
        .then((r) => r.data),
    staleTime: 60_000,
  });
}

import { useQuery } from "@tanstack/react-query";
import { api } from "../api/axios";

export interface TopCustomer {
  customer_name: string;
  customer_phone: string;
  total_jobs: number;
  total_spent: number;
  last_visit: string | null;
}

export function useCustomerInsights(limit = 10) {
  return useQuery({
    queryKey: ["customers", "insights", limit],
    queryFn: () =>
      api.get<TopCustomer[]>(`/customers/insights?limit=${limit}`).then((r) => r.data),
    staleTime: 60_000,
  });
}

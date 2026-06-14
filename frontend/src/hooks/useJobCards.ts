import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/axios";

export interface JobPart {
  id: string;
  job_card_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  created_at: string;
}

export interface JobPartCreate {
  name: string;
  quantity: number;
  unit_price: number;
}

export interface JobCard {
  id: string;
  vehicle_number: string;
  vehicle_make: string | null;
  customer_name: string;
  customer_phone: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  payment_status: "unpaid" | "paid";
  collected_amount: number;
  payment_method: string | null;
  assigned_mechanic_id: string | null;
  description: string | null;
  labour_charge: number;
  parts_charge: number;
  total_amount: number;
  invoice_number: string | null;
  invoice_url: string | null;
  track_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  parts: JobPart[];
}

export interface JobCardCreate {
  vehicle_number: string;
  vehicle_make?: string;
  customer_name: string;
  customer_phone: string;
  description?: string;
  labour_charge: number;
  parts_charge: number;
  notes?: string;
  assigned_mechanic_id?: string;
  notify_checkin?: boolean;
}

export interface CompletePayload {
  id: string;
  notify_customer?: boolean;
}

const KEYS = {
  list: (page: number, filters?: JobCardListFilters) => ["job-cards", page, filters],
  single: (id: string) => ["job-cards", id],
  parts: (id: string) => ["job-cards", id, "parts"],
};

export interface JobCardListFilters {
  activeOnly?: boolean;
  status?: JobCard["status"];
  paymentStatus?: JobCard["payment_status"];
  search?: string;
}

export function useJobCards(page = 1, filters: JobCardListFilters = { activeOnly: true }) {
  return useQuery({
    queryKey: KEYS.list(page, filters),
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page),
        page_size: "20",
        active_only: filters.activeOnly === false ? "false" : "true",
      });
      if (filters.status) params.set("status", filters.status);
      if (filters.paymentStatus) params.set("payment_status", filters.paymentStatus);
      if (filters.search?.trim()) params.set("search", filters.search.trim());
      return api
        .get<{ items: JobCard[]; total: number; page: number; page_size: number }>(
          `/job-cards?${params.toString()}`
        )
        .then((r) => r.data);
    },
  });
}

export function useCreateJobCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: JobCardCreate) =>
      api.post<JobCard>("/job-cards", data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["job-cards"] }),
  });
}

export function useUpdateJobCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<JobCard> & { id: string }) =>
      api.put<JobCard>(`/job-cards/${id}`, data).then((r) => r.data),
    onMutate: async ({ id, ...data }) => {
      await qc.cancelQueries({ queryKey: ["job-cards"] });
      const snapshot = patchJobInLists(qc, id, data as Partial<JobCard>);
      return { snapshot };
    },
    onError: (_e, _vars, ctx) => {
      ctx?.snapshot?.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["job-cards"] }),
  });
}

export function useCompleteJobCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notify_customer = true }: CompletePayload) =>
      api
        .put<JobCard>(`/job-cards/${id}/complete`, { notify_customer })
        .then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["job-cards"] }),
  });
}

export function useCancelJobCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/job-cards/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["job-cards"] }),
  });
}

export function useAddPart(cardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: JobPartCreate) =>
      api.post<JobPart>(`/job-cards/${cardId}/parts`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["job-cards"] }),
  });
}

export function useRemovePart(cardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (partId: string) =>
      api.delete(`/job-cards/${cardId}/parts/${partId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["job-cards"] }),
  });
}

export interface JobPartUpdate {
  name?: string;
  quantity?: number;
  unit_price?: number;
}

export function useUpdatePart(cardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ partId, ...data }: { partId: string } & JobPartUpdate) =>
      api
        .patch<JobPart>(`/job-cards/${cardId}/parts/${partId}`, data)
        .then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["job-cards"] }),
  });
}

/** Patch a single job inside every cached job-cards list page. */
function patchJobInLists(
  qc: ReturnType<typeof useQueryClient>,
  id: string,
  patch: Partial<JobCard>
) {
  const lists = qc.getQueriesData<{ items: JobCard[] }>({ queryKey: ["job-cards"] });
  lists.forEach(([key, data]) => {
    if (!data?.items) return;
    qc.setQueryData(key, {
      ...data,
      items: data.items.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    });
  });
  return lists; // snapshot for rollback
}

export function useMarkPaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payment_status,
    }: {
      id: string;
      payment_status: "paid" | "unpaid";
    }) =>
      api
        .put<JobCard>(`/job-cards/${id}`, { payment_status })
        .then((r) => r.data),
    onMutate: async ({ id, payment_status }) => {
      await qc.cancelQueries({ queryKey: ["job-cards"] });
      const snapshot = patchJobInLists(qc, id, { payment_status });
      return { snapshot };
    },
    onError: (_e, _vars, ctx) => {
      ctx?.snapshot?.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["job-cards"] });
      qc.invalidateQueries({ queryKey: ["summary"] });
    },
  });
}

export interface PaymentUpdatePayload {
  id: string;
  collected_amount: number;
  payment_method?: string;
}

export function useUpdatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: PaymentUpdatePayload) =>
      api.patch<JobCard>(`/job-cards/${id}/payment`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["job-cards"] });
      qc.invalidateQueries({ queryKey: ["summary"] });
    },
  });
}

export interface SummaryData {
  total_jobs: number;
  completed_jobs: number;
  in_progress_jobs: number;
  pending_jobs: number;
  total_revenue: number;
  total_collected: number;
}

export function useSummary(targetDate?: string) {
  return useQuery({
    queryKey: ["summary", "daily", targetDate ?? "today"],
    queryFn: () => {
      const url = targetDate
        ? `/summary/daily?target_date=${targetDate}`
        : "/summary/daily";
      return api.get<SummaryData>(url).then((r) => r.data);
    },
  });
}

export interface RangeSummaryData {
  start_date: string;
  end_date: string;
  total_jobs: number;
  completed_jobs: number;
  in_progress_jobs: number;
  pending_jobs: number;
  total_revenue: number;
  total_collected: number;
  total_expenses: number;
  net_profit: number;
}

export function useRangeSummary(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["summary", "range", startDate, endDate],
    queryFn: () =>
      api
        .get<RangeSummaryData>(
          `/summary/range?start_date=${startDate}&end_date=${endDate}`
        )
        .then((r) => r.data),
    placeholderData: keepPreviousData,
  });
}

export interface MechanicSummaryItem {
  mechanic_id: string;
  full_name: string;
  completed_jobs: number;
  total_labour: number;
  total_revenue: number;
}

export function useMechanicSummary(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["summary", "mechanics", startDate, endDate],
    queryFn: () =>
      api
        .get<MechanicSummaryItem[]>(
          `/summary/mechanics?start_date=${startDate}&end_date=${endDate}`
        )
        .then((r) => r.data),
    placeholderData: keepPreviousData,
  });
}

export interface DailySeriesPoint {
  date: string;
  revenue: number;
  collected: number;
  expenses: number;
}

export function useDailySeries(startDate: string, endDate: string, enabled = true) {
  return useQuery({
    queryKey: ["summary", "series", startDate, endDate],
    queryFn: () =>
      api
        .get<DailySeriesPoint[]>(
          `/summary/daily-series?start_date=${startDate}&end_date=${endDate}`
        )
        .then((r) => r.data),
    placeholderData: keepPreviousData,
    enabled,
  });
}

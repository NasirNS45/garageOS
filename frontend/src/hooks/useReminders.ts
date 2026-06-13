import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/axios";

export interface ServiceReminder {
  id: string;
  customer_name: string;
  customer_phone: string;
  vehicle_number: string;
  service_note: string | null;
  due_date: string;
  status: string;
  created_at: string;
  sent_at: string | null;
}

export function useReminders() {
  return useQuery({
    queryKey: ["reminders"],
    queryFn: () => api.get<ServiceReminder[]>("/reminders").then((r) => r.data),
    staleTime: 30_000,
  });
}

export function useCancelReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/reminders/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reminders"] }),
  });
}

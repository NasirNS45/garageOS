import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/axios";

export interface Mechanic {
  id: string;
  mobile: string;
  full_name: string;
  is_active: boolean;
  is_available: boolean;
}

export function useMechanics() {
  return useQuery({
    queryKey: ["mechanics"],
    queryFn: () =>
      api.get<Mechanic[]>("/auth/mechanics").then((r) => r.data),
    staleTime: 30_000,
  });
}

export function useAddMechanic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { full_name: string; mobile: string; password: string }) =>
      api.post<Mechanic>("/auth/mechanics", data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mechanics"] }),
  });
}

export function useToggleMechanic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      api.patch<Mechanic>(`/auth/mechanics/${id}`, { is_active }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mechanics"] }),
  });
}

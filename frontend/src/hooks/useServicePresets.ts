import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/axios";

export interface ServicePreset {
  id: string;
  workshop_id: string;
  name: string;
  description: string | null;
  default_labour: number;
  created_at: string;
}

export interface ServicePresetCreate {
  name: string;
  description?: string;
  default_labour: number;
}

export function useServicePresets() {
  return useQuery({
    queryKey: ["service-presets"],
    queryFn: () =>
      api.get<ServicePreset[]>("/service-presets").then((r) => r.data),
  });
}

export function useCreatePreset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ServicePresetCreate) =>
      api.post<ServicePreset>("/service-presets", data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["service-presets"] }),
  });
}

export function useDeletePreset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/service-presets/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["service-presets"] }),
  });
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/axios";

export interface PartCatalogItem {
  id: string;
  workshop_id: string;
  name: string;
  default_price: number;
  created_at: string;
}

interface PartCatalogCreate {
  name: string;
  default_price: number;
}

export function usePartCatalog() {
  return useQuery({
    queryKey: ["part-catalog"],
    queryFn: () => api.get<PartCatalogItem[]>("/part-catalog").then((r) => r.data),
  });
}

export function useCreatePartCatalogItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: PartCatalogCreate) =>
      api.post<PartCatalogItem>("/part-catalog", data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["part-catalog"] }),
  });
}

export function useDeletePartCatalogItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/part-catalog/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["part-catalog"] }),
  });
}

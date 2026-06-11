import { useQuery } from "@tanstack/react-query";
import { api } from "../api/axios";

interface VehicleJob {
  id: string;
  vehicle_number: string;
  status: string;
  total_amount: number;
  created_at: string;
  completed_at: string | null;
}

interface VehicleHistoryResult {
  customer_name: string;
  customer_phone: string;
  total_jobs: number;
  jobs: VehicleJob[];
}

export function useVehicleHistory(vehicleNumber: string) {
  const trimmed = vehicleNumber.trim().toUpperCase();
  return useQuery({
    queryKey: ["vehicle-history", trimmed],
    queryFn: () =>
      api
        .get<VehicleHistoryResult>(
          `/customers/history?vehicle_number=${encodeURIComponent(trimmed)}`
        )
        .then((r) => r.data),
    enabled: trimmed.length >= 3,
    staleTime: 30_000,
    retry: false,
  });
}

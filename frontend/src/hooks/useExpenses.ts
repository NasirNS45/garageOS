import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/axios";

export type ExpenseCategory =
  | "parts_purchase"
  | "utilities"
  | "wages"
  | "rent"
  | "other";

export interface Expense {
  id: string;
  expense_date: string;
  category: ExpenseCategory;
  amount: number;
  note: string | null;
  created_at: string;
}

export interface ExpenseCreate {
  expense_date: string;
  category: ExpenseCategory;
  amount: number;
  note?: string;
}

export interface ExpenseListData {
  items: Expense[];
  total: number;
  total_amount: number;
}

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  parts_purchase: "Parts purchase",
  utilities: "Utilities",
  wages: "Wages",
  rent: "Rent",
  other: "Other",
};

export function useExpenses(startDate: string, endDate: string, enabled = true) {
  return useQuery({
    queryKey: ["expenses", startDate, endDate],
    queryFn: () =>
      api
        .get<ExpenseListData>(`/expenses?start_date=${startDate}&end_date=${endDate}`)
        .then((r) => r.data),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ExpenseCreate) =>
      api.post<Expense>("/expenses", data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      qc.invalidateQueries({ queryKey: ["summary"] });
    },
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/expenses/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      qc.invalidateQueries({ queryKey: ["summary"] });
    },
  });
}

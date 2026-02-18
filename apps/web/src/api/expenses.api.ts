import { apiClient } from './client';

export interface Expense {
  id: string;
  category: string;
  description: string | null;
  amount: number;
  expense_date: string;
  is_recurring: boolean;
  recurrence_period: string | null;
  created_by?: string | null;
  created_by_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateExpenseData {
  category: string;
  description?: string;
  amount: number;
  expense_date: string;
  is_recurring?: boolean;
  recurrence_period?: string;
}

export const expensesApi = {
  getAll: (params: Record<string, string | number> = {}) => apiClient.get<Expense[]>('/expenses', params),
  getById: (id: string) => apiClient.get<Expense>(`/expenses/${id}`),
  create: (data: CreateExpenseData) => apiClient.post<Expense>('/expenses', data),
  update: (id: string, data: Partial<CreateExpenseData>) => apiClient.patch<Expense>(`/expenses/${id}`, data),
  delete: (id: string) => apiClient.delete<{ message: string }>(`/expenses/${id}`),
  getByCategory: (params?: { startDate?: string; endDate?: string }) => apiClient.get<{ category: string; total: number }[]>('/expenses/by-category', params as any),
};

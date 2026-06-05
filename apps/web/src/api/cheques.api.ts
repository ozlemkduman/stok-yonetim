import { apiClient } from './client';

export interface Cheque {
  id: string;
  type: 'cek' | 'senet';
  direction: 'incoming' | 'outgoing';
  cheque_number: string | null;
  bank_name: string | null;
  drawer_name: string | null;
  customer_id: string | null;
  customer_name?: string;
  supplier_id: string | null;
  supplier_name?: string;
  amount: number;
  issue_date: string | null;
  due_date: string;
  status: 'in_portfolio' | 'collected' | 'cashed_out' | 'bounced' | 'returned';
  account_id: string | null;
  account_name?: string;
  status_changed_at: string | null;
  notes: string | null;
  created_by_name?: string;
  created_at: string;
}

export interface CreateChequeData {
  type: 'cek' | 'senet';
  direction: 'incoming' | 'outgoing';
  cheque_number?: string;
  bank_name?: string;
  drawer_name?: string;
  customer_id?: string;
  supplier_id?: string;
  amount: number;
  issue_date?: string;
  due_date: string;
  notes?: string;
}

export interface UpdateChequeStatusData {
  status: Cheque['status'];
  account_id?: string;
  notes?: string;
}

export interface ChequesStats {
  incomingPortfolio: { count: number; total: number };
  outgoingPortfolio: { count: number; total: number };
  bouncedCount: number;
  overdueCount: number;
}

export const chequesApi = {
  getAll: (params: Record<string, string | number> = {}) => apiClient.get<Cheque[]>('/cheques', params),
  getStats: () => apiClient.get<ChequesStats>('/cheques/stats'),
  getById: (id: string) => apiClient.get<Cheque>(`/cheques/${id}`),
  create: (data: CreateChequeData) => apiClient.post<Cheque>('/cheques', data),
  updateStatus: (id: string, data: UpdateChequeStatusData) => apiClient.patch<Cheque>(`/cheques/${id}/status`, data),
  delete: (id: string) => apiClient.delete<{ message: string }>(`/cheques/${id}`),
};

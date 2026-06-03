import { apiClient } from './client';

export interface Payment {
  id: string;
  customer_id: string;
  sale_id: string | null;
  payment_date: string;
  amount: number;
  method: string;
  notes: string | null;
  created_at: string;
}

export interface CreatePaymentData {
  customer_id: string;
  sale_id?: string;
  amount: number;
  method: 'nakit' | 'kredi_karti' | 'havale';
  payment_date?: string;
  notes?: string;
}

export const paymentsApi = {
  getAll: (params: Record<string, string | number> = {}) =>
    apiClient.get<Payment[]>('/payments', params),
  create: (data: CreatePaymentData) => apiClient.post<Payment>('/payments', data),
};

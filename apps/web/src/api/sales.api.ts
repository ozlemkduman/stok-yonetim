import { apiClient } from './client';

export interface SaleItem {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  discount_rate: number;
  vat_rate: number;
  vat_amount: number;
  line_total: number;
  product_name?: string;
  barcode?: string;
}

export interface SalePayment {
  id: string;
  payment_date: string;
  amount: number;
  method: string;
  notes: string | null;
}

export interface Sale {
  id: string;
  invoice_number: string;
  customer_id: string | null;
  customer_name?: string;
  customer_phone?: string;
  customer_address?: string;
  customer_tax_number?: string;
  customer_tax_office?: string;
  sale_date: string;
  subtotal: number;
  discount_amount: number;
  discount_rate: number;
  vat_total: number;
  grand_total: number;
  include_vat: boolean;
  payment_method: string;
  due_date: string | null;
  status: string;
  notes: string | null;
  items?: SaleItem[];
}

export interface SaleDetail extends Sale {
  items: SaleItem[];
  payments: SalePayment[];
}

export interface CreateSaleData {
  customer_id?: string;
  items: { product_id: string; quantity: number; unit_price: number; discount_rate?: number }[];
  discount_amount?: number;
  discount_rate?: number;
  include_vat?: boolean;
  payment_method: string;
  due_date?: string;
  notes?: string;
}

export const salesApi = {
  getAll: (params: Record<string, string | number> = {}) => apiClient.get<Sale[]>('/sales', params),
  getById: (id: string) => apiClient.get<Sale>(`/sales/${id}`),
  getDetail: (id: string) => apiClient.get<SaleDetail>(`/sales/${id}/detail`),
  create: (data: CreateSaleData) => apiClient.post<Sale>('/sales', data),
  cancel: (id: string) => apiClient.patch<{ message: string }>(`/sales/${id}/cancel`, {}),
};

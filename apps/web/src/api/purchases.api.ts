import { apiClient } from './client';

export interface PurchaseItem {
  id: string;
  purchase_id: string;
  product_id: string;
  product_name?: string;
  barcode?: string;
  quantity: number;
  unit_price: number;
  discount_rate: number;
  vat_rate: number;
  vat_amount: number;
  line_total: number;
}

export interface Purchase {
  id: string;
  purchase_number: string;
  supplier_id: string | null;
  supplier_name?: string;
  warehouse_id: string | null;
  purchase_date: string;
  subtotal: number;
  discount_amount: number;
  discount_rate: number;
  vat_total: number;
  grand_total: number;
  include_vat: boolean;
  payment_method: string;
  due_date: string | null;
  status: string;
  supplier_invoice_no: string | null;
  notes: string | null;
  created_by_name?: string;
  created_at: string;
}

export interface PurchaseDetail extends Purchase {
  items: PurchaseItem[];
}

export interface CreatePurchaseData {
  supplier_id?: string;
  warehouse_id?: string;
  items: { product_id: string; quantity: number; unit_price: number; discount_rate?: number }[];
  discount_amount?: number;
  discount_rate?: number;
  include_vat?: boolean;
  payment_method: string;
  purchase_date?: string;
  due_date?: string;
  supplier_invoice_no?: string;
  notes?: string;
}

export interface PurchasesStats {
  count: number;
  total: number;
  cancelledCount: number;
  cancelledTotal: number;
}

export const purchasesApi = {
  getAll: (params: Record<string, string | number> = {}) => apiClient.get<Purchase[]>('/purchases', params),
  getStats: (params: Record<string, string | number> = {}) => apiClient.get<PurchasesStats>('/purchases/stats', params),
  getById: (id: string) => apiClient.get<PurchaseDetail>(`/purchases/${id}`),
  create: (data: CreatePurchaseData) => apiClient.post<Purchase>('/purchases', data),
  cancel: (id: string) => apiClient.patch<{ message: string }>(`/purchases/${id}/cancel`, {}),
};

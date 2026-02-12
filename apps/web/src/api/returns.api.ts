import { apiClient } from './client';

export interface ReturnItem {
  id: string;
  return_id: string;
  product_id: string;
  product_name: string;
  barcode: string | null;
  sale_item_id: string | null;
  quantity: number;
  unit_price: number;
  vat_amount: number;
  line_total: number;
}

export interface Return {
  id: string;
  return_number: string;
  sale_id: string | null;
  customer_id: string | null;
  customer_name: string | null;
  return_date: string;
  total_amount: number;
  vat_total: number;
  reason: string | null;
  status: string;
  created_at: string;
  sale_invoice_number?: string;
  sale_date?: string;
}

export interface ReturnDetail extends Return {
  items: ReturnItem[];
}

export interface ReturnListParams {
  page?: number;
  limit?: number;
  customerId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const returnsApi = {
  getAll: (params: ReturnListParams = {}) => {
    const queryParams: Record<string, string | number> = {};
    if (params.page) queryParams.page = params.page;
    if (params.limit) queryParams.limit = params.limit;
    if (params.customerId) queryParams.customerId = params.customerId;
    if (params.sortBy) queryParams.sortBy = params.sortBy;
    if (params.sortOrder) queryParams.sortOrder = params.sortOrder;
    return apiClient.get<Return[]>('/returns', queryParams);
  },

  getById: (id: string) => apiClient.get<ReturnDetail>(`/returns/${id}`),
};

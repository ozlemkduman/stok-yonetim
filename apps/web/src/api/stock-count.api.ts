import { apiClient } from './client';

export interface StockCountItem {
  id: string;
  session_id: string;
  product_id: string | null;
  product_name?: string;
  product_barcode?: string;
  product_unit?: string;
  product_is_active?: boolean;
  expected_quantity: number;
  counted_quantity: number | null;
  notes: string | null;
  counted_at: string | null;
  counted_by: string | null;
}

export interface StockCountSession {
  id: string;
  count_number: string;
  warehouse_id: string | null;
  warehouse_name?: string;
  started_at: string;
  completed_at: string | null;
  status: string;
  notes: string | null;
  created_by_name?: string;
  created_at: string;
}

export interface StockCountDetail extends StockCountSession {
  items: StockCountItem[];
}

export interface CreateStockCountData {
  warehouse_id?: string;
  notes?: string;
}

export interface UpdateStockCountItemData {
  counted_quantity: number;
  notes?: string;
}

export interface CompleteResult {
  updated: number;
  unchanged: number;
  skipped: number;
}

export const stockCountApi = {
  getAll: (params: Record<string, string | number> = {}) => apiClient.get<StockCountSession[]>('/stock-count', params),
  getById: (id: string) => apiClient.get<StockCountDetail>(`/stock-count/${id}`),
  create: (data: CreateStockCountData) => apiClient.post<StockCountSession>('/stock-count', data),
  updateItem: (sessionId: string, itemId: string, data: UpdateStockCountItemData) =>
    apiClient.patch<StockCountItem>(`/stock-count/${sessionId}/items/${itemId}`, data),
  complete: (id: string) => apiClient.patch<CompleteResult>(`/stock-count/${id}/complete`, {}),
  cancel: (id: string) => apiClient.patch<{ message: string }>(`/stock-count/${id}/cancel`, {}),
};

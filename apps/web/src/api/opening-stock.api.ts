import { apiClient } from './client';

export interface OpeningStockItem {
  id: string;
  entry_id: string;
  product_id: string | null;
  product_name?: string;
  barcode?: string;
  unit?: string;
  quantity: number;
  unit_cost: number;
}

export interface OpeningStockEntry {
  id: string;
  entry_number: string;
  warehouse_id: string | null;
  warehouse_name?: string;
  entry_date: string;
  status: string;
  notes: string | null;
  created_by_name?: string;
  created_at: string;
}

export interface OpeningStockDetail extends OpeningStockEntry {
  items: OpeningStockItem[];
}

export interface CreateOpeningStockData {
  warehouse_id?: string;
  items: { product_id: string; quantity: number; unit_cost: number }[];
  entry_date?: string;
  notes?: string;
}

export const openingStockApi = {
  getAll: (params: Record<string, string | number> = {}) => apiClient.get<OpeningStockEntry[]>('/opening-stock', params),
  getById: (id: string) => apiClient.get<OpeningStockDetail>(`/opening-stock/${id}`),
  create: (data: CreateOpeningStockData) => apiClient.post<OpeningStockEntry>('/opening-stock', data),
  cancel: (id: string) => apiClient.patch<{ message: string }>(`/opening-stock/${id}/cancel`, {}),
};

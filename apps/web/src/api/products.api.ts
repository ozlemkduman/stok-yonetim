import { apiClient } from './client';

export interface Product {
  id: string;
  name: string;
  barcode: string | null;
  category: string | null;
  unit: string;
  purchase_price: number;
  sale_price: number;
  vat_rate: number;
  stock_quantity: number;
  min_stock_level: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateProductData {
  name: string;
  barcode?: string;
  category?: string;
  unit?: string;
  purchase_price: number;
  sale_price: number;
  vat_rate?: number;
  stock_quantity?: number;
  min_stock_level?: number;
}

export const productsApi = {
  getAll: (params: Record<string, string | number> = {}) => apiClient.get<Product[]>('/products', params),
  getById: (id: string) => apiClient.get<Product>(`/products/${id}`),
  create: (data: CreateProductData) => apiClient.post<Product>('/products', data),
  update: (id: string, data: Partial<CreateProductData>) => apiClient.patch<Product>(`/products/${id}`, data),
  delete: (id: string) => apiClient.delete<{ message: string }>(`/products/${id}`),
  getLowStock: () => apiClient.get<Product[]>('/products/low-stock'),
  getCategories: () => apiClient.get<string[]>('/products/categories'),
};

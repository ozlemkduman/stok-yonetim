import { apiClient } from './client';

export interface Product {
  id: string;
  name: string;
  barcode: string | null;
  category: string | null;
  unit: string;
  purchase_price: number;
  sale_price: number;
  wholesale_price: number;
  vat_rate: number;
  stock_quantity: number;
  min_stock_level: number;
  is_active: boolean;
  created_by?: string | null;
  created_by_name?: string | null;
  created_at: string;
  updated_at: string;
  total_sold?: number;
}

export interface CreateProductData {
  name: string;
  barcode?: string;
  category?: string;
  unit?: string;
  purchase_price: number;
  sale_price: number;
  wholesale_price?: number;
  vat_rate?: number;
  stock_quantity?: number;
  min_stock_level?: number;
}

export interface ProductSale {
  id: string;
  sale_id: string;
  quantity: number;
  unit_price: number;
  discount_rate: number;
  vat_rate: number;
  vat_amount: number;
  line_total: number;
  invoice_number: string;
  sale_date: string;
  payment_method: string;
  status: string;
  customer_id: string | null;
  customer_name: string | null;
}

export interface ProductReturn {
  id: string;
  return_id: string;
  quantity: number;
  unit_price: number;
  vat_amount: number;
  line_total: number;
  return_number: string;
  return_date: string;
  reason: string | null;
  status: string;
  customer_id: string | null;
  customer_name: string | null;
}

export interface StockMovement {
  id: string;
  warehouse_id: string;
  warehouse_name: string | null;
  product_id: string;
  movement_type: string;
  quantity: number;
  stock_after: number;
  reference_type: string | null;
  reference_id: string | null;
  notes: string | null;
  movement_date: string;
  created_at: string;
}

export interface ProductStats {
  totalSold: number;
  totalReturned: number;
  totalRevenue: number;
  salesCount: number;
  returnsCount: number;
}

export interface WarehouseStock {
  warehouse_id: string;
  warehouse_name: string;
  quantity: number;
}

export interface ProductDetail {
  product: Product;
  sales: ProductSale[];
  returns: ProductReturn[];
  movements: StockMovement[];
  stats: ProductStats;
  warehouseStocks: WarehouseStock[];
}

export const productsApi = {
  getAll: (params: Record<string, string | number> = {}) => apiClient.get<Product[]>('/products', params),
  getById: (id: string) => apiClient.get<Product>(`/products/${id}`),
  create: (data: CreateProductData) => apiClient.post<Product>('/products', data),
  update: (id: string, data: Partial<CreateProductData>) => apiClient.patch<Product>(`/products/${id}`, data),
  delete: (id: string) => apiClient.delete<{ message: string }>(`/products/${id}`),
  getLowStock: () => apiClient.get<Product[]>('/products/low-stock'),
  getCategories: () => apiClient.get<string[]>('/products/categories'),
  getDetail: (id: string) => apiClient.get<ProductDetail>(`/products/${id}/detail`),
  getSales: (id: string) => apiClient.get<ProductSale[]>(`/products/${id}/sales`),
  getReturns: (id: string) => apiClient.get<ProductReturn[]>(`/products/${id}/returns`),
  getMovements: (id: string) => apiClient.get<StockMovement[]>(`/products/${id}/movements`),
  getStats: (id: string) => apiClient.get<ProductStats>(`/products/${id}/stats`),
};

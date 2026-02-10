import { apiClient } from './client';

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address: string | null;
  phone: string | null;
  manager_name: string | null;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WarehouseStock {
  id: string;
  warehouse_id: string;
  product_id: string;
  quantity: number;
  min_stock_level: number;
  product_name?: string;
  product_barcode?: string;
}

export interface StockTransfer {
  id: string;
  transfer_number: string;
  from_warehouse_id: string;
  to_warehouse_id: string;
  transfer_date: string;
  status: 'pending' | 'in_transit' | 'completed' | 'cancelled';
  notes: string | null;
  from_warehouse_name?: string;
  to_warehouse_name?: string;
  items?: StockTransferItem[];
}

export interface StockTransferItem {
  id: string;
  transfer_id: string;
  product_id: string;
  quantity: number;
  product_name?: string;
}

export interface StockMovement {
  id: string;
  warehouse_id: string;
  product_id: string;
  movement_type: string;
  quantity: number;
  stock_after: number;
  reference_type: string | null;
  reference_id: string | null;
  notes: string | null;
  movement_date: string;
  warehouse_name?: string;
  product_name?: string;
}

export interface CreateWarehouseData {
  name: string;
  code: string;
  address?: string;
  phone?: string;
  manager_name?: string;
  is_default?: boolean;
}

export interface UpdateWarehouseData {
  name?: string;
  address?: string;
  phone?: string;
  manager_name?: string;
  is_default?: boolean;
  is_active?: boolean;
}

export interface TransferItemData {
  product_id: string;
  quantity: number;
}

export interface CreateTransferData {
  from_warehouse_id: string;
  to_warehouse_id: string;
  items: TransferItemData[];
  notes?: string;
  transfer_date?: string;
}

export interface AdjustStockData {
  product_id: string;
  quantity: number;
  adjustment_type: 'add' | 'subtract' | 'set';
  notes?: string;
}

export const warehousesApi = {
  // Warehouses
  getAll: async (params: { page?: number; limit?: number; isActive?: boolean } = {}) => {
    const queryParams: Record<string, string | number> = {};
    if (params.page) queryParams.page = params.page;
    if (params.limit) queryParams.limit = params.limit;
    if (params.isActive !== undefined) queryParams.isActive = String(params.isActive);
    return apiClient.get<Warehouse[]>('/warehouses', queryParams);
  },

  getById: async (id: string) => {
    return apiClient.get<Warehouse>(`/warehouses/${id}`);
  },

  create: async (data: CreateWarehouseData) => {
    return apiClient.post<Warehouse>('/warehouses', data);
  },

  update: async (id: string, data: UpdateWarehouseData) => {
    return apiClient.patch<Warehouse>(`/warehouses/${id}`, data);
  },

  delete: async (id: string) => {
    return apiClient.delete<{ message: string }>(`/warehouses/${id}`);
  },

  // Stocks
  getStocks: async (warehouseId: string, params: { page?: number; limit?: number; search?: string; lowStock?: boolean } = {}) => {
    const queryParams: Record<string, string | number> = {};
    if (params.page) queryParams.page = params.page;
    if (params.limit) queryParams.limit = params.limit;
    if (params.search) queryParams.search = params.search;
    if (params.lowStock) queryParams.lowStock = 'true';
    return apiClient.get<WarehouseStock[]>(`/warehouses/${warehouseId}/stocks`, queryParams);
  },

  adjustStock: async (warehouseId: string, data: AdjustStockData) => {
    return apiClient.post<{ success: boolean; new_quantity: number }>(`/warehouses/${warehouseId}/adjust-stock`, data);
  },

  // Transfers
  getTransfers: async (params: { page?: number; limit?: number; warehouseId?: string; status?: string } = {}) => {
    const queryParams: Record<string, string | number> = {};
    if (params.page) queryParams.page = params.page;
    if (params.limit) queryParams.limit = params.limit;
    if (params.warehouseId) queryParams.warehouseId = params.warehouseId;
    if (params.status) queryParams.status = params.status;
    return apiClient.get<StockTransfer[]>('/warehouses/transfers', queryParams);
  },

  getTransferById: async (id: string) => {
    return apiClient.get<StockTransfer>(`/warehouses/transfers/${id}`);
  },

  createTransfer: async (data: CreateTransferData) => {
    return apiClient.post<StockTransfer>('/warehouses/transfers', data);
  },

  completeTransfer: async (id: string) => {
    return apiClient.post<StockTransfer>(`/warehouses/transfers/${id}/complete`, {});
  },

  cancelTransfer: async (id: string) => {
    return apiClient.post<StockTransfer>(`/warehouses/transfers/${id}/cancel`, {});
  },

  // Movements
  getMovements: async (params: {
    page?: number;
    limit?: number;
    warehouseId?: string;
    productId?: string;
    movementType?: string;
    startDate?: string;
    endDate?: string;
  } = {}) => {
    const queryParams: Record<string, string | number> = {};
    if (params.page) queryParams.page = params.page;
    if (params.limit) queryParams.limit = params.limit;
    if (params.warehouseId) queryParams.warehouseId = params.warehouseId;
    if (params.productId) queryParams.productId = params.productId;
    if (params.movementType) queryParams.movementType = params.movementType;
    if (params.startDate) queryParams.startDate = params.startDate;
    if (params.endDate) queryParams.endDate = params.endDate;
    return apiClient.get<StockMovement[]>('/warehouses/movements', queryParams);
  },
};

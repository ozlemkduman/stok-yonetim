import { apiClient } from './client';

// ---- Araçlar (vehicles) ----

export interface Vehicle {
  id: string;
  customer_id: string | null;
  customer_name?: string;
  plate: string;
  brand: string | null;
  model: string | null;
  model_year: number | null;
  vin: string | null;
  engine_no: string | null;
  color: string | null;
  fuel_type: string | null;
  mileage: number | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

export interface CreateVehicleData {
  plate: string;
  customer_id?: string;
  brand?: string;
  model?: string;
  model_year?: number;
  vin?: string;
  engine_no?: string;
  color?: string;
  fuel_type?: string;
  mileage?: number;
  notes?: string;
  is_active?: boolean;
}

export type UpdateVehicleData = Partial<CreateVehicleData>;

// ---- İş emirleri (service orders) ----

export type ServiceOrderStatus = 'open' | 'in_progress' | 'completed' | 'delivered' | 'cancelled';

export interface ServiceOrderItem {
  id: string;
  service_order_id: string;
  product_id: string;
  product_name?: string;
  product_unit?: string;
  quantity: number;
  unit_price: number;
  vat_rate: number;
  line_total: number;
}

export interface ServiceOrderItemInput {
  product_id: string;
  quantity: number;
  unit_price?: number;
  vat_rate?: number;
}

export interface ServiceOrder {
  id: string;
  order_number: string;
  vehicle_id: string;
  vehicle_plate?: string;
  customer_id: string | null;
  customer_name?: string;
  assigned_employee_id: string | null;
  employee_name?: string;
  status: ServiceOrderStatus;
  mileage_in: number | null;
  complaint: string | null;
  diagnosis: string | null;
  labor_cost: number;
  parts_cost: number;
  discount: number;
  total_amount: number;
  opened_at: string;
  completed_at: string | null;
  delivered_at: string | null;
  notes: string | null;
  warehouse_id: string | null;
  stock_deducted: boolean;
  invoice_number: string | null;
  invoice_date: string | null;
  invoice_amount: number | null;
  invoice_file_url: string | null;
  posted_payment_method: string | null;
  items?: ServiceOrderItem[];
  created_at: string;
}

export interface CreateServiceOrderData {
  vehicle_id: string;
  customer_id?: string;
  assigned_employee_id?: string;
  warehouse_id?: string;
  status?: ServiceOrderStatus;
  mileage_in?: number;
  complaint?: string;
  diagnosis?: string;
  labor_cost?: number;
  discount?: number;
  notes?: string;
  items?: ServiceOrderItemInput[];
}

export type UpdateServiceOrderData = Partial<Omit<CreateServiceOrderData, 'vehicle_id'>>;

export type InvoicePosting = 'none' | 'veresiye' | 'nakit' | 'kredi_karti' | 'havale';

export interface RecordInvoiceData {
  invoice_number: string;
  invoice_amount: number;
  invoice_date?: string;
  invoice_file_url?: string;
  posting?: InvoicePosting;
}

export const autoServiceApi = {
  vehicles: {
    getAll: (params: Record<string, string | number> = {}) =>
      apiClient.get<Vehicle[]>('/auto-service/vehicles', params),
    getById: (id: string) => apiClient.get<Vehicle>(`/auto-service/vehicles/${id}`),
    create: (data: CreateVehicleData) => apiClient.post<Vehicle>('/auto-service/vehicles', data),
    update: (id: string, data: UpdateVehicleData) => apiClient.patch<Vehicle>(`/auto-service/vehicles/${id}`, data),
    delete: (id: string) => apiClient.delete<{ message: string }>(`/auto-service/vehicles/${id}`),
  },
  serviceOrders: {
    getAll: (params: Record<string, string | number> = {}) =>
      apiClient.get<ServiceOrder[]>('/auto-service/service-orders', params),
    getById: (id: string) => apiClient.get<ServiceOrder>(`/auto-service/service-orders/${id}`),
    create: (data: CreateServiceOrderData) => apiClient.post<ServiceOrder>('/auto-service/service-orders', data),
    update: (id: string, data: UpdateServiceOrderData) =>
      apiClient.patch<ServiceOrder>(`/auto-service/service-orders/${id}`, data),
    recordInvoice: (id: string, data: RecordInvoiceData) =>
      apiClient.patch<ServiceOrder>(`/auto-service/service-orders/${id}/invoice`, data),
  },
};

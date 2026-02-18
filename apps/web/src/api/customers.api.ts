import { apiClient } from './client';

export interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  tax_number: string | null;
  tax_office: string | null;
  balance: number;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCustomerData {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  tax_number?: string;
  tax_office?: string;
  notes?: string;
}

export interface UpdateCustomerData extends Partial<CreateCustomerData> {
  is_active?: boolean;
}

export interface CustomerListParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
}

export interface SaleItem {
  id: string;
  product_id: string;
  product_name: string;
  barcode: string | null;
  quantity: number;
  unit_price: number;
  discount_rate: number;
  vat_rate: number;
  vat_amount: number;
  line_total: number;
}

export interface CustomerSale {
  id: string;
  invoice_number: string;
  sale_date: string;
  subtotal: number;
  discount_amount: number;
  vat_total: number;
  grand_total: number;
  payment_method: string;
  status: string;
  items: SaleItem[];
}

export interface ReturnItem {
  id: string;
  product_id: string;
  product_name: string;
  barcode: string | null;
  quantity: number;
  unit_price: number;
  vat_amount: number;
  line_total: number;
}

export interface CustomerReturn {
  id: string;
  return_number: string;
  return_date: string;
  total_amount: number;
  vat_total: number;
  reason: string | null;
  status: string;
  items: ReturnItem[];
}

export interface CustomerPayment {
  id: string;
  payment_date: string;
  amount: number;
  method: string;
  notes: string | null;
}

export interface CustomerStats {
  totalSales: number;
  totalReturns: number;
  totalPayments: number;
  salesCount: number;
  returnsCount: number;
  paymentsCount: number;
}

export interface ProductPurchase {
  product_id: string;
  product_name: string;
  barcode: string | null;
  total_quantity: number;
  total_amount: number;
  purchase_count: number;
}

export interface CustomerDetail {
  customer: Customer;
  sales: CustomerSale[];
  returns: CustomerReturn[];
  payments: CustomerPayment[];
  stats: CustomerStats;
  productPurchases: ProductPurchase[];
}

export const customersApi = {
  getAll: async (params: CustomerListParams = {}) => {
    const queryParams: Record<string, string | number> = {};

    if (params.page) queryParams.page = params.page;
    if (params.limit) queryParams.limit = params.limit;
    if (params.search) queryParams.search = params.search;
    if (params.sortBy) queryParams.sortBy = params.sortBy;
    if (params.sortOrder) queryParams.sortOrder = params.sortOrder;
    if (params.isActive !== undefined) queryParams.isActive = String(params.isActive);

    return apiClient.get<Customer[]>('/customers', queryParams);
  },

  getById: async (id: string) => {
    return apiClient.get<Customer>(`/customers/${id}`);
  },

  create: async (data: CreateCustomerData) => {
    return apiClient.post<Customer>('/customers', data);
  },

  update: async (id: string, data: UpdateCustomerData) => {
    return apiClient.patch<Customer>(`/customers/${id}`, data);
  },

  delete: async (id: string) => {
    return apiClient.delete<{ message: string }>(`/customers/${id}`);
  },

  getWithDebt: async () => {
    return apiClient.get<Customer[]>('/customers/with-debt');
  },

  getWithCredit: async () => {
    return apiClient.get<Customer[]>('/customers/with-credit');
  },

  getDetail: async (id: string) => {
    return apiClient.get<CustomerDetail>(`/customers/${id}/detail`);
  },

  getSales: async (id: string) => {
    return apiClient.get<CustomerSale[]>(`/customers/${id}/sales`);
  },

  getReturns: async (id: string) => {
    return apiClient.get<CustomerReturn[]>(`/customers/${id}/returns`);
  },

  getPayments: async (id: string) => {
    return apiClient.get<CustomerPayment[]>(`/customers/${id}/payments`);
  },

  getStats: async (id: string) => {
    return apiClient.get<CustomerStats>(`/customers/${id}/stats`);
  },
};

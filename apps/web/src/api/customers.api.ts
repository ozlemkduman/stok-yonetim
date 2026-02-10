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
};

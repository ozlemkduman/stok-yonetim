import { apiClient } from './client';

export interface Supplier {
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

export interface CreateSupplierData {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  tax_number?: string;
  tax_office?: string;
  notes?: string;
  is_active?: boolean;
}

export type UpdateSupplierData = Partial<CreateSupplierData>;

export const suppliersApi = {
  getAll: (params: Record<string, string | number> = {}) => apiClient.get<Supplier[]>('/suppliers', params),
  getById: (id: string) => apiClient.get<Supplier>(`/suppliers/${id}`),
  create: (data: CreateSupplierData) => apiClient.post<Supplier>('/suppliers', data),
  update: (id: string, data: UpdateSupplierData) => apiClient.patch<Supplier>(`/suppliers/${id}`, data),
  delete: (id: string) => apiClient.delete<{ message: string }>(`/suppliers/${id}`),
};

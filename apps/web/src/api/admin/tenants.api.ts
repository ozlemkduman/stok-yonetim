import { apiClient, ApiResponse } from '../client';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  logo_url: string | null;
  plan_id: string | null;
  plan_name?: string;
  plan_code?: string;
  settings: Record<string, any>;
  status: string;
  trial_ends_at: string | null;
  subscription_starts_at: string | null;
  subscription_ends_at: string | null;
  billing_email: string | null;
  owner_id: string | null;
  user_count?: number;
  created_at: string;
  updated_at: string;
}

export interface TenantStats {
  userCount: number;
  productCount: number;
  customerCount: number;
  saleCount: number;
}

export interface CreateTenantData {
  name: string;
  slug?: string;
  domain?: string;
  planId?: string;
  billingEmail?: string;
  status?: string;
}

export interface UpdateTenantData {
  name?: string;
  domain?: string;
  planId?: string;
  billingEmail?: string;
  status?: string;
  settings?: Record<string, any>;
}

export interface TenantListParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: string;
  search?: string;
  [key: string]: string | number | boolean | undefined;
}

export const adminTenantsApi = {
  async getAll(params?: TenantListParams): Promise<ApiResponse<Tenant[]>> {
    return apiClient.get<Tenant[]>('/admin/tenants', params);
  },

  async getById(id: string): Promise<ApiResponse<Tenant>> {
    return apiClient.get<Tenant>(`/admin/tenants/${id}`);
  },

  async getStats(id: string): Promise<ApiResponse<TenantStats>> {
    return apiClient.get<TenantStats>(`/admin/tenants/${id}/stats`);
  },

  async create(data: CreateTenantData): Promise<ApiResponse<Tenant>> {
    return apiClient.post<Tenant>('/admin/tenants', data);
  },

  async update(id: string, data: UpdateTenantData): Promise<ApiResponse<Tenant>> {
    return apiClient.patch<Tenant>(`/admin/tenants/${id}`, data);
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/admin/tenants/${id}`);
  },

  async suspend(id: string): Promise<ApiResponse<Tenant>> {
    return apiClient.post<Tenant>(`/admin/tenants/${id}/suspend`, {});
  },

  async activate(id: string): Promise<ApiResponse<Tenant>> {
    return apiClient.post<Tenant>(`/admin/tenants/${id}/activate`, {});
  },
};

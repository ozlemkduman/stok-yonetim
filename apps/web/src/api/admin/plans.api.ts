import { apiClient, ApiResponse } from '../client';

export interface Plan {
  id: string;
  name: string;
  code: string;
  price: number;
  billing_period: string;
  features: Record<string, boolean>;
  limits: Record<string, number>;
  is_active: boolean;
  sort_order: number;
  tenant_count?: number;
  created_at: string;
  updated_at: string;
}

export interface CreatePlanData {
  name: string;
  code: string;
  price: number;
  billingPeriod?: string;
  features?: Record<string, boolean>;
  limits?: Record<string, number>;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdatePlanData {
  name?: string;
  price?: number;
  billingPeriod?: string;
  features?: Record<string, boolean>;
  limits?: Record<string, number>;
  isActive?: boolean;
  sortOrder?: number;
}

export const adminPlansApi = {
  async getAll(includeInactive?: boolean): Promise<ApiResponse<Plan[]>> {
    return apiClient.get<Plan[]>('/admin/plans', { includeInactive });
  },

  async getById(id: string): Promise<ApiResponse<Plan>> {
    return apiClient.get<Plan>(`/admin/plans/${id}`);
  },

  async create(data: CreatePlanData): Promise<ApiResponse<Plan>> {
    return apiClient.post<Plan>('/admin/plans', data);
  },

  async update(id: string, data: UpdatePlanData): Promise<ApiResponse<Plan>> {
    return apiClient.patch<Plan>(`/admin/plans/${id}`, data);
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/admin/plans/${id}`);
  },
};

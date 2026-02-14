import { apiClient, ApiResponse } from '../client';

export interface AdminUser {
  id: string;
  tenant_id: string | null;
  email: string;
  name: string;
  phone: string | null;
  avatar_url: string | null;
  role: string;
  permissions: string[];
  status: string;
  email_verified_at: string | null;
  last_login_at: string | null;
  tenant_name?: string;
  tenant_slug?: string;
  created_at: string;
  updated_at: string;
}

export interface UserListParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  role?: string;
  status?: string;
  tenantId?: string;
  search?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface RoleCount {
  role: string;
  count: number;
}

export interface CreateUserData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role: string;
  tenantId?: string;
  permissions?: string[];
}

export interface UpdateUserData {
  name?: string;
  phone?: string;
  role?: string;
  tenantId?: string;
  permissions?: string[];
  status?: string;
}

export const adminUsersApi = {
  async getAll(params?: UserListParams): Promise<ApiResponse<AdminUser[]>> {
    return apiClient.get<AdminUser[]>('/admin/users', params);
  },

  async getById(id: string): Promise<ApiResponse<AdminUser>> {
    return apiClient.get<AdminUser>(`/admin/users/${id}`);
  },

  async create(data: CreateUserData): Promise<ApiResponse<AdminUser>> {
    return apiClient.post<AdminUser>('/admin/users', data);
  },

  async update(id: string, data: UpdateUserData): Promise<ApiResponse<AdminUser>> {
    return apiClient.patch<AdminUser>(`/admin/users/${id}`, data);
  },

  async countByRole(): Promise<ApiResponse<RoleCount[]>> {
    return apiClient.get<RoleCount[]>('/admin/users/stats/by-role');
  },

  async suspend(id: string): Promise<ApiResponse<AdminUser>> {
    return apiClient.post<AdminUser>(`/admin/users/${id}/suspend`, {});
  },

  async activate(id: string): Promise<ApiResponse<AdminUser>> {
    return apiClient.post<AdminUser>(`/admin/users/${id}/activate`, {});
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/admin/users/${id}`);
  },
};

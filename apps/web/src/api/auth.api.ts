import { apiClient, ApiResponse } from './client';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatarUrl?: string;
  role: string;
  tenantId: string | null;
  permissions: string[];
  emailVerifiedAt?: string;
  lastLoginAt?: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginResponse {
  user: User & { tenant?: Tenant };
  tokens: AuthTokens;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  companyName: string;
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export const authApi = {
  async login(data: LoginData): Promise<ApiResponse<LoginResponse>> {
    const response = await apiClient.post<LoginResponse>('/auth/login', data, true);
    if (response.data?.tokens) {
      apiClient.setTokens(response.data.tokens.accessToken, response.data.tokens.refreshToken);
    }
    return response;
  },

  async register(data: RegisterData): Promise<ApiResponse<LoginResponse>> {
    const response = await apiClient.post<LoginResponse>('/auth/register', data, true);
    if (response.data?.tokens) {
      apiClient.setTokens(response.data.tokens.accessToken, response.data.tokens.refreshToken);
    }
    return response;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout', {});
    } finally {
      apiClient.clearTokens();
    }
  },

  async logoutAll(): Promise<void> {
    try {
      await apiClient.post('/auth/logout-all', {});
    } finally {
      apiClient.clearTokens();
    }
  },

  async getProfile(): Promise<ApiResponse<User>> {
    return apiClient.get<User>('/auth/me');
  },

  async forgotPassword(email: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>('/auth/forgot-password', { email }, true);
  },

  async resetPassword(token: string, password: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>('/auth/reset-password', { token, password }, true);
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>('/users/change-password', { currentPassword, newPassword });
  },
};

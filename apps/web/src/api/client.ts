const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ApiError {
  success: false;
  message: string;
  errors?: string[];
}

// Token storage keys
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const IMPERSONATION_KEY = 'impersonated_tenant';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  setAccessToken(token: string): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  setRefreshToken(token: string): void {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  }

  clearTokens(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  setTokens(accessToken: string, refreshToken: string): void {
    this.setAccessToken(accessToken);
    this.setRefreshToken(refreshToken);
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    skipAuth = false
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    // Add auth header if token exists and not skipping auth
    if (!skipAuth) {
      const token = this.getAccessToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    // Add impersonation header if impersonating a tenant
    const impersonatedTenant = localStorage.getItem(IMPERSONATION_KEY);
    if (impersonatedTenant) {
      const tenant = JSON.parse(impersonatedTenant);
      headers['X-Impersonate-Tenant'] = tenant.id;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    const response = await fetch(url, config);

    // Handle 401 Unauthorized - try to refresh token
    if (response.status === 401 && !skipAuth) {
      const refreshed = await this.tryRefreshToken();
      if (refreshed) {
        // Retry the request with new token
        headers['Authorization'] = `Bearer ${this.getAccessToken()}`;
        const retryResponse = await fetch(url, { ...config, headers });

        // Handle 204 No Content
        if (retryResponse.status === 204) {
          return { success: true, data: null as T };
        }

        const retryData = await retryResponse.json();

        if (!retryResponse.ok) {
          const error = retryData as ApiError;
          throw new Error(error.message || 'API error');
        }

        return retryData as ApiResponse<T>;
      } else {
        // Refresh failed, clear tokens and throw
        this.clearTokens();
        window.dispatchEvent(new CustomEvent('auth:logout'));
        throw new Error('Oturum süresi doldu');
      }
    }

    // Handle 204 No Content (e.g., successful DELETE)
    if (response.status === 204) {
      return { success: true, data: null as T };
    }

    const data = await response.json();

    if (!response.ok) {
      const error = data as ApiError;
      throw new Error(error.message || 'API error');
    }

    return data as ApiResponse<T>;
  }

  private async tryRefreshToken(): Promise<boolean> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) return false;

      const data = await response.json();
      if (data.data?.accessToken) {
        this.setAccessToken(data.data.accessToken);
        if (data.data.refreshToken) {
          this.setRefreshToken(data.data.refreshToken);
        }
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  async get<T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>): Promise<ApiResponse<T>> {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url = `${endpoint}?${queryString}`;
      }
    }
    return this.request<T>(url, { method: 'GET' });
  }

  async post<T>(endpoint: string, body: unknown, skipAuth = false): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    }, skipAuth);
  }

  async patch<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  async upload<T>(endpoint: string, file: File, fieldName = 'file'): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const formData = new FormData();
    formData.append(fieldName, file);

    const headers: Record<string, string> = {};

    const token = this.getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const impersonatedTenant = localStorage.getItem('impersonated_tenant');
    if (impersonatedTenant) {
      const tenant = JSON.parse(impersonatedTenant);
      headers['X-Impersonate-Tenant'] = tenant.id;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (response.status === 401) {
      const refreshed = await this.tryRefreshToken();
      if (refreshed) {
        headers['Authorization'] = `Bearer ${this.getAccessToken()}`;
        const retryResponse = await fetch(url, { method: 'POST', headers, body: formData });
        const retryData = await retryResponse.json();
        if (!retryResponse.ok) throw new Error(retryData.message || 'API error');
        return retryData as ApiResponse<T>;
      } else {
        this.clearTokens();
        window.dispatchEvent(new CustomEvent('auth:logout'));
        throw new Error('Oturum süresi doldu');
      }
    }

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'API error');
    return data as ApiResponse<T>;
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

import { apiClient, ApiResponse } from '../client';

export interface DashboardStats {
  totalTenants: number;
  activeTenants: number;
  trialTenants: number;
  suspendedTenants: number;
  totalUsers: number;
  activeUsers: number;
  totalRevenue: number;
  monthlyRevenue: number;
}

export interface RevenueData {
  month: string;
  revenue: number;
  tenantCount: number;
}

export interface TenantGrowthData {
  month: string;
  newTenants: number;
  totalTenants: number;
}

export interface PlanDistribution {
  planName: string;
  count: number;
  percentage: number;
}

export interface ActivityLog {
  id: string;
  tenant_id: string | null;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  ip_address: string | null;
  metadata: Record<string, any>;
  user_name?: string;
  user_email?: string;
  tenant_name?: string;
  created_at: string;
}

export const adminDashboardApi = {
  async getStats(): Promise<ApiResponse<DashboardStats>> {
    return apiClient.get<DashboardStats>('/admin/dashboard/stats');
  },

  async getRevenue(months?: number): Promise<ApiResponse<RevenueData[]>> {
    return apiClient.get<RevenueData[]>('/admin/dashboard/revenue', { months });
  },

  async getTenantGrowth(months?: number): Promise<ApiResponse<TenantGrowthData[]>> {
    return apiClient.get<TenantGrowthData[]>('/admin/dashboard/growth', { months });
  },

  async getPlanDistribution(): Promise<ApiResponse<PlanDistribution[]>> {
    return apiClient.get<PlanDistribution[]>('/admin/dashboard/plan-distribution');
  },

  async getRecentActivity(limit?: number): Promise<ApiResponse<ActivityLog[]>> {
    return apiClient.get<ActivityLog[]>('/admin/dashboard/recent-activity', { limit });
  },
};

export interface ActivityLogListParams {
  page?: number;
  limit?: number;
  tenantId?: string;
  userId?: string;
  action?: string;
  entityType?: string;
  startDate?: string;
  endDate?: string;
  [key: string]: string | number | boolean | undefined;
}

export const adminLogsApi = {
  async getAll(params?: ActivityLogListParams): Promise<ApiResponse<ActivityLog[]>> {
    return apiClient.get<ActivityLog[]>('/admin/logs', params);
  },

  async getActionTypes(): Promise<ApiResponse<string[]>> {
    return apiClient.get<string[]>('/admin/logs/action-types');
  },

  async getEntityTypes(): Promise<ApiResponse<string[]>> {
    return apiClient.get<string[]>('/admin/logs/entity-types');
  },
};

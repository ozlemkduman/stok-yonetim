import { apiClient } from './client';

export interface DashboardSummary {
  todaySales: { count: number; total: number };
  totalCustomers: number;
  totalProducts: number;
  lowStockCount: number;
  totalDebt: number;
  totalCredit: number;
  monthlyExpenses: number;
}

export const dashboardApi = {
  getSummary: () => apiClient.get<DashboardSummary>('/dashboard/summary'),
  getRecentSales: () => apiClient.get<any[]>('/dashboard/recent-sales'),
  getLowStock: () => apiClient.get<any[]>('/dashboard/low-stock'),
  getTopDebtors: () => apiClient.get<any[]>('/dashboard/top-debtors'),
};

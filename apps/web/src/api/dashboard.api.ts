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

export interface RecentSale {
  id: string;
  invoice_number: string;
  customer_name: string;
  grand_total: number;
  sale_date: string;
  status: string;
  payment_method: string;
}

export interface LowStockProduct {
  id: string;
  name: string;
  barcode: string;
  stock_quantity: number;
  min_stock_level: number;
}

export interface TopDebtor {
  id: string;
  name: string;
  phone: string;
  balance: number;
}

export const dashboardApi = {
  getSummary: () => apiClient.get<DashboardSummary>('/dashboard/summary'),
  getRecentSales: () => apiClient.get<RecentSale[]>('/dashboard/recent-sales'),
  getLowStock: () => apiClient.get<LowStockProduct[]>('/dashboard/low-stock'),
  getTopDebtors: () => apiClient.get<TopDebtor[]>('/dashboard/top-debtors'),
};

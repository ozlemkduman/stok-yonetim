import { apiClient } from './client';

export interface TopProduct {
  id: string;
  name: string;
  total_quantity: number;
  total_revenue: number;
}

export interface TopCustomer {
  id: string;
  name: string;
  phone: string | null;
  total_amount: number;
  sale_count: number;
}

export interface UpcomingPayment {
  id: string;
  invoice_number: string;
  grand_total: number;
  due_date: string;
  sale_date: string;
  customer_name: string | null;
  customer_phone: string | null;
}

export interface OverduePayment extends UpcomingPayment {
  customer_id: string;
  days_overdue: number;
}

export interface StockReportProduct {
  id: string;
  name: string;
  barcode: string | null;
  stock_quantity: number;
  min_stock_level: number;
  purchase_price: number;
  sale_price: number;
}

export interface ReturnReport {
  id: string;
  return_number: string;
  return_date: string;
  total_amount: number;
  reason: string | null;
  customer_name: string | null;
}

export interface ExpenseByCategory {
  category: string;
  total: number;
  count: number;
}

export interface CustomerSaleItem {
  sale_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface CustomerSale {
  id: string;
  invoice_number: string;
  sale_date: string;
  grand_total: number;
  payment_method: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string | null;
  items: CustomerSaleItem[];
}

export interface CustomerProductPurchase {
  customer_id: string;
  customer_name: string;
  product_id: string;
  product_name: string;
  total_quantity: number;
  total_amount: number;
}

export interface EmployeePerformance {
  id: string;
  name: string;
  email: string;
  role: string;
  saleCount: number;
  totalRevenue: number;
  invoiceCount: number;
  cancelledCount: number;
  avgSale: number;
}

export interface EmployeePerformanceReport {
  employees: EmployeePerformance[];
  summary: {
    totalSales: number;
    totalRevenue: number;
    avgPerEmployee: number;
  };
}

export interface RenewalItem {
  id: string;
  invoice_number: string;
  sale_date: string;
  renewal_date: string;
  reminder_days_before: number;
  reminder_note: string | null;
  grand_total: number;
  customer_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  days_remaining: number;
  product_names: string[];
  renewal_red_days: number;
  renewal_yellow_days: number;
  renewal_status: 'expired' | 'red' | 'yellow' | 'green';
}

export interface RenewalsReport {
  renewals: RenewalItem[];
  summary: {
    total: number;
    expiredCount: number;
    urgentCount: number;
    upcomingCount: number;
    futureCount: number;
  };
}

export const reportsApi = {
  getSalesSummary: (startDate: string, endDate: string) =>
    apiClient.get<any>('/reports/sales-summary', { startDate, endDate }),
  getDebtOverview: () => apiClient.get<any>('/reports/debt-overview'),
  getVatReport: (startDate: string, endDate: string) =>
    apiClient.get<any>('/reports/vat', { startDate, endDate }),
  getProfitLoss: (startDate: string, endDate: string) =>
    apiClient.get<any>('/reports/profit-loss', { startDate, endDate }),
  getTopProducts: (startDate: string, endDate: string, limit?: number) =>
    apiClient.get<TopProduct[]>('/reports/top-products', { startDate, endDate, limit: limit || 10 }),
  getTopCustomers: (startDate: string, endDate: string, limit?: number) =>
    apiClient.get<TopCustomer[]>('/reports/top-customers', { startDate, endDate, limit: limit || 10 }),
  getUpcomingPayments: (days?: number) =>
    apiClient.get<UpcomingPayment[]>('/reports/upcoming-payments', { days: days || 30 }),
  getOverduePayments: () =>
    apiClient.get<{ overdueList: OverduePayment[]; totalCount: number; totalAmount: number }>('/reports/overdue-payments'),
  getStockReport: () =>
    apiClient.get<{ products: StockReportProduct[]; summary: any }>('/reports/stock-report'),
  getReturnsReport: (startDate: string, endDate: string) =>
    apiClient.get<{ returns: ReturnReport[]; summary: any; byReason: any[]; topReturnedProducts: any[] }>('/reports/returns-report', { startDate, endDate }),
  getCustomerSales: (startDate: string, endDate: string) =>
    apiClient.get<CustomerSale[]>('/reports/customer-sales', { startDate, endDate }),
  getCustomerProductPurchases: (startDate: string, endDate: string) =>
    apiClient.get<CustomerProductPurchase[]>('/reports/customer-product-purchases', { startDate, endDate }),
  getExpensesByCategory: (startDate: string, endDate: string) =>
    apiClient.get<{ byCategory: ExpenseByCategory[]; summary: any; monthlyTrend: any[] }>('/reports/expenses-by-category', { startDate, endDate }),
  getEmployeePerformance: (startDate: string, endDate: string) =>
    apiClient.get<EmployeePerformanceReport>('/reports/employee-performance', { startDate, endDate }),
  getRenewals: () =>
    apiClient.get<RenewalsReport>('/reports/renewals'),
};

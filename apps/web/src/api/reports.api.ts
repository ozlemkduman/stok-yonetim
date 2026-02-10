import { apiClient } from './client';

export const reportsApi = {
  getSalesSummary: (startDate: string, endDate: string) =>
    apiClient.get<any>('/reports/sales-summary', { startDate, endDate }),
  getDebtOverview: () => apiClient.get<any>('/reports/debt-overview'),
  getVatReport: (startDate: string, endDate: string) =>
    apiClient.get<any>('/reports/vat', { startDate, endDate }),
  getProfitLoss: (startDate: string, endDate: string) =>
    apiClient.get<any>('/reports/profit-loss', { startDate, endDate }),
  getTopProducts: (startDate: string, endDate: string, limit?: number) =>
    apiClient.get<any[]>('/reports/top-products', { startDate, endDate, limit: limit || 10 }),
};

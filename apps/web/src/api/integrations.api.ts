import { apiClient, ApiResponse } from './client';

export interface Integration {
  id: string;
  name: string;
  type: 'e_commerce' | 'bank' | 'payment' | 'crm' | 'other';
  provider: string;
  status: 'active' | 'inactive' | 'error';
  config: Record<string, unknown>;
  credentials: Record<string, unknown>;
  last_sync_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface IntegrationLog {
  id: string;
  integration_id: string;
  action: string;
  status: string;
  message: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

export interface ECommerceOrder {
  id: string;
  integration_id: string;
  external_order_id: string;
  external_order_number: string | null;
  sale_id: string | null;
  status: string;
  sync_status: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  shipping_address: string | null;
  subtotal: number;
  shipping_cost: number;
  commission: number;
  total: number;
  currency: string;
  items: unknown[];
  order_date: string;
  created_at: string;
  updated_at: string;
  integration_name?: string;
}

export interface BankStatement {
  id: string;
  integration_id: string;
  account_id: string | null;
  external_id: string | null;
  transaction_date: string;
  value_date: string | null;
  description: string | null;
  type: 'credit' | 'debit';
  amount: number;
  balance: number | null;
  currency: string;
  reference: string | null;
  match_status: string;
  matched_movement_id: string | null;
  created_at: string;
  updated_at: string;
  integration_name?: string;
  account_name?: string;
}

export interface CreateIntegrationInput {
  name: string;
  type: 'e_commerce' | 'bank' | 'payment' | 'crm' | 'other';
  provider: string;
  config?: Record<string, unknown>;
  credentials?: Record<string, unknown>;
}

export interface UpdateIntegrationInput {
  name?: string;
  status?: 'active' | 'inactive' | 'error';
  config?: Record<string, unknown>;
  credentials?: Record<string, unknown>;
}

export interface SyncResult {
  syncedCount: number;
  errorCount: number;
  errors?: string[];
}

const getIntegrations = (type?: string, status?: string): Promise<ApiResponse<Integration[]>> => {
  const params: Record<string, string> = {};
  if (type) params.type = type;
  if (status) params.status = status;
  return apiClient.get<Integration[]>('/integrations', params);
};

const getIntegration = (id: string): Promise<ApiResponse<Integration>> => {
  return apiClient.get<Integration>(`/integrations/${id}`);
};

const getIntegrationLogs = (id: string): Promise<ApiResponse<IntegrationLog[]>> => {
  return apiClient.get<IntegrationLog[]>(`/integrations/${id}/logs`);
};

const createIntegration = (data: CreateIntegrationInput): Promise<ApiResponse<Integration>> => {
  return apiClient.post<Integration>('/integrations', data);
};

const updateIntegration = (id: string, data: UpdateIntegrationInput): Promise<ApiResponse<Integration>> => {
  return apiClient.patch<Integration>(`/integrations/${id}`, data);
};

const deleteIntegration = (id: string): Promise<ApiResponse<void>> => {
  return apiClient.delete<void>(`/integrations/${id}`);
};

const testConnection = (id: string): Promise<ApiResponse<{ success: boolean; message: string }>> => {
  return apiClient.post<{ success: boolean; message: string }>(`/integrations/${id}/test`, {});
};

const syncOrders = (id: string, startDate?: string, endDate?: string): Promise<ApiResponse<SyncResult>> => {
  return apiClient.post<SyncResult>(`/integrations/${id}/sync-orders`, { startDate, endDate });
};

const getECommerceOrders = (params?: {
  page?: number;
  limit?: number;
  integrationId?: string;
  status?: string;
  syncStatus?: string;
  startDate?: string;
  endDate?: string;
}): Promise<ApiResponse<ECommerceOrder[]>> => {
  return apiClient.get<ECommerceOrder[]>('/integrations/e-commerce-orders', params as Record<string, string | number>);
};

const getECommerceOrder = (id: string): Promise<ApiResponse<ECommerceOrder>> => {
  return apiClient.get<ECommerceOrder>(`/integrations/e-commerce-orders/${id}`);
};

const getBankStatements = (params?: {
  page?: number;
  limit?: number;
  integrationId?: string;
  accountId?: string;
  matchStatus?: string;
  startDate?: string;
  endDate?: string;
}): Promise<ApiResponse<BankStatement[]>> => {
  return apiClient.get<BankStatement[]>('/integrations/bank-statements', params as Record<string, string | number>);
};

const matchBankStatement = (id: string, movementId: string): Promise<ApiResponse<void>> => {
  return apiClient.post<void>(`/integrations/bank-statements/${id}/match`, { movementId });
};

const ignoreBankStatement = (id: string): Promise<ApiResponse<void>> => {
  return apiClient.post<void>(`/integrations/bank-statements/${id}/ignore`, {});
};

export const integrationsApi = {
  getIntegrations,
  getIntegration,
  getIntegrationLogs,
  createIntegration,
  updateIntegration,
  deleteIntegration,
  testConnection,
  syncOrders,
  getECommerceOrders,
  getECommerceOrder,
  getBankStatements,
  matchBankStatement,
  ignoreBankStatement,
};

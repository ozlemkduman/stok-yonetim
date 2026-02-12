import { apiClient } from './client';

export interface Account {
  id: string;
  name: string;
  account_type: 'kasa' | 'banka';
  bank_name: string | null;
  iban: string | null;
  account_number: string | null;
  branch_name: string | null;
  currency: string;
  opening_balance: number;
  current_balance: number;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AccountMovement {
  id: string;
  account_id: string;
  movement_type: 'gelir' | 'gider' | 'transfer_in' | 'transfer_out';
  amount: number;
  balance_after: number;
  category: string | null;
  description: string | null;
  reference_type: string | null;
  reference_id: string | null;
  movement_date: string;
  created_at: string;
  account_name?: string;
}

export interface AccountTransfer {
  id: string;
  from_account_id: string;
  to_account_id: string;
  amount: number;
  description: string | null;
  transfer_date: string;
  created_at: string;
  from_account_name?: string;
  to_account_name?: string;
}

export interface CreateAccountData {
  name: string;
  account_type: 'kasa' | 'banka';
  bank_name?: string;
  iban?: string;
  account_number?: string;
  branch_name?: string;
  currency?: string;
  opening_balance?: number;
  is_default?: boolean;
}

export interface UpdateAccountData {
  name?: string;
  bank_name?: string;
  iban?: string;
  account_number?: string;
  branch_name?: string;
  is_default?: boolean;
  is_active?: boolean;
}

export interface CreateMovementData {
  movement_type: 'gelir' | 'gider';
  amount: number;
  category?: string;
  description?: string;
  reference_type?: string;
  reference_id?: string;
  movement_date?: string;
}

export interface CreateTransferData {
  from_account_id: string;
  to_account_id: string;
  amount: number;
  description?: string;
  transfer_date?: string;
}

export interface AccountListParams {
  page?: number;
  limit?: number;
  accountType?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface MovementListParams {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  movementType?: string;
}

export interface AccountSummary {
  totalKasa: number;
  totalBanka: number;
  totalBalance: number;
}

export interface AccountStats {
  movementsCount: number;
  totalIncome: number;
  totalExpense: number;
  totalTransferIn: number;
  totalTransferOut: number;
  transfersCount: number;
}

export interface AccountDetail {
  account: Account;
  movements: AccountMovement[];
  transfers: AccountTransfer[];
  stats: AccountStats;
}

export const accountsApi = {
  getAll: async (params: AccountListParams = {}) => {
    const queryParams: Record<string, string | number> = {};

    if (params.page) queryParams.page = params.page;
    if (params.limit) queryParams.limit = params.limit;
    if (params.accountType) queryParams.accountType = params.accountType;
    if (params.isActive !== undefined) queryParams.isActive = String(params.isActive);
    if (params.sortBy) queryParams.sortBy = params.sortBy;
    if (params.sortOrder) queryParams.sortOrder = params.sortOrder;

    return apiClient.get<Account[]>('/accounts', queryParams);
  },

  getById: async (id: string) => {
    return apiClient.get<Account>(`/accounts/${id}`);
  },

  getDetail: async (id: string) => {
    return apiClient.get<AccountDetail>(`/accounts/${id}/detail`);
  },

  getSummary: async () => {
    return apiClient.get<AccountSummary>('/accounts/summary');
  },

  create: async (data: CreateAccountData) => {
    return apiClient.post<Account>('/accounts', data);
  },

  update: async (id: string, data: UpdateAccountData) => {
    return apiClient.patch<Account>(`/accounts/${id}`, data);
  },

  delete: async (id: string) => {
    return apiClient.delete<{ message: string }>(`/accounts/${id}`);
  },

  // Movements
  getMovements: async (accountId: string, params: MovementListParams = {}) => {
    const queryParams: Record<string, string | number> = {};

    if (params.page) queryParams.page = params.page;
    if (params.limit) queryParams.limit = params.limit;
    if (params.startDate) queryParams.startDate = params.startDate;
    if (params.endDate) queryParams.endDate = params.endDate;
    if (params.movementType) queryParams.movementType = params.movementType;

    return apiClient.get<AccountMovement[]>(`/accounts/${accountId}/movements`, queryParams);
  },

  addMovement: async (accountId: string, data: CreateMovementData) => {
    return apiClient.post<AccountMovement>(`/accounts/${accountId}/movements`, data);
  },

  // Transfers
  getTransfers: async (params: { page?: number; limit?: number; accountId?: string } = {}) => {
    const queryParams: Record<string, string | number> = {};

    if (params.page) queryParams.page = params.page;
    if (params.limit) queryParams.limit = params.limit;
    if (params.accountId) queryParams.accountId = params.accountId;

    return apiClient.get<AccountTransfer[]>('/accounts/transfers', queryParams);
  },

  createTransfer: async (data: CreateTransferData) => {
    return apiClient.post<AccountTransfer>('/accounts/transfers', data);
  },
};

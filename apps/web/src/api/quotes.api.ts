import { apiClient } from './client';

export interface Quote {
  id: string;
  quote_number: string;
  customer_id: string | null;
  quote_date: string;
  valid_until: string;
  subtotal: number;
  discount_amount: number;
  discount_rate: number;
  vat_total: number;
  grand_total: number;
  include_vat: boolean;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted';
  converted_sale_id: string | null;
  notes: string | null;
  created_by?: string | null;
  created_by_name?: string | null;
  created_at: string;
  updated_at: string;
  customer_name?: string;
  items?: QuoteItem[];
}

export interface QuoteItem {
  id: string;
  quote_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  discount_rate: number;
  vat_rate: number;
  vat_amount: number;
  line_total: number;
}

export interface QuoteItemInput {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  discount_rate?: number;
  vat_rate?: number;
}

export interface CreateQuoteData {
  customer_id?: string;
  valid_until: string;
  items: QuoteItemInput[];
  discount_amount?: number;
  discount_rate?: number;
  include_vat?: boolean;
  notes?: string;
}

export interface UpdateQuoteData {
  customer_id?: string;
  valid_until?: string;
  items?: QuoteItemInput[];
  discount_amount?: number;
  discount_rate?: number;
  include_vat?: boolean;
  notes?: string;
}

export interface ConvertToSaleData {
  payment_method: 'nakit' | 'kredi_karti' | 'havale' | 'veresiye';
  warehouse_id?: string;
  due_date?: string;
  notes?: string;
}

export interface QuoteListParams {
  page?: number;
  limit?: number;
  search?: string;
  customerId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const quotesApi = {
  getAll: async (params: QuoteListParams = {}) => {
    const queryParams: Record<string, string | number> = {};

    if (params.page) queryParams.page = params.page;
    if (params.limit) queryParams.limit = params.limit;
    if (params.search) queryParams.search = params.search;
    if (params.customerId) queryParams.customerId = params.customerId;
    if (params.status) queryParams.status = params.status;
    if (params.startDate) queryParams.startDate = params.startDate;
    if (params.endDate) queryParams.endDate = params.endDate;
    if (params.sortBy) queryParams.sortBy = params.sortBy;
    if (params.sortOrder) queryParams.sortOrder = params.sortOrder;

    return apiClient.get<Quote[]>('/quotes', queryParams);
  },

  getById: async (id: string) => {
    return apiClient.get<Quote>(`/quotes/${id}`);
  },

  create: async (data: CreateQuoteData) => {
    return apiClient.post<Quote>('/quotes', data);
  },

  update: async (id: string, data: UpdateQuoteData) => {
    return apiClient.patch<Quote>(`/quotes/${id}`, data);
  },

  delete: async (id: string) => {
    return apiClient.delete<{ message: string }>(`/quotes/${id}`);
  },

  send: async (id: string) => {
    return apiClient.post<Quote>(`/quotes/${id}/send`, {});
  },

  accept: async (id: string) => {
    return apiClient.post<Quote>(`/quotes/${id}/accept`, {});
  },

  reject: async (id: string) => {
    return apiClient.post<Quote>(`/quotes/${id}/reject`, {});
  },

  convertToSale: async (id: string, data: ConvertToSaleData) => {
    return apiClient.post<Quote>(`/quotes/${id}/convert`, data);
  },
};

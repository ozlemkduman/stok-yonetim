import { apiClient } from './client';

export interface EDocument {
  id: string;
  document_type: 'e_fatura' | 'e_arsiv' | 'e_ihracat' | 'e_irsaliye' | 'e_smm';
  document_number: string;
  gib_uuid: string | null;
  reference_type: 'sale' | 'return' | 'waybill';
  reference_id: string;
  customer_id: string | null;
  issue_date: string;
  amount: number;
  vat_amount: number;
  total_amount: number;
  status: 'draft' | 'pending' | 'sent' | 'approved' | 'rejected' | 'cancelled';
  gib_response_code: string | null;
  gib_response_message: string | null;
  envelope_uuid: string | null;
  created_at: string;
  updated_at: string;
  customer_name?: string;
  logs?: EDocumentLog[];
}

export interface EDocumentLog {
  id: string;
  document_id: string;
  action: string;
  status_before: string | null;
  status_after: string | null;
  message: string | null;
  created_at: string;
}

export interface CreateEDocumentData {
  document_type: 'e_fatura' | 'e_arsiv' | 'e_ihracat' | 'e_irsaliye' | 'e_smm';
  reference_type: 'sale' | 'return' | 'waybill';
  reference_id: string;
  notes?: string;
}

export interface EDocumentListParams {
  page?: number;
  limit?: number;
  documentType?: string;
  status?: string;
  referenceType?: string;
  customerId?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface EDocumentSummary {
  total: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
}

export const eDocumentsApi = {
  getAll: async (params: EDocumentListParams = {}) => {
    const queryParams: Record<string, string | number> = {};

    if (params.page) queryParams.page = params.page;
    if (params.limit) queryParams.limit = params.limit;
    if (params.documentType) queryParams.documentType = params.documentType;
    if (params.status) queryParams.status = params.status;
    if (params.referenceType) queryParams.referenceType = params.referenceType;
    if (params.customerId) queryParams.customerId = params.customerId;
    if (params.startDate) queryParams.startDate = params.startDate;
    if (params.endDate) queryParams.endDate = params.endDate;
    if (params.sortBy) queryParams.sortBy = params.sortBy;
    if (params.sortOrder) queryParams.sortOrder = params.sortOrder;

    return apiClient.get<EDocument[]>('/e-documents', queryParams);
  },

  getById: async (id: string) => {
    return apiClient.get<EDocument>(`/e-documents/${id}`);
  },

  getSummary: async () => {
    return apiClient.get<EDocumentSummary>('/e-documents/summary');
  },

  create: async (data: CreateEDocumentData) => {
    return apiClient.post<EDocument>('/e-documents', data);
  },

  send: async (id: string) => {
    return apiClient.post<EDocument>(`/e-documents/${id}/send`, {});
  },

  checkStatus: async (id: string) => {
    return apiClient.post<EDocument>(`/e-documents/${id}/check-status`, {});
  },

  cancel: async (id: string) => {
    return apiClient.post<EDocument>(`/e-documents/${id}/cancel`, {});
  },
};

import { apiClient } from './client';

export type EDocumentType = 'e_fatura' | 'e_arsiv' | 'e_ihracat' | 'e_irsaliye' | 'e_smm';
export type EDocumentStatus = 'draft' | 'pending' | 'sent' | 'approved' | 'rejected' | 'cancelled';

export interface EDocument {
  id: string;
  document_type: EDocumentType;
  document_number: string;
  gib_uuid: string | null;
  reference_type: string;
  reference_id: string;
  customer_id: string | null;
  customer_name?: string | null;
  issue_date: string;
  amount: number;
  vat_amount: number;
  total_amount: number;
  status: EDocumentStatus;
  gib_response_code: string | null;
  gib_response_message: string | null;
  sent_at: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EDocumentSummary {
  total: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
}

export interface CreateEDocumentData {
  document_type: EDocumentType;
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

export const eDocumentsApi = {
  getAll: (params: EDocumentListParams = {}) =>
    apiClient.get<EDocument[]>('/e-documents', params as Record<string, string | number>),
  getSummary: () => apiClient.get<EDocumentSummary>('/e-documents/summary'),
  getById: (id: string) => apiClient.get<EDocument & { logs: unknown[] }>(`/e-documents/${id}`),
  create: (data: CreateEDocumentData) => apiClient.post<EDocument>('/e-documents', data),
  send: (id: string) => apiClient.post<EDocument>(`/e-documents/${id}/send`, {}),
  checkStatus: (id: string) => apiClient.post<EDocument>(`/e-documents/${id}/check-status`, {}),
  cancel: (id: string) => apiClient.post<EDocument>(`/e-documents/${id}/cancel`, {}),
};

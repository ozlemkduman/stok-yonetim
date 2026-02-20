import { apiClient } from './client';

export interface ParsedInvoiceInfo {
  id: string;
  issueDate: string;
  invoiceTypeCode: string;
  currencyCode: string;
}

export interface ParsedCustomerInfo {
  name: string;
  taxNumber: string | null;
  taxOffice: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
}

export interface ParsedItemInfo {
  name: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  lineTotal: number;
  vatAmount: number;
  unit: string;
}

export interface PreviewMatch<T> {
  parsed: T;
  isNew: boolean;
  matchedId: string | null;
  matchedName: string | null;
}

export interface ParsePreviewResponse {
  invoice: ParsedInvoiceInfo;
  customer: PreviewMatch<ParsedCustomerInfo>;
  items: (PreviewMatch<ParsedItemInfo> & { index: number; stockQuantity: number | null })[];
  totals: {
    lineExtensionAmount: number;
    taxInclusiveAmount: number;
    taxTotal: number;
    payableAmount: number;
  };
}

export interface ConfirmImportData {
  invoice: ParsedInvoiceInfo;
  customer: PreviewMatch<ParsedCustomerInfo>;
  items: {
    parsed: ParsedItemInfo;
    isNew: boolean;
    matchedId: string | null;
    purchasePrice?: number;
  }[];
  totals: ParsePreviewResponse['totals'];
  warehouseId?: string;
  paymentMethod?: string;
  saleType?: string;
  dueDate?: string;
  notes?: string;
}

export const invoiceImportApi = {
  parse: (file: File) =>
    apiClient.upload<ParsePreviewResponse>('/invoice-import/parse', file),

  confirm: (data: ConfirmImportData) =>
    apiClient.post<{ saleId: string }>('/invoice-import/confirm', data),
};

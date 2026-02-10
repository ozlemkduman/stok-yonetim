import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { Knex } from 'knex';

export interface EDocument {
  id: string;
  document_type: string;
  document_number: string;
  gib_uuid: string | null;
  reference_type: string;
  reference_id: string;
  customer_id: string | null;
  issue_date: Date;
  amount: number;
  vat_amount: number;
  total_amount: number;
  status: string;
  gib_response_code: string | null;
  gib_response_message: string | null;
  envelope_uuid: string | null;
  xml_content: string | null;
  pdf_path: string | null;
  sent_at: Date | null;
  approved_at: Date | null;
  created_at: Date;
  updated_at: Date;
  customer_name?: string;
}

export interface EDocumentLog {
  id: string;
  document_id: string;
  action: string;
  status_before: string | null;
  status_after: string | null;
  message: string | null;
  created_at: Date;
}

@Injectable()
export class EDocumentsRepository {
  constructor(private readonly db: DatabaseService) {}

  async findAll(params: {
    page: number;
    limit: number;
    documentType?: string;
    status?: string;
    referenceType?: string;
    customerId?: string;
    startDate?: string;
    endDate?: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  }): Promise<{ items: EDocument[]; total: number }> {
    const { page, limit, documentType, status, referenceType, customerId, startDate, endDate, sortBy, sortOrder } = params;
    const offset = (page - 1) * limit;

    let query = this.db.knex('e_documents')
      .leftJoin('customers', 'e_documents.customer_id', 'customers.id')
      .select('e_documents.*', 'customers.name as customer_name');
    let countQuery = this.db.knex('e_documents');

    if (documentType) {
      query = query.where('e_documents.document_type', documentType);
      countQuery = countQuery.where('document_type', documentType);
    }

    if (status) {
      query = query.where('e_documents.status', status);
      countQuery = countQuery.where('status', status);
    }

    if (referenceType) {
      query = query.where('e_documents.reference_type', referenceType);
      countQuery = countQuery.where('reference_type', referenceType);
    }

    if (customerId) {
      query = query.where('e_documents.customer_id', customerId);
      countQuery = countQuery.where('customer_id', customerId);
    }

    if (startDate) {
      query = query.where('e_documents.issue_date', '>=', startDate);
      countQuery = countQuery.where('issue_date', '>=', startDate);
    }

    if (endDate) {
      query = query.where('e_documents.issue_date', '<=', endDate);
      countQuery = countQuery.where('issue_date', '<=', endDate);
    }

    const [items, [{ count }]] = await Promise.all([
      query.orderBy(`e_documents.${sortBy}`, sortOrder).limit(limit).offset(offset),
      countQuery.count('id as count'),
    ]);

    return { items, total: parseInt(count as string, 10) };
  }

  async findById(id: string): Promise<EDocument | null> {
    return this.db.knex('e_documents')
      .leftJoin('customers', 'e_documents.customer_id', 'customers.id')
      .select('e_documents.*', 'customers.name as customer_name')
      .where('e_documents.id', id)
      .first() || null;
  }

  async findByReference(referenceType: string, referenceId: string): Promise<EDocument[]> {
    return this.db.knex('e_documents')
      .where('reference_type', referenceType)
      .where('reference_id', referenceId)
      .orderBy('created_at', 'desc');
  }

  async generateDocumentNumber(documentType: string): Promise<string> {
    const prefixes: Record<string, string> = {
      e_fatura: 'EFT',
      e_arsiv: 'EAR',
      e_ihracat: 'EIH',
      e_irsaliye: 'EIR',
      e_smm: 'ESM',
    };
    const prefix = prefixes[documentType] || 'DOC';
    const today = new Date();
    const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`;

    const [result] = await this.db.knex('e_documents')
      .where('document_type', documentType)
      .whereILike('document_number', `${prefix}${dateStr}%`)
      .count('id as count');

    const count = parseInt(result.count as string, 10) + 1;
    return `${prefix}${dateStr}${String(count).padStart(6, '0')}`;
  }

  async create(data: Partial<EDocument>, trx?: Knex.Transaction): Promise<EDocument> {
    const query = trx ? trx('e_documents') : this.db.knex('e_documents');
    const [document] = await query.insert(data).returning('*');
    return document;
  }

  async update(id: string, data: Partial<EDocument>, trx?: Knex.Transaction): Promise<EDocument> {
    const query = trx ? trx('e_documents') : this.db.knex('e_documents');
    const [document] = await query
      .where('id', id)
      .update({ ...data, updated_at: this.db.knex.fn.now() })
      .returning('*');
    return document;
  }

  async createLog(data: Partial<EDocumentLog>, trx?: Knex.Transaction): Promise<EDocumentLog> {
    const query = trx ? trx('e_document_logs') : this.db.knex('e_document_logs');
    const [log] = await query.insert(data).returning('*');
    return log;
  }

  async getLogs(documentId: string): Promise<EDocumentLog[]> {
    return this.db.knex('e_document_logs')
      .where('document_id', documentId)
      .orderBy('created_at', 'desc');
  }

  async getSummary(): Promise<{
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
  }> {
    const [totalResult] = await this.db.knex('e_documents').count('id as count');
    const total = parseInt(totalResult.count as string, 10);

    const byTypeResults = await this.db.knex('e_documents')
      .select('document_type')
      .count('id as count')
      .groupBy('document_type');

    const byStatusResults = await this.db.knex('e_documents')
      .select('status')
      .count('id as count')
      .groupBy('status');

    const byType: Record<string, number> = {};
    for (const row of byTypeResults) {
      byType[(row as any).document_type] = parseInt((row as any).count, 10);
    }

    const byStatus: Record<string, number> = {};
    for (const row of byStatusResults) {
      byStatus[(row as any).status] = parseInt((row as any).count, 10);
    }

    return { total, byType, byStatus };
  }
}

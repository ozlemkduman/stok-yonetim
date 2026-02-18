import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { BaseTenantRepository } from '../../common/repositories/base.repository';
import { Knex } from 'knex';

export interface Quote {
  id: string;
  quote_number: string;
  customer_id: string | null;
  quote_date: Date;
  valid_until: Date;
  subtotal: number;
  discount_amount: number;
  discount_rate: number;
  vat_total: number;
  grand_total: number;
  include_vat: boolean;
  status: string;
  converted_sale_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
  customer_name?: string;
  created_by_name?: string;
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
  created_at: Date;
}

@Injectable()
export class QuotesRepository extends BaseTenantRepository<Quote> {
  protected tableName = 'quotes';

  constructor(db: DatabaseService) {
    super(db);
  }

  async findAll(params: {
    page: number;
    limit: number;
    search?: string;
    customerId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  }): Promise<{ items: Quote[]; total: number }> {
    const { page, limit, search, customerId, status, startDate, endDate, sortBy, sortOrder } = params;
    const offset = (page - 1) * limit;

    let query = this.query.clone()
      .leftJoin('customers', 'quotes.customer_id', 'customers.id')
      .leftJoin('users', 'quotes.created_by', 'users.id')
      .select('quotes.*', 'customers.name as customer_name', 'users.name as created_by_name');
    let countQuery = this.query.clone();

    if (customerId) {
      query = query.where('quotes.customer_id', customerId);
      countQuery = countQuery.where('customer_id', customerId);
    }

    if (status) {
      query = query.where('quotes.status', status);
      countQuery = countQuery.where('status', status);
    }

    if (startDate) {
      query = query.where('quotes.quote_date', '>=', startDate);
      countQuery = countQuery.where('quote_date', '>=', startDate);
    }

    if (endDate) {
      query = query.where('quotes.quote_date', '<=', endDate);
      countQuery = countQuery.where('quote_date', '<=', endDate);
    }

    if (search) {
      query = query.where((b) =>
        b.whereILike('quotes.quote_number', `%${search}%`)
          .orWhereILike('customers.name', `%${search}%`)
      );
      countQuery = countQuery.whereILike('quote_number', `%${search}%`);
    }

    const [items, [{ count }]] = await Promise.all([
      query.orderBy(`quotes.${sortBy}`, sortOrder).limit(limit).offset(offset),
      countQuery.count('id as count'),
    ]);

    return { items, total: parseInt(count as string, 10) };
  }

  async findQuoteById(id: string): Promise<Quote | null> {
    return this.query.clone()
      .leftJoin('customers', 'quotes.customer_id', 'customers.id')
      .leftJoin('users', 'quotes.created_by', 'users.id')
      .select('quotes.*', 'customers.name as customer_name', 'users.name as created_by_name')
      .where('quotes.id', id)
      .first() || null;
  }

  async findItemsByQuoteId(quoteId: string): Promise<QuoteItem[]> {
    const query = this.knex('quote_items').where('quote_id', quoteId);
    return this.applyTenantFilter(query, 'quote_items');
  }

  async generateQuoteNumber(): Promise<string> {
    const today = new Date();
    const prefix = `TKL${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`;
    const [result] = await this.query.whereILike('quote_number', `${prefix}%`).count('id as count');
    const count = parseInt(result.count as string, 10) + 1;
    return `${prefix}${String(count).padStart(4, '0')}`;
  }

  async createQuote(data: Partial<Quote>, items: Partial<QuoteItem>[], trx?: Knex.Transaction): Promise<Quote> {
    const insertData = this.getInsertData(data);
    const query = trx ? trx('quotes') : this.knex('quotes');
    const [quote] = await query.insert(insertData).returning('*');

    if (items.length > 0) {
      const itemsQuery = trx ? trx('quote_items') : this.knex('quote_items');
      const itemsData = items.map((item) => this.getInsertData({ ...item, quote_id: quote.id } as any));
      await itemsQuery.insert(itemsData);
    }

    return quote;
  }

  async updateQuote(id: string, data: Partial<Quote>, trx?: Knex.Transaction): Promise<Quote> {
    const baseQuery = trx ? trx('quotes') : this.knex('quotes');
    const query = this.applyTenantFilter(baseQuery);
    const [quote] = await query
      .where('id', id)
      .update({ ...data, updated_at: this.knex.fn.now() })
      .returning('*');
    return quote;
  }

  async deleteItems(quoteId: string, trx?: Knex.Transaction): Promise<void> {
    const baseQuery = trx ? trx('quote_items') : this.knex('quote_items');
    const query = this.applyTenantFilter(baseQuery, 'quote_items');
    await query.where('quote_id', quoteId).delete();
  }

  async insertItems(items: Partial<QuoteItem>[], trx?: Knex.Transaction): Promise<void> {
    if (items.length === 0) return;
    const query = trx ? trx('quote_items') : this.knex('quote_items');
    const itemsData = items.map((item) => this.getInsertData(item));
    await query.insert(itemsData);
  }

  async updateStatus(id: string, status: string, convertedSaleId?: string): Promise<void> {
    const updateData: any = { status, updated_at: this.knex.fn.now() };
    if (convertedSaleId) {
      updateData.converted_sale_id = convertedSaleId;
    }
    await this.query.where(`${this.tableName}.id`, id).update(updateData);
  }

  async deleteQuote(id: string): Promise<void> {
    await this.query.where(`${this.tableName}.id`, id).delete();
  }

  async getExpiredQuotes(): Promise<Quote[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.query
      .whereIn('status', ['draft', 'sent'])
      .where('valid_until', '<', today);
  }
}

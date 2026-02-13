import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { Knex } from 'knex';

export interface Sale {
  id: string;
  invoice_number: string;
  customer_id: string | null;
  warehouse_id: string | null;
  sale_date: Date;
  subtotal: number;
  discount_amount: number;
  discount_rate: number;
  vat_total: number;
  grand_total: number;
  include_vat: boolean;
  payment_method: string;
  due_date: Date | null;
  status: string;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
  customer_name?: string;
  customer_phone?: string;
  customer_address?: string;
  customer_tax_number?: string;
  customer_tax_office?: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  discount_rate: number;
  vat_rate: number;
  vat_amount: number;
  line_total: number;
  product_name?: string;
  barcode?: string;
}

@Injectable()
export class SalesRepository {
  constructor(private readonly db: DatabaseService) {}

  async findAll(params: { page: number; limit: number; search?: string; customerId?: string; status?: string; startDate?: string; endDate?: string; includeVat?: string; sortBy: string; sortOrder: 'asc' | 'desc' }): Promise<{ items: Sale[]; total: number }> {
    const { page, limit, search, customerId, status, startDate, endDate, includeVat, sortBy, sortOrder } = params;
    const offset = (page - 1) * limit;

    let query = this.db.knex('sales').leftJoin('customers', 'sales.customer_id', 'customers.id').select('sales.*', 'customers.name as customer_name');
    let countQuery = this.db.knex('sales');

    if (customerId) {
      query = query.where('sales.customer_id', customerId);
      countQuery = countQuery.where('customer_id', customerId);
    }
    if (status) {
      query = query.where('sales.status', status);
      countQuery = countQuery.where('status', status);
    }
    if (startDate) {
      query = query.where('sales.sale_date', '>=', startDate);
      countQuery = countQuery.where('sale_date', '>=', startDate);
    }
    if (endDate) {
      query = query.where('sales.sale_date', '<=', endDate);
      countQuery = countQuery.where('sale_date', '<=', endDate);
    }
    if (includeVat === 'true') {
      query = query.where('sales.include_vat', true);
      countQuery = countQuery.where('include_vat', true);
    } else if (includeVat === 'false') {
      query = query.where('sales.include_vat', false);
      countQuery = countQuery.where('include_vat', false);
    }
    if (search) {
      query = query.where((b) => b.whereILike('sales.invoice_number', `%${search}%`).orWhereILike('customers.name', `%${search}%`));
      countQuery = countQuery.whereILike('invoice_number', `%${search}%`);
    }

    const [items, [{ count }]] = await Promise.all([
      query.orderBy(`sales.${sortBy}`, sortOrder).limit(limit).offset(offset),
      countQuery.count('id as count'),
    ]);
    return { items, total: parseInt(count as string, 10) };
  }

  async findById(id: string): Promise<Sale | null> {
    return this.db.knex('sales')
      .leftJoin('customers', 'sales.customer_id', 'customers.id')
      .select(
        'sales.*',
        'customers.name as customer_name',
        'customers.phone as customer_phone',
        'customers.address as customer_address',
        'customers.tax_number as customer_tax_number',
        'customers.tax_office as customer_tax_office'
      )
      .where('sales.id', id)
      .first() || null;
  }

  async findItemsBySaleId(saleId: string): Promise<SaleItem[]> {
    return this.db.knex('sale_items')
      .leftJoin('products', 'sale_items.product_id', 'products.id')
      .select('sale_items.*', 'products.name as product_name', 'products.barcode')
      .where('sale_items.sale_id', saleId);
  }

  async generateInvoiceNumber(): Promise<string> {
    const today = new Date();
    const prefix = `INV${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`;
    const [result] = await this.db.knex('sales').whereILike('invoice_number', `${prefix}%`).count('id as count');
    const count = parseInt(result.count as string, 10) + 1;
    return `${prefix}${String(count).padStart(4, '0')}`;
  }

  async create(data: Partial<Sale>, items: Partial<SaleItem>[], trx: Knex.Transaction): Promise<Sale> {
    const [sale] = await trx('sales').insert(data).returning('*');
    if (items.length > 0) {
      await trx('sale_items').insert(items.map((item) => ({ ...item, sale_id: sale.id })));
    }
    return sale;
  }

  async updateStatus(id: string, status: string): Promise<void> {
    await this.db.knex('sales').where('id', id).update({ status, updated_at: this.db.knex.fn.now() });
  }

  async getTodaySales(): Promise<{ count: number; total: number }> {
    const today = new Date().toISOString().split('T')[0];
    const [result] = await this.db.knex('sales').where('status', 'completed').whereRaw('DATE(sale_date) = ?', [today]).select(this.db.knex.raw('COUNT(*) as count, COALESCE(SUM(grand_total), 0) as total'));
    const r = result as any;
    return { count: parseInt(r?.count || '0', 10), total: parseFloat(r?.total || '0') };
  }

  async findPaymentsBySaleId(saleId: string): Promise<{ id: string; payment_date: Date; amount: number; method: string; notes: string | null }[]> {
    return this.db.knex('payments').where('sale_id', saleId).orderBy('payment_date', 'desc');
  }
}

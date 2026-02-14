import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { BaseTenantRepository } from '../../common/repositories/base.repository';
import { Knex } from 'knex';

export interface Return {
  id: string;
  return_number: string;
  sale_id: string | null;
  customer_id: string | null;
  return_date: Date;
  total_amount: number;
  vat_total: number;
  reason: string | null;
  status: string;
  created_at: Date;
  customer_name?: string;
}

export interface ReturnItem {
  id: string;
  return_id: string;
  product_id: string;
  sale_item_id: string | null;
  quantity: number;
  unit_price: number;
  vat_amount: number;
  line_total: number;
  product_name?: string;
  barcode?: string | null;
}

@Injectable()
export class ReturnsRepository extends BaseTenantRepository<Return> {
  protected tableName = 'returns';

  constructor(db: DatabaseService) {
    super(db);
  }

  async findAll(params: { page: number; limit: number; customerId?: string; sortBy: string; sortOrder: 'asc' | 'desc' }): Promise<{ items: Return[]; total: number }> {
    const { page, limit, customerId, sortBy, sortOrder } = params;

    let query = this.query.clone()
      .leftJoin('customers', 'returns.customer_id', 'customers.id')
      .select('returns.*', 'customers.name as customer_name');
    let countQuery = this.query.clone();

    if (customerId) {
      query = query.where('returns.customer_id', customerId);
      countQuery = countQuery.where('customer_id', customerId);
    }

    const [items, [{ count }]] = await Promise.all([
      query.orderBy(`returns.${sortBy}`, sortOrder).limit(limit).offset((page - 1) * limit),
      countQuery.count('id as count'),
    ]);
    return { items, total: parseInt(count as string, 10) };
  }

  async findReturnById(id: string): Promise<Return & { sale_invoice_number?: string; sale_date?: Date } | null> {
    return this.query.clone()
      .leftJoin('customers', 'returns.customer_id', 'customers.id')
      .leftJoin('sales', 'returns.sale_id', 'sales.id')
      .select(
        'returns.*',
        'customers.name as customer_name',
        'sales.invoice_number as sale_invoice_number',
        'sales.sale_date as sale_date'
      )
      .where('returns.id', id)
      .first() || null;
  }

  async findItemsByReturnId(returnId: string): Promise<ReturnItem[]> {
    const query = this.knex('return_items')
      .leftJoin('products', 'return_items.product_id', 'products.id')
      .select(
        'return_items.*',
        'products.name as product_name',
        'products.barcode as barcode'
      )
      .where('return_items.return_id', returnId);

    return this.applyTenantFilter(query, 'products');
  }

  async generateReturnNumber(): Promise<string> {
    const today = new Date();
    const prefix = `RET${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`;
    const [result] = await this.query.whereILike('return_number', `${prefix}%`).count('id as count');
    return `${prefix}${String(parseInt(result.count as string, 10) + 1).padStart(4, '0')}`;
  }

  async createReturn(data: Partial<Return>, items: Partial<ReturnItem>[], trx: Knex.Transaction): Promise<Return> {
    const insertData = this.getInsertData(data);
    const [ret] = await trx('returns').insert(insertData).returning('*');
    if (items.length > 0) {
      const itemsData = items.map((item) => this.getInsertData({ ...item, return_id: ret.id } as any));
      await trx('return_items').insert(itemsData);
    }
    return ret;
  }
}

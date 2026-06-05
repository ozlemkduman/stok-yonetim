import { Injectable } from '@nestjs/common';
import { BaseTenantRepository } from '../../common/repositories/base.repository';
import { DatabaseService } from '../../database/database.service';
import { Knex } from 'knex';

export interface StockCountSession {
  id: string;
  tenant_id: string | null;
  count_number: string;
  warehouse_id: string | null;
  started_at: Date;
  completed_at: Date | null;
  status: string;
  notes: string | null;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface StockCountItem {
  id: string;
  tenant_id: string | null;
  session_id: string;
  product_id: string | null;
  expected_quantity: number;
  counted_quantity: number | null;
  notes: string | null;
  counted_at: Date | null;
  counted_by: string | null;
  product_name?: string;
  product_barcode?: string;
  product_unit?: string;
  product_is_active?: boolean;
}

@Injectable()
export class StockCountRepository extends BaseTenantRepository<StockCountSession> {
  protected tableName = 'stock_count_sessions';

  constructor(db: DatabaseService) {
    super(db);
  }

  async findAll(params: { page: number; limit: number; status?: string; search?: string; sortBy: string; sortOrder: 'asc' | 'desc' }) {
    const { page, limit, status, search, sortBy, sortOrder } = params;
    const offset = (page - 1) * limit;

    let query = this.query.clone()
      .leftJoin('warehouses', 'stock_count_sessions.warehouse_id', 'warehouses.id')
      .leftJoin('users', 'stock_count_sessions.created_by', 'users.id')
      .select('stock_count_sessions.*', 'warehouses.name as warehouse_name', 'users.name as created_by_name');
    let countQuery = this.query.clone();

    if (status) {
      query = query.where('stock_count_sessions.status', status);
      countQuery = countQuery.where('status', status);
    }
    if (search) {
      query = query.whereILike('stock_count_sessions.count_number', `%${search}%`);
      countQuery = countQuery.whereILike('count_number', `%${search}%`);
    }

    const [items, [{ count }]] = await Promise.all([
      query.orderBy(`stock_count_sessions.${sortBy}`, sortOrder).limit(limit).offset(offset),
      countQuery.count('id as count'),
    ]);

    return { items, total: parseInt(count as string, 10) };
  }

  async findById(id: string): Promise<StockCountSession | null> {
    const result = await this.query
      .leftJoin('warehouses', 'stock_count_sessions.warehouse_id', 'warehouses.id')
      .leftJoin('users', 'stock_count_sessions.created_by', 'users.id')
      .select(
        'stock_count_sessions.*',
        'warehouses.name as warehouse_name',
        'users.name as created_by_name',
      )
      .where('stock_count_sessions.id', id)
      .first();
    return result || null;
  }

  async findItemsBySessionId(sessionId: string): Promise<StockCountItem[]> {
    const baseQuery = this.knex('stock_count_items')
      .leftJoin('products', 'stock_count_items.product_id', 'products.id')
      .select(
        'stock_count_items.*',
        'products.name as product_name',
        'products.barcode as product_barcode',
        'products.unit as product_unit',
        'products.is_active as product_is_active',
      )
      .where('stock_count_items.session_id', sessionId)
      .orderBy('products.name', 'asc');
    return this.applyTenantFilter(baseQuery, 'stock_count_items');
  }

  async generateCountNumber(): Promise<string> {
    const today = new Date();
    const prefix = `SAY${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`;
    const [result] = await this.query.whereILike('count_number', `${prefix}%`).count('id as count');
    const count = parseInt(result.count as string, 10) + 1;
    return `${prefix}${String(count).padStart(4, '0')}`;
  }

  async createSession(data: Partial<StockCountSession>, items: Partial<StockCountItem>[], trx: Knex.Transaction): Promise<StockCountSession> {
    const insertData = this.getInsertData(data);
    const [session] = await trx('stock_count_sessions').insert(insertData).returning('*');
    if (items.length > 0) {
      const tenantId = (insertData as any).tenant_id;
      await trx('stock_count_items').insert(items.map((it) => ({ ...it, session_id: session.id, tenant_id: tenantId })));
    }
    return session;
  }
}

import { Injectable } from '@nestjs/common';
import { BaseTenantRepository } from '../../common/repositories/base.repository';
import { DatabaseService } from '../../database/database.service';
import { Knex } from 'knex';

export interface OpeningStockEntry {
  id: string;
  tenant_id: string | null;
  entry_number: string;
  warehouse_id: string | null;
  entry_date: Date;
  status: string;
  notes: string | null;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface OpeningStockItem {
  id: string;
  tenant_id: string | null;
  entry_id: string;
  product_id: string | null;
  quantity: number;
  unit_cost: number;
  product_name?: string;
}

@Injectable()
export class OpeningStockRepository extends BaseTenantRepository<OpeningStockEntry> {
  protected tableName = 'opening_stock_entries';

  constructor(db: DatabaseService) {
    super(db);
  }

  async findAll(params: { page: number; limit: number; search?: string; status?: string; startDate?: string; endDate?: string; sortBy: string; sortOrder: 'asc' | 'desc' }) {
    const { page, limit, search, status, startDate, endDate, sortBy, sortOrder } = params;
    const offset = (page - 1) * limit;

    let query = this.query.clone()
      .leftJoin('warehouses', 'opening_stock_entries.warehouse_id', 'warehouses.id')
      .leftJoin('users', 'opening_stock_entries.created_by', 'users.id')
      .select('opening_stock_entries.*', 'warehouses.name as warehouse_name', 'users.name as created_by_name');
    let countQuery = this.query.clone();

    if (status) {
      query = query.where('opening_stock_entries.status', status);
      countQuery = countQuery.where('status', status);
    }
    if (startDate) {
      query = query.where('opening_stock_entries.entry_date', '>=', startDate);
      countQuery = countQuery.where('entry_date', '>=', startDate);
    }
    if (endDate) {
      query = query.where('opening_stock_entries.entry_date', '<=', endDate);
      countQuery = countQuery.where('entry_date', '<=', endDate);
    }
    if (search) {
      query = query.whereILike('opening_stock_entries.entry_number', `%${search}%`);
      countQuery = countQuery.whereILike('entry_number', `%${search}%`);
    }

    const [items, [{ count }]] = await Promise.all([
      query.orderBy(`opening_stock_entries.${sortBy}`, sortOrder).limit(limit).offset(offset),
      countQuery.count('id as count'),
    ]);

    return { items, total: parseInt(count as string, 10) };
  }

  async findById(id: string): Promise<OpeningStockEntry | null> {
    const result = await this.query
      .leftJoin('warehouses', 'opening_stock_entries.warehouse_id', 'warehouses.id')
      .leftJoin('users', 'opening_stock_entries.created_by', 'users.id')
      .select(
        'opening_stock_entries.*',
        'warehouses.name as warehouse_name',
        'users.name as created_by_name',
      )
      .where('opening_stock_entries.id', id)
      .first();
    return result || null;
  }

  async findItemsByEntryId(entryId: string): Promise<OpeningStockItem[]> {
    const baseQuery = this.knex('opening_stock_items')
      .leftJoin('products', 'opening_stock_items.product_id', 'products.id')
      .select('opening_stock_items.*', 'products.name as product_name', 'products.barcode', 'products.unit', 'products.is_active as product_is_active')
      .where('opening_stock_items.entry_id', entryId);
    return this.applyTenantFilter(baseQuery, 'opening_stock_items');
  }

  async generateEntryNumber(): Promise<string> {
    const today = new Date();
    const prefix = `ACL${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`;
    const [result] = await this.query.whereILike('entry_number', `${prefix}%`).count('id as count');
    const count = parseInt(result.count as string, 10) + 1;
    return `${prefix}${String(count).padStart(4, '0')}`;
  }

  async createEntry(data: Partial<OpeningStockEntry>, items: Partial<OpeningStockItem>[], trx: Knex.Transaction): Promise<OpeningStockEntry> {
    const insertData = this.getInsertData(data);
    const [entry] = await trx('opening_stock_entries').insert(insertData).returning('*');
    if (items.length > 0) {
      const tenantId = (insertData as any).tenant_id;
      await trx('opening_stock_items').insert(items.map((item) => ({ ...item, entry_id: entry.id, tenant_id: tenantId })));
    }
    return entry;
  }
}

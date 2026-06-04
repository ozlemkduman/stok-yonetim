import { Injectable } from '@nestjs/common';
import { BaseTenantRepository } from '../../common/repositories/base.repository';
import { DatabaseService } from '../../database/database.service';
import { Knex } from 'knex';

export interface Purchase {
  id: string;
  tenant_id: string | null;
  purchase_number: string;
  supplier_id: string | null;
  warehouse_id: string | null;
  purchase_date: Date;
  subtotal: number;
  discount_amount: number;
  discount_rate: number;
  vat_total: number;
  grand_total: number;
  include_vat: boolean;
  payment_method: string;
  due_date: Date | null;
  status: string;
  supplier_invoice_no: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface PurchaseItem {
  id: string;
  tenant_id: string | null;
  purchase_id: string;
  product_id: string | null;
  quantity: number;
  unit_price: number;
  discount_rate: number;
  vat_rate: number;
  vat_amount: number;
  line_total: number;
  product_name?: string;
}

@Injectable()
export class PurchasesRepository extends BaseTenantRepository<Purchase> {
  protected tableName = 'purchases';

  constructor(db: DatabaseService) {
    super(db);
  }

  async findAll(params: { page: number; limit: number; search?: string; supplierId?: string; status?: string; startDate?: string; endDate?: string; sortBy: string; sortOrder: 'asc' | 'desc' }) {
    const { page, limit, search, supplierId, status, startDate, endDate, sortBy, sortOrder } = params;
    const offset = (page - 1) * limit;

    let query = this.query.clone()
      .leftJoin('suppliers', 'purchases.supplier_id', 'suppliers.id')
      .leftJoin('users', 'purchases.created_by', 'users.id')
      .select('purchases.*', 'suppliers.name as supplier_name', 'users.name as created_by_name');
    let countQuery = this.query.clone();

    if (supplierId) {
      query = query.where('purchases.supplier_id', supplierId);
      countQuery = countQuery.where('supplier_id', supplierId);
    }
    if (status) {
      query = query.where('purchases.status', status);
      countQuery = countQuery.where('status', status);
    }
    if (startDate) {
      query = query.where('purchases.purchase_date', '>=', startDate);
      countQuery = countQuery.where('purchase_date', '>=', startDate);
    }
    if (endDate) {
      query = query.where('purchases.purchase_date', '<=', endDate);
      countQuery = countQuery.where('purchase_date', '<=', endDate);
    }
    if (search) {
      query = query.where((b) =>
        b.whereILike('purchases.purchase_number', `%${search}%`)
          .orWhereILike('suppliers.name', `%${search}%`)
          .orWhereILike('purchases.supplier_invoice_no', `%${search}%`),
      );
      countQuery = countQuery.whereILike('purchase_number', `%${search}%`);
    }

    const [items, [{ count }]] = await Promise.all([
      query.orderBy(`purchases.${sortBy}`, sortOrder).limit(limit).offset(offset),
      countQuery.count('id as count'),
    ]);

    return { items, total: parseInt(count as string, 10) };
  }

  async findById(id: string): Promise<Purchase | null> {
    const result = await this.query
      .leftJoin('suppliers', 'purchases.supplier_id', 'suppliers.id')
      .leftJoin('users', 'purchases.created_by', 'users.id')
      .select(
        'purchases.*',
        'suppliers.name as supplier_name',
        'suppliers.phone as supplier_phone',
        'suppliers.tax_number as supplier_tax_number',
        'users.name as created_by_name',
      )
      .where('purchases.id', id)
      .first();
    return result || null;
  }

  async findItemsByPurchaseId(purchaseId: string): Promise<PurchaseItem[]> {
    const baseQuery = this.knex('purchase_items')
      .leftJoin('products', 'purchase_items.product_id', 'products.id')
      .select('purchase_items.*', 'products.name as product_name', 'products.barcode', 'products.is_active as product_is_active')
      .where('purchase_items.purchase_id', purchaseId);
    return this.applyTenantFilter(baseQuery, 'purchase_items');
  }

  async generatePurchaseNumber(): Promise<string> {
    const today = new Date();
    const prefix = `ALN${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`;
    const [result] = await this.query.whereILike('purchase_number', `${prefix}%`).count('id as count');
    const count = parseInt(result.count as string, 10) + 1;
    return `${prefix}${String(count).padStart(4, '0')}`;
  }

  async createPurchase(data: Partial<Purchase>, items: Partial<PurchaseItem>[], trx: Knex.Transaction): Promise<Purchase> {
    const insertData = this.getInsertData(data);
    const [purchase] = await trx('purchases').insert(insertData).returning('*');
    if (items.length > 0) {
      const tenantId = (insertData as any).tenant_id;
      await trx('purchase_items').insert(items.map((item) => ({ ...item, purchase_id: purchase.id, tenant_id: tenantId })));
    }
    return purchase;
  }

  async updateStatus(id: string, status: string, trx?: Knex.Transaction): Promise<void> {
    const baseQuery = trx ? trx(this.tableName) : this.knex(this.tableName);
    const query = this.applyTenantFilter(baseQuery);
    await query.where('id', id).update({ status, updated_at: this.knex.fn.now() });
  }
}

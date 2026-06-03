import { Injectable } from '@nestjs/common';
import { BaseTenantRepository } from '../../common/repositories/base.repository';
import { DatabaseService } from '../../database/database.service';
import { CreateSupplierDto, UpdateSupplierDto } from './dto';
import { Knex } from 'knex';

export interface Supplier {
  id: string;
  tenant_id: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  tax_number: string | null;
  tax_office: string | null;
  balance: number; // negatif = biz tedarikçiye borçluyuz
  notes: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class SuppliersRepository extends BaseTenantRepository<Supplier> {
  protected tableName = 'suppliers';

  constructor(db: DatabaseService) {
    super(db);
  }

  async findAll(params: { page: number; limit: number; search?: string; isActive?: boolean; sortBy?: string; sortOrder?: 'asc' | 'desc' }): Promise<{ items: Supplier[]; total: number }> {
    const { page, limit, search, isActive, sortBy = 'name', sortOrder = 'asc' } = params;
    const offset = (page - 1) * limit;

    let query = this.query.clone();
    let countQuery = this.query.clone();

    if (isActive !== undefined) {
      query = query.where('is_active', isActive);
      countQuery = countQuery.where('is_active', isActive);
    }

    if (search) {
      const s = `%${search}%`;
      const f = (b: any) => b.whereILike('name', s).orWhereILike('phone', s).orWhereILike('email', s).orWhereILike('tax_number', s);
      query = query.where(f);
      countQuery = countQuery.where(f);
    }

    const [items, [{ count }]] = await Promise.all([
      query.select('*').orderBy(sortBy, sortOrder).limit(limit).offset(offset),
      countQuery.count('id as count'),
    ]);

    return { items, total: parseInt(count as string, 10) };
  }

  async findSupplierById(id: string): Promise<Supplier | null> {
    return this.query.where('id', id).first() || null;
  }

  async createSupplier(data: CreateSupplierDto, userId?: string): Promise<Supplier> {
    const insertData = this.getInsertData({
      ...data,
      balance: 0,
      is_active: data.is_active !== false,
      created_by: userId || null,
    });
    const [supplier] = await this.knex(this.tableName).insert(insertData).returning('*');
    return supplier;
  }

  async updateSupplier(id: string, data: UpdateSupplierDto): Promise<Supplier | null> {
    const [supplier] = await this.query.where('id', id).update({ ...data, updated_at: this.knex.fn.now() }).returning('*');
    return supplier || null;
  }

  async updateBalance(id: string, amount: number, trx?: Knex.Transaction): Promise<void> {
    const base = trx ? trx(this.tableName) : this.knex(this.tableName);
    const q = this.applyTenantFilter(base);
    await q.where('id', id).update({
      balance: this.knex.raw('balance + ?', [amount]),
      updated_at: this.knex.fn.now(),
    });
  }

  async deleteSupplier(id: string): Promise<boolean> {
    const result = await this.query.where('id', id).update({ is_active: false, updated_at: this.knex.fn.now() });
    return result > 0;
  }
}

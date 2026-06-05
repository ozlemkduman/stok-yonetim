import { Injectable } from '@nestjs/common';
import { BaseTenantRepository } from '../../common/repositories/base.repository';
import { DatabaseService } from '../../database/database.service';

export interface Cheque {
  id: string;
  tenant_id: string | null;
  type: string;
  direction: string;
  cheque_number: string | null;
  bank_name: string | null;
  drawer_name: string | null;
  customer_id: string | null;
  supplier_id: string | null;
  amount: number;
  issue_date: Date | null;
  due_date: Date;
  status: string;
  account_id: string | null;
  status_changed_at: Date | null;
  notes: string | null;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
  customer_name?: string;
  supplier_name?: string;
  account_name?: string;
  created_by_name?: string;
}

@Injectable()
export class ChequesRepository extends BaseTenantRepository<Cheque> {
  protected tableName = 'cheques';

  constructor(db: DatabaseService) {
    super(db);
  }

  async findAll(params: {
    page: number;
    limit: number;
    search?: string;
    type?: string;
    direction?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  }) {
    const { page, limit, search, type, direction, status, startDate, endDate, sortBy, sortOrder } = params;
    const offset = (page - 1) * limit;

    let query = this.query.clone()
      .leftJoin('customers', 'cheques.customer_id', 'customers.id')
      .leftJoin('suppliers', 'cheques.supplier_id', 'suppliers.id')
      .leftJoin('accounts', 'cheques.account_id', 'accounts.id')
      .leftJoin('users', 'cheques.created_by', 'users.id')
      .select(
        'cheques.*',
        'customers.name as customer_name',
        'suppliers.name as supplier_name',
        'accounts.name as account_name',
        'users.name as created_by_name',
      );
    let countQuery = this.query.clone();

    if (type) {
      query = query.where('cheques.type', type);
      countQuery = countQuery.where('type', type);
    }
    if (direction) {
      query = query.where('cheques.direction', direction);
      countQuery = countQuery.where('direction', direction);
    }
    if (status) {
      query = query.where('cheques.status', status);
      countQuery = countQuery.where('status', status);
    }
    if (startDate) {
      query = query.where('cheques.due_date', '>=', startDate);
      countQuery = countQuery.where('due_date', '>=', startDate);
    }
    if (endDate) {
      query = query.where('cheques.due_date', '<=', endDate);
      countQuery = countQuery.where('due_date', '<=', endDate);
    }
    if (search) {
      query = query.where((b) =>
        b.whereILike('cheques.cheque_number', `%${search}%`)
          .orWhereILike('cheques.bank_name', `%${search}%`)
          .orWhereILike('cheques.drawer_name', `%${search}%`)
          .orWhereILike('customers.name', `%${search}%`)
          .orWhereILike('suppliers.name', `%${search}%`),
      );
      countQuery = countQuery.where((b) =>
        b.whereILike('cheque_number', `%${search}%`)
          .orWhereILike('bank_name', `%${search}%`)
          .orWhereILike('drawer_name', `%${search}%`),
      );
    }

    const [items, [{ count }]] = await Promise.all([
      query.orderBy(`cheques.${sortBy}`, sortOrder).limit(limit).offset(offset),
      countQuery.count('id as count'),
    ]);

    return { items, total: parseInt(count as string, 10) };
  }

  async findById(id: string): Promise<Cheque | null> {
    const result = await this.query
      .leftJoin('customers', 'cheques.customer_id', 'customers.id')
      .leftJoin('suppliers', 'cheques.supplier_id', 'suppliers.id')
      .leftJoin('accounts', 'cheques.account_id', 'accounts.id')
      .leftJoin('users', 'cheques.created_by', 'users.id')
      .select(
        'cheques.*',
        'customers.name as customer_name',
        'suppliers.name as supplier_name',
        'accounts.name as account_name',
        'users.name as created_by_name',
      )
      .where('cheques.id', id)
      .first();
    return result || null;
  }
}

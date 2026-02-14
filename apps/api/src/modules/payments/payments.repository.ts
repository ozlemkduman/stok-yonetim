import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { BaseTenantRepository } from '../../common/repositories/base.repository';
import { Knex } from 'knex';

export interface Payment {
  id: string;
  customer_id: string;
  sale_id: string | null;
  payment_date: Date;
  amount: number;
  method: string;
  notes: string | null;
  created_at: Date;
  customer_name?: string;
}

@Injectable()
export class PaymentsRepository extends BaseTenantRepository<Payment> {
  protected tableName = 'payments';

  constructor(db: DatabaseService) {
    super(db);
  }

  async findAll(params: { page: number; limit: number; customerId?: string; method?: string; sortBy: string; sortOrder: 'asc' | 'desc' }): Promise<{ items: Payment[]; total: number }> {
    const { page, limit, customerId, method, sortBy, sortOrder } = params;

    let query = this.query.clone()
      .leftJoin('customers', 'payments.customer_id', 'customers.id')
      .select('payments.*', 'customers.name as customer_name');
    let countQuery = this.query.clone();

    if (customerId) {
      query = query.where('payments.customer_id', customerId);
      countQuery = countQuery.where('customer_id', customerId);
    }
    if (method) {
      query = query.where('payments.method', method);
      countQuery = countQuery.where('method', method);
    }

    const [items, [{ count }]] = await Promise.all([
      query.orderBy(`payments.${sortBy}`, sortOrder).limit(limit).offset((page - 1) * limit),
      countQuery.count('id as count'),
    ]);
    return { items, total: parseInt(count as string, 10) };
  }

  async createPayment(data: Partial<Payment>, trx?: Knex.Transaction): Promise<Payment> {
    const insertData = this.getInsertData(data);
    const query = trx ? trx('payments') : this.knex('payments');
    const [payment] = await query.insert(insertData).returning('*');
    return payment;
  }
}

import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

export interface Integration {
  id: string;
  name: string;
  type: 'e_commerce' | 'bank' | 'payment' | 'crm' | 'other';
  provider: string;
  status: 'active' | 'inactive' | 'error';
  config: Record<string, unknown>;
  credentials: Record<string, unknown>;
  last_sync_at: Date | null;
  last_error: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface IntegrationLog {
  id: string;
  integration_id: string;
  action: 'sync' | 'push' | 'pull' | 'webhook' | 'error';
  status: 'started' | 'success' | 'failed';
  message: string | null;
  details: Record<string, unknown>;
  created_at: Date;
}

export interface ECommerceOrder {
  id: string;
  integration_id: string;
  external_order_id: string;
  external_order_number: string | null;
  sale_id: string | null;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
  sync_status: 'pending' | 'synced' | 'error';
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  shipping_address: string | null;
  subtotal: number;
  shipping_cost: number;
  commission: number;
  total: number;
  currency: string;
  items: unknown[];
  raw_data: Record<string, unknown>;
  order_date: Date;
  created_at: Date;
  updated_at: Date;
  integration_name?: string;
}

export interface BankStatement {
  id: string;
  integration_id: string;
  account_id: string | null;
  external_id: string | null;
  transaction_date: Date;
  value_date: Date | null;
  description: string | null;
  type: 'credit' | 'debit';
  amount: number;
  balance: number | null;
  currency: string;
  reference: string | null;
  match_status: 'unmatched' | 'matched' | 'ignored';
  matched_movement_id: string | null;
  raw_data: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
  integration_name?: string;
  account_name?: string;
}

@Injectable()
export class IntegrationsRepository {
  constructor(private readonly db: DatabaseService) {}

  async findAll(params: { type?: string; status?: string }): Promise<Integration[]> {
    let query = this.db.knex('integrations').select('*');
    if (params.type) {
      query = query.where('type', params.type);
    }
    if (params.status) {
      query = query.where('status', params.status);
    }
    return query.orderBy('name', 'asc');
  }

  async findById(id: string): Promise<Integration | null> {
    return this.db.knex('integrations').where('id', id).first() || null;
  }

  async create(data: Partial<Integration>): Promise<Integration> {
    const [integration] = await this.db.knex('integrations').insert(data).returning('*');
    return integration;
  }

  async update(id: string, data: Partial<Integration>): Promise<Integration> {
    const [integration] = await this.db.knex('integrations')
      .where('id', id)
      .update({ ...data, updated_at: this.db.knex.fn.now() })
      .returning('*');
    return integration;
  }

  async delete(id: string): Promise<void> {
    await this.db.knex('integrations').where('id', id).delete();
  }

  async createLog(data: Partial<IntegrationLog>): Promise<IntegrationLog> {
    const [log] = await this.db.knex('integration_logs').insert(data).returning('*');
    return log;
  }

  async findLogsByIntegrationId(integrationId: string, limit = 50): Promise<IntegrationLog[]> {
    return this.db.knex('integration_logs')
      .where('integration_id', integrationId)
      .orderBy('created_at', 'desc')
      .limit(limit);
  }

  // E-commerce orders
  async findECommerceOrders(params: {
    page: number;
    limit: number;
    integrationId?: string;
    status?: string;
    syncStatus?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ items: ECommerceOrder[]; total: number }> {
    const { page, limit, integrationId, status, syncStatus, startDate, endDate } = params;
    const offset = (page - 1) * limit;

    let query = this.db.knex('e_commerce_orders')
      .leftJoin('integrations', 'e_commerce_orders.integration_id', 'integrations.id')
      .select('e_commerce_orders.*', 'integrations.name as integration_name');
    let countQuery = this.db.knex('e_commerce_orders');

    if (integrationId) {
      query = query.where('e_commerce_orders.integration_id', integrationId);
      countQuery = countQuery.where('integration_id', integrationId);
    }
    if (status) {
      query = query.where('e_commerce_orders.status', status);
      countQuery = countQuery.where('status', status);
    }
    if (syncStatus) {
      query = query.where('e_commerce_orders.sync_status', syncStatus);
      countQuery = countQuery.where('sync_status', syncStatus);
    }
    if (startDate) {
      query = query.where('e_commerce_orders.order_date', '>=', startDate);
      countQuery = countQuery.where('order_date', '>=', startDate);
    }
    if (endDate) {
      query = query.where('e_commerce_orders.order_date', '<=', endDate);
      countQuery = countQuery.where('order_date', '<=', endDate);
    }

    const [items, [{ count }]] = await Promise.all([
      query.orderBy('e_commerce_orders.order_date', 'desc').limit(limit).offset(offset),
      countQuery.count('id as count'),
    ]);
    return { items, total: parseInt(count as string, 10) };
  }

  async findECommerceOrderById(id: string): Promise<ECommerceOrder | null> {
    return this.db.knex('e_commerce_orders')
      .leftJoin('integrations', 'e_commerce_orders.integration_id', 'integrations.id')
      .select('e_commerce_orders.*', 'integrations.name as integration_name')
      .where('e_commerce_orders.id', id)
      .first() || null;
  }

  async upsertECommerceOrder(data: Partial<ECommerceOrder>): Promise<ECommerceOrder> {
    const existing = await this.db.knex('e_commerce_orders')
      .where('integration_id', data.integration_id)
      .where('external_order_id', data.external_order_id)
      .first();

    if (existing) {
      const [order] = await this.db.knex('e_commerce_orders')
        .where('id', existing.id)
        .update({ ...data, updated_at: this.db.knex.fn.now() })
        .returning('*');
      return order;
    } else {
      const [order] = await this.db.knex('e_commerce_orders').insert(data).returning('*');
      return order;
    }
  }

  async updateECommerceOrderSaleId(id: string, saleId: string): Promise<void> {
    await this.db.knex('e_commerce_orders')
      .where('id', id)
      .update({ sale_id: saleId, sync_status: 'synced', updated_at: this.db.knex.fn.now() });
  }

  // Bank statements
  async findBankStatements(params: {
    page: number;
    limit: number;
    integrationId?: string;
    accountId?: string;
    matchStatus?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ items: BankStatement[]; total: number }> {
    const { page, limit, integrationId, accountId, matchStatus, startDate, endDate } = params;
    const offset = (page - 1) * limit;

    let query = this.db.knex('bank_statements')
      .leftJoin('integrations', 'bank_statements.integration_id', 'integrations.id')
      .leftJoin('accounts', 'bank_statements.account_id', 'accounts.id')
      .select('bank_statements.*', 'integrations.name as integration_name', 'accounts.name as account_name');
    let countQuery = this.db.knex('bank_statements');

    if (integrationId) {
      query = query.where('bank_statements.integration_id', integrationId);
      countQuery = countQuery.where('integration_id', integrationId);
    }
    if (accountId) {
      query = query.where('bank_statements.account_id', accountId);
      countQuery = countQuery.where('account_id', accountId);
    }
    if (matchStatus) {
      query = query.where('bank_statements.match_status', matchStatus);
      countQuery = countQuery.where('match_status', matchStatus);
    }
    if (startDate) {
      query = query.where('bank_statements.transaction_date', '>=', startDate);
      countQuery = countQuery.where('transaction_date', '>=', startDate);
    }
    if (endDate) {
      query = query.where('bank_statements.transaction_date', '<=', endDate);
      countQuery = countQuery.where('transaction_date', '<=', endDate);
    }

    const [items, [{ count }]] = await Promise.all([
      query.orderBy('bank_statements.transaction_date', 'desc').limit(limit).offset(offset),
      countQuery.count('id as count'),
    ]);
    return { items, total: parseInt(count as string, 10) };
  }

  async createBankStatement(data: Partial<BankStatement>): Promise<BankStatement> {
    const [statement] = await this.db.knex('bank_statements').insert(data).returning('*');
    return statement;
  }

  async matchBankStatement(id: string, movementId: string): Promise<void> {
    await this.db.knex('bank_statements')
      .where('id', id)
      .update({ matched_movement_id: movementId, match_status: 'matched', updated_at: this.db.knex.fn.now() });
  }

  async ignoreBankStatement(id: string): Promise<void> {
    await this.db.knex('bank_statements')
      .where('id', id)
      .update({ match_status: 'ignored', updated_at: this.db.knex.fn.now() });
  }
}

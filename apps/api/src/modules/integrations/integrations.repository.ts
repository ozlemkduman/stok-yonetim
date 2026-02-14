import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { BaseTenantRepository } from '../../common/repositories/base.repository';

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
export class IntegrationsRepository extends BaseTenantRepository<Integration> {
  protected tableName = 'integrations';

  constructor(db: DatabaseService) {
    super(db);
  }

  async findAll(params: { type?: string; status?: string }): Promise<Integration[]> {
    let query = this.query.clone().select('*');
    if (params.type) {
      query = query.where('type', params.type);
    }
    if (params.status) {
      query = query.where('status', params.status);
    }
    return query.orderBy('name', 'asc');
  }

  async createIntegration(data: Partial<Integration>): Promise<Integration> {
    const insertData = this.getInsertData(data);
    const [integration] = await this.knex(this.tableName).insert(insertData).returning('*');
    return integration;
  }

  async updateIntegration(id: string, data: Partial<Integration>): Promise<Integration> {
    const [integration] = await this.query
      .where(`${this.tableName}.id`, id)
      .update({ ...data, updated_at: this.knex.fn.now() })
      .returning('*');
    return integration;
  }

  async deleteIntegration(id: string): Promise<void> {
    await this.query.where(`${this.tableName}.id`, id).delete();
  }

  async createLog(data: Partial<IntegrationLog>): Promise<IntegrationLog> {
    const insertData = this.getInsertData(data as any);
    const [log] = await this.knex('integration_logs').insert(insertData).returning('*');
    return log;
  }

  async findLogsByIntegrationId(integrationId: string, limit = 50): Promise<IntegrationLog[]> {
    const query = this.knex('integration_logs')
      .where('integration_id', integrationId)
      .orderBy('created_at', 'desc')
      .limit(limit);

    return this.applyTenantFilter(query, 'integration_logs');
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

    let query = this.knex('e_commerce_orders')
      .leftJoin('integrations', 'e_commerce_orders.integration_id', 'integrations.id')
      .select('e_commerce_orders.*', 'integrations.name as integration_name');

    query = this.applyTenantFilter(query, 'e_commerce_orders');

    let countQuery = this.knex('e_commerce_orders');
    countQuery = this.applyTenantFilter(countQuery, 'e_commerce_orders');

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
    const query = this.knex('e_commerce_orders')
      .leftJoin('integrations', 'e_commerce_orders.integration_id', 'integrations.id')
      .select('e_commerce_orders.*', 'integrations.name as integration_name')
      .where('e_commerce_orders.id', id);

    return this.applyTenantFilter(query, 'e_commerce_orders').first() || null;
  }

  async upsertECommerceOrder(data: Partial<ECommerceOrder>): Promise<ECommerceOrder> {
    const existingQuery = this.knex('e_commerce_orders')
      .where('integration_id', data.integration_id)
      .where('external_order_id', data.external_order_id);

    const existing = await this.applyTenantFilter(existingQuery, 'e_commerce_orders').first();

    if (existing) {
      const updateQuery = this.knex('e_commerce_orders')
        .where('id', existing.id);
      const [order] = await this.applyTenantFilter(updateQuery, 'e_commerce_orders')
        .update({ ...data, updated_at: this.knex.fn.now() })
        .returning('*');
      return order;
    } else {
      const insertData = this.getInsertData(data as any);
      const [order] = await this.knex('e_commerce_orders').insert(insertData).returning('*');
      return order;
    }
  }

  async updateECommerceOrderSaleId(id: string, saleId: string): Promise<void> {
    const query = this.knex('e_commerce_orders').where('id', id);
    await this.applyTenantFilter(query, 'e_commerce_orders')
      .update({ sale_id: saleId, sync_status: 'synced', updated_at: this.knex.fn.now() });
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

    let query = this.knex('bank_statements')
      .leftJoin('integrations', 'bank_statements.integration_id', 'integrations.id')
      .leftJoin('accounts', 'bank_statements.account_id', 'accounts.id')
      .select('bank_statements.*', 'integrations.name as integration_name', 'accounts.name as account_name');

    query = this.applyTenantFilter(query, 'bank_statements');

    let countQuery = this.knex('bank_statements');
    countQuery = this.applyTenantFilter(countQuery, 'bank_statements');

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
    const insertData = this.getInsertData(data as any);
    const [statement] = await this.knex('bank_statements').insert(insertData).returning('*');
    return statement;
  }

  async matchBankStatement(id: string, movementId: string): Promise<void> {
    const query = this.knex('bank_statements').where('id', id);
    await this.applyTenantFilter(query, 'bank_statements')
      .update({ matched_movement_id: movementId, match_status: 'matched', updated_at: this.knex.fn.now() });
  }

  async ignoreBankStatement(id: string): Promise<void> {
    const query = this.knex('bank_statements').where('id', id);
    await this.applyTenantFilter(query, 'bank_statements')
      .update({ match_status: 'ignored', updated_at: this.knex.fn.now() });
  }

  async getIntegrationStats(integrationId: string): Promise<{
    totalSynced: number;
    totalErrors: number;
    lastSyncAt: Date | null;
    syncedOrders: number;
    pendingOrders: number;
    errorOrders: number;
  }> {
    // Get log stats
    const logQuery = this.knex('integration_logs')
      .where('integration_id', integrationId)
      .select(
        this.knex.raw("COUNT(CASE WHEN status = 'success' THEN 1 END) as total_synced"),
        this.knex.raw("COUNT(CASE WHEN status = 'failed' THEN 1 END) as total_errors"),
        this.knex.raw("MAX(CASE WHEN status = 'success' THEN created_at END) as last_sync_at")
      );

    const [logStats] = await this.applyTenantFilter(logQuery, 'integration_logs') as unknown as { total_synced: string; total_errors: string; last_sync_at: Date | null }[];

    // Get e-commerce order stats
    const orderQuery = this.knex('e_commerce_orders')
      .where('integration_id', integrationId)
      .select(
        this.knex.raw("COUNT(CASE WHEN sync_status = 'synced' THEN 1 END) as synced_orders"),
        this.knex.raw("COUNT(CASE WHEN sync_status = 'pending' THEN 1 END) as pending_orders"),
        this.knex.raw("COUNT(CASE WHEN sync_status = 'error' THEN 1 END) as error_orders")
      );

    const [orderStats] = await this.applyTenantFilter(orderQuery, 'e_commerce_orders') as unknown as { synced_orders: string; pending_orders: string; error_orders: string }[];

    return {
      totalSynced: parseInt(logStats?.total_synced || '0', 10),
      totalErrors: parseInt(logStats?.total_errors || '0', 10),
      lastSyncAt: logStats?.last_sync_at || null,
      syncedOrders: parseInt(orderStats?.synced_orders || '0', 10),
      pendingOrders: parseInt(orderStats?.pending_orders || '0', 10),
      errorOrders: parseInt(orderStats?.error_orders || '0', 10),
    };
  }
}

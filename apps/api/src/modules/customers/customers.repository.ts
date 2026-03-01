import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { BaseTenantRepository } from '../../common/repositories/base.repository';
import { CreateCustomerDto, UpdateCustomerDto } from './dto';

export interface Customer {
  id: string;
  tenant_id?: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  tax_number: string | null;
  tax_office: string | null;
  balance: number;
  notes: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
  created_by_name?: string;
  renewal_red_days: number;
  renewal_yellow_days: number;
  nearest_renewal_days?: number | null;
}

export interface CustomerListParams {
  page: number;
  limit: number;
  search?: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  isActive?: boolean;
  renewalStatus?: 'red' | 'yellow' | 'green';
}

@Injectable()
export class CustomersRepository extends BaseTenantRepository<Customer> {
  protected tableName = 'customers';

  constructor(db: DatabaseService) {
    super(db);
  }

  async findCustomerById(id: string): Promise<Customer | null> {
    const renewalSubquery = this.knex('sales')
      .select('customer_id')
      .min('renewal_date as nearest_renewal_date')
      .where('has_renewal', true)
      .where('status', 'completed')
      .whereNotNull('renewal_date')
      .groupBy('customer_id')
      .as('renewals');

    return this.query.clone()
      .leftJoin('users', `${this.tableName}.created_by`, 'users.id')
      .leftJoin(renewalSubquery, `${this.tableName}.id`, 'renewals.customer_id')
      .select(
        `${this.tableName}.*`,
        'users.name as created_by_name',
        this.knex.raw('(DATE(renewals.nearest_renewal_date) - CURRENT_DATE) as nearest_renewal_days'),
      )
      .where(`${this.tableName}.id`, id)
      .first() || null;
  }

  async findAll(params: CustomerListParams): Promise<{ items: Customer[]; total: number }> {
    const { page, limit, search, sortBy, sortOrder, isActive, renewalStatus } = params;
    const offset = (page - 1) * limit;

    const renewalSubquery = this.knex('sales')
      .select('customer_id')
      .min('renewal_date as nearest_renewal_date')
      .where('has_renewal', true)
      .where('status', 'completed')
      .whereNotNull('renewal_date')
      .groupBy('customer_id')
      .as('renewals');

    const renewalSubqueryForCount = this.knex('sales')
      .select('customer_id')
      .min('renewal_date as nearest_renewal_date')
      .where('has_renewal', true)
      .where('status', 'completed')
      .whereNotNull('renewal_date')
      .groupBy('customer_id')
      .as('renewals');

    let query = this.query.clone()
      .leftJoin('users', `${this.tableName}.created_by`, 'users.id')
      .leftJoin(renewalSubquery, `${this.tableName}.id`, 'renewals.customer_id');
    let countQuery = this.query.clone()
      .leftJoin(renewalSubqueryForCount, `${this.tableName}.id`, 'renewals.customer_id');

    // Filter by active status
    if (isActive !== undefined) {
      query = query.where(`${this.tableName}.is_active`, isActive);
      countQuery = countQuery.where(`${this.tableName}.is_active`, isActive);
    }

    // Search
    if (search) {
      const searchTerm = `%${search}%`;
      query = query.where((builder) => {
        builder
          .whereILike(`${this.tableName}.name`, searchTerm)
          .orWhereILike(`${this.tableName}.phone`, searchTerm)
          .orWhereILike(`${this.tableName}.email`, searchTerm);
      });
      countQuery = countQuery.where((builder) => {
        builder
          .whereILike(`${this.tableName}.name`, searchTerm)
          .orWhereILike(`${this.tableName}.phone`, searchTerm)
          .orWhereILike(`${this.tableName}.email`, searchTerm);
      });
    }

    // Filter by renewal status
    if (renewalStatus) {
      const daysExpr = this.knex.raw('(DATE(renewals.nearest_renewal_date) - CURRENT_DATE)');
      const applyRenewalFilter = (q: any) => {
        q.whereNotNull('renewals.nearest_renewal_date');
        if (renewalStatus === 'red') {
          q.where(daysExpr, '<=', this.knex.raw(`COALESCE(${this.tableName}.renewal_red_days, 30)`));
        } else if (renewalStatus === 'yellow') {
          q.where(daysExpr, '>', this.knex.raw(`COALESCE(${this.tableName}.renewal_red_days, 30)`));
          q.where(daysExpr, '<=', this.knex.raw(`COALESCE(${this.tableName}.renewal_yellow_days, 60)`));
        } else if (renewalStatus === 'green') {
          q.where(daysExpr, '>', this.knex.raw(`COALESCE(${this.tableName}.renewal_yellow_days, 60)`));
        }
      };
      applyRenewalFilter(query);
      applyRenewalFilter(countQuery);
    }

    const [items, [{ count }]] = await Promise.all([
      query
        .orderBy(`${this.tableName}.${sortBy}`, sortOrder)
        .limit(limit)
        .offset(offset)
        .select(
          `${this.tableName}.*`,
          'users.name as created_by_name',
          this.knex.raw('(DATE(renewals.nearest_renewal_date) - CURRENT_DATE) as nearest_renewal_days'),
        ),
      countQuery.count(`${this.tableName}.id as count`),
    ]);

    return {
      items,
      total: parseInt(count as string, 10),
    };
  }

  async findByEmail(email: string): Promise<Customer | null> {
    const customer = await this.query
      .where('email', email)
      .first();

    return customer || null;
  }

  async createCustomer(data: CreateCustomerDto, userId?: string): Promise<Customer> {
    const insertData = this.getInsertData({
      ...data,
      balance: 0,
      is_active: true,
      created_by: userId || null,
    });
    const [customer] = await this.knex(this.tableName)
      .insert(insertData)
      .returning('*');

    return customer;
  }

  async updateCustomer(id: string, data: UpdateCustomerDto): Promise<Customer | null> {
    const [customer] = await this.query
      .where('id', id)
      .update({
        ...data,
        updated_at: this.knex.fn.now(),
      })
      .returning('*');

    return customer || null;
  }

  async updateBalance(id: string, amount: number): Promise<void> {
    await this.query
      .where('id', id)
      .update({
        balance: this.knex.raw('balance + ?', [amount]),
        updated_at: this.knex.fn.now(),
      });
  }

  async deleteCustomer(id: string): Promise<boolean> {
    // Soft delete - set is_active to false
    const result = await this.query
      .where('id', id)
      .update({
        is_active: false,
        updated_at: this.knex.fn.now(),
      });

    return result > 0;
  }

  async getCustomersWithDebt(): Promise<Customer[]> {
    return this.query
      .where('balance', '<', 0)
      .where('is_active', true)
      .orderBy('balance', 'asc')
      .select('*');
  }

  async getCustomersWithCredit(): Promise<Customer[]> {
    return this.query
      .where('balance', '>', 0)
      .where('is_active', true)
      .orderBy('balance', 'desc')
      .select('*');
  }

  async getCustomerSales(customerId: string): Promise<any[]> {
    return this.applyTenantFilter(this.knex('sales'), 'sales')
      .where('customer_id', customerId)
      .orderBy('sale_date', 'desc')
      .select('*');
  }

  async getCustomerSalesWithItems(customerId: string): Promise<any[]> {
    const sales = await this.applyTenantFilter(this.knex('sales'), 'sales')
      .where('customer_id', customerId)
      .orderBy('sale_date', 'desc')
      .select('*');

    for (const sale of sales) {
      sale.items = await this.knex('sale_items')
        .leftJoin('products', 'sale_items.product_id', 'products.id')
        .where('sale_items.sale_id', sale.id)
        .select('sale_items.*', 'products.name as product_name', 'products.barcode');
    }

    return sales;
  }

  async getCustomerReturns(customerId: string): Promise<any[]> {
    const returns = await this.applyTenantFilter(this.knex('returns'), 'returns')
      .where('customer_id', customerId)
      .orderBy('return_date', 'desc')
      .select('*');

    for (const ret of returns) {
      ret.items = await this.knex('return_items')
        .leftJoin('products', 'return_items.product_id', 'products.id')
        .where('return_items.return_id', ret.id)
        .select('return_items.*', 'products.name as product_name', 'products.barcode');
    }

    return returns;
  }

  async getCustomerPayments(customerId: string): Promise<any[]> {
    return this.applyTenantFilter(this.knex('payments'), 'payments')
      .where('customer_id', customerId)
      .orderBy('payment_date', 'desc')
      .select('*');
  }

  async getCustomerProductPurchases(customerId: string): Promise<any[]> {
    return this.applyTenantFilter(this.knex('sale_items'), 'sales')
      .join('sales', 'sale_items.sale_id', 'sales.id')
      .join('products', 'sale_items.product_id', 'products.id')
      .where('sales.customer_id', customerId)
      .where('sales.status', 'completed')
      .select(
        'products.id as product_id',
        'products.name as product_name',
        'products.barcode',
      )
      .sum('sale_items.quantity as total_quantity')
      .sum('sale_items.line_total as total_amount')
      .count('sale_items.id as purchase_count')
      .groupBy('products.id', 'products.name', 'products.barcode')
      .orderBy('total_quantity', 'desc');
  }

  async getCustomerStats(customerId: string): Promise<{
    totalSales: number;
    totalReturns: number;
    totalPayments: number;
    salesCount: number;
    returnsCount: number;
    paymentsCount: number;
  }> {
    const [salesStats] = await this.applyTenantFilter(this.knex('sales'), 'sales')
      .where('customer_id', customerId)
      .where('status', 'completed')
      .select(
        this.knex.raw('COALESCE(SUM(grand_total), 0) as total'),
        this.knex.raw('COUNT(*) as count')
      ) as { total: string; count: string }[];

    const [returnsStats] = await this.applyTenantFilter(this.knex('returns'), 'returns')
      .where('customer_id', customerId)
      .where('status', 'completed')
      .select(
        this.knex.raw('COALESCE(SUM(total_amount), 0) as total'),
        this.knex.raw('COUNT(*) as count')
      ) as { total: string; count: string }[];

    const [paymentsStats] = await this.applyTenantFilter(this.knex('payments'), 'payments')
      .where('customer_id', customerId)
      .select(
        this.knex.raw('COALESCE(SUM(amount), 0) as total'),
        this.knex.raw('COUNT(*) as count')
      ) as { total: string; count: string }[];

    return {
      totalSales: parseFloat(salesStats?.total || '0'),
      totalReturns: parseFloat(returnsStats?.total || '0'),
      totalPayments: parseFloat(paymentsStats?.total || '0'),
      salesCount: parseInt(salesStats?.count || '0', 10),
      returnsCount: parseInt(returnsStats?.count || '0', 10),
      paymentsCount: parseInt(paymentsStats?.count || '0', 10),
    };
  }
}

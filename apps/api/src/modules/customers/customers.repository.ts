import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto';

export interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  tax_number: string | null;
  tax_office: string | null;
  balance: number;
  notes: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CustomerListParams {
  page: number;
  limit: number;
  search?: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  isActive?: boolean;
}

@Injectable()
export class CustomersRepository {
  private readonly tableName = 'customers';

  constructor(private readonly db: DatabaseService) {}

  async findAll(params: CustomerListParams): Promise<{ items: Customer[]; total: number }> {
    const { page, limit, search, sortBy, sortOrder, isActive } = params;
    const offset = (page - 1) * limit;

    let query = this.db.knex(this.tableName);
    let countQuery = this.db.knex(this.tableName);

    // Filter by active status
    if (isActive !== undefined) {
      query = query.where('is_active', isActive);
      countQuery = countQuery.where('is_active', isActive);
    }

    // Search
    if (search) {
      const searchTerm = `%${search}%`;
      query = query.where((builder) => {
        builder
          .whereILike('name', searchTerm)
          .orWhereILike('phone', searchTerm)
          .orWhereILike('email', searchTerm);
      });
      countQuery = countQuery.where((builder) => {
        builder
          .whereILike('name', searchTerm)
          .orWhereILike('phone', searchTerm)
          .orWhereILike('email', searchTerm);
      });
    }

    const [items, [{ count }]] = await Promise.all([
      query
        .orderBy(sortBy, sortOrder)
        .limit(limit)
        .offset(offset)
        .select('*'),
      countQuery.count('id as count'),
    ]);

    return {
      items,
      total: parseInt(count as string, 10),
    };
  }

  async findById(id: string): Promise<Customer | null> {
    const customer = await this.db.knex(this.tableName)
      .where('id', id)
      .first();

    return customer || null;
  }

  async findByEmail(email: string): Promise<Customer | null> {
    const customer = await this.db.knex(this.tableName)
      .where('email', email)
      .first();

    return customer || null;
  }

  async create(data: CreateCustomerDto): Promise<Customer> {
    const [customer] = await this.db.knex(this.tableName)
      .insert({
        ...data,
        balance: 0,
        is_active: true,
      })
      .returning('*');

    return customer;
  }

  async update(id: string, data: UpdateCustomerDto): Promise<Customer | null> {
    const [customer] = await this.db.knex(this.tableName)
      .where('id', id)
      .update({
        ...data,
        updated_at: this.db.knex.fn.now(),
      })
      .returning('*');

    return customer || null;
  }

  async updateBalance(id: string, amount: number): Promise<void> {
    await this.db.knex(this.tableName)
      .where('id', id)
      .update({
        balance: this.db.knex.raw('balance + ?', [amount]),
        updated_at: this.db.knex.fn.now(),
      });
  }

  async delete(id: string): Promise<boolean> {
    // Soft delete - set is_active to false
    const result = await this.db.knex(this.tableName)
      .where('id', id)
      .update({
        is_active: false,
        updated_at: this.db.knex.fn.now(),
      });

    return result > 0;
  }

  async getCustomersWithDebt(): Promise<Customer[]> {
    return this.db.knex(this.tableName)
      .where('balance', '<', 0)
      .where('is_active', true)
      .orderBy('balance', 'asc')
      .select('*');
  }

  async getCustomersWithCredit(): Promise<Customer[]> {
    return this.db.knex(this.tableName)
      .where('balance', '>', 0)
      .where('is_active', true)
      .orderBy('balance', 'desc')
      .select('*');
  }

  async getCustomerSales(customerId: string): Promise<any[]> {
    return this.db.knex('sales')
      .where('customer_id', customerId)
      .orderBy('sale_date', 'desc')
      .select('*');
  }

  async getCustomerSalesWithItems(customerId: string): Promise<any[]> {
    const sales = await this.db.knex('sales')
      .where('customer_id', customerId)
      .orderBy('sale_date', 'desc')
      .select('*');

    for (const sale of sales) {
      sale.items = await this.db.knex('sale_items')
        .leftJoin('products', 'sale_items.product_id', 'products.id')
        .where('sale_items.sale_id', sale.id)
        .select('sale_items.*', 'products.name as product_name', 'products.barcode');
    }

    return sales;
  }

  async getCustomerReturns(customerId: string): Promise<any[]> {
    const returns = await this.db.knex('returns')
      .where('customer_id', customerId)
      .orderBy('return_date', 'desc')
      .select('*');

    for (const ret of returns) {
      ret.items = await this.db.knex('return_items')
        .leftJoin('products', 'return_items.product_id', 'products.id')
        .where('return_items.return_id', ret.id)
        .select('return_items.*', 'products.name as product_name', 'products.barcode');
    }

    return returns;
  }

  async getCustomerPayments(customerId: string): Promise<any[]> {
    return this.db.knex('payments')
      .where('customer_id', customerId)
      .orderBy('payment_date', 'desc')
      .select('*');
  }

  async getCustomerStats(customerId: string): Promise<{
    totalSales: number;
    totalReturns: number;
    totalPayments: number;
    salesCount: number;
    returnsCount: number;
    paymentsCount: number;
  }> {
    const [salesStats] = await this.db.knex('sales')
      .where('customer_id', customerId)
      .where('status', 'completed')
      .select(
        this.db.knex.raw('COALESCE(SUM(grand_total), 0) as total'),
        this.db.knex.raw('COUNT(*) as count')
      ) as { total: string; count: string }[];

    const [returnsStats] = await this.db.knex('returns')
      .where('customer_id', customerId)
      .where('status', 'completed')
      .select(
        this.db.knex.raw('COALESCE(SUM(total_amount), 0) as total'),
        this.db.knex.raw('COUNT(*) as count')
      ) as { total: string; count: string }[];

    const [paymentsStats] = await this.db.knex('payments')
      .where('customer_id', customerId)
      .select(
        this.db.knex.raw('COALESCE(SUM(amount), 0) as total'),
        this.db.knex.raw('COUNT(*) as count')
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

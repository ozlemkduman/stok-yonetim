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
}
